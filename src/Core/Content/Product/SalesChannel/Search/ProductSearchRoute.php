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
use MakairaConnectFrontend\Utils\PluginConfig;
use Psr\Log\LoggerInterface;
use Shopware\Core\Content\Product\Events\ProductSearchCriteriaEvent;
use Shopware\Core\Content\Product\Events\ProductSearchResultEvent;
use Shopware\Core\Content\Product\ProductEvents;
use Shopware\Core\Content\Product\SalesChannel\Listing\ProductListingResult;
use Shopware\Core\Content\Product\SalesChannel\Search\AbstractProductSearchRoute;
use Shopware\Core\Content\Product\SalesChannel\Search\ProductSearchRouteResponse;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\Routing\Exception\MissingRequestParameterException;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

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
        $this->logger->debug('[Makaira] Search on? ', [$this->pluginConfig->get('useForSearch', $context->getSalesChannel()->getId())]);
        // Check if the category setting is enabled
        if (!$this->pluginConfig->get('useForSearch', $context->getSalesChannel()->getId())) {
            return $this->decorated->load($request, $context, $criteria);
        }

        $this->validateSearchRequest($request);
        $query = $request->query->get('search');
        $criteria->addState(Criteria::STATE_ELASTICSEARCH_AWARE);

        $makairaFilter = $this->filterExtractionService->extractMakairaFiltersFromRequest($request);

        try {
            $makairaSorting = $this->sortingMappingService->mapSortingCriteria($criteria);

            $makairaResponse = $this->makairaProductFetchingService->fetchProductsFromMakaira($context, $query, $criteria, $makairaSorting, $makairaFilter);

            if (null === $makairaResponse) {
                throw new NoDataException('Keine Daten oder fehlerhaft vom Makaira Server.');
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

        return new ProductSearchRouteResponse($finalResult);
    }

    private function validateSearchRequest(Request $request): void
    {
        if (!$request->get('search')) {
            throw new MissingRequestParameterException('search');
        }
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
}
