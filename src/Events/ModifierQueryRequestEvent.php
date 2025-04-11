<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Events;

use Symfony\Contracts\EventDispatcher\Event;

/**
 * Possibility to change the query before sending it to Makaira.
 */
class ModifierQueryRequestEvent extends Event
{
    public const NAME_SEARCH = 'makaira.request.modifier.query.search';

    public const NAME_AUTOSUGGESTER = 'makaira.request.modifier.query.autosuggester';

    public const NAME_SEARCH_CATEGORY = 'makaira.request.modifier.query.category';

    public const NAME_RECOMMENDATION = 'makaira.request.modifier.query.recommendation';


    private \ArrayObject $query;

    public function __construct(
        array $query,
    ) {
        $this->query = new \ArrayObject($query);
    }

    public function getQuery(): \ArrayObject
    {
        return $this->query;
    }
}
