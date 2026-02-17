# Multivarianten-Ausspielung mit Makaira und Shopware 6

## Zusammenfassung

Das **Makaira Connect Frontend**-Plugin für Shopware 6 unterstützt die Ausspielung von Produktvarianten. Die Makaira API liefert Varianten grundsätzlich als `makaira-product` zurück. Das Plugin übernimmt die Produkt-IDs aus der Makaira-Antwort und löst diese gegen die Shopware-Produktdatenbank auf, sodass die vollständigen Produktdaten (inkl. Varianten-Informationen) im Storefront angezeigt werden können.

---

## Wie funktioniert der Datenfluss?

Der grundlegende Ablauf für Suche, Kategorielisten und Autosuggest ist identisch:

```
1. Shopware-Storefront → Request (Suche, Kategorie, Suggest)
2. Plugin fängt den Request ab (Decorator-Pattern)
3. Plugin sendet Query an Makaira API (/search/public)
4. Makaira API liefert Ergebnis mit Produkt-IDs (als makaira-product)
5. Plugin löst die IDs gegen die Shopware-Datenbank auf
6. Shopware liefert vollständige Produktdaten inkl. Varianten
7. Ergebnis wird im Storefront angezeigt
```

### Konkret im Code

1. **Makaira liefert Produkt-IDs**: Die API-Antwort enthält `items` (bei Recommendations) bzw. `product.items` (bei Suche/Listing), die jeweils eine `id`-Property haben.

2. **IDs werden extrahiert** (`ShopwareProductFetchingService`):
   ```php
   // Aus src/Service/ShopwareProductFetchingService.php
   private function extractProductIdsFromMakairaResponse(\stdClass $makairaResponse): array
   {
       return array_map(fn ($product) => $product->id, $makairaResponse->items ?? $makairaResponse->product->items);
   }
   ```

3. **Shopware-Produkte werden geladen**: Die extrahierten IDs werden per `EqualsAnyFilter('id', $ids)` gegen das `sales_channel.product.repository` aufgelöst.

4. **Reihenfolge wird beibehalten**: Die Produkte werden in der von Makaira vorgegebenen Reihenfolge sortiert.

---

## Schritt-für-Schritt: Multivarianten einrichten

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
| **Für Kategorielisten verwenden** | ✓ Aktivieren |
| **Für Suche verwenden** | ✓ Aktivieren |
| **Für Autosuggest verwenden** | ✓ Aktivieren |

### Schritt 2: Makaira-seitige Konfiguration

In der Makaira-Administrationsoberfläche muss sichergestellt werden, dass:

- Die **Produktvarianten als eigenständige `makaira-product`-Dokumente** indiziert sind
- Jede Variante eine eigene `id` hat, die der **Shopware-Produkt-ID** (UUID) der jeweiligen Variante entspricht
- Die Varianten korrekt mit ihren Eigenschaften (Farbe, Größe, etc.) indiziert sind

> **Wichtig:** Die `id` in Makaira muss exakt der Shopware-Produkt-UUID entsprechen, da das Plugin die Produkte über `EqualsAnyFilter('id', $ids)` auflöst.

### Schritt 3: Varianten-Handling verstehen

Es gibt zwei grundsätzliche Strategien für die Multivarianten-Ausspielung:

#### Strategie A: Varianten als eigenständige Produkte anzeigen (Standard)

Makaira liefert einzelne Varianten-IDs zurück. Das Plugin löst jede ID gegen Shopware auf. Jede Variante erscheint als eigener Eintrag im Listing.

**Vorteil:** Maximale Sichtbarkeit aller Varianten
**Anwendungsfall:** Wenn z.B. jede Farbvariante einzeln im Listing erscheinen soll

#### Strategie B: Hauptprodukt (Parent) mit Varianten-Gruppierung

Makaira liefert die Parent-Produkt-IDs zurück. Shopware löst diese auf und stellt die Varianten automatisch über das Shopware-eigene Varianten-Handling bereit (Dropdown, Auswahl-Boxen auf der Detailseite).

**Vorteil:** Kompakteres Listing, keine Duplikate
**Anwendungsfall:** Klassisches Listing mit Variantenauswahl auf der Produktdetailseite

### Schritt 4: Query-Anpassungen über Events (Fortgeschritten)

