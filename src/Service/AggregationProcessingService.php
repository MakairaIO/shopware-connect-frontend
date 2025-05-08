<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Service;

//use MakairaConnectFrontend\Utils\ColorLogic;
use Psr\Log\LoggerInterface;
use Shopware\Core\Content\Property\Aggregate\PropertyGroupOption\PropertyGroupOptionEntity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityCollection;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\AggregationResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\Metric\EntityResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\Metric\StatsResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;

class AggregationProcessingService
{
    public function __construct(
        private readonly FilterDataTransformerService $filterDataTransformer,
        private readonly LoggerInterface $logger
    ) {
    }

    public function processAggregationsFromMakairaResponse(
        EntitySearchResult $shopwareResult,
        $makairaResponse,
    ): EntitySearchResult {
        foreach ($makairaResponse->product->aggregations as $aggregation) {
            $makFilter = $this->createAggregationFilter($aggregation);
            if ($makFilter) {
                $shopwareResult->getAggregations()->add($makFilter);
            }
        }

        return $shopwareResult;
    }

    private function createAggregationFilter($aggregation): ?AggregationResult
    {
        // Generic aggregation die für alle gleich sind.
        switch ($aggregation->type) {
            case 'range_slider_price':
                return new StatsResult('filter_' . $aggregation->key, $aggregation->min, $aggregation->max, ($aggregation->min + $aggregation->max) / 2, $aggregation->max);
            case 'list':
            case 'list_multiselect':
            case 'list_multiselect_custom_1':
                return $this->createCustomAggregationFilter($aggregation);
            default:
                return null; // In case none of the types match
        }
    }

    private function createCustomAggregationFilter($aggregation): ?EntityResult
    {
        $transformedData = $this->filterDataTransformer->transformFilterData([
            $aggregation->key => [
                'type'           => 'list',
                'key'            => $aggregation->key,
                'title'          => $aggregation->title,
                'values'         => (array)$aggregation->values,
                'selectedValues' => $aggregation->selectedValues ?? null,
            ],
        ]);

        if (empty($transformedData)) {
            return null;
        }

        $this->logger->debug('Transformed filter data', ['data' => $transformedData]);

        $options = [];
        foreach ($transformedData[$aggregation->key]['elements'] as $key => $value) {
            try {
                $option = new PropertyGroupOptionEntity();
                $option->setName((string)$value);
                $option->setId((string)$key);
                $option->setTranslated(['name' => (string)$value]);
                $option->setPosition($value['position'] ?? 0);
                $option->setGroupId($aggregation->key);
                $options[] = $option;
            } catch (\Exception $e) {
                $this->logger->error('Error creating PropertyGroupOptionEntity', [
                    'error' => $e->getMessage(),
                    'key'   => $key,
                    'value' => $value,
                ]);
            }
        }

        return new EntityResult('filter_' . $aggregation->key, new EntityCollection($options));
    }
}
