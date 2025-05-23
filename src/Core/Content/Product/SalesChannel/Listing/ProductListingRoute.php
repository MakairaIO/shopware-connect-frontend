<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Core\Content\Product\SalesChannel\Listing;

use League\Pipeline\Pipeline;
use MakairaConnectFrontend\Exception\NoDataException;
use MakairaConnectFrontend\Loader\SalesChannelLoader;
use MakairaConnectFrontend\Service\AggregationProcessingService;
use MakairaConnectFrontend\Service\BannerProcessingService;
use MakairaConnectFrontend\Service\FilterExtractionService;
use MakairaConnectFrontend\Service\MakairaProductFetchingService;
use MakairaConnectFrontend\Service\ShopwareProductFetchingService;
use MakairaConnectFrontend\Service\SortingMappingService;
use MakairaConnectFrontend\Struct\MakairaConnectFrontendService;
use MakairaConnectFrontend\Utils\PluginConfig;
use Psr\Log\LoggerInterface;
use Shopware\Core\Content\Category\CategoryDefinition;
use Shopware\Core\Content\Category\CategoryEntity;
use Shopware\Core\Content\Product\Aggregate\ProductVisibility\ProductVisibilityDefinition;
use Shopware\Core\Content\Product\Events\ProductListingResultEvent;
use Shopware\Core\Content\Product\SalesChannel\Listing\AbstractProductListingRoute;
use Shopware\Core\Content\Product\SalesChannel\Listing\ProductListingResult;
use Shopware\Core\Content\Product\SalesChannel\Listing\ProductListingRouteResponse;
use Shopware\Core\Content\Product\SalesChannel\ProductAvailableFilter;
use Shopware\Core\Content\ProductStream\Service\ProductStreamBuilderInterface;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\System\SalesChannel\Entity\SalesChannelRepository;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

#[\AllowDynamicProperties]
class ProductListingRoute extends AbstractProductListingRoute
{
    public function __construct(
        AbstractProductListingRoute $decorated,
        EntityRepository $categoryRepository,
        ProductStreamBuilderInterface $productStreamBuilder,
        EventDispatcherInterface $eventDispatcher,
        SalesChannelRepository $salesChannelProductRepository,
        private readonly FilterExtractionService $filterExtractionService,
        private readonly SortingMappingService $sortingMappingService,
        private readonly MakairaProductFetchingService $makairaProductFetchingService,
        private readonly ShopwareProductFetchingService $shopwareProductFetchingService,
        private readonly AggregationProcessingService $aggregationProcessingService,
        private readonly BannerProcessingService $bannerProcessingService,
        private readonly LoggerInterface $logger,
        private readonly PluginConfig $pluginConfig,
        private readonly SalesChannelLoader $salesChannelLoader,
    ) {
        $this->decorated                     = $decorated;
        $this->categoryRepository            = $categoryRepository;
        $this->productStreamBuilder          = $productStreamBuilder;
        $this->eventDispatcher               = $eventDispatcher;
        $this->salesChannelProductRepository = $salesChannelProductRepository;
    }

    public function getDecorated(): AbstractProductListingRoute
    {
        return $this->decorated;
    }

