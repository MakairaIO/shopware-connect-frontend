<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Makaira\Api;

use MakairaConnectFrontend\Makaira\Api\Exception\ApiException;
use Psr\Clock\ClockInterface;
use Psr\Log\LoggerInterface;

final readonly class ApiGateway implements ApiGatewayInterface
{
    public function __construct(
        protected ApiClient $apiClient,
        protected ClockInterface $clock,
        protected string $instance,
        protected LoggerInterface $logger,
    ) {
    }

    public function fetchMakairaProductsFromCategory(array $payload, bool $trace = false): ?\stdClass
    {

        $response = $this->apiClient->request('POST', '/search/public', null, $payload, $trace);

        // Check the responsecode
        if (200 !== $response->getStatusCode()) {
            $this->logger->error('[Makaira] Request failed', [$response->getStatusCode()]);

            throw ApiException::fromResponse($response);
        }
        return json_decode((string) $response->getContent(), false);
    }

    public function fetchSuggestionsFromMakaira(array $payload, bool $trace = false): ?\stdClass
    {
        $response = $this->apiClient->request('POST', '/search/public', null, $payload, $trace);

        // Check the responsecode
        if (200 !== $response->getStatusCode()) {
            $this->logger->error('[Makaira] Request failed', [$response->getStatusCode()]);

            throw ApiException::fromResponse($response);
        }
        return json_decode((string) $response->getContent(), false);
    }

    public function fetchProductsFromMakaira(array $payload, bool $trace = false): ?\stdClass
    {

        $response = $this->apiClient->request('POST', '/search/public', null, $payload, $trace);

        // Check the responsecode
        if (200 !== $response->getStatusCode()) {
            $this->logger->error('[Makaira] Request failed', [$response->getStatusCode()]);

            throw ApiException::fromResponse($response);
        }
        return json_decode((string) $response->getContent(), false);
    }

    public function fetchRecommendationFromMakaira(array $payload, bool $trace = false): ?\stdClass
    {
        $response = $this->apiClient->request('POST', '/recommendation/public', null, $payload, $trace);

        // Check the responsecode
        if (200 !== $response->getStatusCode()) {
            $this->logger->error('[Makaira][API] Request failed', [$response]);

            throw ApiException::fromResponse($response);
        }
        return json_decode((string) $response->getContent(), false);
    }
}
