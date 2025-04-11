<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Loader;

use Psr\Log\LoggerInterface;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityCollection;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\System\Language\LanguageCollection;
use Shopware\Core\System\SalesChannel\SalesChannelEntity;

class SalesChannelLoader
{
    public function __construct(
        protected EntityRepository $salesChannelRepository,
        protected EntityRepository $languageRepository,
        protected LoggerInterface $logger,
    ) {
    }


    public function getAllIds(Context $context, ?bool $active = null): array
    {
        $criteria = new Criteria();
        if ($active !== null) {
            $criteria->addFilter(new EqualsFilter('active', $active));
        }

        return $this->salesChannelRepository->searchIds($criteria, $context)->getIds();
    }

    public function getLanguages(Context $context, string $salesChannelId): LanguageCollection
    {
        $criteria = new Criteria([$salesChannelId]);
        $criteria->addAssociation('languages');
        $criteria->addAssociation('languages.locale');

        /** @var SalesChannelEntity $salesChannel */
        $salesChannel = $this->salesChannelRepository->search($criteria, $context)->first();

        return $salesChannel->getLanguages();
    }

    public function loadByIds(array $ids, Context $context): EntityCollection
    {
        $criteria = new Criteria($ids);

        return $this->salesChannelRepository->search($criteria, $context);
    }

    public function getLocaleCode(Context $context): ?string
    {
        $languageId = $context->getLanguageId();
        $criteria   = new Criteria([$languageId]);
        $criteria->addAssociation('locale');

        $languageEntity = $this->languageRepository
            ->search($criteria, $context)
            ->get($languageId);

        return substr($languageEntity?->getLocale()?->getCode() ?? 'en-GB', 0, 2); // fallback
    }
}
