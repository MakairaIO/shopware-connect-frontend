# Makaira Connect Frontend

![Version](https://img.shields.io/github/v/tag/MakairaIO/shopware-connect-frontend?color=blue) [![Packagist Version](https://img.shields.io/packagist/v/makaira/shopware6-connect-frontend)](https://packagist.org/packages/makaira/shopware6-connect-frontend)

## 🎯 Purpose

The **Makaira Connect Frontend** module integrates the Makaira API client into Shopware, enabling advanced features such as product listings, search, autosuggest, and personalized recommendations. This module enhances the Shopware storefront by leveraging Makaira's powerful API capabilities to deliver a seamless and optimized shopping experience.

---

## ✨ Key Features

- 🔍 **Search Integration**: Provides fast and accurate product search powered by the Makaira API.
- 💡 **Autosuggest**: Offers real-time search suggestions to improve user experience.
- 🛒 **Product Listings**: Displays product data fetched directly from the Makaira API.
- 🎯 **Recommendations**: Delivers personalized product recommendations based on user behavior and preferences.
- 🌐 **API Client**: A robust client for interacting with the Makaira platform.

---

## ⚙️ Installation

To install the **Makaira Connect Frontend** module in your Shopware 6 environment, follow these steps:

1. **Install via Composer**:

   ```bash
   composer require makaira/shopware6-connect-frontend
   ```

2. **Activate the Plugin**:
   - After installation, activate the plugin by running:
     ```bash
     bin/console plugin:install --activate MakairaConnectFrontend
     ```
3. **Configure the Plugin**:

   - Navigate to the Shopware administration panel.
   - Go to **Settings > Plugins > Makaira Connect Frontend**.

---

## ⚙️ Configuration

The following configuration options are available for the Makaira Connect Frontend module:

### General Settings

1. **Base URL of Makaira API**:

   - **Key**: `makairaBaseUrl`
   - **Description**: The base URL of the Makaira API.
   - **Default Value**: `https://<customer>.makaira.io`
   - **Help Text**: The URL of your Makaira account in the format `https://<customer>.makaira.io`.

2. **Makaira Instance**:

   - **Key**: `makairaInstance`
   - **Description**: The instance name for Makaira (e.g., live or staging).
   - **Placeholder**: e.g., live
   - **Help Text**: Please set the Makaira instance name to connect the data provider.

3. **API Timeout**:
   - **Key**: `apiTimeout`
   - **Description**: The timeout for API requests in seconds.
   - **Default Value**: `5`
   - **Help Text**: Set the timeout for API requests in seconds.

---

### Search Settings

1. **Use for Product Lists**:

   - **Key**: `useForProductLists`
   - **Description**: Whether to use Makaira for category product listings.
   - **Default Value**: `false`
   - **Help Text**: Enable this option to use Makaira for category product listings.

2. **Use for Search**:

   - **Key**: `useForSearch`
   - **Description**: Whether to use Makaira for search functionality.
   - **Default Value**: `false`
   - **Help Text**: Enable this option to use Makaira for search functionality.

3. **Use for Autosuggest**:
   - **Key**: `useForSuggest`
   - **Description**: Whether to use Makaira for autosuggest functionality.
   - **Default Value**: `false`
   - **Help Text**: Enable this option to use Makaira for autosuggest functionality.

---

### Recommendation Settings

1. **Use for Recommendations**:

   - **Key**: `useForRecommendation`
   - **Description**: Whether to use Makaira for product recommendations.
   - **Default Value**: `false`
   - **Help Text**: Enable this option to use Makaira for product recommendations.

2. **Recommendation ID**:

   - **Key**: `recommendationId`
   - **Description**: The ID for the recommendation configuration to use for cross-selling.
   - **Placeholder**: Enter recommendation ID
   - **Help Text**: Provide the ID for the recommendation configuration to use for cross-selling.

3. **Recommendation Product Limit**:
   - **Key**: `recommendationProductLimit`
   - **Description**: The maximum number of products to return from the Makaira recommendation.
   - **Default Value**: `10`
   - **Minimum Value**: `1`
   - **Help Text**: Set the maximum number of products to return from the Makaira recommendation.

---

### How to Configure

1. Navigate to the Shopware administration panel.
2. Go to **Settings > Plugins > Makaira Connect Frontend**.
3. Fill in the required fields for each sales channel:
   - Base URL of Makaira API
   - Makaira Instance
   - API Timeout
   - Use for Product Lists
   - Use for Search
   - Use for Autosuggest
   - Use for Recommendations
   - Recommendation ID
   - Recommendation Product Limit
4. Save the configuration.

💡 **Note**: Ensure that the `Makaira Instance` values are set individually for each sales channel.

---

## 🛠️ Development Setup

1. `git clone git@github.com:MakairaIO/shopware-connect-frontend`
2. `make init`

### Useful Commands

- Start project: `make up`
- Stop project: `make down`
- SSH to container: `make ssh`

---

### 📢 Events

The **Makaira Connect Frontend** module provides several events that can be used to customize the request sent to the Makaira API. Below is a list of available events:

#### `ModifierQueryRequestEvent`

This event allows you to modify the query before it is sent to the Makaira API.

- **Class**: `MakairaConnectFrontend\Events\ModifierQueryRequestEvent`
- **Namespace**: `MakairaConnectFrontend\Events`
- **Event Names**:
  - `makaira.request.modifier.query.search`: Triggered for search queries.
  - `makaira.request.modifier.query.autosuggester`: Triggered for autosuggest queries.
  - `makaira.request.modifier.query.category`: Triggered for category-based search queries.
  - `makaira.request.modifier.query.recommendation`: Triggered for recommendation queries.
- **Methods**:
  - `getQuery(): \ArrayObject`: Returns the query as an `ArrayObject` for modification.

**Usage Example**:

```php
use MakairaConnectFrontend\Events\ModifierQueryRequestEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class CustomQueryModifierSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            ModifierQueryRequestEvent::NAME_SEARCH => 'onSearchQueryModify',
        ];
    }

    public function onSearchQueryModify(ModifierQueryRequestEvent $event): void
    {
        $query = $event->getQuery();
        $query['customFilter'] = 'value'; // Add custom filter to the query
    }
}
```

💡 **Note**: You can subscribe to these events in your custom plugin to modify the query dynamically.

---

## 🛠️ Shopware Compatibility

The **Makaira Connect Frontend** module is compatible with the following Shopware versions:

| Shopware Version | Supported    |
| ---------------- | ------------ |
| 6.5              | ✅ Supported |
| 6.6              | ✅ Supported |

💡 **Note**: Ensure your Shopware installation matches one of the supported versions for optimal compatibility.
