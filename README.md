# Makaira Connect Frontend

![Version](https://img.shields.io/github/v/tag/MakairaIO/shopware-connect-frontend?color=blue) [![Packagist Version](https://img.shields.io/packagist/v/makaira/shopware6-connect-frontend)](https://packagist.org/packages/makaira/shopware-connect-frontend)

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

1. **Base URL of Makaira API**:

   - **Key**: `makairaBaseUrl
   - **Description**: The base URL of the Makaira API.
   - **Default Value**: https://\<customer\>.makaira.io

1. **Makaira Instance**:

   - **Key**: `makairaInstance`
   - **Description**: The instance name for Makaira (e.g., live).
   - **Placeholder**: e.g. live
   - **Note**: This value must be set per sales channel.

1. **Use for Product Lists**:

   - **Key**: `useForProductLists`
   - **Description**: Whether to use Makaira for category product listings.
   - **Default Value**: false

1. **Use for Search**:

   - **Key**: `useForSearch`
   - **Description**: Whether to use Makaira for search functionality.
   - **Default Value**: false

1. **Use for Autosuggest**:

   - **Key**: `useForSuggest`
   - **Description**: Whether to use Makaira for autosuggest functionality.
   - **Default Value**: false

1. **API Timeout**:

   - **Key**: apiTimeout
   - **Description**: The timeout for API requests in seconds.
   - **Default Value**: 5

How to Configure

1. Navigate to the Shopware administration panel.
2. Go to Settings > Plugins > Makaira Connect Frontend.
3. Fill in the required fields for each sales channel:
   - Base URL of Makaira API
   - Makaira Instance
   - Use for Product Lists
   - Use for Search
   - Use for Autosuggest
   - API Timeout
     Save the configuration.

💡 **Note**: Ensure that the `Makaira Instance` values are set individually for each sales channel to .

---

## 🛠️ Development Setup

1. `git clone git@github.com:MakairaIO/shopware-connect-frontend`
2. `make init`

### Usefull commands

- Start project: `make up`
- Stop project: `make down`
- SSH to container: `make ssh`
