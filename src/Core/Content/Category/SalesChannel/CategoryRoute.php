<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Core\Content\Category\SalesChannel;

use Psr\Log\LoggerInterface;
use Shopware\Core\Content\Category\SalesChannel\AbstractCategoryRoute;
use Shopware\Core\Content\Category\SalesChannel\CategoryRouteResponse;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;

class CategoryRoute extends AbstractCategoryRoute
{
    final public const HOME = 'home';

    public function __construct(
        private readonly AbstractCategoryRoute $decorated,
        private readonly LoggerInterface $logger
    ) {
        $this->logger->info('MakairaConnectFrontend CategoryRoute decorator instantiated', [
            'decorated_class' => get_class($this->decorated),
            'time'            => date('Y-m-d H:i:s'),
        ]);
    }

    public function getDecorated(): AbstractCategoryRoute
    {
        return $this->decorated;
    }

    public function load(string $navigationId, Request $request, SalesChannelContext $context): CategoryRouteResponse
    {
        $this->logger->info('MakairaConnectFrontend CategoryRoute::load called', [
            'navigationId'    => $navigationId,
            'request_uri'     => $request->getRequestUri(),
            'route_name'      => $request->attributes->get('_route'),
            'decorated_class' => get_class($this->decorated),
            'time'            => date('Y-m-d H:i:s'),
        ]);

        // Soften cache bypass for 6.7 HTTP cache / ESI: avoid random query params that
        // poison cache keys; keep Shopware no-cache header so Makaira aggregations stay fresh.
        $request->headers->set('sw-no-cache', '1');

        return $this->decorated->load($navigationId, $request, $context);
    }
}
