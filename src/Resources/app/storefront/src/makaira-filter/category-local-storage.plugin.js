import Plugin from "src/plugin-system/plugin.class";

/**
 * CategoryLocalStorage Plugin
 *
 * Detects available filters on Shopware category pages and stores them as an array to localStorage.
 * Tracks which filters are available for each category page visit.
 *
 * Configuration options:
 * - enabled: Whether the plugin is enabled
 * - storageKey: The key to use in localStorage (default: 'macatfiall')
 *
 * Usage:
 * <div data-category-local-storage="true"
 *      data-category-local-storage-options='{"enabled": true, "storageKey": "macatfiall"}'>
 * </div>
 */
export default class CategoryLocalStorage extends Plugin {
  static options = {
    enabled: true,
    storageKey: "macatfiall",
    includeTimestamp: false,
  };

  constructor(el, options, pluginName) {
    super(el, options, pluginName);

    this._currentCategoryId = null;
    this._isInitialized = false;

    // Merge configuration from data attributes
    this._mergeConfigFromElement(el);
  }

  /**
   * Merge configuration from PHP (data attribute) with default options
   */
  _mergeConfigFromElement(el) {
    const configAttribute = el.getAttribute(
      "data-category-local-storage-options"
    );
    if (configAttribute) {
      try {
        const pluginConfig = JSON.parse(configAttribute);
        Object.assign(this.options, pluginConfig);
      } catch (e) {
        console.warn(
          "CategoryLocalStorage: Failed to parse configuration from data attribute",
          e
        );
      }
    }
  }

  init() {
    if (!this.options.enabled) {
      return;
    }

    this._detectAndStoreCategoryData();
    this._setupUrlChangeListener();
    this._isInitialized = true;
  }

  /**
   * Detect available filters and store to localStorage
   */
  _detectAndStoreCategoryData() {
    const availableFilters = this._getCategoryData();

    if (availableFilters && availableFilters.length > 0) {
      this._storeToLocalStorage(availableFilters);

      // Also store to macurrfi if filter parameters are present in URL
      if (this._hasFilterParameters()) {
        this._storeCurrentFiltersToLocalStorage(availableFilters);
      } else {
        // Clean macurrfi if no filter parameters are present
        this._clearCurrentFiltersFromLocalStorage();
      }

      this._currentCategoryId = this._extractCategoryId();
    }
  }

  /**
   * Set up listener for URL changes (for SPA navigation)
   */
  _setupUrlChangeListener() {
    // Listen for popstate events (browser navigation)
    window.addEventListener("popstate", () => {
      setTimeout(() => this._detectAndStoreCategoryData(), 100);
    });

    // Listen for Shopware's listing updates
    // if (this.$emitter) {
    //   this.$emitter.subscribe('Listing/afterRenderResponse', () => {
    //     setTimeout(() => this._detectAndStoreCategoryData(), 100);
    //   });
    // }

    // Also listen for pushState/replaceState changes
    // const originalPushState = history.pushState;
    // const originalReplaceState = history.replaceState;

    // history.pushState = (...args) => {
    //   originalPushState.apply(history, args);
    //   setTimeout(() => this._detectAndStoreCategoryData(), 100);
    // };

    // history.replaceState = (...args) => {
    //   originalReplaceState.apply(history, args);
    //   setTimeout(() => this._detectAndStoreCategoryData(), 100);
    // };
  }

  /**
   * Extract available filters from the current page
   */
  _getCategoryData() {
    // Check if we're on a category page
    if (!this._isOnCategoryPage()) {
      return null;
    }

    // Simply return the available filters array
    return this._getAvailableFilters();
  }

  /**
   * Check if current page is a category page
   */
  _isOnCategoryPage() {
    // Check for category-specific elements
    const categoryIndicators = [
      ".category-listing",
      ".cms-element-product-listing",
      "[data-listing]",
      ".product-listing",
      "body.is-ctl-navigation",
    ];

    return categoryIndicators.some(
      (selector) => document.querySelector(selector) !== null
    );
  }

