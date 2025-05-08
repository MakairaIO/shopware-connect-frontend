<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Service;

use MakairaConnectFrontend\Events\ModifierQueryRequestEvent;
use MakairaConnectFrontend\Loader\SalesChannelLoader;
use MakairaConnectFrontend\Makaira\Api\ApiGateway;
use MakairaConnectFrontend\Makaira\Api\ApiGatewayFactory;
use MakairaConnectFrontend\Utils\PluginConfig;
use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

#[\AllowDynamicProperties]
class MakairaProductFetchingService
{
    private ?ApiGateway $client = null;

    public function __construct(
        private readonly PluginConfig $config,
        private readonly EventDispatcherInterface $dispatcher,
        private readonly LoggerInterface $logger,
        private readonly SalesChannelLoader $loader,
        private readonly ApiGatewayFactory $apiGatewayFactory,
    ) {
    }

    public function fetchProductsFromMakaira(SalesChannelContext $context, string $query, Criteria $criteria, array $makairaSorting, array $makairaFilter): ?\stdClass
    {
        $client = $this->getClient($context);

        return $client->fetchProductsFromMakaira(
            $this->dispatchEvent(
                ModifierQueryRequestEvent::NAME_SEARCH,
                [
                    'isSearch'           => true,
                    'enableAggregations' => true,
                    'aggregations'       => $makairaFilter,
                    'constraints'        => $this->getDefaultConstraints($context),
                    'searchPhrase'       => $query,
                    'count'              => $criteria->getLimit(),
                    'offset'             => $criteria->getOffset(),
                    'sorting'            => $makairaSorting,
                    'fields'             => ['id', 'title'],
                ]
            )
        );
    }

    public function fetchMakairaProductsFromCategory(SalesChannelContext $context, array $categoryIds, Criteria $criteria, array $filter, array $sorting): ?\stdClass
    {
        $client                           = $this->getClient($context);
        $constraints                      = $this->getDefaultConstraints($context);
        $constraints['query.category_id'] = $categoryIds;

        $this->logger->debug('[Makaira] Filter ::', [$filter]);
        return $client->fetchMakairaProductsFromCategory($this->dispatchEvent(
            ModifierQueryRequestEvent::NAME_SEARCH_CATEGORY,
            [
                'isSearch'           => false,
                'enableAggregations' => true,
                'constraints'        => $constraints,
                'count'              => $criteria->getLimit(),
                'offset'             => $criteria->getOffset(),
                'searchPhrase'       => '',
                'aggregations'       => $filter,
                'sorting'            => $sorting,
                'customFilter'       => [],
                'fields'             => ['id'],
            ]
        ));
    }

    public function fetchSuggestionsFromMakaira(SalesChannelContext $context, $query): ?\stdClass
    {
        $client = $this->getClient($context);

        return $client->fetchSuggestionsFromMakaira(
            $this->dispatchEvent(
                ModifierQueryRequestEvent::NAME_AUTOSUGGESTER,
                [
                    'isSearch'           => true,
                    'enableAggregations' => false,
                    'fields'             => ['id', 'title'],
                    'constraints'        => $this->getDefaultConstraints($context),
                    'searchPhrase'       => $query,
                    'count'              => '10',
                ]
            )
        );
    }

    public function fetchRecommendationFromMakaira(string $productId, SalesChannelContext $context, Criteria $criteria): ?\stdClass
    {
        $client = $this->getClient($context);

        return $client->fetchRecommendationFromMakaira(
            $this->dispatchEvent(
                ModifierQueryRequestEvent::NAME_RECOMMENDATION,
                [
                    'count'              => $this->config->get('recommendationProductLimit', $context->getSalesChannel()->getId()),
                    'recommendationId'   => $this->config->get('recommendationId', $context->getSalesChannel()->getId()),
                    'productId'          => [$productId],
                    'constraints'        => $this->getDefaultConstraints($context),
                    'fields'             => ['id', 'ean'],

                ]
            )
        );
    }

    private function getDefaultConstraints(SalesChannelContext $context): array
    {
        // get the locale from the language
        $language = $this->loader->getLocaleCode($context->getContext());
        return [
            'query.shop_id'   => intval($context->getSalesChannelId()),
            'query.use_stock' => true,
            'query.language'  => $language,
        ];
    }

    private function dispatchEvent($eventName, array $query): array
    {
        $event = new ModifierQueryRequestEvent($query);
        $this->dispatcher->dispatch(
            event: $event,
            eventName: $eventName
        );

        return $event->getQuery()->getArrayCopy();
    }

    private function getClient(SalesChannelContext $context): ApiGateway
    {
        if ($this->client === null) {
            $apiConfig    = $this->config->createMakairaApiConfig($context->getSalesChannel()->getId());
            $this->client = $this->apiGatewayFactory->create($apiConfig);
        }

        return $this->client;
    }
}
