<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Makaira\Api;

interface ApiGatewayInterface
{
    public function fetchMakairaProductsFromCategory(array $payload): ?\stdClass;

    public function fetchProductsFromMakaira(array $payload): ?\stdClass;

    public function fetchRecommendationFromMakaira(array $payload): ?\stdClass;

}
