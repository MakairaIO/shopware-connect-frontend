# Multivarianten-Ausspielung mit Makaira und Shopware 6

## Zusammenfassung

Das **Makaira Connect Frontend**-Plugin fuer Shopware 6 arbeitet mit der Makaira API zusammen, die Produkte grundsaetzlich als `makaira-product` auf **Parent-Ebene** (Hauptprodukt-Ebene) bereitstellt. Das bedeutet: Makaira liefert Parent-Produkt-IDs, und das Plugin loest diese gegen die Shopware-Produktdatenbank auf. Die Variantenauswahl (Farbe, Groesse, etc.) erfolgt dann ueber das native Shopware-Varianten-Handling auf der Produktdetailseite.

**Wichtig:** Ein reines Variantenmodell, bei dem einzelne Varianten als eigenstaendige Eintraege im Listing erscheinen, wird von der Makaira API nicht unterstuetzt. Pagination (`count`/`offset`), Gesamtanzahl (`total`) und Filter-Aggregationen werden alle auf Parent-Ebene berechnet. Wuerde man versuchen, Varianten client-seitig aus den Parent-Daten herauszuziehen, wuerden diese Werte nicht mehr stimmen.

---

## Warum kein reines Variantenmodell?

Die Makaira API `/search/public` arbeitet auf Parent-Produkt-Ebene. Das hat drei konkrete Konsequenzen:

1. **Pagination**: Die Parameter `count` und `offset` beziehen sich auf die Anzahl der Parent-Produkte. Wenn Makaira 24 Produkte pro Seite liefert, sind das 24 Parents -- nicht 24 Varianten.

2. **Total**: Der Wert `product.total` in der Makaira-Antwort zaehlt Parent-Produkte. Wenn der Shop 500 Produkte hat, steht dort 500, unabhaengig davon, ob jedes Produkt 5 Farbvarianten hat.

3. **Filter-Aggregationen**: Die Aggregationen (z.B. "Farbe: Rot (12), Blau (8)") zaehlen, wie viele Parent-Produkte diesem Filter entsprechen. Nicht wie viele Varianten.

Wuerde man nun versuchen, die Varianten aus den Parents zu extrahieren und als einzelne Listing-Eintraege anzuzeigen, haette man folgende Probleme:
- Die Seitenanzahl stimmt nicht (Pagination kaputt)
- Die Filter-Counts stimmen nicht
- Die Gesamtanzahl stimmt nicht
- Die Sortierung waere nicht mehr korrekt

**Fazit: Das ist kein gangbarer Weg.**

---

## So funktioniert die Multivarianten-Ausspielung korrekt

### Der Datenfluss

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

### Konkret im Code

Makaira liefert IDs, das Plugin extrahiert sie:

```php
// src/Service/ShopwareProductFetchingService.php
private function extractProductIdsFromMakairaResponse(\stdClass $makairaResponse): array
{
    return array_map(fn ($product) => $product->id,
        $makairaResponse->items ?? $makairaResponse->product->items);
}
```

Diese IDs sind **Parent-Produkt-IDs**. Sie werden per `EqualsAnyFilter('id', $ids)` gegen das Shopware `sales_channel.product.repository` aufgeloest:

```php
$criteria->addFilter(new EqualsAnyFilter('id', $ids));
$shopwareResult = $this->salesChannelProductRepository->search($criteria, $context);
```

Shopware liefert dann die vollstaendigen Produktdaten, inklusive Varianteninformationen, Bilder und Preise. Die Reihenfolge wird gemaess der Makaira-Sortierung beibehalten.

---

## Einrichtung: Schritt fuer Schritt

### Schritt 1: Plugin installieren und konfigurieren

```bash
composer require makaira/shopware6-connect-frontend
bin/console plugin:install --activate MakairaConnectFrontend
```

In der Shopware-Administration unter **Einstellungen > Plugins > Makaira Connect Frontend**:

| Einstellung | Wert |
|---|---|
| **Base URL** | `https://<kunde>.makaira.io` |
| **Makaira Instanz** | z.B. `live` |
| **Fuer Kategorielisten verwenden** | Aktivieren |
| **Fuer Suche verwenden** | Aktivieren |
| **Fuer Autosuggest verwenden** | Aktivieren |

> **Hinweis:** Die Konfiguration ist pro Sales Channel moeglich. Stellen Sie sicher, dass die Makaira-Instanz fuer jeden Sales Channel korrekt eingestellt ist.

### Schritt 2: Makaira-seitige Konfiguration

