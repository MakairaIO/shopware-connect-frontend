<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Makaira\Api;

use MakairaConnectFrontend\MakairaConnectFrontend;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final readonly class ApiClientFactory
{
    public function __construct(
        protected HttpClientInterface $httpClient,
        protected string $shopwareVersion,
    ) {
    }

    public function create(ApiConfig $apiConfig): ApiClient
    {
        $userAgent = sprintf('Shopware/%s MakairaConnectFrontend/%s', $this->shopwareVersion, MakairaConnectFrontend::PLUGIN_VERSION);

        return new ApiClient(
            $this->httpClient,
            $apiConfig->getBaseUrl(),
            $apiConfig->getInstance(),
            $userAgent,
            $apiConfig->getTimeout(),
        );
    }
}
