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

        // Detect if cache is being cleared or in an inconsistent state
        $cacheState = $this->detectCacheState($context);
        $this->logger->debug('[Makaira] Cache state detection', [
            'cache_state' => $cacheState,
            'request_id'  => uniqid('req_', true),
        ]);

        // If cache is being cleared, use fallback to avoid race conditions
        if ($cacheState === 'clearing' || $cacheState === 'inconsistent') {
            $this->logger->warning('[Makaira] Cache in clearing/inconsistent state, using decorated fallback', [
                'cache_state' => $cacheState,
                'category_id' => $categoryId,
            ]);
            return $this->decorated->load($categoryId, $request, $context, $criteria);
        }

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

        // Safely add extensions with retry mechanism for cache inconsistencies
        $this->addContextExtensionsSafely($context, $makairaFrontend);

        $this->logger->debug('[Makaira] Extensions added to context', [
            'makairafrontend_service' => [
                'isListingEnabled' => $makairaFrontend->isListingEnabled(),
                'isSearchEnabled'  => $makairaFrontend->isSearchEnabled(),//,
                //'instance' => $makairaFrontend->getInstance()
            ],
            'route_name'                              => 'frontend.navigation.page',
            'context_extensions_count'                => count($context->getContext()->getExtensions()),
            'has_makairafrontend_extension_after_add' => $context->getContext()->hasExtension('makairafrontend'),
            'has_route_extension_after_add'           => $context->getContext()->hasExtension('route'),
        ]);

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
                $this->logger->debug('[Makaira] Aggregations set from response', [
                    'aggregations' => $makairaResponse->product->aggregations,
                    'total'        => $makairaResponse->product->total,
                ]);

                // Verify the aggregations are actually accessible on the extension
                $this->logger->debug('[Makaira] Extension aggregations verification', [
                    'extension_aggregations_count'          => count($makairaFrontend->getAggregations()),
                    'extension_has_aggregations'            => !empty($makairaFrontend->getAggregations()),
                    'context_has_makairafrontend_extension' => $context->getContext()->hasExtension('makairafrontend'),
                ]);
            } else {
                $this->logger->warning('[Makaira] No aggregations found in response', [
                    'response_structure' => [
                        'has_product'      => isset($makairaResponse->product),
                        'has_aggregations' => null !== ($makairaResponse->product->aggregations ?? null),
                    ],
                ]);
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

    /**
     * Detect if cache is being cleared or in an inconsistent state
     */
    private function detectCacheState(SalesChannelContext $context): string
    {
        try {
            // Check if system configuration is accessible (often affected during cache clear)
            $testConfig = $this->pluginConfig->get('useForProductLists', $context->getSalesChannel()->getId());

            // Check if context extensions can be added and retrieved properly
            $testExtension = new \Shopware\Core\Framework\Struct\ArrayStruct(['test' => 'cache_detection']);
            $context->getContext()->addExtension('makaira_cache_test', $testExtension);
            $retrieved = $context->getContext()->getExtension('makaira_cache_test');

            if (!$retrieved || !$retrieved instanceof \Shopware\Core\Framework\Struct\ArrayStruct) {
                return 'inconsistent';
            }

            // Remove test extension
            $context->getContext()->removeExtension('makaira_cache_test');

            // Check if we can access sales channel data
            if (!$context->getSalesChannel() || !$context->getSalesChannel()->getId()) {
                return 'inconsistent';
            }

            return 'normal';

        } catch (\Exception $e) {
            $this->logger->warning('[Makaira] Cache state detection failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return 'clearing';
        }
    }

    private function addContextExtensionsSafely(SalesChannelContext $context, MakairaConnectFrontendService $makairaFrontend)
    {
        $maxRetries = 3;
        $attempt    = 0;

        while ($attempt < $maxRetries) {
            try {
                $context->getContext()->addExtension('makairafrontend', $makairaFrontend);
                $context->getContext()->addExtension('route', new \Shopware\Core\Framework\Struct\ArrayStruct([
                    'name' => 'frontend.navigation.page',
                ]));

                // Verify extensions were added successfully
                if ($context->getContext()->hasExtension('makairafrontend') &&
                    $context->getContext()->hasExtension('route')) {
                    $this->logger->debug('[Makaira] Extensions added successfully', ['attempt' => $attempt + 1]);
                    return;
                }

                throw new \RuntimeException('Extensions not properly added to context');

            } catch (\Exception $e) {
                $attempt++;
                $this->logger->warning('[Makaira] Failed to add extensions, attempt ' . $attempt, [
                    'error'       => $e->getMessage(),
                    'attempt'     => $attempt,
                    'max_retries' => $maxRetries,
                ]);

                if ($attempt >= $maxRetries) {
                    $this->logger->error('[Makaira] Failed to add extensions after all retries');
                    throw $e;
                }

                // Small delay before retry
                usleep(1000); // 1ms delay
            }
        }
    }
}
