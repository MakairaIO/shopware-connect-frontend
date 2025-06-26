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
    public const ENABLE_FILTER_LISTENER     = 'enableFilterListener';
    public const FILTER_CONTAINER_SELECTORS = 'filterContainerSelectors';
    public const ENABLE_FALLBACK_CONTAINER  = 'enableFallbackContainer';
    public const UPDATE_STRATEGY            = 'updateStrategy';

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

        // If filter listener is disabled, return minimal config
        if (!$enabled) {
            return [
                'enabled'                 => false,
                'enableFallbackContainer' => false,
                'excludeSelectors'        => [],
            ];
        }

        // Parse container selectors from textarea (one per line)
        $selectorString     = $this->get(self::FILTER_CONTAINER_SELECTORS, $salesChannelId) ?? '';
        $containerSelectors = array_filter(
            array_map('trim', explode("\n", $selectorString)),
            function ($selector) {
                return !empty($selector);
            }
        );

        return [
            'enabled'                 => true,
            'excludeSelectors'        => $containerSelectors,
            'enableFallbackContainer' => (bool) $this->get(self::ENABLE_FALLBACK_CONTAINER, $salesChannelId),
        ];
    }
}