Das Plugin bietet ein Event-System, mit dem die Makaira-Query vor dem Absenden angepasst werden kann. Dies ist besonders nützlich, um das Varianten-Verhalten zu steuern.

#### Beispiel: Eigenes Plugin zur Query-Modifikation

Erstellen Sie ein eigenes Shopware-Plugin mit einem Event-Subscriber:

```php
<?php

namespace MyCustomPlugin\Subscriber;

use MakairaConnectFrontend\Events\ModifierQueryRequestEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class MakairaVariantQuerySubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            // Suche anpassen
            ModifierQueryRequestEvent::NAME_SEARCH => 'onModifyQuery',
            // Kategorielisten anpassen
            ModifierQueryRequestEvent::NAME_SEARCH_CATEGORY => 'onModifyQuery',
            // Autosuggest anpassen
            ModifierQueryRequestEvent::NAME_AUTOSUGGESTER => 'onModifySuggestQuery',
        ];
    }

    public function onModifyQuery(ModifierQueryRequestEvent $event): void
    {
        $query = $event->getQuery();

        // Beispiel: Nur Hauptvarianten anzeigen (Parent-Produkte)
        // Dies hängt von Ihrer Makaira-Indizierung ab
        $query['customFilter'] = ['makaira_product_type' => 'parent'];

        // Beispiel: Bestimmte Felder zusätzlich anfordern
        $query['fields'] = array_merge(
            $query['fields'] ?? [],
            ['variant_attributes', 'color', 'size']
        );
    }

    public function onModifySuggestQuery(ModifierQueryRequestEvent $event): void
    {
        $query = $event->getQuery();
        // Suggest-spezifische Anpassungen
    }
}
```

Die zugehörige `services.xml` in Ihrem Plugin:

```xml
<service id="MyCustomPlugin\Subscriber\MakairaVariantQuerySubscriber">
    <tag name="kernel.event_subscriber" />
</service>
```

#### Verfügbare Events

| Event-Name | Konstante | Anwendungsbereich |
|---|---|---|
| `makaira.request.modifier.query.search` | `NAME_SEARCH` | Produktsuche |
| `makaira.request.modifier.query.category` | `NAME_SEARCH_CATEGORY` | Kategorielisten |
| `makaira.request.modifier.query.autosuggester` | `NAME_AUTOSUGGESTER` | Autosuggest |
| `makaira.request.modifier.query.recommendation` | `NAME_RECOMMENDATION` | Produktempfehlungen/Cross-Selling |

### Schritt 5: Filter für Varianten-Eigenschaften

Das Plugin unterstützt Filter, die von der Makaira API als Aggregationen zurückgeliefert werden. Diese werden automatisch verarbeitet und im Storefront angezeigt.

Unterstützte Filtertypen:

| Makaira-Typ | Shopware-Darstellung |
|---|---|
| `range_slider_price` | Preisfilter (Slider) |
| `list` | Einfach-Auswahl-Liste |
| `list_multiselect` | Mehrfach-Auswahl-Liste |
| `list_multiselect_custom_1` | Benutzerdefinierte Mehrfach-Auswahl |

Varianten-spezifische Filter (z.B. Farbe, Größe) werden automatisch angezeigt, sofern diese in Makaira als Aggregationen konfiguriert sind.

### Schritt 6: Cross-Selling / Recommendations mit Varianten

Für die Ausspielung von Varianten im Cross-Selling-Bereich:

1. In der Plugin-Konfiguration **Empfehlungen aktivieren** auf `true` setzen
2. Eine **Recommendation-ID** aus der Makaira-Administration eingeben
3. Das **Produktlimit** festlegen (Standard: 10)

Das Plugin sendet die aktuelle Produkt-ID an die Makaira Recommendation API (`/recommendation/public`) und erhält empfohlene Produkte zurück, die ebenfalls Varianten enthalten können.

---

## Häufige Fragen (FAQ)

### Q: Werden Varianten doppelt angezeigt?

**A:** Das hängt von der Makaira-Konfiguration ab. Wenn Makaira sowohl Parent-Produkte als auch ihre Varianten zurückliefert, können Duplikate im Listing auftreten. Lösung: In Makaira die Indizierung so konfigurieren, dass entweder nur Parents oder nur bestimmte Varianten zurückgegeben werden. Alternativ können Sie über das `ModifierQueryRequestEvent` einen Filter setzen.

