/**
 * Makaira Fast Autosuggest Plugin
 *
 * This plugin provides a high-performance autosuggest implementation that:
 * - Calls the Makaira API directly from the browser (bypassing PHP backend)
 * - Uses AbortController to cancel stale requests when new input arrives
 * - Implements configurable debouncing
 * - Renders results client-side for maximum speed
 *
 * This significantly reduces latency compared to the standard PHP-based approach
 * because it eliminates the round-trip through the Shopware backend.
 */
import Plugin from "src/plugin-system/plugin.class";

export default class MakairaAutosuggestPlugin extends Plugin {
  static options = {
    // Makaira API configuration
    makairaBaseUrl: "",
    makairaInstance: "",

    // Search configuration
    minSearchLength: 3,
    debounceDelay: 150, // Reduced from 250ms for faster response
    maxResults: 10,

    // Language/locale settings
    language: "de",
    shopId: 1,

    // Selectors
    inputSelector: 'input[type="search"]',
    resultsContainerSelector: ".search-suggest-container",
    dropdownSelector: ".search-suggest-dropdown",

    // Feature flags
    showProducts: true,
    showCategories: true,
    showPages: true,
    showLinks: true,

    // URL templates for generating links
    productUrlTemplate: "/detail/{id}",
    categoryUrlTemplate: "/navigation/{id}",
    searchUrlTemplate: "/search?search={query}",

    // Labels (can be overridden for translations)
    labels: {
      products: "Produkte",
      categories: "Kategorien",
      pages: "Seiten",
      links: "Links",
      showAll: "Alle Ergebnisse anzeigen",
      noResults: "Keine Ergebnisse gefunden",
      loading: "Suche...",
    },
  };

  init() {
    this._currentAbortController = null;
    this._debounceTimeout = null;
    this._lastQuery = "";
    this._isOpen = false;
    this._selectedIndex = -1;
    this._results = null;

    this._inputElement = this.el.querySelector(this.options.inputSelector);

    if (!this._inputElement) {
      console.warn(
        "MakairaAutosuggest: No input element found with selector:",
        this.options.inputSelector
      );
      return;
    }

    // Create the results dropdown container
    this._createDropdownContainer();

    // Bind event listeners
    this._registerEvents();

    console.debug("MakairaAutosuggest: Plugin initialized", {
      baseUrl: this.options.makairaBaseUrl,
      instance: this.options.makairaInstance,
    });
  }

  /**
   * Create the dropdown container for results
   */
  _createDropdownContainer() {
    // Check if container already exists
    let existingContainer = this.el.querySelector(
      this.options.dropdownSelector
    );
    if (existingContainer) {
      this._dropdownElement = existingContainer;
      return;
    }

    // Create new dropdown container
    this._dropdownElement = document.createElement("div");
    this._dropdownElement.className =
      "search-suggest-dropdown makaira-autosuggest-dropdown";
    this._dropdownElement.setAttribute("aria-live", "polite");
    this._dropdownElement.setAttribute("role", "listbox");
    this._dropdownElement.style.display = "none";

    // Insert after the input element's parent form or input wrapper
    const inputWrapper =
      this._inputElement.closest(".search-form") ||
      this._inputElement.parentElement;
    if (inputWrapper) {
      inputWrapper.style.position = "relative";
      inputWrapper.appendChild(this._dropdownElement);
    }
  }

  /**
   * Register all event listeners
   */
  _registerEvents() {
    // Input events
    this._inputElement.addEventListener("input", this._onInput.bind(this));
    this._inputElement.addEventListener("focus", this._onFocus.bind(this));
    this._inputElement.addEventListener("keydown", this._onKeyDown.bind(this));

    // Click outside to close
    document.addEventListener("click", this._onDocumentClick.bind(this));

    // Form submission
    const form = this._inputElement.closest("form");
    if (form) {
      form.addEventListener("submit", this._onFormSubmit.bind(this));
    }
  }

