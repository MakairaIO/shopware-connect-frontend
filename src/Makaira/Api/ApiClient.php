<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Makaira\Api;

use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

final readonly class ApiClient
{
    public function __construct(
        protected HttpClientInterface $httpClient,
        protected string $baseUrl,
        protected string $instance,
        protected string $userAgent,
        protected int $timeout = 30,
    ) {
    }

    public function request(string $method, string $url, ?array $query = null, ?array $data = null, bool $doTrace = false): ResponseInterface
    {
        $body = null !== $data ? json_encode($data, \JSON_PRETTY_PRINT) : null;

        $headers = [
            'User-Agent'         => $this->userAgent,
            'Accept'             => 'application/json',
            'Content-Type'       => 'application/json; charset=UTF-8',
            'X-Makaira-Instance' => $this->instance,
            'X-Makaira-Trace'    => $doTrace,
        ];

        return $this->httpClient->request($method, $url, [
            'base_uri'     => $this->baseUrl,
            'headers'      => $headers,
            'query'        => $query,
            'body'         => $body,
            'http_version' => '1.1',
            'timeout'      => $this->timeout,
        ]);
    }

}
