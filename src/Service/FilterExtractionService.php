<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Service;

use Symfony\Component\HttpFoundation\Request;

class FilterExtractionService
{
    public function extractMakairaFiltersFromRequest(Request $request): array
    {
        $makairaFilter = [];
        foreach ($request->query as $key => $value) {
            if (str_starts_with((string) $key, 'filter_')) {
                $makairaFilter[str_replace('filter_', '', (string) $key)] = explode('|', (string) $value);
            }
        }

        $min = $request->query->get('min-price');
        $max = $request->query->get('max-price');

        if ($min) {
            $makairaFilter['price_from'] = $min;
        }

        if ($max) {
            $makairaFilter['price_to'] = $max;
        }

        if (\array_key_exists('Nachhaltigkeit', $makairaFilter)) {
            $makairaFilter['Nachhaltigkeit'] = [1];
        }

        if (\array_key_exists('Sale', $makairaFilter)) {
            $makairaFilter['Sale'] = [1];
        }

        return $makairaFilter;
    }
}
