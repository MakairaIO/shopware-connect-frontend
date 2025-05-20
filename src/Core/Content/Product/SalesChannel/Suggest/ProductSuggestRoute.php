<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Core\Content\Product\SalesChannel\Suggest;

use MakairaConnectFrontend\Service\MakairaProductFetchingService;
use MakairaConnectFrontend\Service\ShopwareProductFetchingService;
use MakairaConnectFrontend\Utils\PluginConfig;
use Psr\Log\LoggerInterface;
use Shopware\Core\Content\Product\Aggregate\ProductVisibility\ProductVisibilityDefinition;
use Shopware\Core\Content\Product\Events\ProductSuggestCriteriaEvent;
use Shopware\Core\Content\Product\Events\ProductSuggestResultEvent;
use Shopware\Core\Content\Product\ProductDefinition;
use Shopware\Core\Content\Product\ProductEvents;
use Shopware\Core\Content\Product\SalesChannel\Listing\ProductListingLoader;
use Shopware\Core\Content\Product\SalesChannel\Listing\ProductListingResult;
use Shopware\Core\Content\Product\SalesChannel\ProductAvailableFilter;
use Shopware\Core\Content\Product\SalesChannel\Suggest\AbstractProductSuggestRoute;
use Shopware\Core\Content\Product\SalesChannel\Suggest\ProductSuggestRouteResponse;
use Shopware\Core\Content\Product\SearchKeyword\ProductSearchBuilderInterface;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\RequestCriteriaBuilder;
use Shopware\Core\Framework\Feature;
use Shopware\Core\Framework\Routing\Exception\MissingRequestParameterException;
use Shopware\Core\Framework\Struct\ArrayEntity;
use Shopware\Core\System\SalesChannel\Entity\SalesChannelRepository;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

#[\AllowDynamicProperties]
class ProductSuggestRoute extends AbstractProductSuggestRoute
{
    public function __construct(
        AbstractProductSuggestRoute $decorated,
        ProductSearchBuilderInterface $searchBuilder,
        EventDispatcherInterface $eventDispatcher,
        ProductListingLoader $productListingLoader,
        RequestCriteriaBuilder $criteriaBuilder,
        SalesChannelRepository $salesChannelProductRepository,
        ProductDefinition $definition,
        private readonly MakairaProductFetchingService $makairaProductFetchingService,
        private readonly ShopwareProductFetchingService $shopwareProductFetchingService,
        private readonly LoggerInterface $logger,
        private readonly PluginConfig $pluginConfig,
        private readonly EntityRepository $categoryRepository,
    ) {
        $this->decorated                     = $decorated;
        $this->eventDispatcher               = $eventDispatcher;
        $this->searchBuilder                 = $searchBuilder;
        $this->productListingLoader          = $productListingLoader;
        $this->criteriaBuilder               = $criteriaBuilder;
        $this->salesChannelProductRepository = $salesChannelProductRepository;
        $this->definition                    = $definition;
    }

    public function getDecorated(): AbstractProductSuggestRoute
    {
        return $this->decorated;
    }

    public function load(Request $request, SalesChannelContext $context, Criteria $criteria): ProductSuggestRouteResponse
    {
        if (!$request->get('search')) {
            throw new MissingRequestParameterException('search');
        }

        $doTrace = $request->headers->has('X-Makaira-Trace') ? $request->headers->get('X-Makaira-Trace') === 'true' || $request->headers->get('X-Makaira-Trace') === '1' : false;

        $this->logger->debug('[Makaira][Suggest] on? ', [$this->pluginConfig->get('useForSuggest', $context->getSalesChannel()->getId())]);
        // Check if the suggest setting is enabled
        if (!$this->pluginConfig->get('useForSuggest', $context->getSalesChannel()->getId())) {
            return $this->decorated->load($request, $context, $criteria);
        }

        $criteria->addFilter(
            new ProductAvailableFilter($context->getSalesChannel()->getId(), ProductVisibilityDefinition::VISIBILITY_SEARCH)
        );
        $criteria->addState(Criteria::STATE_ELASTICSEARCH_AWARE);
        if (!Feature::isActive('v6.5.0.0')) {
            $context->getContext()->addState(Context::STATE_ELASTICSEARCH_AWARE);
        }

        $this->searchBuilder->build($request, $criteria, $context);
        $this->eventDispatcher->dispatch(
            new ProductSuggestCriteriaEvent($request, $criteria, $context),
            ProductEvents::PRODUCT_SUGGEST_CRITERIA
        );
        $this->addElasticSearchContext($context);

        $query = $request->query->get('search');

        try {

            $makairaResponse = $this->makairaProductFetchingService->fetchSuggestionsFromMakaira($context, $query, $doTrace);
            // add product, page count to the log

            $this->logger->debug('[Makaira][Suggest] Counts: ', [
                'product'    => $makairaResponse->product->count          ?? 0,
                'page'       => $makairaResponse->page->count             ?? 0,
                'category'   => $makairaResponse->category->count         ?? 0,
                'link'       => $makairaResponse->links->count            ?? 0,
                'suggestion' => $makairaResponse->suggestion->count       ?? 0,
            ]);

        } catch (\Exception $exception) {
            $this->logger->error('[Makaira][Suggest] ' . $exception->getMessage(), ['type' => __CLASS__]);
            return $this->decorated->load($request, $context, $criteria);
        }

        $criteria->resetQueries();

        $shopwareResult   = $this->shopwareProductFetchingService->fetchProductsFromShopware($makairaResponse, $criteria, $context);
        $result           = ProductListingResult::createFrom($shopwareResult);
        $categories       = $makairaResponse->category->items ?? [];
        $categoriesEntity = new ArrayEntity(array_splice($categories, 0, 10));
        $result->addExtension('makairaCategories', $categoriesEntity);

        $pages       = $makairaResponse->page->items ?? [];
        $pagesEntity = new ArrayEntity(array_splice($pages, 0, 10));
        $result->addExtension('makairaPages', $pagesEntity);

        $links       = $makairaResponse->links->items ?? [];
        $linksEntity = new ArrayEntity(array_splice($links, 0, 10));
        $result->addExtension('makairaLinks', $linksEntity);

        $this->eventDispatcher->dispatch(
            new ProductSuggestResultEvent($request, $result, $context),
            ProductEvents::PRODUCT_SUGGEST_RESULT
        );

        return new ProductSuggestRouteResponse($result);
    }

    public function addElasticSearchContext(SalesChannelContext $context): void
    {
        $context->getContext()->addState(Criteria::STATE_ELASTICSEARCH_AWARE);
    }
}
