<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Struct;

use JsonSerializable;
use Shopware\Core\Framework\Struct\Struct;

class MakairaConnectFrontendService extends Struct implements JsonSerializable
{
    private bool $isRecommendationEnabled;
    private bool $isSearchEnabled;
    private bool $isListingEnabled;
    private ?string $makairaInstance;
    private array $aggregations = [];
    private int $total          = 0;

    public function __construct(
        ?string $makairaInstance = null,
        bool $isListingEnabled = false,
        bool $isSearchEnabled = false,
        bool $isRecommendationEnabled = false,
    ) {
        $this->isRecommendationEnabled = $isRecommendationEnabled;
        $this->isSearchEnabled         = $isSearchEnabled;
        $this->isListingEnabled        = $isListingEnabled;
        $this->makairaInstance         = $makairaInstance;
    }

    public function getTotal(): int
    {
        return $this->total;
    }

    public function setTotal(int $total): self
    {
        $this->total = $total;
        return $this;
    }

    public function getAggregations(): array
    {
        return $this->aggregations;
    }

    public function setAggregations(array $aggregations): self
    {
        $this->aggregations = $aggregations;
        return $this;
    }

    public function isRecommendatioEnabled(): bool
    {
        return $this->isRecommendationEnabled;
    }

    public function setIsRecommendationEnabled(bool $isRecommendationEnabled): self
    {
        $this->isRecommendationEnabled = $isRecommendationEnabled;
        return $this;
    }

    public function isSearchEnabled(): bool
    {
        return $this->isSearchEnabled;
    }

    public function setIsSearchEnabled(bool $isSearchEnabled): self
    {
        $this->isSearchEnabled = $isSearchEnabled;
        return $this;
    }

    public function isListingEnabled(): bool
    {
        return $this->isListingEnabled;
    }

    public function setIsListingEnabled(bool $isListingEnabled): self
    {
        $this->isListingEnabled = $isListingEnabled;
        return $this;
    }

    public function getMakairaInstance(): ?string
    {
        return $this->makairaInstance;
    }

    public function setMakairaInstance(?string $makairaInstance): self
    {
        $this->makairaInstance = $makairaInstance;
        return $this;
    }

    /**
     * Prevent caching of this struct
     */
    public function jsonSerialize(): array
    {
        return [
            'isRecommendationEnabled' => $this->isRecommendationEnabled,
            'isSearchEnabled'         => $this->isSearchEnabled,
            'isListingEnabled'        => $this->isListingEnabled,
            'makairaInstance'         => $this->makairaInstance,
            'aggregations'            => $this->aggregations,
            'total'                   => $this->total,
        ];
    }

}
