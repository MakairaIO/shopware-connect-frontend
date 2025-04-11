<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Service;

//use MakairaConnectFrontend\Utils\ColorLogic;
use Shopware\Core\Content\Property\Aggregate\PropertyGroupOption\PropertyGroupOptionEntity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityCollection;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\AggregationResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\Metric\EntityResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\AggregationResult\Metric\StatsResult;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;

class AggregationProcessingService
{
    public function __construct(
        #private readonly ColorLogic $colorLogic,
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
        // Speziele aggregation gefunden über den nahmen
        /*      switch ($aggregation->key) {
                  case 'color':
                      return $this->colorLogic->MakairaColorFilter($aggregation);
              }*/

        // Generic aggregation die für alle gleich sind.
        switch ($aggregation->type) {
            case 'range_slider_price':
                return new StatsResult('filter_' . $aggregation->key, $aggregation->min, $aggregation->max, ($aggregation->min + $aggregation->max) / 2, $aggregation->max);
            case 'list_multiselect':
            case 'list_multiselect_custom_1':
                return $this->createCustomAggregationFilter($aggregation);
            default:
                return null; // In case none of the types match
        }
    }

    private function createCustomAggregationFilter($aggregation): ?EntityResult
    {
        // we use this currently for Nachhaltigkeit and Sale
        // they have 0 or 1 as their values
        // we only want to show if there is a 1
        $showFilter = false;
        foreach ($aggregation->values as $value) {
            if (1 == $value->key) {
                $showFilter = true;
            }
        }

        if ($showFilter) {
            $options = [];
            $option  = new PropertyGroupOptionEntity();
            $option->setName($aggregation->key);
            $option->setId($aggregation->key);
            $option->setTranslated(['name' => $aggregation->title]);
            $options[] = $option;

            $makFilter = new EntityResult('filter_' . $aggregation->key, new EntityCollection(
                $options
            ));

            return $makFilter;
        }

        return null;
    }
}