    public function load(
        string $categoryId,
        Request $request,
        SalesChannelContext $context,
        Criteria $criteria,
    ): ProductListingRouteResponse {

        $doTrace = $request->headers->has('X-Makaira-Trace') ? $request->headers->get('X-Makaira-Trace') === 'true' || $request->headers->get('X-Makaira-Trace') === '1' : false;

        $this->logger->debug('[Makaira] Listing on? ', [$this->pluginConfig->get('useForProductLists', $context->getSalesChannel()->getId())]);
        // Check if the category setting is enabled
        if (!$this->pluginConfig->get('useForProductLists', $context->getSalesChannel()->getId())) {
            return $this->decorated->load($categoryId, $request, $context, $criteria);
        }

        $makairaFrontend = new MakairaConnectFrontendService(
            $this->pluginConfig->get('makairaInstance', $context->getSalesChannel()->getId()),
            $this->pluginConfig->get('useForProductLists', $context->getSalesChannel()->getId()),
            $this->pluginConfig->get('useForSearch', $context->getSalesChannel()->getId()),
            $this->pluginConfig->get('useForRecommendation', $context->getSalesChannel()->getId())
        );

        $context->getContext()->addExtension('makairafrontend', $makairaFrontend);
        $context->getContext()->addExtension('route', new \Shopware\Core\Framework\Struct\ArrayStruct([
            'name' => 'frontend.navigation.page',
        ]));

        $criteria->addFilter(
            new ProductAvailableFilter($context->getSalesChannel()->getId(), ProductVisibilityDefinition::VISIBILITY_ALL)
        );
        $criteria->setTitle('product-listing-route::loading');

        $makairaFilter = $this->filterExtractionService->extractMakairaFiltersFromRequest($request);
        $this->logger->debug('[Makaira] Filter ', [$makairaFilter]);

        $category = $this->fetchCategory($categoryId, $context);
        $streamId = $this->extendCriteria($context, $criteria, $category);

        $categoryIds = $this->fetchSubcategoryIds($categoryId, $context);
        $this->logger->debug('[Makaira] Category IDs ', $categoryIds);

        try {
            $makairaSorting = $this->sortingMappingService->mapSortingCriteria($criteria);
            $this->logger->debug('[Makaira] Sorting ', [$makairaSorting]);

            $makairaResponse = $this->makairaProductFetchingService->fetchMakairaProductsFromCategory($context, $categoryIds, $criteria, $makairaFilter, $makairaSorting, $doTrace);

            if (null === $makairaResponse) {
                throw new NoDataException('Keine Daten oder fehlerhaft vom Makaira Server.');
            }

            if (isset($makairaResponse->product->aggregations)) {
                $makairaFrontend->setAggregations(json_decode(json_encode($makairaResponse->product->aggregations), true));
                $makairaFrontend->setTotal($makairaResponse->product->total);
            }
        } catch (\Exception $exception) {
            $this->logger->error('[Makaira] ' . $exception->getMessage(), ['type' => __CLASS__]);

            return $this->decorated->load($categoryId, $request, $context, $criteria);
        }

        $shopwareResult = $this->shopwareProductFetchingService->fetchProductsFromShopware($makairaResponse, $criteria, $context);

        $result = (new Pipeline())
            ->pipe(fn ($payload) => $this->aggregationProcessingService->processAggregationsFromMakairaResponse($payload, $makairaResponse))
            ->pipe(fn ($payload) => $this->bannerProcessingService->processBannersFromMakairaResponse($payload, $makairaResponse, $context))
            ->process($shopwareResult);

        /** @var ProductListingResult $result */
        $finalResult = ProductListingResult::createFrom($result);

        $this->eventDispatcher->dispatch(
            new ProductListingResultEvent($request, $finalResult, $context)
        );

        $finalResult->setStreamId($streamId);

        $this->logger->debug('[Makaira][Listing] Products total ', [$finalResult->getTotal()]);

        return new ProductListingRouteResponse($finalResult);
    }

    private function extendCriteria(SalesChannelContext $salesChannelContext, Criteria $criteria, CategoryEntity $category): ?string
    {
        if (CategoryDefinition::PRODUCT_ASSIGNMENT_TYPE_PRODUCT_STREAM === $category->getProductAssignmentType() && null !== $category->getProductStreamId()) {
            $filters = $this->productStreamBuilder->buildFilters(
                $category->getProductStreamId(),
                $salesChannelContext->getContext()
            );

            $criteria->addFilter(...$filters);

            return $category->getProductStreamId();
        }

        $criteria->addFilter(
            new EqualsFilter('product.categoriesRo.id', $category->getId())
        );

        return null;
    }

    private function fetchCategory(string $categoryId, SalesChannelContext $context): CategoryEntity
    {
        $categoryCriteria = new Criteria([$categoryId]);
        $categoryCriteria->setTitle('product-listing-route::category-loading');

        /** @var CategoryEntity $category */
        return $this->categoryRepository->search($categoryCriteria, $context->getContext())->first();
    }

    private function fetchSubcategories(string $categoryId, SalesChannelContext $context): array
    {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('parentId', $categoryId));
        $criteria->setTitle('product-listing-route::subcategories-loading');

        $subcategories = $this->categoryRepository->search($criteria, $context->getContext());

        return $subcategories->getElements();
    }

    private function fetchSubcategoryIds(string $categoryId, SalesChannelContext $context): array
    {
        $criteria = new Criteria();
        $criteria->addFilter(new EqualsFilter('parentId', $categoryId));
        $criteria->setTitle('product-listing-route::subcategories-loading');

        $subcategories = $this->categoryRepository->search($criteria, $context->getContext());

        // Extract only the IDs of the subcategories
        $subcategoryIds = array_values(array_map(
            fn ($subcategory) => (string) $subcategory->getId(),
            $subcategories->getElements()
        ));

        // Include the current category ID
        array_unshift($subcategoryIds, (string) $categoryId);

        return $subcategoryIds;
    }
}
