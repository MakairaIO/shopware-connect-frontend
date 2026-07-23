<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Core\Content\Product\SalesChannel\Search;

use League\Pipeline\Pipeline;
use MakairaConnectFrontend\Exception\NoDataException;
use MakairaConnectFrontend\Service\AggregationProcessingService;
use MakairaConnectFrontend\Service\BannerProcessingService;
use MakairaConnectFrontend\Service\FilterExtractionService;
use MakairaConnectFrontend\Service\MakairaProductFetchingService;
use MakairaConnectFrontend\Service\ShopwareProductFetchingService;
use MakairaConnectFrontend\Service\SortingMappingService;
use MakairaConnectFrontend\Struct\MakairaConnectFrontendService;
use MakairaConnectFrontend\Utils\PluginConfig;
use Psr\Log\LoggerInterface;
use Shopware\Core\Content\Product\Events\ProductSearchCriteriaEvent;
use Shopware\Core\Content\Product\Events\ProductSearchResultEvent;
use Shopware\Core\Content\Product\ProductEvents;
use Shopware\Core\Content\Product\SalesChannel\Listing\ProductListingResult;
use Shopware\Core\Content\Product\SalesChannel\Search\AbstractProductSearchRoute;
use Shopware\Core\Content\Product\SalesChannel\Search\ProductSearchRouteResponse;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\Routing\RoutingException;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

use function is_string;

class ProductSearchRoute extends AbstractProductSearchRoute
{
    public function __construct(
        private readonly AbstractProductSearchRoute $decorated,
        private readonly EventDispatcherInterface $eventDispatcher,
        private readonly FilterExtractionService $filterExtractionService,
        private readonly SortingMappingService $sortingMappingService,
        private readonly ShopwareProductFetchingService $shopwareProductFetchingService,
        private readonly MakairaProductFetchingService $makairaProductFetchingService,
        private readonly AggregationProcessingService $aggregationProcessingService,
        private readonly BannerProcessingService $bannerProcessingService,
        private readonly LoggerInterface $logger,
        private readonly PluginConfig $pluginConfig
    ) {
    }

    public function getDecorated(): AbstractProductSearchRoute
    {
        return $this->decorated;
    }

    public function load(Request $request, SalesChannelContext $context, Criteria $criteria): ProductSearchRouteResponse
    {
        $doTrace = $request->headers->get('X-Makaira-Trace', 'false') === 'true';

        $makairaFrontend = new MakairaConnectFrontendService(
            $this->pluginConfig->get('makairaInstance', $context->getSalesChannel()->getId()),
            $this->pluginConfig->get('useForProductLists', $context->getSalesChannel()->getId()),
            $this->pluginConfig->get('useForSearch', $context->getSalesChannel()->getId()),
            $this->pluginConfig->get('useForRecommendation', $context->getSalesChannel()->getId())
        );

        $context->getContext()->addExtension('makairafrontend', $makairaFrontend);
        $context->getContext()->addExtension('route', new \Shopware\Core\Framework\Struct\ArrayStruct([
            'name' => 'frontend.search.page',
        ]));

        $this->logger->debug('[Makaira] Search on? ', [$this->pluginConfig->get('useForSearch', $context->getSalesChannel()->getId())]);
        // Check if the category setting is enabled
        if (!$this->pluginConfig->get('useForSearch', $context->getSalesChannel()->getId())) {
            return $this->decorated->load($request, $context, $criteria);
        }

        $query = $this->getSearchTerm($request);
        if ($query === null) {
            throw RoutingException::missingRequestParameter('search');
        }

        $criteria->addState(Criteria::STATE_ELASTICSEARCH_AWARE);

        $makairaFilter = $this->filterExtractionService->extractMakairaFiltersFromRequest($request);

        try {
            $makairaSorting = $this->sortingMappingService->mapSortingCriteria($criteria);

            $makairaResponse = $this->makairaProductFetchingService->fetchProductsFromMakaira($context, $query, $criteria, $makairaSorting, $makairaFilter, $doTrace);

            if (null === $makairaResponse) {
                throw new NoDataException('Keine Daten oder fehlerhaft vom Makaira Server.');
            }

            if (isset($makairaResponse->product->aggregations)) {
                // Convert aggregations to array and ensure showDocCount is available
                $aggregations = json_decode(json_encode($makairaResponse->product->aggregations), true);
                $aggregations = $this->enrichAggregationsWithShowDocCount($aggregations);

                $makairaFrontend->setAggregations($aggregations);
                $makairaFrontend->setTotal($makairaResponse->product->total);
            }
        } catch (\Exception $exception) {
            $this->logger->error('[Makaira] ' . $exception->getMessage(), ['type' => __CLASS__]);

            return $this->decorated->load($request, $context, $criteria);
        }

        $redirectUrl = $this->checkForSearchRedirect($makairaResponse);

        if ($redirectUrl) {
            $redirectResponse = new RedirectResponse($redirectUrl, 302);
            $redirectResponse->send();
        }

        $shopwareResult = $this->shopwareProductFetchingService->fetchProductsFromShopware($makairaResponse, $criteria, $context);

        $result = (new Pipeline())
            ->pipe(fn ($payload) => $this->aggregationProcessingService->processAggregationsFromMakairaResponse($payload, $makairaResponse))
            ->pipe(fn ($payload) => $this->bannerProcessingService->processBannersFromMakairaResponse($payload, $makairaResponse, $context))
            ->process($shopwareResult);

        $this->eventDispatcher->dispatch(new ProductSearchCriteriaEvent($request, $criteria, $context), ProductEvents::PRODUCT_SEARCH_CRITERIA);

        $finalResult = ProductListingResult::createFrom($result);

        $this->eventDispatcher->dispatch(new ProductSearchResultEvent($request, $finalResult, $context), ProductEvents::PRODUCT_SEARCH_RESULT);

        $this->logger->debug('[Makaira][Search] Products total ', [$finalResult->getTotal()]);

        $context->getContext()->addExtension('total', new \Shopware\Core\Framework\Struct\ArrayStruct([
            'total' => $makairaResponse->product->total,
        ]));

        return new ProductSearchRouteResponse(
            $finalResult,
            $makairaFrontend
        );
    }

    private function getSearchTerm(Request $request): ?string
    {
        $term = $request->query->get('search') ?? $request->request->get('search');

        if (!is_string($term)) {
            return null;
        }

        $term = trim($term);

        return $term !== '' ? $term : null;
    }

    private function checkForSearchRedirect($makairaResponse): ?string
    {
        $redirects = isset($makairaResponse->searchredirect) ? $makairaResponse->searchredirect->items : [];

        if (\count($redirects) > 0) {
            $targetUrl = $redirects[0]->fields->targetUrl;

            if ($targetUrl) {
                return $targetUrl;
            }
        }

        return null;
    }

    /**
     * Enrich aggregations with showDocCount for template usage
     */
    private function enrichAggregationsWithShowDocCount(array $aggregations): array
    {
        foreach ($aggregations as &$aggregation) {
            // Set showDocCount at aggregation level if not present
            if (!isset($aggregation['showDocCount'])) {
                $aggregation['showDocCount'] = true; // Default to showing doc count
            }

            // Ensure each value/element has showDocCount
            if (isset($aggregation['values']) && is_array($aggregation['values'])) {
                foreach ($aggregation['values'] as &$value) {
                    if (is_array($value) && !isset($value['showDocCount'])) {
                        $value['showDocCount'] = $aggregation['showDocCount'];
                    }
                }
            }
        }

        return $aggregations;
    }
}
