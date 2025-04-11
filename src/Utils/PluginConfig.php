<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Utils;

use MakairaConnectFrontend\Makaira\Api\ApiConfig;
use Shopware\Core\System\SystemConfig\SystemConfigService;

class PluginConfig
{
    public const MAKAIRA_BASE_URL = 'makairaBaseUrl';

    public const MAKAIRA_INSTANCE = 'makairaInstance';
    public const API_TIMEOUT      = 'apiTimeout';

    public const KEY_PREFIX = 'MakairaConnectFrontend.config.';

    public function __construct(protected SystemConfigService $systemConfigService)
    {
    }

    public function get(string $key, ?string $salesChannelId = null): mixed
    {
        return $this->systemConfigService->get(self::KEY_PREFIX . $key, $salesChannelId);
    }

    public function hasValidMakairaCredentials(?string $salesChannelId = null): bool
    {
        if (!$this->get(self::MAKAIRA_BASE_URL, $salesChannelId)
            || !$this->get(self::MAKAIRA_INSTANCE, $salesChannelId)) {
            return false;
        }

        return true;
    }

    public function createMakairaApiConfig(?string $salesChannelId = null): ApiConfig
    {
        return new ApiConfig(
            $this->get(self::MAKAIRA_BASE_URL, $salesChannelId),
            $this->get(self::MAKAIRA_INSTANCE, $salesChannelId),
            $this->get(self::API_TIMEOUT, $salesChannelId)
        );
    }
}
