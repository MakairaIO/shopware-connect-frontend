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

    // Fast Autosuggest Configuration
    public const USE_FAST_AUTOSUGGEST           = 'useFastAutosuggest';
    public const AUTOSUGGEST_DEBOUNCE_DELAY     = 'autosuggestDebounceDelay';
    public const AUTOSUGGEST_MIN_CHARS          = 'autosuggestMinChars';
    public const AUTOSUGGEST_MAX_RESULTS        = 'autosuggestMaxResults';
    public const AUTOSUGGEST_SHOW_CATEGORIES    = 'autosuggestShowCategories';
    public const AUTOSUGGEST_SHOW_PAGES         = 'autosuggestShowPages';
    public const AUTOSUGGEST_SHOW_LINKS         = 'autosuggestShowLinks';

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

    /**
     * Get the fast autosuggest configuration for the given sales channel.
     *
     * @param string|null $salesChannelId
     * @return array{enabled: bool, debounceDelay: int, minChars: int, maxResults: int, showCategories: bool, showPages: bool, showLinks: bool}
     */
    public function getFastAutosuggestConfig(?string $salesChannelId = null): array
    {
        return [
            'enabled'        => (bool) $this->get(self::USE_FAST_AUTOSUGGEST, $salesChannelId),
            'debounceDelay'  => (int) ($this->get(self::AUTOSUGGEST_DEBOUNCE_DELAY, $salesChannelId) ?? 150),
            'minChars'       => (int) ($this->get(self::AUTOSUGGEST_MIN_CHARS, $salesChannelId) ?? 3),
            'maxResults'     => (int) ($this->get(self::AUTOSUGGEST_MAX_RESULTS, $salesChannelId) ?? 10),
            'showCategories' => (bool) ($this->get(self::AUTOSUGGEST_SHOW_CATEGORIES, $salesChannelId) ?? true),
            'showPages'      => (bool) ($this->get(self::AUTOSUGGEST_SHOW_PAGES, $salesChannelId) ?? true),
            'showLinks'      => (bool) ($this->get(self::AUTOSUGGEST_SHOW_LINKS, $salesChannelId) ?? true),
        ];
    }
}
