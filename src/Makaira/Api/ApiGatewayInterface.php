<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Makaira\Api;

interface ApiGatewayInterface
{
    public function fetchMakairaProductsFromCategory(array $payload, bool $trace = false): ?\stdClass;

    public function fetchProductsFromMakaira(array $payload, bool $trace = false): ?\stdClass;

    public function fetchRecommendationFromMakaira(array $payload, bool $trace = false): ?\stdClass;

}
