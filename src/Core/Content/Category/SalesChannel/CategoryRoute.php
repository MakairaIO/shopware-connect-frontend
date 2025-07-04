<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Core\Content\Category\SalesChannel;

use Psr\Log\LoggerInterface;
use Shopware\Core\Content\Category\CategoryDefinition;
use Shopware\Core\Content\Category\SalesChannel\AbstractCategoryRoute;
use Shopware\Core\Content\Category\SalesChannel\CategoryRouteResponse;
use Shopware\Core\Content\Cms\SalesChannel\SalesChannelCmsPageLoader;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;

class CategoryRoute extends AbstractCategoryRoute
{
    final public const HOME = 'home';

    public function __construct(
        private readonly AbstractCategoryRoute $decorated,
        private readonly SalesChannelCmsPageLoader $cmsPageLoader,
        private readonly EntityRepository $categoryRepository,
        private readonly CategoryDefinition $categoryDefinition,
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

        // Modify the request to reload the category data
        //$request->query->set('reload', '1');

        // Add a random parameter to prevent caching
        $randomParam = 'makaira_' . uniqid();
        $request->query->set($randomParam, time());

        // Set no-cache headers to bypass caching
        $request->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate');
        $request->headers->set('Pragma', 'no-cache');
        $request->headers->set('Expires', '0');

        // Set Shopware specific no-cache header
        $request->headers->set('sw-no-cache', '1');

        // Log the modified request parameters
        $this->logger->debug('Request modified for reload', [
            'reload_param'     => $request->query->get('reload'),
            'random_param'     => $randomParam,
            'random_value'     => $request->query->get($randomParam),
            'makaira_header'   => $request->headers->get('X-Makaira-Request'),
            'all_query_params' => $request->query->all(),
        ]);

        $response = $this->decorated->load($navigationId, $request, $context);

        return $response;
    }
}
