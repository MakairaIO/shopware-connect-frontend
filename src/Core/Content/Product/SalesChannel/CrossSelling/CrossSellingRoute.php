<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Core\Content\Product\SalesChannel\CrossSelling;

use MakairaConnectFrontend\Exception\NoDataException;
use MakairaConnectFrontend\Service\MakairaProductFetchingService;
use MakairaConnectFrontend\Service\ShopwareProductFetchingService;
use MakairaConnectFrontend\Utils\PluginConfig;
use Psr\Log\LoggerInterface;
use Shopware\Core\Content\Product\Aggregate\ProductCrossSelling\ProductCrossSellingEntity;
use Shopware\Core\Content\Product\Events\ProductCrossSellingsLoadedEvent;
use Shopware\Core\Content\Product\ProductCollection;
use Shopware\Core\Content\Product\SalesChannel\CrossSelling\CrossSellingElement;
use Shopware\Core\Content\Product\SalesChannel\CrossSelling\CrossSellingElementCollection;
use Shopware\Core\Content\Product\SalesChannel\CrossSelling\ProductCrossSellingRoute;
use Shopware\Core\Content\Product\SalesChannel\CrossSelling\ProductCrossSellingRouteResponse;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

class CrossSellingRoute extends ProductCrossSellingRoute
{
    public function __construct(
        private readonly ProductCrossSellingRoute $inner,
        private readonly LoggerInterface $logger,
        private readonly PluginConfig $pluginConfig,
        private readonly MakairaProductFetchingService $makairaProductFetchingService,
        private readonly ShopwareProductFetchingService $shopwareProductFetchingService,
        private readonly EventDispatcherInterface $eventDispatcher
    ) {
    }

    public function getDecorated(): ProductCrossSellingRoute
    {
        return $this->inner;
    }

    public function load(
        string $productId,
        Request $request,
        SalesChannelContext $context,
        Criteria $criteria
    ): ProductCrossSellingRouteResponse {
        $this->logger->debug('[Makaira] Recommendation on? ', [$this->pluginConfig->get('useForRecommendation', $context->getSalesChannel()->getId())]);
        // Check if the category setting is enabled
        if (!$this->pluginConfig->get('useForRecommendation', $context->getSalesChannel()->getId())) {
            return $this->inner->load($productId, $request, $context, $criteria);
        }

        $this->logger->debug('[Makaira] Recommendation Id? ', [$this->pluginConfig->get('recommendationId', $context->getSalesChannel()->getId())]);
        if (!$this->pluginConfig->get('recommendationId', $context->getSalesChannel()->getId())) {
            return $this->inner->load($productId, $request, $context, $criteria);
        }

        $criteria->setLimit($this->pluginConfig->get('recommendationProductLimit', $context->getSalesChannel()->getId()));

        try {
            $makairaResponse = $this->makairaProductFetchingService->fetchRecommendationFromMakaira($productId, $context, $criteria);

            if (null === $makairaResponse || !isset($makairaResponse->items)) {
                throw new NoDataException('Keine Daten oder fehlerhaft vom Makaira Server.');
            }

            $shopwareResult     = $this->shopwareProductFetchingService->fetchProductsFromShopware($makairaResponse, $criteria, $context);
            $makairaResponseIds = array_map(
                fn ($item) => $item->id ?? null,
                $makairaResponse->items
            );
            $makairaResponseIds = array_filter($makairaResponseIds);
        } catch (\Exception $e) {
            $this->logger->error('[Makaira] Error in CrossSellingRoute: ' . $e->getMessage());
            $makairaResponseIds = [];
        }

        $crossSelling = new ProductCrossSellingEntity();
        $crossSelling->setActive(true);
        $crossSelling->setId($this->pluginConfig->get('recommendationId', $context->getSalesChannel()->getId()));

        $element = new CrossSellingElement();
        $element->setTotal(\count($shopwareResult->getEntities()->getElements()));
        $element->setCrossSelling($crossSelling);
        $element->setProducts(new ProductCollection($shopwareResult->getEntities()->getElements()));

        $elements = new CrossSellingElementCollection();
        $elements->add($element);

        $this->eventDispatcher->dispatch(new ProductCrossSellingsLoadedEvent($elements, $context));

        return new ProductCrossSellingRouteResponse($elements);
    }

}
