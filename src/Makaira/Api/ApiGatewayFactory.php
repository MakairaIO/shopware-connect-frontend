<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Makaira\Api;

use Psr\Clock\ClockInterface;
use Psr\Log\LoggerInterface;

final readonly class ApiGatewayFactory
{
    public function __construct(
        protected ApiClientFactory $apiClientFactory,
        protected ClockInterface $clock,
        protected LoggerInterface $logger,
    ) {
    }

    public function create(ApiConfig $apiConfig): ApiGateway
    {
        return new ApiGateway(
            $this->apiClientFactory->create($apiConfig),
            $this->clock,
            $apiConfig->getInstance(),
            $this->logger
        );
    }
}