  /**
   * Handle input changes with debouncing
   */
  _onInput(event) {
    const query = event.target.value.trim();

    // Clear previous debounce timeout
    if (this._debounceTimeout) {
      clearTimeout(this._debounceTimeout);
    }

    // Cancel any pending request immediately when user types
    this._cancelPendingRequest();

    // Check minimum length
    if (query.length < this.options.minSearchLength) {
      this._hideDropdown();
      this._lastQuery = "";
      return;
    }

    // Don't search for the same query
    if (query === this._lastQuery) {
      return;
    }

    // Show loading state immediately for better UX
    this._showLoading();

    // Debounce the actual API call
    this._debounceTimeout = setTimeout(() => {
      this._performSearch(query);
    }, this.options.debounceDelay);
  }

  /**
   * Handle focus on input
   */
  _onFocus(event) {
    const query = this._inputElement.value.trim();

    // If we have previous results and a valid query, show them
    if (query.length >= this.options.minSearchLength && this._results) {
      this._showDropdown();
    }
  }

  /**
   * Handle keyboard navigation
   */
  _onKeyDown(event) {
    if (!this._isOpen) return;

    const items = this._dropdownElement.querySelectorAll(
      ".makaira-autosuggest-item"
    );
    const itemCount = items.length;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this._selectedIndex = Math.min(this._selectedIndex + 1, itemCount - 1);
        this._highlightItem(items);
        break;

      case "ArrowUp":
        event.preventDefault();
        this._selectedIndex = Math.max(this._selectedIndex - 1, -1);
        this._highlightItem(items);
        break;

      case "Enter":
        if (this._selectedIndex >= 0 && items[this._selectedIndex]) {
          event.preventDefault();
          const link = items[this._selectedIndex].querySelector("a");
          if (link) {
            window.location.href = link.href;
          }
        }
        break;

      case "Escape":
        this._hideDropdown();
        this._inputElement.blur();
        break;
    }
  }

  /**
   * Highlight selected item during keyboard navigation
   */
  _highlightItem(items) {
    items.forEach((item, index) => {
      if (index === this._selectedIndex) {
        item.classList.add("is-selected");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("is-selected");
      }
    });
  }

  /**
   * Handle click outside the dropdown
   */
  _onDocumentClick(event) {
    if (!this.el.contains(event.target)) {
      this._hideDropdown();
    }
  }

  /**
   * Handle form submission
   */
  _onFormSubmit(event) {
    this._hideDropdown();
    this._cancelPendingRequest();
  }

  /**
   * Cancel any pending API request
   */
  _cancelPendingRequest() {
    if (this._currentAbortController) {
      this._currentAbortController.abort();
      this._currentAbortController = null;
    }
  }

  /**
   * Perform the search by calling Makaira API directly
   */
  async _performSearch(query) {
    // Cancel any previous request
    this._cancelPendingRequest();

    // Create new AbortController for this request
    this._currentAbortController = new AbortController();

    const payload = {
      isSearch: true,
      enableAggregations: false,
      fields: ["id", "title", "picture_url_main", "url", "price", "ean"],
      constraints: {
        "query.shop_id": this.options.shopId,
        "query.use_stock": true,
        "query.language": this.options.language,
      },
      searchPhrase: query,
      count: this.options.maxResults,
    };

    try {
      const response = await fetch(
        `${this.options.makairaBaseUrl}/search/public`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Makaira-Instance": this.options.makairaInstance,
          },
          body: JSON.stringify(payload),
          signal: this._currentAbortController.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      // Only update if this is still the current query (not aborted)
      this._lastQuery = query;
      this._results = data;
      this._renderResults(data, query);
    } catch (error) {
      // Ignore abort errors (expected when user types quickly)
      if (error.name === "AbortError") {
        console.debug("MakairaAutosuggest: Request cancelled (new query)");
        return;
      }

      console.error("MakairaAutosuggest: Search failed", error);
      this._showError();
    }
  }

  /**
   * Show loading state
   */
  _showLoading() {
    this._dropdownElement.innerHTML = `
      <div class="makaira-autosuggest-loading">
        <div class="makaira-autosuggest-spinner"></div>
        <span>${this.options.labels.loading}</span>
      </div>
    `;
    this._showDropdown();
  }

  /**
   * Show error state
   */
  _showError() {
    this._dropdownElement.innerHTML = `
      <div class="makaira-autosuggest-error">
        Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
      </div>
    `;
  }

  /**
   * Render search results
   */
  _renderResults(data, query) {
    const products = data.product?.items || [];
    const categories = data.category?.items || [];
    const pages = data.page?.items || [];
    const links = data.links?.items || [];

    const hasResults =
      products.length > 0 ||
      categories.length > 0 ||
      pages.length > 0 ||
      links.length > 0;

    if (!hasResults) {
      this._dropdownElement.innerHTML = `
        <div class="makaira-autosuggest-no-results">
          ${this.options.labels.noResults}
        </div>
      `;
      this._showDropdown();
      return;
    }

    let html = '<div class="makaira-autosuggest-results">';

    // Products section
    if (this.options.showProducts && products.length > 0) {
      html += this._renderProductsSection(products);
    }

    // Right column for categories, pages, links
    const hasSecondaryResults =
      (this.options.showCategories && categories.length > 0) ||
      (this.options.showPages && pages.length > 0) ||
      (this.options.showLinks && links.length > 0);

    if (hasSecondaryResults) {
      html += '<div class="makaira-autosuggest-secondary">';

      if (this.options.showCategories && categories.length > 0) {
        html += this._renderCategoriesSection(categories);
      }

      if (this.options.showPages && pages.length > 0) {
        html += this._renderPagesSection(pages);
      }

      if (this.options.showLinks && links.length > 0) {
        html += this._renderLinksSection(links);
      }

      html += "</div>";
    }

    // Show all results link
    html += `
      <div class="makaira-autosuggest-footer">
        <a href="${this._getSearchUrl(query)}" class="makaira-autosuggest-show-all">
          ${this.options.labels.showAll}
          <span class="makaira-autosuggest-arrow">→</span>
        </a>
      </div>
    `;

    html += "</div>";

    this._dropdownElement.innerHTML = html;
    this._selectedIndex = -1;
    this._showDropdown();
  }

  /**
   * Render products section
   */
  _renderProductsSection(products) {
    let html = `
      <div class="makaira-autosuggest-section makaira-autosuggest-products">
        <h4 class="makaira-autosuggest-section-title">${this.options.labels.products}</h4>
        <ul class="makaira-autosuggest-list">
    `;

    products.forEach((product, index) => {
      const fields = product.fields || product;
      const title = this._escapeHtml(fields.title || "");
      const url = fields.url || this._getProductUrl(fields.id);
      const image = fields.picture_url_main || "";
      const price = fields.price ? this._formatPrice(fields.price) : "";

      html += `
        <li class="makaira-autosuggest-item makaira-autosuggest-product-item" role="option" data-index="${index}">
          <a href="${url}" class="makaira-autosuggest-product-link">
            ${
              image
                ? `
              <div class="makaira-autosuggest-product-image">
                <img src="${image}" alt="${title}" loading="lazy" />
              </div>
            `
                : ""
            }
            <div class="makaira-autosuggest-product-info">
              <span class="makaira-autosuggest-product-title">${title}</span>
              ${price ? `<span class="makaira-autosuggest-product-price">${price}</span>` : ""}
            </div>
          </a>
        </li>
      `;
    });

    html += "</ul></div>";
    return html;
  }

  /**
   * Render categories section
   */
  _renderCategoriesSection(categories) {
    let html = `
      <div class="makaira-autosuggest-section makaira-autosuggest-categories">
        <h4 class="makaira-autosuggest-section-title">${this.options.labels.categories}</h4>
        <ul class="makaira-autosuggest-list">
    `;

    categories.slice(0, 5).forEach((category) => {
      const fields = category.fields || category;
      const title = this._escapeHtml(fields.category_title || fields.title || "");
      const parent = fields.category_parent
        ? this._escapeHtml(fields.category_parent)
        : "";
      const url = this._getCategoryUrl(fields.id);

      html += `
        <li class="makaira-autosuggest-item makaira-autosuggest-category-item">
          <a href="${url}" class="makaira-autosuggest-category-link">
            ${parent ? `<span class="makaira-autosuggest-category-parent">${parent} / </span>` : ""}
            <span class="makaira-autosuggest-category-title">${title}</span>
          </a>
        </li>
      `;
    });

    html += "</ul></div>";
    return html;
  }

  /**
   * Render pages section
   */
  _renderPagesSection(pages) {
    let html = `
      <div class="makaira-autosuggest-section makaira-autosuggest-pages">
        <h4 class="makaira-autosuggest-section-title">${this.options.labels.pages}</h4>
        <ul class="makaira-autosuggest-list">
    `;

    pages.slice(0, 5).forEach((page) => {
      const fields = page.fields || page;
      const title = this._escapeHtml(fields.title || "");
      const url = fields.url || "#";

      html += `
        <li class="makaira-autosuggest-item makaira-autosuggest-page-item">
          <a href="${url}" class="makaira-autosuggest-page-link">
            <span class="makaira-autosuggest-page-title">${title}</span>
          </a>
        </li>
      `;
    });

    html += "</ul></div>";
    return html;
  }

  /**
   * Render links section
   */
  _renderLinksSection(links) {
    let html = `
      <div class="makaira-autosuggest-section makaira-autosuggest-links">
        <h4 class="makaira-autosuggest-section-title">${this.options.labels.links}</h4>
        <ul class="makaira-autosuggest-list">
    `;

    links.slice(0, 5).forEach((link) => {
      const fields = link.fields || link;
      const title = this._escapeHtml(fields.title || "");
      const url = fields.url || "#";

      html += `
        <li class="makaira-autosuggest-item makaira-autosuggest-link-item">
          <a href="${url}" class="makaira-autosuggest-link-link">
            <span class="makaira-autosuggest-link-title">${title}</span>
          </a>
        </li>
      `;
    });

    html += "</ul></div>";
    return html;
  }

  /**
   * Show the dropdown
   */
  _showDropdown() {
    this._dropdownElement.style.display = "block";
    this._isOpen = true;
    this._inputElement.setAttribute("aria-expanded", "true");
  }

  /**
   * Hide the dropdown
   */
  _hideDropdown() {
    this._dropdownElement.style.display = "none";
    this._isOpen = false;
    this._selectedIndex = -1;
    this._inputElement.setAttribute("aria-expanded", "false");
  }

  /**
   * Escape HTML to prevent XSS
   */
  _escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format price for display
   */
  _formatPrice(price) {
    if (typeof price === "number") {
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(price);
    }
    return price;
  }

  /**
   * Get product URL
   */
  _getProductUrl(productId) {
    return this.options.productUrlTemplate.replace("{id}", productId);
  }

  /**
   * Get category URL
   */
  _getCategoryUrl(categoryId) {
    return this.options.categoryUrlTemplate.replace("{id}", categoryId);
  }

  /**
   * Get search URL
   */
  _getSearchUrl(query) {
    return this.options.searchUrlTemplate.replace(
      "{query}",
      encodeURIComponent(query)
    );
  }

  /**
   * Destroy the plugin and clean up
   */
  destroy() {
    this._cancelPendingRequest();

    if (this._debounceTimeout) {
      clearTimeout(this._debounceTimeout);
    }

    if (this._dropdownElement && this._dropdownElement.parentNode) {
      this._dropdownElement.parentNode.removeChild(this._dropdownElement);
    }

    super.destroy();
  }
}