In der Makaira-Administration sicherstellen, dass:

- Die **Parent-Produkte** korrekt indiziert sind
- Die `id` jedes `makaira-product`-Dokuments der **Shopware-Produkt-UUID** des Parent-Produkts (bzw. der Hauptvariante) entspricht
- Varianten-Eigenschaften (Farbe, Groesse, Material, etc.) als **Aggregationen** auf dem Parent konfiguriert sind, damit sie als Filter im Listing erscheinen

> **Entscheidend:** Die `id` in Makaira muss exakt der Shopware-UUID entsprechen, da das Plugin die Produkte ueber `EqualsAnyFilter('id', $ids)` auflöst. Stimmt die ID nicht ueberein, wird das Produkt im Listing nicht angezeigt.

### Schritt 3: Varianten-Darstellung im Storefront

Die Varianten-Darstellung erfolgt auf zwei Ebenen:

**Im Listing (Kategorie / Suche):**
- Es wird das **Parent-Produkt** (bzw. die konfigurierte Hauptvariante) angezeigt
- Preis, Bild und Titel kommen vom Parent bzw. der Shopware-Hauptvariante
- Makaira bestimmt **Reihenfolge, Filterung und Pagination**

**Auf der Produktdetailseite (PDP):**
- Shopware uebernimmt die **Variantenauswahl** vollstaendig (Dropdowns, Farbauswahl, etc.)
- Alle Varianten des Parents sind verfuegbar
- Das ist natives Shopware-Verhalten und erfordert keine Makaira-Konfiguration

### Schritt 4: Filter fuer Varianten-Eigenschaften

Varianten-spezifische Eigenschaften (z.B. Farbe, Groesse) koennen als Filter im Listing angezeigt werden, sofern sie in Makaira als Aggregationen auf dem Parent konfiguriert sind.

Unterstuetzte Filtertypen:

| Makaira-Typ | Darstellung im Storefront |
|---|---|
| `range_slider_price` | Preis-Slider |
| `list` | Einfach-Auswahl-Liste |
| `list_multiselect` | Mehrfach-Auswahl-Liste |
| `list_multiselect_custom_1` | Benutzerdefinierte Mehrfach-Auswahl |

Die Filter-Counts beziehen sich auf Parent-Produkte. Beispiel: "Farbe: Rot (12)" bedeutet, dass 12 Parent-Produkte eine Variante in Rot haben.

### Schritt 5: Query-Anpassungen ueber Events (Fortgeschritten)

Das Plugin bietet ein Event-System, mit dem die Makaira-Query vor dem API-Call angepasst werden kann:

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
            ModifierQueryRequestEvent::NAME_AUTOSUGGESTER   => 'onModifySuggestQuery',
        ];
    }

    public function onModifyQuery(ModifierQueryRequestEvent $event): void
    {
        $query = $event->getQuery();

        // Beispiel: Zusaetzliche Felder anfordern
        $query['fields'] = array_merge(
            $query['fields'] ?? [],
            ['variant_count', 'available_colors']
        );

        // Beispiel: Benutzerdefinierten Filter setzen
        $query['customFilter'] = ['availability' => 'in_stock'];
    }

    public function onModifySuggestQuery(ModifierQueryRequestEvent $event): void
    {
        $query = $event->getQuery();
        // Suggest-spezifische Anpassungen
    }
}
```

Die zugehoerige `services.xml`:

```xml
<service id="MyCustomPlugin\Subscriber\MakairaQuerySubscriber">
    <tag name="kernel.event_subscriber" />
