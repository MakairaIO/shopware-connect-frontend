<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Subscriber;

use MakairaConnectFrontend\Loader\SalesChannelLoader;
use MakairaConnectFrontend\Utils\PluginConfig;
use Shopware\Storefront\Event\StorefrontRenderEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Subscriber that adds Makaira autosuggest configuration to the storefront.
 *
 * This enables the fast client-side autosuggest to be initialized with the
 * correct API configuration from the plugin settings.
 */
class AutosuggestConfigSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly PluginConfig $pluginConfig,
        private readonly SalesChannelLoader $salesChannelLoader,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            StorefrontRenderEvent::class => 'onStorefrontRender',
        ];
    }

    public function onStorefrontRender(StorefrontRenderEvent $event): void
    {
        $salesChannelId = $event->getSalesChannelContext()->getSalesChannel()->getId();

        // Check if fast autosuggest is enabled
        $useFastAutosuggest = (bool) $this->pluginConfig->get('useFastAutosuggest', $salesChannelId);

        if (!$useFastAutosuggest) {
            return;
        }

        // Get Makaira API configuration
        $makairaBaseUrl = $this->pluginConfig->get(PluginConfig::MAKAIRA_BASE_URL, $salesChannelId);
        $makairaInstance = $this->pluginConfig->get(PluginConfig::MAKAIRA_INSTANCE, $salesChannelId);

        // If credentials are not set, don't enable fast autosuggest
        if (empty($makairaBaseUrl) || empty($makairaInstance)) {
            return;
        }

        // Get autosuggest-specific configuration
        $debounceDelay = (int) ($this->pluginConfig->get('autosuggestDebounceDelay', $salesChannelId) ?? 150);
        $minChars = (int) ($this->pluginConfig->get('autosuggestMinChars', $salesChannelId) ?? 3);
        $maxResults = (int) ($this->pluginConfig->get('autosuggestMaxResults', $salesChannelId) ?? 10);
        $showCategories = (bool) ($this->pluginConfig->get('autosuggestShowCategories', $salesChannelId) ?? true);
        $showPages = (bool) ($this->pluginConfig->get('autosuggestShowPages', $salesChannelId) ?? true);
        $showLinks = (bool) ($this->pluginConfig->get('autosuggestShowLinks', $salesChannelId) ?? true);

        // Get current locale/language
        $language = $this->salesChannelLoader->getLocaleCode($event->getSalesChannelContext()->getContext());

        // Build configuration array for the JavaScript plugin
        $autosuggestConfig = [
            'enabled' => true,
            'makairaBaseUrl' => rtrim($makairaBaseUrl, '/'),
            'makairaInstance' => $makairaInstance,
            'debounceDelay' => $debounceDelay,
            'minSearchLength' => $minChars,
            'maxResults' => $maxResults,
            'showProducts' => true,
            'showCategories' => $showCategories,
            'showPages' => $showPages,
            'showLinks' => $showLinks,
            'language' => $language,
            'shopId' => 1, // Legacy shop ID for Makaira
        ];

        // Add configuration to template parameters
        $event->setParameter('makairaAutosuggestConfig', $autosuggestConfig);
    }
}
