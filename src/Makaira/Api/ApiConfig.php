<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Makaira\Api;

use Shopware\Core\Framework\Struct\Struct;

class ApiConfig extends Struct
{
    public function __construct(
        protected string $baseUrl,
        protected string $instance,
        protected int $timeout,
    ) {
    }

    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    public function setBaseUrl(string $baseUrl): void
    {
        $this->baseUrl = $baseUrl;
    }

    public function getInstance(): string
    {
        return $this->instance;
    }

    public function setInstance(string $instance): void
    {
        $this->instance = $instance;
    }

    public function getTimeout(): int
    {
        return $this->timeout;
    }

    public function setTimeout(int $timeout): void
    {
        $this->timeout = $timeout;
    }
}
