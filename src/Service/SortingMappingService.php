<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Service;

use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;

class SortingMappingService
{
    public const MAKAIRA_SORTING_MAPPING = [
        'field' => [
            'product.name'                                    => 'title',
            'product.cheapestPrice'                           => 'price',
            'customFields.makaira_sortings_LAT_ARTICLESORT'   => 'LAT_ARTICLESORT',
            'customFields.makaira_sortings_lb_neu'            => 'lb_neu',
            'customFields.makaira_sortings_lb_lieferzeitsort' => 'lb_lieferzeitsort',
        ],
        'direction' => [
            'ASC'  => 'asc',
            'DESC' => 'desc',
        ],
    ];

    public function mapSortingCriteria(Criteria $criteria): array
    {
        $sorting = $criteria->getSorting();
        $sort    = [];
        foreach ($sorting as $sortingField) {
            $field     = self::MAKAIRA_SORTING_MAPPING['field'][$sortingField->getField()]         ?? null;
            $direction = self::MAKAIRA_SORTING_MAPPING['direction'][$sortingField->getDirection()] ?? null;
            if ($field && $direction) {
                $sort[] = [$field, $direction];
            }
        }

        return $sort ? [$sort[0][0] => $sort[0][1]] : [];
    }
}
