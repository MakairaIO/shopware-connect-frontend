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

    // Filter Listener Configuration
    public const ENABLE_FILTER_LISTENER           = 'enableFilterListener';
    public const HIDE_ITEMS_WHEN_OFFCANVAS_HIDDEN = 'hideItemsWhenOffcanvasHidden';

    public const KEY_PREFIX = 'MakairaConnectFrontend.config.';

    public function __construct(
        protected SystemConfigService $systemConfigService,
        protected $salesChannelLoader = null
    ) {
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

    public function getFilterListenerConfig(?string $salesChannelId = null): array
    {
        $enabled = $this->get(self::ENABLE_FILTER_LISTENER, $salesChannelId);

        return [
            'enabled'                      => (bool) $enabled,
            'hideItemsWhenOffcanvasHidden' => (bool) $this->get(self::HIDE_ITEMS_WHEN_OFFCANVAS_HIDDEN, $salesChannelId),
        ];
    }
}