### Q: Was passiert, wenn eine Variante in Makaira existiert, aber nicht in Shopware?

**A:** Das Plugin löst die IDs über Shopware auf. Produkte, die in Shopware nicht existieren oder nicht im Sales Channel verfügbar sind, werden automatisch herausgefiltert. Die Reihenfolge der verbleibenden Produkte bleibt erhalten.

### Q: Kann ich die zurückgegebenen Felder steuern?

**A:** Ja. Über das Event-System können Sie das `fields`-Array in der Query anpassen. Standardmäßig werden für die Suche `['id', 'title']` und für Kategorielisten `['id']` angefordert. Sie können weitere Felder hinzufügen, die für Ihre Varianten-Logik relevant sind.

### Q: Wie funktioniert die Sortierung bei Varianten?

**A:** Die Sortierung wird von Makaira übernommen. Das Plugin mappt die Shopware-Sortierfelder auf Makaira-Felder:

| Shopware-Feld | Makaira-Feld |
|---|---|
| `product.name` | `title` |
| `product.cheapestPrice` | `price` |

Zusätzliche Custom-Sortierungen können über das Sorting-Mapping in der `SortingMappingService`-Klasse konfiguriert werden.

### Q: Wie wird die Sprache bei Multivarianten gehandhabt?

**A:** Das Plugin erkennt automatisch die aktuelle Sprache des Sales Channels und sendet diese als `query.language`-Constraint an die Makaira API. Makaira liefert dann die sprachspezifischen Varianten-Daten zurück.

### Q: Was passiert bei einem API-Fehler?

**A:** Das Plugin implementiert ein robustes Fallback-Verhalten. Bei einem Fehler in der Makaira API (Timeout, Serverfehler, keine Daten) wird automatisch auf die native Shopware-Suche/Listing zurückgegriffen (Decorated Pattern). Ihre Kunden sehen also immer Produkte.

---

## Debugging und Tracing

Für die Fehleranalyse können Sie den **Trace-Modus** aktivieren, indem Sie den HTTP-Header `X-Makaira-Trace: true` an den Request senden. Dies gibt detaillierte Informationen über die Makaira-API-Kommunikation zurück.

Das Plugin loggt ausführlich über Monolog im Channel `makaira_frontend`. Aktivieren Sie Debug-Logging, um den vollständigen Ablauf nachzuvollziehen:

- `[Makaira] Listing on?` - Ist das Kategorie-Listing über Makaira aktiv?
- `[Makaira] Search on?` - Ist die Suche über Makaira aktiv?
- `[Makaira] Filter` - Welche Filter wurden aus dem Request extrahiert?
- `[Makaira] Sorting` - Welche Sortierung wird an Makaira gesendet?
- `[Makaira][Listing] Products total` - Wie viele Produkte wurden gefunden?

---

## Zusammenfassung der Architektur

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
│                                                         │
│  ProductSearchRoute  (decorates Shopware Search)         │
│  ProductListingRoute (decorates Shopware Listing)        │
│  ProductSuggestRoute (decorates Shopware Suggest)        │
│  CrossSellingRoute   (decorates Shopware CrossSelling)   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ModifierQueryRequestEvent                        │    │
│  │ → Erlaubt Query-Anpassung vor dem API-Call       │    │
│  └─────────────────────────────────────────────────┘    │
└───┬─────────────────────────────────────┬───────────────┘
    │                                     │
    ▼                                     ▼
┌──────────────────┐         ┌────────────────────────────┐
│   Makaira API    │         │   Shopware Product DB       │
│                  │         │                            │
│ /search/public   │────────▶│ sales_channel.product.     │
│ /recommendation/ │  IDs    │ repository                 │
│  public          │         │                            │
│                  │         │ → Vollständige Produktdaten │
│ Liefert:         │         │   inkl. Varianten,         │
│ makaira-product  │         │   Bilder, Preise           │
│ mit Produkt-IDs  │         │                            │
└──────────────────┘         └────────────────────────────┘
```

---

## Ansprechpartner

Bei weiteren Fragen zur Multivarianten-Konfiguration wenden Sie sich bitte an Ihr Makaira Customer Success Team.
