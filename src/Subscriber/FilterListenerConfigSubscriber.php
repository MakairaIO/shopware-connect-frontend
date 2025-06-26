<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Subscriber;

use MakairaConnectFrontend\Utils\PluginConfig;
use Shopware\Storefront\Event\StorefrontRenderEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class FilterListenerConfigSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly PluginConfig $pluginConfig
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
        $salesChannelContext = $event->getSalesChannelContext();
        $salesChannelId      = $salesChannelContext->getSalesChannel()->getId();

        // Get filter listener configuration
        $filterListenerConfig = $this->pluginConfig->getFilterListenerConfig($salesChannelId);

        // Add configuration to template parameters
        $event->setParameter('filterListenerConfig', $filterListenerConfig);
    }
}
