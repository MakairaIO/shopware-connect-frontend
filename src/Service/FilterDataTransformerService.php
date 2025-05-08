<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Service;

class FilterDataTransformerService
{
    public function transformFilterData(array $filterData): array
    {
        $transformedData = [];

        foreach ($filterData as $key => $filter) {
            if ($filter['type'] === 'list') {
                $transformedData[$key] = [
                    'name'         => $filter['key'],
                    'propertyName' => $filter['key'],
                    'displayName'  => $filter['title'],
                    'elements'     => $this->transformListValues((array)$filter['values'], $filter['selectedValues'] ?? null),
                ];
            }
        }

        return $transformedData;
    }

    private function transformListValues(array $values, ?array $selectedValues): array
    {
        $transformedValues = [];

        foreach ($values as $valueKey => $value) {
            // Convert stdClass to array if needed
            $valueArray = is_object($value) ? (array)$value : $value;

            $transformedValues[$valueKey] = [
                'selected' => $selectedValues !== null && in_array($valueKey, $selectedValues),
                'count'    => $valueArray['count']    ?? null,
                'position' => $valueArray['position'] ?? null,
            ];
        }

        return $transformedValues;
    }
}
