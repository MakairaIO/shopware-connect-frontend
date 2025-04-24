<?php

declare(strict_types=1);

namespace MakairaConnectFrontend;

use MakairaConnectFrontend\Utils\PluginConfig;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\Plugin;
use Shopware\Core\Framework\Plugin\Context\ActivateContext;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\Config\Loader\DelegatingLoader;
use Symfony\Component\Config\Loader\LoaderResolver;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\DirectoryLoader;
use Symfony\Component\DependencyInjection\Loader\GlobFileLoader;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;

class MakairaConnectFrontend extends Plugin
{
    public const PLUGIN_VERSION = '1.1.5';

    public function build(ContainerBuilder $container): void
    {
        parent::build($container);

        $locator = new FileLocator('Resources/config');

        $resolver = new LoaderResolver([
            new YamlFileLoader($container, $locator),
            new GlobFileLoader($container, $locator),
            new DirectoryLoader($container, $locator),
        ]);

        $configLoader = new DelegatingLoader($resolver);

        $confDir = \rtrim($this->getPath(), '/') . '/Resources/config';

        $configLoader->load($confDir . '/{packages}/*.yml', 'glob');
    }

    public function activate(ActivateContext $activateContext): void
    {
        parent::activate($activateContext);

        $salesChannelLoader  = $this->container->get('MakairaConnectFrontend\Loader\SalesChannelLoader');
        $systemConfigService = $this->container->get('Shopware\Core\System\SystemConfig\SystemConfigService');

        $allSalesChannelIds = $salesChannelLoader->getAllIds(Context::createDefaultContext(), null);
        foreach ($allSalesChannelIds as $salesChannelId) {
            $systemConfigService->set(PluginConfig::KEY_PREFIX . PluginConfig::MAKAIRA_INSTANCE, '', $salesChannelId);
        }
    }
}