  /**
   * Extract category ID from various sources (simplified)
   */
  _extractCategoryId() {
    // Method 1: From data attributes
    const listingElement = document.querySelector("[data-listing]");
    if (listingElement && listingElement.dataset.listingOptions) {
      try {
        const listingOptions = JSON.parse(
          listingElement.dataset.listingOptions
        );
        if (listingOptions.categoryId) {
          return listingOptions.categoryId;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Method 2: From URL patterns
    const path = window.location.pathname;
    const match = path.match(/\/navigation\/([a-f0-9-]+)/);
    if (match) {
      return match[1];
    }

    // Method 3: Generate simple identifier from URL
    return window.location.pathname.replace(/\//g, "_") || "unknown_category";
  }

  /**
   * Check if URL contains parameters that start with "filter_"
   */
  _hasFilterParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    for (const [key] of urlParams) {
      if (key.startsWith("filter_")) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get available filters from the page
   */
  _getAvailableFilters() {
    const filterItems = document.querySelectorAll(
      ".filter-panel-item[data-filter-multi-select-options]"
    );
    const availableFilters = [];

    filterItems.forEach((filterItem) => {
      try {
        const optionsData = filterItem.getAttribute(
          "data-filter-multi-select-options"
        );
        if (optionsData) {
          const options = JSON.parse(optionsData);
          if (options.name) {
            availableFilters.push(options.name);
          }
        }
      } catch (e) {
        // Ignore parsing errors and continue with next item
        console.warn(
          "CategoryLocalStorage: Failed to parse filter options for item:",
          filterItem,
          e
        );
      }
    });

    return availableFilters;
  }

  /**
   * Store filters array to localStorage
   */
  _storeToLocalStorage(filtersArray) {
    try {
      const storageValue = JSON.stringify(filtersArray);
      localStorage.setItem(this.options.storageKey, storageValue);

      console.log(
        `CategoryLocalStorage: Stored available filters to localStorage with key "${this.options.storageKey}":`,
        filtersArray
      );
    } catch (e) {
      console.error(
        "CategoryLocalStorage: Failed to store filters to localStorage:",
        e
      );
    }
  }

  /**
   * Store current filters to localStorage with key "macurrfi"
   */
  _storeCurrentFiltersToLocalStorage(filtersArray) {
    try {
      const storageValue = JSON.stringify(filtersArray);
      localStorage.setItem("macurrfi", storageValue);

      console.log(
        'CategoryLocalStorage: Stored current filters to localStorage with key "macurrfi":',
        filtersArray
      );
    } catch (e) {
      console.error(
        "CategoryLocalStorage: Failed to store current filters to localStorage:",
        e
      );
    }
  }

  /**
   * Clear current filters from localStorage by setting macurrfi to values from macatfiall
   */
  _clearCurrentFiltersFromLocalStorage() {
    try {
      // Get values from macatfiall and set them to macurrfi
      const macatfiallData = localStorage.getItem(this.options.storageKey);
      if (macatfiallData) {
        localStorage.setItem("macurrfi", macatfiallData);
        const filtersArray = JSON.parse(macatfiallData);
        console.log(
          "CategoryLocalStorage: Set macurrfi to values from macatfiall (no filter parameters):",
          filtersArray
        );
      } else {
        // If macatfiall doesn't exist, remove macurrfi
        localStorage.removeItem("macurrfi");
        console.log(
          "CategoryLocalStorage: Removed macurrfi from localStorage (no filter parameters, no macatfiall data)"
        );
      }
    } catch (e) {
      console.error(
        "CategoryLocalStorage: Failed to clear current filters from localStorage:",
        e
      );
    }
  }

  /**
   * Get stored filters from localStorage
   */
  getStoredFilters() {
    try {
      const data = localStorage.getItem(this.options.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(
        "CategoryLocalStorage: Failed to retrieve filters from localStorage:",
        e
      );
      return [];
    }
  }

  /**
   * Clear stored filters from localStorage
   */
  clearStoredFilters() {
    try {
      localStorage.removeItem(this.options.storageKey);
      console.log(
        `CategoryLocalStorage: Cleared filters from localStorage key "${this.options.storageKey}"`
      );
    } catch (e) {
      console.error(
        "CategoryLocalStorage: Failed to clear filters from localStorage:",
        e
      );
    }
  }

  /**
   * Check if currently on a category page
   */
  isOnCategoryPage() {
    return this._currentCategoryId !== null;
  }

  /**
   * Get current category ID
   */
  getCurrentCategoryId() {
    return this._currentCategoryId;
  }
}
