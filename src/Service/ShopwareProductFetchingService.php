<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Service;

use Monolog\Logger;
use Shopware\Core\Content\Product\ProductDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\EntityCollection;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsAnyFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\RequestCriteriaBuilder;
use Shopware\Core\System\SalesChannel\Entity\SalesChannelRepository;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;

class ShopwareProductFetchingService
{
    public function __construct(
        private readonly SalesChannelRepository $salesChannelProductRepository,
        private readonly RequestCriteriaBuilder $criteriaBuilder,
        private readonly ProductDefinition $definition,
        private readonly Logger $logger,
    ) {
    }

    public function fetchProductsFromShopware(
        $makairaResponse,
        Criteria $criteria,
        SalesChannelContext $context,
    ): EntitySearchResult {
        $ids = $this->extractProductIdsFromMakairaResponse($makairaResponse);

        $criteria->resetFilters();
        $criteria->addFilter(new EqualsAnyFilter('id', $ids));

        $shopwareResult = $this->salesChannelProductRepository->search($criteria, $context);

        // Restore original pagination
        $shopwareResult->getCriteria()->setOffset($criteria->getOffset());
        $shopwareResult->getCriteria()->setLimit($criteria->getLimit());
        $shopwareResult->setLimit($criteria->getLimit());


        if (isset($makairaResponse->items)) {
            $total = isset($makairaResponse->items) && is_array($makairaResponse->items) ? count($makairaResponse->items) : 0;
        } else {
            $total = $makairaResponse->product->total ?? 0;
        }

        $shopwareResult = $this->reorderProductsAccordingToMakairaIds($shopwareResult, $ids, $total);

        return $shopwareResult;
    }

    private function buildNewCriteriaFromRequestAndMakairaResponse(Request $request, array $ids, SalesChannelContext $context, Criteria $originalCriteria): Criteria
    {

        $newCriteria = $this->criteriaBuilder->handleRequest($request, new Criteria(), $this->definition, $context->getContext());
        // log the new criteria
        if ($originalCriteria->getSorting()) {
            $newCriteria->addSorting($originalCriteria->getSorting()[0]);
        }
        if (isset($originalCriteria->getExtensions()['aggregations'])) {
            $newCriteria->addExtension('aggregations', $originalCriteria->getExtensions()['aggregations']);
        }
        if (isset($originalCriteria->getExtensions()['sortings'])) {
            $newCriteria->addExtension('sortings', $originalCriteria->getExtensions()['sortings']);
        }
        $newCriteria->addFilter(new EqualsAnyFilter('productNumber', $ids));
        $newCriteria->setOffset(0);
        $newCriteria->setLimit($originalCriteria->getLimit());

        return $newCriteria;
    }

    private function extractProductIdsFromMakairaResponse(\stdClass $makairaResponse): array
    {
        return array_map(fn ($product) => $product->id, $makairaResponse->items ?? $makairaResponse->product->items);
    }

    private function reorderProductsAccordingToMakairaIds(EntitySearchResult $shopwareResult, array $ids, int $total): EntitySearchResult
    {
        $productMap      = array_column($shopwareResult->getEntities()->getElements(), null, 'id');
        $orderedProducts = array_filter(array_map(fn ($id) => $productMap[$id] ?? null, $ids));

        return new EntitySearchResult('product', $total, new EntityCollection($orderedProducts), $shopwareResult->getAggregations(), $shopwareResult->getCriteria(), $shopwareResult->getContext());
    }
}
