# Multivarianten-Ausspielung mit Makaira und Shopware 6

## Zusammenfassung

Das **Makaira Connect Frontend**-Plugin fuer Shopware 6 arbeitet mit der Makaira API zusammen, die Produkte als `makaira-product` auf **Parent-Ebene** bereitstellt. Makaira uebernimmt dabei die Steuerung von Suche, Sortierung, Filterung und Pagination. Die Variantenauswahl (Farbe, Groesse, etc.) erfolgt ueber das native Shopware-Varianten-Handling auf der Produktdetailseite.

---

## Datenfluss

```
1. Shopware Storefront → Request (Suche, Kategorie, Suggest)
2. Plugin faengt den Request ab (Decorator-Pattern)
3. Plugin sendet Query an Makaira API (/search/public)
4. Makaira liefert Parent-Produkt-IDs zurueck (als makaira-product)
5. Plugin loest die Parent-IDs gegen Shopware auf (EqualsAnyFilter auf 'id')
6. Shopware liefert vollstaendige Produktdaten inkl. Varianteninformationen
7. Im Listing: Parent-Produkt wird angezeigt (ggf. mit Hauptvariante)
8. Auf der Produktdetailseite: Shopware zeigt alle Varianten zur Auswahl
```

Makaira steuert **was** angezeigt wird und in welcher **Reihenfolge**. Shopware steuert **wie** es angezeigt wird -- inklusive Varianten.

---

## Varianten-Darstellung im Storefront

Die Darstellung erfolgt auf zwei Ebenen:

### Im Listing (Kategorie / Suche)

- Makaira liefert Parent-Produkt-IDs mit Reihenfolge, Pagination und Filter-Aggregationen
- Das Plugin loest diese IDs gegen Shopware auf
- Shopware zeigt das Parent-Produkt bzw. die konfigurierte **Hauptvariante** an (Preis, Bild, Titel)

Welche Variante als "Display-Variante" im Listing erscheint, wird ueber die **Shopware-Produktkonfiguration** gesteuert -- nicht ueber Makaira.

### Auf der Produktdetailseite (PDP)

- Shopware uebernimmt die **Variantenauswahl** vollstaendig (Dropdowns, Farbauswahl, Groessenauswahl, etc.)
- Alle Varianten des Parents sind verfuegbar
- Das ist natives Shopware-Verhalten und erfordert keine zusaetzliche Makaira-Konfiguration

---

## Query-Anpassungen ueber Events

Das Plugin bietet ein Event-System (`ModifierQueryRequestEvent`), mit dem die Makaira-Query vor dem API-Call angepasst werden kann. Das ist der zentrale Erweiterungspunkt fuer individuelle Anforderungen.

### Verfuegbare Events

| Event | Konstante | Anwendungsbereich |
|---|---|---|
| `makaira.request.modifier.query.search` | `NAME_SEARCH` | Produktsuche |
| `makaira.request.modifier.query.category` | `NAME_SEARCH_CATEGORY` | Kategorielisten |
| `makaira.request.modifier.query.autosuggester` | `NAME_AUTOSUGGESTER` | Autosuggest |
| `makaira.request.modifier.query.recommendation` | `NAME_RECOMMENDATION` | Recommendations / Cross-Selling |

### Beispiel: Eigener Event-Subscriber

```php
<?php

namespace MyCustomPlugin\Subscriber;

use MakairaConnectFrontend\Events\ModifierQueryRequestEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class MakairaQuerySubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            ModifierQueryRequestEvent::NAME_SEARCH          => 'onModifyQuery',
            ModifierQueryRequestEvent::NAME_SEARCH_CATEGORY => 'onModifyQuery',
        ];
    }

    public function onModifyQuery(ModifierQueryRequestEvent $event): void
    {
        $query = $event->getQuery();

        // Zusaetzliche Felder anfordern
        $query['fields'] = array_merge(
            $query['fields'] ?? [],
            ['variant_count', 'available_colors']
        );

        // Benutzerdefinierten Filter setzen
        $query['customFilter'] = ['availability' => 'in_stock'];
    }
}
```

`services.xml` im eigenen Plugin:

```xml
<service id="MyCustomPlugin\Subscriber\MakairaQuerySubscriber">
    <tag name="kernel.event_subscriber" />
</service>
```

---

## Cross-Selling / Recommendations

Fuer Produktempfehlungen auf der Detailseite stehen drei Plugin-Konfigurationen zur Verfuegung:

| Einstellung | Beschreibung |
|---|---|
| **Empfehlungen aktivieren** | Schaltet die Makaira-Recommendations ein |
| **Recommendation-ID** | ID der Recommendation-Konfiguration aus der Makaira-Administration |
| **Produktlimit** | Maximale Anzahl empfohlener Produkte (Standard: 10) |

Das Plugin sendet die aktuelle Produkt-ID an `/recommendation/public` und erhaelt empfohlene Parent-Produkte zurueck, die dann als Cross-Selling-Elemente angezeigt werden.

---

## Fallback-Verhalten

Bei einem Makaira-API-Fehler (Timeout, Serverfehler, keine Daten) greift das Plugin automatisch auf die native Shopware-Suche bzw. das native Listing zurueck. Kunden sehen immer Produkte.

---

## Debugging

- **Trace-Modus:** HTTP-Header `X-Makaira-Trace: true` fuer detaillierte API-Informationen
- **Logging:** Monolog-Channel `makaira_frontend` fuer vollstaendiges Debug-Logging

---

## Architektur

```
┌─────────────────────────────────────────────────────────┐
│                   Shopware Storefront                    │
│                                                         │
│  Suche │ Kategorie │ Autosuggest │ Cross-Selling        │
└───┬────────┬───────────┬──────────────┬─────────────────┘
    │        │           │              │
    ▼        ▼           ▼              ▼
┌─────────────────────────────────────────────────────────┐
│          Makaira Connect Frontend Plugin                 │
│          (Decorator-Pattern auf Shopware-Routen)         │
│                                                         │
│  ProductSearchRoute   → decorates Shopware Search        │
│  ProductListingRoute  → decorates Shopware Listing       │
│  ProductSuggestRoute  → decorates Shopware Suggest       │
│  CrossSellingRoute    → decorates Shopware CrossSelling  │
│                                                         │
│  ModifierQueryRequestEvent                               │
│  → Erlaubt Query-Anpassung vor dem API-Call              │
│                                                         │
│  Bei API-Fehler: automatischer Fallback auf Shopware     │
└───┬─────────────────────────────────────┬───────────────┘
    │                                     │
    ▼                                     ▼
┌──────────────────┐         ┌────────────────────────────┐
│   Makaira API    │         │   Shopware Product DB       │
│                  │         │                            │
│ /search/public   │  IDs   │ sales_channel.product.     │
│                  │────────▶│ repository                 │
│                  │         │                            │
│ Steuert:         │         │ Steuert:                   │
│ - Reihenfolge    │         │ - Produktdarstellung       │
│ - Pagination     │         │ - Varianten-Handling       │
│ - Filter/Aggs    │         │ - Bilder, Preise           │
│ - Sortierung     │         │ - Display-Variante         │
└──────────────────┘         └────────────────────────────┘
```
