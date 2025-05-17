<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Storefront\Controller;

use Shopware\Core\Content\Category\Exception\CategoryNotFoundException;
use Shopware\Core\Content\Category\SalesChannel\AbstractCategoryRoute;
use Shopware\Core\Content\Cms\Exception\PageNotFoundException;
use Shopware\Core\Content\Cms\SalesChannel\CmsRoute;
use Shopware\Core\Framework\Routing\Exception\MissingRequestParameterException;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Controller\StorefrontController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route(defaults: ['_routeScope' => ['storefront']])]
class CustomStorefrontController extends StorefrontController
{
    public function __construct(
        private readonly AbstractCategoryRoute $categoryRoute,
        private readonly CmsRoute $cmsRoute
    ) {
    }

    #[Route(
        path: '/widgets/cms/navigation/{navigationId}',
        name: 'frontend.cms.navigation.page',
        defaults: ['navigationId' => null, 'XmlHttpRequest' => true, '_httpCache' => true],
        methods: ['GET', 'POST']
    )]
    public function category(?string $navigationId, Request $request, SalesChannelContext $salesChannelContext): Response
    {
        if (!$navigationId) {
            throw new MissingRequestParameterException('navigationId');
        }

        try {
            // Get the category information
            $category = $this->categoryRoute->load($navigationId, $request, $salesChannelContext)->getCategory();

            // Get its CMS page ID
            $cmsPageId = $category->getCmsPageId();

            if (!$cmsPageId) {
                throw new PageNotFoundException('');
            }

            // Load the CMS page
            $page = $this->cmsRoute->load(
                $cmsPageId,
                $request,
                $salesChannelContext
            )->getCmsPage();

            // Prepare template variables
            $templateVars = [
                'cmsPage'  => $page,
                'page'     => $page,
                'category' => $category,
            ];

            // Add element and block data if available
            if ($page->getSections()->count()                       > 0 &&
                $page->getSections()->first()->getBlocks()->count() > 0) {
                $block                 = $page->getSections()->first()->getBlocks()->first();
                $templateVars['block'] = $block;

                if ($block->getSlots()->count() > 0) {
                    $templateVars['element'] = $block->getSlots()->first();
                }
            }

            // Render the filter panel
            $filterPanel = $this->renderStorefront(
                '@Storefront/storefront/element/cms-element-sidebar-filter.html.twig',
                $templateVars
            );

            $filterPanelContent = $filterPanel->getContent();

            // Render the main template with the additional content
            $response = $this->renderStorefront('@Storefront/storefront/page/content/detail.html.twig', [
                'cmsPage'     => $page,
                'category'    => $category,
                'filterPanel' => $filterPanelContent,
            ]);

            // Add our script to the response content
            $content = $response->getContent();

            $content .= $filterPanelContent;
            $response->setContent($content);

            $response->headers->set('x-robots-tag', 'noindex');

            return $response;
        } catch (CategoryNotFoundException) {
            throw $this->createNotFoundException('Category not found.');
        } catch (PageNotFoundException) {
            throw $this->createNotFoundException('CMS page not found.');
        }
    }
}