</service>
```

#### Verfuegbare Events

| Event | Konstante | Anwendungsbereich |
|---|---|---|
| `makaira.request.modifier.query.search` | `NAME_SEARCH` | Produktsuche |
| `makaira.request.modifier.query.category` | `NAME_SEARCH_CATEGORY` | Kategorielisten |
| `makaira.request.modifier.query.autosuggester` | `NAME_AUTOSUGGESTER` | Autosuggest |
| `makaira.request.modifier.query.recommendation` | `NAME_RECOMMENDATION` | Recommendations / Cross-Selling |

### Schritt 6: Cross-Selling / Recommendations

Fuer die Produktempfehlungen auf der Detailseite:

1. **Empfehlungen aktivieren** auf `true` setzen
2. Eine **Recommendation-ID** aus der Makaira-Administration eingeben
3. Das **Produktlimit** festlegen (Standard: 10)

Das Plugin sendet die aktuelle Produkt-ID an `/recommendation/public` und erhaelt empfohlene Parent-Produkte zurueck.

---

## Haeufige Fragen (FAQ)

### Q: Kann ich einzelne Varianten im Listing anzeigen statt nur den Parent?

**A:** Nein, das ist mit der Makaira API nicht moeglich. Die API arbeitet auf Parent-Ebene. Pagination, Total und Filter-Aggregationen werden alle auf Parent-Ebene berechnet. Wuerde man Varianten client-seitig extrahieren, waeren all diese Werte falsch. Die Variantenauswahl erfolgt auf der Produktdetailseite ueber das native Shopware-Varianten-Handling.

### Q: Was passiert, wenn eine Makaira-ID keinem Shopware-Produkt entspricht?

**A:** Das Produkt wird stillschweigend herausgefiltert. Die Reihenfolge der verbleibenden Produkte bleibt erhalten. Es gibt keine Fehlermeldung -- das Produkt erscheint einfach nicht im Listing.

### Q: Wie wird die Sprache bei Produkten gehandhabt?

**A:** Das Plugin erkennt automatisch die Sprache des Sales Channels und sendet sie als `query.language`-Constraint an Makaira. Makaira liefert dann die sprachspezifischen Daten zurueck.

### Q: Wie funktioniert die Sortierung?

**A:** Die Sortierung wird von Makaira uebernommen. Das Plugin mappt Shopware-Sortierfelder auf Makaira-Felder:

| Shopware-Feld | Makaira-Feld |
|---|---|
| `product.name` | `title` |
| `product.cheapestPrice` | `price` |

Zusaetzliche Custom-Sortierungen koennen in der `SortingMappingService`-Klasse konfiguriert werden.

### Q: Was passiert bei einem Makaira-API-Fehler?

**A:** Das Plugin implementiert ein automatisches Fallback. Bei API-Fehlern (Timeout, Serverfehler, keine Daten) wird auf die native Shopware-Suche/-Listing zurueckgegriffen. Kunden sehen also immer Produkte.

### Q: Kann ich die Hauptvariante steuern, die im Listing angezeigt wird?

**A:** Das bestimmt Shopware. Welche Variante als "Display-Variante" im Listing erscheint, wird ueber die Shopware-Produktkonfiguration festgelegt (Hauptvariante in der Shopware-Administration). Makaira liefert nur die Parent-ID, Shopware entscheidet, welche Variante angezeigt wird.

---

## Debugging und Tracing

**Trace-Modus:** HTTP-Header `X-Makaira-Trace: true` senden fuer detaillierte API-Informationen.

**Logging:** Monolog-Channel `makaira_frontend`:

- `[Makaira] Listing on?` -- Ist das Kategorie-Listing aktiv?
- `[Makaira] Search on?` -- Ist die Suche aktiv?
- `[Makaira] Filter` -- Extrahierte Filter aus dem Request
- `[Makaira] Sorting` -- Sortierung, die an Makaira gesendet wird
- `[Makaira][Listing] Products total` -- Anzahl gefundener Produkte
- `[Makaira][Suggest] Counts` -- Ergebnis-Counts fuer Suggest (Produkte, Kategorien, Seiten, Links)

---

## Architektur-Uebersicht

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
│  ┌─────────────────────────────────────────────────┐    │
│  │ ModifierQueryRequestEvent                        │    │
│  │ → Erlaubt Query-Anpassung vor dem API-Call       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Bei API-Fehler: automatischer Fallback auf Shopware    │
└───┬─────────────────────────────────────┬───────────────┘
    │                                     │
    ▼                                     ▼
┌──────────────────┐         ┌────────────────────────────┐
│   Makaira API    │         │   Shopware Product DB       │
│                  │         │                            │
│ /search/public   │  IDs   │ sales_channel.product.     │
│                  │────────▶│ repository                 │
│ Liefert:         │         │                            │
│ Parent-Produkt-  │         │ Liefert:                   │
│ IDs + Total +    │         │ Vollstaendige Produktdaten │
│ Aggregationen +  │         │ inkl. Varianten, Bilder,   │
│ Pagination       │         │ Preise                     │
│                  │         │                            │
│ Alles auf        │         │ Varianten-Handling auf     │
│ PARENT-Ebene     │         │ der PDP durch Shopware     │
└──────────────────┘         └────────────────────────────┘
```

---

## Ansprechpartner

Bei weiteren Fragen zur Konfiguration wenden Sie sich bitte an Ihr Makaira Customer Success Team.
