<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Service;

use MakairaConnectFrontend\Utils\PluginConfig;
use Shopware\Core\Content\Media\MediaEntity;
use Shopware\Core\Framework\DataAbstractionLayer\Search\EntitySearchResult;
use Shopware\Core\Framework\Struct\ArrayEntity;
use Shopware\Core\System\SalesChannel\SalesChannelContext;

class BannerProcessingService
{
    public function __construct(private readonly PluginConfig $config)
    {
    }

    public function getBaseMediaUrl($context, $mediaUrl)
    {
        return 'https://' . $this->config->getApiCustomer($context->getSalesChannelId()) . '.makaira.media/' . $mediaUrl;
    }

    public function processBannersFromMakairaResponse(
        EntitySearchResult $shopwareResult,
        \stdClass $makairaResponse,
        SalesChannelContext $context,
    ): EntitySearchResult {
        $banner = [];

        $total = $shopwareResult->getTotal();

        if (!isset($makairaResponse->banners)) {
            return $shopwareResult;
        }

        foreach ($makairaResponse->banners as $item) {
            if (isset($item->position)) {
                if ($item->imageDesktop) {
                    $mediaDesktop = new MediaEntity();
                    $mediaDesktop->setAlt($item->title);
                    $mediaDesktop->setUrl($this->getBaseMediaUrl($context, $item->imageDesktop));
                    $item->mediaDesktop = $mediaDesktop;
                }

                if ($item->imageMobile) {
                    $media = new MediaEntity();
                    $media->setAlt($item->title);
                    $media->setUrl($this->getBaseMediaUrl($context, $item->imageMobile));
                    $item->media = $media;
                }

                // fallback to desktop image if mobile image is missing
                if (!$item->imageMobile && $item->imageDesktop) {
                    $item->media = $mediaDesktop;
                }

                // if we have less items then the position we move the first item to be shown
                if ((int) $item->position > $total && !isset($banner[$total])) {
                    $item->position = $total + 1;
                }

                $banner[$item->position] = $item;
            }
        }

        $banner = new ArrayEntity($banner);
        $shopwareResult->addExtension('makairaBanner', $banner);

        return $shopwareResult;
    }
}
