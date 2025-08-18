// Import PluginOverride from Shopware's storefront-sdk
//import Plugin from '../plugin';
import Plugin from "src/plugin-system/plugin.class";

/**
 * ListingListener Plugin
 *
 * Handles filter panel content synchronization for both sidebar and offcanvas modes.
 * Updates all matching containers except those specified in excludeSelectors.
 *
 * Configuration options:
 * - hideItemsWhenOffcanvasHidden: Hide all filter items when offcanvas is not visible
 * - enabled: Whether the plugin is enabled
 *
 * Usage:
 * new ListingListener(element, {
 *   hideItemsWhenOffcanvasHidden: true
 * });
 */
export default class ListingListener extends Plugin {
  static sidebarFilterSelector = ".cms-element-sidebar-filter";

  static options = {
    hideItemsWhenOffcanvasHidden: false,
    enabled: false,
  };

  constructor(el, options, pluginName) {
    super(el, options, pluginName);
    this._isUpdating = false;

    // Merge PHP configuration with default options
    this._mergeConfigFromElement(el);
  }

  /**
   * Merge configuration from PHP (data attribute) with default options
   */
  _mergeConfigFromElement(el) {
    const configAttribute = el.getAttribute("data-listing-listener-options");
    if (configAttribute) {
      try {
        const pluginConfig = JSON.parse(configAttribute);

        // Merge PHP config with options, PHP config takes precedence
        if (pluginConfig.enabled !== undefined) {
          this.options.enabled = pluginConfig.enabled;
        }

        if (pluginConfig.hideItemsWhenOffcanvasHidden !== undefined) {
          this.options.hideItemsWhenOffcanvasHidden =
            pluginConfig.hideItemsWhenOffcanvasHidden;
        }
      } catch (e) {
        console.warn(
          "ListingListener: Failed to parse configuration from data attribute",
          e
        );
      }
    }
  }

  init() {
    // Only register events if the filter listener is enabled
    this._registerEvents();
    if (this.options.hideItemsWhenOffcanvasHidden) {
      this._setupOffcanvasMonitoring();
    }

    // Establish connection to the main listing plugin
    this._connectToListingPlugin();
  }

  /**
   * Connect to the main listing plugin instance
   */
  _connectToListingPlugin() {
    // Try to find the listing plugin instance
    const listingElement = document.querySelector("[data-listing]");
    if (listingElement) {
      const listingPlugin = window.PluginManager.getPluginInstanceFromElement(
        listingElement,
        "Listing"
      );

      if (listingPlugin) {
        // Store reference to the listing plugin
        this.listing = listingPlugin;
      }
    }
  }

  /**
   * Check if the filter listener is enabled
   */
  _isEnabled() {
    // Check if explicitly disabled in options
    if (this.options.enabled === false) {
      return false;
    }

    // If no explicit setting, default to enabled
    return this.options.enabled !== false;
  }

  _registerEvents() {
    this.$emitter.subscribe("Listing/afterRenderResponse", (event) => {
      this._swapContent(event.detail.response);
    });
  }

  /**
   * Find all filter panel containers
   */
  _findFilterPanelContainers(doc = document) {
    return Array.from(doc.querySelectorAll(".filter-panel-items-container"));
  }

  /**
   * Extract filters from new panel and merge with existing filters in localStorage
   */
  _extractAndMergeFilters(doc) {
    try {
      // Extract filters from the new document
      const newFilters = this._getAvailableFiltersFromDocument(doc);

      if (newFilters.length === 0) {
        return; // No new filters to merge
      }

      // Store current response filters to "macurrfi"
      this._storeCurrentFiltersToLocalStorage(newFilters);

      // Get existing filters from localStorage
      const existingFilters = this._getStoredFilters();

      // Merge filters (create union with no duplicates)
      const mergedFilters = [...new Set([...existingFilters, ...newFilters])];

      // Store merged filters back to localStorage
      this._storeFiltersToLocalStorage(mergedFilters);
    } catch (e) {
      console.error("ListingListener: Failed to extract and merge filters:", e);
    }
  }

  /**
   * Get available filters from a document
   */
  _getAvailableFiltersFromDocument(doc) {
    const filterItems = doc.querySelectorAll(
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
          "ListingListener: Failed to parse filter options for item:",
          filterItem,
          e
        );
      }
    });

    return availableFilters;
  }

  /**
   * Get stored filters from localStorage
   */
  _getStoredFilters() {
    try {
      const data = localStorage.getItem("macatfiall");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(
        "ListingListener: Failed to retrieve filters from localStorage:",
        e
      );
      return [];
    }
  }

  /**
   * Store filters array to localStorage
   */
  _storeFiltersToLocalStorage(filtersArray) {
    try {
      const storageValue = JSON.stringify(filtersArray);
      localStorage.setItem("macatfiall", storageValue);
    } catch (e) {
      console.error(
        "ListingListener: Failed to store filters to localStorage:",
        e
      );
    }
  }

  /**
   * Store current response filters to localStorage
   */
  _storeCurrentFiltersToLocalStorage(filtersArray) {
    try {
      const storageValue = JSON.stringify(filtersArray);
      localStorage.setItem("macurrfi", storageValue);
    } catch (e) {
      console.error(
        "ListingListener: Failed to store current filters to localStorage:",
        e
      );
    }
  }

  /**
   * Set up monitoring for offcanvas visibility changes
   */
  _setupOffcanvasMonitoring() {
    // Monitor for offcanvas show/hide events
    document.addEventListener("shown.bs.offcanvas", () => {
      this._onOffcanvasVisibilityChange(true);
    });

    document.addEventListener("hidden.bs.offcanvas", () => {
      this._onOffcanvasVisibilityChange(false);
    });

    // Bind to custom onCloseOffcanvas event if $emitter is available
    if (document.$emitter) {
      document.$emitter.subscribe("onCloseOffcanvas", () => {
        this._onOffcanvasVisibilityChange(false);
      });
    }

    // Also monitor for modal backdrop clicks and ESC key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this._isOffcanvasVisible()) {
        setTimeout(() => this._onOffcanvasVisibilityChange(false), 100);
      }
    });
  }

  /**
   * Handle offcanvas visibility changes
   */
  _onOffcanvasVisibilityChange(isVisible) {
    if (!isVisible && this.options.hideItemsWhenOffcanvasHidden) {
      this._hideAllFilterItems();
    } else {
      this._showAllActiveFilters();
    }
  }

  /**
   * Check if any offcanvas is currently visible
   */
  _isOffcanvasVisible() {
    const offcanvasElements = document.querySelectorAll(".offcanvas");
    return Array.from(offcanvasElements).some((offcanvas) => {
      return (
        offcanvas.classList.contains("show") ||
        getComputedStyle(offcanvas).display !== "none"
      );
    });
  }

  /**
   * Hide all filter panel items containers
   */
  _hideAllFilterItems() {
    // Get the available filters from localStorage
    const availableFilters = this._getAvailableFiltersFromLocalStorage();

    if (!availableFilters || availableFilters.length === 0) {
      return;
    }

    const containers = document.querySelectorAll(
      ".filter-panel-items-container"
    );

    containers.forEach((container) => {
      const items = container.querySelectorAll(".filter-panel-item");

      items.forEach((item) => {
        // Check if this item's filter name is in the available filters list
        const filterName = this._getFilterNameFromItem(item);
        if (filterName && availableFilters.includes(filterName)) {
          this._hideFilterItem(item);
        }
      });
    });
  }

  /**
   * Show only active filters based on localStorage macurrfi
   */
  _showAllActiveFilters() {
    // Get the current filters from localStorage
    const currentFilters = this._getCurrentFiltersFromLocalStorage();

    if (!currentFilters || currentFilters.length === 0) {
      // If no current filters are set, show all available filters
      this._showAllAvailableFilters();
      return;
    }

    const containers = document.querySelectorAll(
      ".filter-panel-items-container"
    );

    containers.forEach((container) => {
      const items = container.querySelectorAll(
        ".filter-panel-item, .filter-multi-select-list-item"
      );

      items.forEach((item) => {
        const filterName = this._getFilterNameFromItem(item);
        if (filterName) {
          if (currentFilters.includes(filterName)) {
            // Show items that are in the current filters list
            this._showFilterItem(item);
          } else {
            // Hide items that are not in the current filters list
            this._hideFilterItem(item);
          }
        }
      });
    });
  }

  /**
   * Show all available filters (fallback when no current filters are set)
   */
  _showAllAvailableFilters() {
    const availableFilters = this._getAvailableFiltersFromLocalStorage();

    if (!availableFilters || availableFilters.length === 0) {
      return;
    }

    const containers = document.querySelectorAll(
      ".filter-panel-items-container"
    );

    containers.forEach((container) => {
      const items = container.querySelectorAll(
        ".filter-panel-item, .filter-multi-select-list-item"
      );

      items.forEach((item) => {
        const filterName = this._getFilterNameFromItem(item);
        if (filterName && availableFilters.includes(filterName)) {
          this._showFilterItem(item);
        }
      });
    });
  }

  /**
   * Get available filters from localStorage using macatfiall key
   */
  _getAvailableFiltersFromLocalStorage() {
    try {
      const data = localStorage.getItem("macatfiall");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(
        "ListingListener: Failed to retrieve filters from localStorage:",
        e
      );
      return [];
    }
  }

  /**
   * Get current filters from localStorage using macurrfi key
   */
  _getCurrentFiltersFromLocalStorage() {
    try {
      const data = localStorage.getItem("macurrfi");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(
        "ListingListener: Failed to retrieve current filters from localStorage:",
        e
      );
      return [];
    }
  }

  /**
   * Extract filter name from a filter item element
   */
  _getFilterNameFromItem(item) {
    try {
      // Try to get the filter name from data attribute
      const optionsData = item.getAttribute("data-filter-multi-select-options");
      if (optionsData) {
        const options = JSON.parse(optionsData);
        return options.name;
      }

      // Fallback: try to get from parent container
      const parentContainer = item.closest(
        "[data-filter-multi-select-options]"
      );
      if (parentContainer) {
        const parentOptionsData = parentContainer.getAttribute(
          "data-filter-multi-select-options"
        );
        if (parentOptionsData) {
          const parentOptions = JSON.parse(parentOptionsData);
          return parentOptions.name;
        }
      }

      return null;
    } catch (e) {
      console.warn(
        "ListingListener: Failed to extract filter name from item:",
        item,
        e
      );
      return null;
    }
  }

  /**
   * Find the filter panel container using configurable selectors (legacy method)
   * @deprecated Use _findFilterPanelContainers instead
   */
  _findFilterPanelContainer(doc = document) {
    const containers = this._findFilterPanelContainers(doc);
    return containers.length > 0 ? containers[0] : null;
  }

  /**
   * Get a unique identifier for a container to match old and new panels
   */
  _getContainerIdentifier(container) {
    // Try different attributes to create a unique identifier
    if (container.id) {
      return `id-${container.id}`;
    }

    if (container.dataset.filterType) {
      return `filter-type-${container.dataset.filterType}`;
    }

    if (container.className) {
      // Use a combination of classes as identifier
      const classes = container.className
        .split(" ")
        .filter(
          (cls) =>
            cls.includes("filter") ||
            cls.includes("sidebar") ||
            cls.includes("offcanvas")
        )
        .sort()
        .join("-");
      if (classes) {
        return `classes-${classes}`;
      }
    }

    // Try to use the parent element's identifier if available
    const parent = container.closest("[id], [data-filter-type]");
    if (parent) {
      const parentId = parent.id || parent.dataset.filterType;
      if (parentId) {
        return `parent-${parentId}`;
      }
    }

    return null;
  }

  _swapContent(data) {
    if (this._isUpdating) {
      return;
    }

    this._isUpdating = true;

    try {
      // Check if we should hide items based on offcanvas visibility
      if (
        this.options.hideItemsWhenOffcanvasHidden &&
        !this._isOffcanvasVisible()
      ) {
        this._hideAllFilterItems();
        return;
      }

      const doc = new DOMParser().parseFromString(data, "text/html");
      const oldFilterPanels = this._findFilterPanelContainers();
      const newFilterPanels = this._findFilterPanelContainers(doc);

      // Extract and merge filters from new panels
      this._extractAndMergeFilters(doc);

      // Create a map of new panels by their selector or position for matching
      const newPanelsMap = new Map();
      newFilterPanels.forEach((panel, index) => {
        // Try to create a unique identifier for each panel
        const identifier =
          this._getContainerIdentifier(panel) || `panel-${index}`;
        newPanelsMap.set(identifier, panel);
      });

      // Update each old panel with its corresponding new panel
      oldFilterPanels.forEach((oldPanel, index) => {
        const identifier =
          this._getContainerIdentifier(oldPanel) || `panel-${index}`;
        const newPanel = newPanelsMap.get(identifier);

        if (newPanel) {
          this._updateFilterPanelSelectively(oldPanel, newPanel);
        } else {
          // If no matching new panel found, try to match by index as fallback
          const fallbackNewPanel = newFilterPanels[index];
          if (fallbackNewPanel) {
            this._updateFilterPanelSelectively(oldPanel, fallbackNewPanel);
          }
        }
      });
    } finally {
      setTimeout(() => {
        this._isUpdating = false;
      }, 50);
    }
  }

  /**
   * Original innerHTML replacement method (fallback)
   */
  _updateFilterPanelWithInnerHTML(oldPanel, newPanel) {
    const inputStates = this._getInputStates(oldPanel);

    // Replace the entire HTML content
    oldPanel.innerHTML = newPanel.innerHTML;

    // Restore states
    this._restoreInputStates(oldPanel, inputStates);

    // Reinitialize plugins
    //window.PluginManager.initializePlugins();

    // Update filter labels
    this._buildLabels();
  }

  /**
   * Selectively update filter panel by hiding/showing elements
   */

  _updateFilterPanelSelectively(oldPanel, newPanel) {
    const inputStates = this._getInputStates(oldPanel);

    if (this.options.enabled) {
      // First, preserve existing section-item relationships
      const existingSectionMap = this._createExistingSectionMap(oldPanel);

      // Create a complete structural replacement approach
      this._replaceFilterStructureCompletely(
        oldPanel,
        newPanel,
        existingSectionMap
      );
    }

    this._reregisterExistingFilters(oldPanel);
    this._restoreInputStates(oldPanel, inputStates, false);
  }

  /**
   * Synchronize the structural elements between old and new filter panels
   * This handles elements that appear between filter containers and their lists
   */
  _synchronizeFilterStructure(oldPanel, newPanel) {
    // Get all filter elements from both panels
    const oldFilters = oldPanel.querySelectorAll(
      "[data-filter-multi-select-options]"
    );
    const newFilters = newPanel.querySelectorAll(
      "[data-filter-multi-select-options]"
    );

    // Create maps for comparison using filter names
    const oldFiltersMap = this._createFilterElementsMap(oldFilters);
    const newFiltersMap = this._createFilterElementsMap(newFilters);

    // Synchronize structure for each filter
    Object.keys(newFiltersMap).forEach((filterName) => {
      const oldFilter = oldFiltersMap[filterName];
      const newFilter = newFiltersMap[filterName];

      if (oldFilter && newFilter) {
        this._synchronizeFilterDropdownStructure(oldFilter, newFilter);
      }
    });
  }

  /**
   * Synchronize the dropdown structure for a specific filter
   */
  _synchronizeFilterDropdownStructure(oldFilter, newFilter) {
    const oldDropdown = oldFilter.querySelector(".filter-panel-item-dropdown");
    const newDropdown = newFilter.querySelector(".filter-panel-item-dropdown");

    if (!oldDropdown || !newDropdown) return;

    // Get the structure map for both dropdowns
    const oldStructure = this._getDropdownStructureMap(oldDropdown);
    const newStructure = this._getDropdownStructureMap(newDropdown);

    // Add missing structural elements
    this._addMissingStructuralElements(oldDropdown, newStructure, oldStructure);
  }

  /**
   * Create a map of filter elements keyed by their filter name
   */
  _createFilterElementsMap(elements) {
    const map = {};
    elements.forEach((element) => {
      const options = element.getAttribute("data-filter-multi-select-options");
      if (options) {
        try {
          const parsedOptions = JSON.parse(options);
          if (parsedOptions.name) {
            map[parsedOptions.name] = element;
          }
        } catch (e) {
          console.warn("ListingListener: Failed to parse filter options", e);
        }
      }
    });
    return map;
  }

  /**
   * Get the structural map of a dropdown container
   * Returns an array of structural elements in order
   */
  _getDropdownStructureMap(dropdown) {
    const structure = [];
    const children = Array.from(dropdown.children);

    children.forEach((child, index) => {
      const elementInfo = {
        index,
        element: child,
        tagName: child.tagName.toLowerCase(),
        classes: Array.from(child.classList),
        textContent: this._getElementTextSignature(child),
        isList:
          child.tagName.toLowerCase() === "ul" &&
          child.classList.contains("filter-multi-select-list"),
        isStructural: !child.classList.contains(
          "filter-multi-select-list-item"
        ),
      };

      structure.push(elementInfo);
    });

    return structure;
  }

  /**
   * Get a text signature for an element (useful for matching)
   */
  _getElementTextSignature(element) {
    if (element.tagName.toLowerCase() === "ul") {
      return ""; // Lists don't have meaningful text content for matching
    }

    // Get direct text content, not from children
    let textContent = "";
    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        textContent += node.textContent.trim();
      }
    });

    return textContent.trim();
  }

  /**
   * Add missing structural elements to the old dropdown
   */
  _addMissingStructuralElements(oldDropdown, newStructure, oldStructure) {
    // Create a map of existing elements by their signature
    const existingElements = new Map();
    oldStructure.forEach((info) => {
      const signature = this._createElementSignature(info);
      existingElements.set(signature, info);
    });

    // Track where to insert new elements
    let insertPosition = 0;

    newStructure.forEach((newElementInfo, newIndex) => {
      const signature = this._createElementSignature(newElementInfo);

      if (!existingElements.has(signature) && newElementInfo.isStructural) {
        // This is a new structural element, clone and insert it
        const clonedElement = newElementInfo.element.cloneNode(true);

        // Find the correct insertion point
        const insertBeforeElement = this._findInsertionPoint(
          oldDropdown,
          newStructure,
          newIndex,
          existingElements
        );

        if (insertBeforeElement) {
          oldDropdown.insertBefore(clonedElement, insertBeforeElement);
        } else {
          oldDropdown.appendChild(clonedElement);
        }
      }
    });
  }

  /**
   * Create a signature for an element to match between old and new structures
   */
  _createElementSignature(elementInfo) {
    if (elementInfo.isList) {
      // For lists, create signature based on position and context
      return `list-${elementInfo.classes.join("-")}`;
    }

    // For other elements, use tag + classes + text content
    const classSignature = elementInfo.classes.join("-");
    const textSignature = elementInfo.textContent.replace(/\s+/g, " ").trim();

    return `${elementInfo.tagName}-${classSignature}-${textSignature}`;
  }

  /**
   * Find the correct insertion point for a new structural element
   */
  _findInsertionPoint(
    oldDropdown,
    newStructure,
    newElementIndex,
    existingElements
  ) {
    // Look for the next existing element after the new element position
    for (let i = newElementIndex + 1; i < newStructure.length; i++) {
      const nextElementInfo = newStructure[i];
      const nextSignature = this._createElementSignature(nextElementInfo);

      if (existingElements.has(nextSignature)) {
        // Find this element in the old dropdown
        const existingInfo = existingElements.get(nextSignature);
        return existingInfo.element;
      }
    }

    return null; // Insert at the end
  }

  /**
   * Update filter-multi-select elements based on data-filter-multi-select-options
   */
  _updateFilterMultiSelectElements(oldPanel, newPanel) {
    // Get all filter-multi-select elements from both panels
    const oldElements = oldPanel.querySelectorAll("[data-filter-multi-select]");
    const newElements = newPanel.querySelectorAll("[data-filter-multi-select]");

    // Create maps for comparison using data-filter-multi-select-options name and value
    const oldElementsMap = this._createFilterMultiSelectMap(oldElements);
    const newElementsMap = this._createFilterMultiSelectMap(newElements);

    // Hide elements that are no longer in the new panel
    Object.keys(oldElementsMap).forEach((key) => {
      if (!newElementsMap[key]) {
        this._hideFilterItem(oldElementsMap[key]);
      }
    });

    // Show elements that are in the new panel
    Object.keys(newElementsMap).forEach((key) => {
      if (oldElementsMap[key]) {
        this._showFilterItem(oldElementsMap[key]);
      } else {
        // New element, add it to the panel
        const newElement = newElementsMap[key].cloneNode(true);
        oldPanel.appendChild(newElement);
        newElement.setAttribute("data-needs-init", "true");
      }
    });
  }

  /**
   * Update filter-multi-select-list-item elements based on data-label
   */
  _updateFilterListItemElements(oldPanel, newPanel) {
    // Get all filter-multi-select-list-item elements from both panels
    const oldItems = oldPanel.querySelectorAll(
      ".filter-multi-select-list-item"
    );
    const newItems = newPanel.querySelectorAll(
      ".filter-multi-select-list-item"
    );

    // Create maps for comparison using data-label attribute from input elements
    const oldItemsMap = this._createFilterListItemMap(oldItems);
    const newItemsMap = this._createFilterListItemMap(newItems);

    // Hide items that are no longer in the new panel
    Object.keys(oldItemsMap).forEach((key) => {
      if (!newItemsMap[key]) {
        this._hideFilterItem(oldItemsMap[key]);
      }
    });

    // Show items that are in the new panel
    Object.keys(newItemsMap).forEach((key) => {
      if (oldItemsMap[key]) {
        this._showFilterItem(oldItemsMap[key]);
        this._updateFilterListItemContent(oldItemsMap[key], newItemsMap[key]);
      } else {
        this._addNewFilterListItem(oldPanel, newItemsMap[key]);
      }
    });
  }

  /**
   * Create a map of filter-multi-select elements keyed by their filter name
   */
  _createFilterMultiSelectMap(elements) {
    const map = {};
    elements.forEach((element) => {
      const options = element.getAttribute("data-filter-multi-select-options");
      if (options) {
        try {
          // Parse the options to get the filter name for a reliable key
          const parsedOptions = JSON.parse(options);
          if (parsedOptions.name) {
            const key = `filter-multi-select-${parsedOptions.name}`;
            map[key] = element;
          }
        } catch (e) {
          // Skip elements with invalid JSON
          console.warn("ListingListener: Failed to parse filter options", e);
        }
      }
    });
    return map;
  }

  /**
   * Create a map of filter-multi-select-list-item elements keyed by their data-label
   */
  _createFilterListItemMap(items) {
    const map = {};
    items.forEach((item) => {
      // Look for data-label attribute on the input element inside the list item
      const input = item.querySelector("input[data-label]");
      const label = input ? input.getAttribute("data-label") : null;
      if (label) {
        // Include parent filter info to make key more unique
        const parentFilter = item.closest("[data-filter-multi-select]");
        let parentFilterName = "unknown";

        if (parentFilter) {
          const parentOptions = parentFilter.getAttribute(
            "data-filter-multi-select-options"
          );
          if (parentOptions) {
            try {
              const parsedOptions = JSON.parse(parentOptions);
              parentFilterName = parsedOptions.name || "unknown";
            } catch (e) {
              // Use fallback if parsing fails
              console.warn(
                "ListingListener: Failed to parse parent filter options",
                e
              );
            }
          }
        }

        const key = `${parentFilterName}-${label}`;
        map[key] = item;
      }
    });
    return map;
  }

  /**
   * Update the content of a filter dropdown
   */
  _updateFilterDropdownContent(oldElement, newElement) {
    const oldDropdown = oldElement.querySelector(".filter-panel-item-dropdown");
    const newDropdown = newElement.querySelector(".filter-panel-item-dropdown");

    if (oldDropdown && newDropdown) {
      // Store current input states before updating content
      const inputStates = this._getInputStates(oldDropdown);

      // Use our existing merge method to preserve event handlers
      this._mergeDropdownContent(oldDropdown, newDropdown);

      // Restore states without triggering events
      this._restoreInputStates(oldDropdown, inputStates, false);
    }
  }

  /**
   * Update the content of a filter list item
   */
  _updateFilterListItemContent(oldItem, newItem) {
    // Update label text if changed
    const oldLabel = oldItem.querySelector("label");
    const newLabel = newItem.querySelector("label");

    if (oldLabel && newLabel && oldLabel.textContent !== newLabel.textContent) {
      oldLabel.textContent = newLabel.textContent;
    }

    // Update input attributes if they've changed
    const oldInput = oldItem.querySelector("input");
    const newInput = newItem.querySelector("input");

    if (oldInput && newInput) {
      ["value", "name", "data-count"].forEach((attr) => {
        if (oldInput.getAttribute(attr) !== newInput.getAttribute(attr)) {
          oldInput.setAttribute(attr, newInput.getAttribute(attr) || "");
        }
      });
    }
  }

  /**
   * Find a filter element by its name (extracted from data-filter-multi-select-options)
   */
  _findFilterElementByName(panel, filterName) {
    const filterElements = panel.querySelectorAll(
      "[data-filter-multi-select-options]"
    );

    for (const element of filterElements) {
      try {
        const optionsJson = element.getAttribute(
          "data-filter-multi-select-options"
        );
        if (optionsJson) {
          const options = JSON.parse(optionsJson);
          if (options.name === filterName) {
            return element;
          }
        }
      } catch (e) {
        // Skip elements with invalid JSON
        continue;
      }
    }

    return null;
  }

  /**
   * Find the target list (ul element) where a new filter item should be added
   */
  _findTargetListForNewItem(dropdownInOldPanel, newItem, clonedItem) {
    // Find the proper container to search in
    const newDropdown = newItem.closest(".filter-panel-item-dropdown");
    const targetContainer = newDropdown
      ? this._findTargetContainer(newDropdown, dropdownInOldPanel)
      : dropdownInOldPanel;

    // First, try to find the section where this item belongs in the new panel structure
    const newItemParentList = newItem.closest("ul.filter-multi-select-list");

    if (newItemParentList) {
      // Look for a preceding structural element to identify the section
      let sectionElement = null;
      let sectionText = null;
      let currentElement = newItemParentList.previousElementSibling;

      // Walk backwards to find the section identifier
      while (currentElement && !sectionElement) {
        // Check if this is a structural element (not a list item)
        if (
          currentElement.tagName &&
          !currentElement.classList.contains("filter-multi-select-list-item") &&
          currentElement.textContent.trim()
        ) {
          sectionElement = currentElement;
          sectionText = currentElement.textContent.trim();
          break;
        }
        currentElement = currentElement.previousElementSibling;
      }

      // If we found a section element, try to find the matching section in the target container
      if (sectionElement && sectionText) {
        const matchingSection = this._findSectionByText(
          targetContainer,
          sectionText,
          sectionElement.tagName
        );
        if (matchingSection) {
          return matchingSection;
        }
      }
    }

    // Fallback: try to find the best matching list based on item position or content
    const allLists = targetContainer.querySelectorAll(
      "ul.filter-multi-select-list"
    );

    if (allLists.length === 1) {
      // If there's only one list, use it
      return allLists[0];
    }

    if (allLists.length > 1) {
      // Try to find a list that already contains similar items
      const newItemLabel = clonedItem
        .querySelector("input[data-label]")
        ?.getAttribute("data-label");

      if (newItemLabel) {
        for (const list of allLists) {
          const existingItems = list.querySelectorAll("input[data-label]");
          for (const existing of existingItems) {
            const existingLabel = existing.getAttribute("data-label");

            // Simple heuristic: if labels have similar patterns, they might belong together
            if (this._labelsSeemRelated(newItemLabel, existingLabel)) {
              return list;
            }
          }
        }
      }

      // If no good match found, use the first list
      return allLists[0];
    }

    // No lists found, return null
    return null;
  }

  /**
   * Find a section's ul element by matching text content and tag name
   */
  _findSectionByText(container, sectionText, tagName) {
    // Find all elements with the same tag name
    const elements = container.querySelectorAll(tagName.toLowerCase());

    for (const element of elements) {
      if (element.textContent.trim() === sectionText) {
        // Find the next ul element after this section element
        let nextElement = element.nextElementSibling;
        while (nextElement) {
          if (
            nextElement.tagName.toLowerCase() === "ul" &&
            nextElement.classList.contains("filter-multi-select-list")
          ) {
            return nextElement;
          }
          nextElement = nextElement.nextElementSibling;
        }
      }
    }

    return null;
  }

  /**
   * Simple heuristic to check if two filter labels seem related
   */
  _labelsSeemRelated(label1, label2) {
    if (!label1 || !label2) return false;

    // Check if both are numeric ranges (e.g., "41-42", "43-44")
    const rangePattern = /^\d+(-\d+)?$/;
    if (rangePattern.test(label1) && rangePattern.test(label2)) {
      return true;
    }

    // Check if both are size indicators (e.g., "XL", "XXL", "3XL")
    const sizePattern = /^\d*XL[K]?$/;
    if (sizePattern.test(label1) && sizePattern.test(label2)) {
      return true;
    }

    // Check if both are waist/length combinations (e.g., "40/30", "42/32")
    const waistLengthPattern = /^\d+\/\d+$/;
    if (waistLengthPattern.test(label1) && waistLengthPattern.test(label2)) {
      return true;
    }

    // Check if both start with "W" (waist sizes like "W40", "W42")
    if (label1.startsWith("W") && label2.startsWith("W")) {
      return true;
    }

    return false;
  }

  /**
   * Add a new filter list item to the appropriate parent
   */
  _addNewFilterListItem(oldPanel, newItem) {
    // Find the parent filter in the old panel
    const parentOptions = newItem
      .closest("[data-filter-multi-select]")
      ?.getAttribute("data-filter-multi-select-options");
    if (!parentOptions) return;

    // Parse the options to get the filter name
    let filterName;
    try {
      const parsedOptions = JSON.parse(parentOptions);
      filterName = parsedOptions.name;
    } catch (e) {
      console.warn("ListingListener: Failed to parse parent options", e);
      return;
    }

    if (!filterName) return;

    // Find the matching parent in old panel by filter name
    const parentInOldPanel = this._findFilterElementByName(
      oldPanel,
      filterName
    );
    if (!parentInOldPanel) return;

    const dropdownInOldPanel = parentInOldPanel.querySelector(
      ".filter-panel-item-dropdown"
    );
    if (!dropdownInOldPanel) return;

    // Clone the new item
    const clonedItem = newItem.cloneNode(true);

    // First, ensure the section structure exists
    const sectionStructure = this._ensureSectionStructureExists(
      newItem,
      dropdownInOldPanel
    );

    // Then find the appropriate target list within the existing/created section
    const targetList = this._findTargetListForNewItem(
      dropdownInOldPanel,
      newItem,
      clonedItem
    );

    if (targetList) {
      targetList.appendChild(clonedItem);
    } else if (sectionStructure && sectionStructure.list) {
      // Use the list from the newly created section structure
      sectionStructure.list.appendChild(clonedItem);
    } else {
      // Ultimate fallback: append to the main dropdown
      dropdownInOldPanel.appendChild(clonedItem);
    }

    // Ensure event handlers are attached
    this._attachEventHandlersToNewItem(clonedItem, dropdownInOldPanel);
  }

  /**
   * Hide a filter item with smooth animation
   */
  _hideFilterItem(item) {
    item.style.display = "none";
    item.classList.add("filter-item-hidden");
  }

  /**
   * Show a filter item with smooth animation
   * Respects different display modes (sidebar vs offcanvas)
   */
  _showFilterItem(item) {
    if (item.classList.contains("filter-item-hidden")) {
      item.classList.remove("filter-item-hidden");

      // Determine the appropriate display style based on filter context
      const displayStyle = this._getAppropriateDisplayStyle(item);
      item.style.display = displayStyle;
    }
  }

  /**
   * Get the appropriate display style for a filter item based on its context
   */
  _getAppropriateDisplayStyle(item) {
    // Check if we're in sidebar mode (uses collapse/d-grid)
    if (item.closest(".filter-panel-item.d-grid")) {
      return "block";
    }

    // Check if we're in offcanvas/dropdown mode
    if (item.closest(".filter-panel-item.dropdown")) {
      return "block";
    }

    // Check for list items which should use inline-block
    if (item.classList.contains("filter-multi-select-list-item")) {
      return "inline-block";
    }

    // Default to block display
    return "block";
  }

  /**
   * Create a map of filter items keyed by their identifier
   */
  _getFilterItemsMap(panel) {
    const items = {};
    const filterItems = panel.querySelectorAll(".filter-panel-item");

    filterItems.forEach((item) => {
      // Use data attributes or other identifiers to create unique keys
      const key = this._getFilterItemKey(item);
      if (key) {
        items[key] = item;
      }
    });

    return items;
  }

  /**
   * Generate a unique key for a filter item
   */
  _getFilterItemKey(item) {
    // Try to find a unique identifier for the filter item
    const input = item.querySelector("input[name]");
    const toggle = item.querySelector(".filter-panel-item-toggle");

    if (input) {
      return `input-${input.name}`;
    } else if (toggle) {
      return `toggle-${toggle.textContent.trim()}`;
    }

    // Fallback to index if no unique identifier found
    return null;
  }

  /**
   * Get current states of all inputs in the panel
   */
  _getInputStates(panel) {
    const states = new Map();
    const inputs = panel.querySelectorAll("input");

    inputs.forEach((input) => {
      const key =
        input.type === "checkbox" || input.type === "radio"
          ? input.name + "_" + input.value
          : input.name;
      states.set(key, {
        checked: input.checked,
        value: input.value,
      });
    });

    return states;
  }

  /**
   * Restore input states after content update
   */
  _restoreInputStates(panel, inputStates, triggerEvents = true) {
    const inputs = panel.querySelectorAll("input");

    inputs.forEach((input) => {
      const key =
        input.type === "checkbox" || input.type === "radio"
          ? input.name + "_" + input.value
          : input.name;

      if (inputStates.has(key)) {
        const state = inputStates.get(key);
        if (input.type === "checkbox" || input.type === "radio") {
          input.checked = state.checked;
        } else {
          input.value = state.value;
        }

        // Trigger appropriate event only if requested
        if (triggerEvents) {
          input.dispatchEvent(
            new Event(
              input.type === "checkbox" || input.type === "radio"
                ? "change"
                : "input",
              { bubbles: true }
            )
          );
        }
      }
    });
  }

  /**
   * Update the content of an existing filter item if needed
   */
  _updateFilterItemContent(oldItem, newItem) {
    // Compare the options/content within the filter item
    const oldOptions = oldItem.querySelectorAll(
      ".filter-multi-select-list-item"
    );
    const newOptions = newItem.querySelectorAll(
      ".filter-multi-select-list-item"
    );

    // If the number of options has changed, update the content
    if (oldOptions.length !== newOptions.length) {
      const dropdown = oldItem.querySelector(".filter-panel-item-dropdown");
      const newDropdown = newItem.querySelector(".filter-panel-item-dropdown");

      if (dropdown && newDropdown) {
        // Store current input states before updating content
        const inputStates = this._getInputStates(dropdown);

        // Instead of replacing innerHTML, merge the content while preserving handlers
        this._mergeDropdownContent(dropdown, newDropdown);

        // Restore states without triggering events
        this._restoreInputStates(dropdown, inputStates, false);
      }
    }
  }

  /**
   * Merge dropdown content while preserving existing event handlers
   */
  _mergeDropdownContent(oldDropdown, newDropdown) {
    const oldItems = this._getDropdownItemsMap(oldDropdown);
    const newItems = this._getDropdownItemsMap(newDropdown);

    // Create a temporary container to hold the correctly ordered items
    const tempContainer = document.createElement("div");

    // Process items in the correct order from the server response
    const newItemElements = newDropdown.querySelectorAll(
      ".filter-multi-select-list-item"
    );
    newItemElements.forEach((newItemElement, index) => {
      const key = this._getDropdownItemKey(newItemElement);

      if (oldItems[key]) {
        // Item exists, reuse the old DOM element but update its content
        const oldItemElement = oldItems[key];

        // Update content if needed
        const oldLabel = oldItemElement.querySelector("label");
        const newLabel = newItemElement.querySelector("label");

        if (
          oldLabel &&
          newLabel &&
          oldLabel.textContent !== newLabel.textContent
        ) {
          oldLabel.textContent = newLabel.textContent;
        }

        // Update input attributes if they've changed
        const oldInput = oldItemElement.querySelector("input");
        const newInput = newItemElement.querySelector("input");

        if (oldInput && newInput) {
          ["value", "name", "data-count"].forEach((attr) => {
            if (oldInput.getAttribute(attr) !== newInput.getAttribute(attr)) {
              oldInput.setAttribute(attr, newInput.getAttribute(attr) || "");
            }
          });
        }

        // Move the existing item to the correct position in temp container
        tempContainer.appendChild(oldItemElement);
      } else {
        // New item, clone and add it
        const clonedItem = newItemElement.cloneNode(true);
        tempContainer.appendChild(clonedItem);

        // Ensure event handlers are attached to the new item
        this._attachEventHandlersToNewItem(clonedItem, oldDropdown);
      }
    });

    // Clear the old dropdown and move all items from temp container
    oldDropdown.innerHTML = "";
    while (tempContainer.firstChild) {
      oldDropdown.appendChild(tempContainer.firstChild);
    }
  }

  /**
   * Create a map of dropdown items keyed by their identifier
   */
  _getDropdownItemsMap(dropdown) {
    const items = {};
    const listItems = dropdown.querySelectorAll(
      ".filter-multi-select-list-item"
    );

    listItems.forEach((item) => {
      const key = this._getDropdownItemKey(item);
      if (key) {
        items[key] = item;
      }
    });

    return items;
  }

  /**
   * Generate a unique key for a dropdown item
   */
  _getDropdownItemKey(item) {
    const input = item.querySelector("input");
    if (input) {
      // Prefer data-label if available, otherwise use value
      const identifier = input.getAttribute("data-label") || input.value;
      if (identifier && input.name) {
        return `${input.name}-${identifier}`;
      }
    }

    const label = item.querySelector("label");
    if (label) {
      return `label-${label.textContent.trim()}`;
    }

    return null;
  }

  /**
   * Attach event handlers to newly added filter items
   */
  _attachEventHandlersToNewItem(newItem, dropdown) {
    // Find all inputs in the new item that need event handlers
    const inputs = newItem.querySelectorAll(
      'input[type="checkbox"], input[type="radio"]'
    );

    inputs.forEach((input, index) => {
      // Add change event listener that calls the filter change handler
      input.addEventListener("change", (event) => {
        this._onChangeFilter(event);
      });
    });
  }

  /**
   * Handle filter change events for dynamically added items
   */
  _onChangeFilter(event) {
    // Check if we have access to the main listing plugin
    if (this.listing && typeof this.listing.changeListing === "function") {
      this.listing.changeListing(true, { p: 1 });
    } else {
      // Try to find the listing plugin instance
      const listingElement = document.querySelector("[data-listing]");
      if (listingElement) {
        const listingPlugin = window.PluginManager.getPluginInstanceFromElement(
          listingElement,
          "Listing"
        );
        if (
          listingPlugin &&
          typeof listingPlugin.changeListing === "function"
        ) {
          listingPlugin.changeListing(true, { p: 1 });
        } else {
          console.warn(
            "ListingListener: Could not find listing plugin or changeListing method"
          );
        }
      } else {
        console.warn("ListingListener: Could not find listing element");
      }
    }
  }

  /**
   * Reinitialize plugins only for new or modified elements
   */
  _reinitializePluginsSelectively(panel) {
    // Only reinitialize plugins for elements that were newly added
    const newElements = panel.querySelectorAll('[data-needs-init="true"]');

    newElements.forEach((element) => {
      try {
        // Initialize plugins for the new element and its children
        if (
          element.dataset.pluginName &&
          typeof element.dataset.pluginName === "string"
        ) {
          window.PluginManager.initializePlugin(
            element,
            element.dataset.pluginName
          );
        }

        // Also initialize plugins for child elements that might need it
        const childElements = element.querySelectorAll("[data-plugin-name]");
        childElements.forEach((child) => {
          if (
            child.dataset.pluginName &&
            typeof child.dataset.pluginName === "string"
          ) {
            window.PluginManager.initializePlugin(
              child,
              child.dataset.pluginName
            );
          }
        });
      } catch (e) {
        console.warn(
          "ListingListener: Failed to reinitialize plugin for element:",
          element,
          e
        );
      }

      // Remove the initialization flag
      element.removeAttribute("data-needs-init");
    });
  }

  /**
   * Build filter labels after content update
   */
  _buildLabels() {
    // const filterPanelItems = document.querySelectorAll(".filter-panel-item");
    // filterPanelItems.forEach((item) => {
    //   const checkedInputs = item.querySelectorAll("input:checked");
    //   const countElement = item.querySelector(".filter-multi-select-count");
    //   const toggleElement = item.querySelector(".filter-panel-item-toggle");
    //   if (countElement && checkedInputs.length > 0) {
    //     // Update count display
    //     countElement.textContent = checkedInputs.length;
    //     countElement.style.display = "inline";
    //     // Update toggle text or add active class
    //     if (toggleElement) {
    //       toggleElement.classList.add("is-active");
    //     }
    //   } else if (countElement) {
    //     // Hide count when no filters selected
    //     countElement.style.display = "none";
    //     if (toggleElement) {
    //       toggleElement.classList.remove("is-active");
    //     }
    //   }
    // });
  }

  /**
   * Re-register existing filter plugins with the main listing plugin
   * This is needed because the registry gets cleared during updates
   */
  _reregisterExistingFilters(panel) {
    // Find the main listing plugin instance
    const listingElement = document.querySelector("[data-listing]");
    if (!listingElement) return;

    const listingPlugin = window.PluginManager.getPluginInstanceFromElement(
      listingElement,
      "Listing"
    );
    if (!listingPlugin || !listingPlugin.registerFilter) return;

    // Find all filter elements and their associated plugins
    const filterElements = panel.querySelectorAll(
      "[data-filter-multi-select], [data-filter-range-slider], [data-filter-boolean]"
    );

    filterElements.forEach((element) => {
      // Check if this element needs reinitialization due to new content
      const needsReinit = element.hasAttribute("data-needs-reinit");

      // Try to get the plugin instance for each filter element
      const pluginNames = [
        "FilterMultiSelect",
        "FilterRangeSlider",
        "FilterBoolean",
      ];

      for (const pluginName of pluginNames) {
        try {
          const filterPlugin =
            window.PluginManager.getPluginInstanceFromElement(
              element,
              pluginName
            );
          if (filterPlugin) {
            // Re-register this filter plugin with the main listing
            if (typeof listingPlugin.registerFilter === "function") {
              listingPlugin.registerFilter(filterPlugin);
            }

            // Skip automatic reinitialization to avoid conflicts
            // Our manual event handlers should be sufficient
            if (needsReinit) {
              element.removeAttribute("data-needs-reinit");
            }
            break;
          }
        } catch (e) {
          console.warn(
            `ListingListener: Error processing ${pluginName} plugin:`,
            e
          );
        }
      }
    });
  }

  /**
   * Create missing section structure for a new filter item
   */
  _createMissingSectionStructure(newItem, dropdownInOldPanel) {
    // Find the section structure that this item belongs to in the new panel
    const newItemParentList = newItem.closest("ul.filter-multi-select-list");
    if (!newItemParentList) {
      return { list: null };
    }

    // Find the new panel dropdown that contains this structure
    const newDropdown = newItem.closest(".filter-panel-item-dropdown");
    if (!newDropdown) {
      return { list: null };
    }

    // First, ensure we have the complete wrapper structure
    const targetContainer = this._ensureWrapperStructureExists(
      newDropdown,
      dropdownInOldPanel
    );

    // Find all elements that come before this list in the new structure
    const elementsToClone = [];
    let currentElement = newItemParentList.previousElementSibling;

    // Walk backwards to collect all structural elements that belong to this section
    while (currentElement) {
      // Check if this is a structural element (not a list item)
      if (
        currentElement.tagName &&
        !currentElement.classList.contains("filter-multi-select-list-item")
      ) {
        // Check if this element is already in the target container
        const signature =
          this._createElementSignatureFromElement(currentElement);
        if (!this._elementExistsInContainer(targetContainer, signature)) {
          elementsToClone.unshift(currentElement); // Add to beginning to maintain order
        } else {
          // If we found an existing element, we've reached the boundary of this section
          break;
        }
      }
      currentElement = currentElement.previousElementSibling;
    }

    // Find the insertion point in the target container
    const insertionPoint = this._findSectionInsertionPoint(
      targetContainer,
      newDropdown,
      newItemParentList
    );

    // Clone and insert the structural elements
    let lastInsertedElement = null;
    elementsToClone.forEach((elementToClone) => {
      const clonedElement = elementToClone.cloneNode(true);

      if (insertionPoint) {
        targetContainer.insertBefore(clonedElement, insertionPoint);
      } else {
        targetContainer.appendChild(clonedElement);
      }

      lastInsertedElement = clonedElement;
    });

    // Create and insert the new list
    const newList = newItemParentList.cloneNode(false); // Clone without children
    newList.innerHTML = ""; // Ensure it's empty

    if (lastInsertedElement) {
      // Insert the list right after the last structural element
      lastInsertedElement.parentNode.insertBefore(
        newList,
        lastInsertedElement.nextSibling
      );
    } else if (insertionPoint) {
      targetContainer.insertBefore(newList, insertionPoint);
    } else {
      targetContainer.appendChild(newList);
    }

    return { list: newList };
  }

  /**
   * Create element signature from an actual element
   */
  _createElementSignatureFromElement(element) {
    const elementInfo = {
      tagName: element.tagName.toLowerCase(),
      classes: Array.from(element.classList),
      textContent: this._getElementTextSignature(element),
      isList:
        element.tagName.toLowerCase() === "ul" &&
        element.classList.contains("filter-multi-select-list"),
      isStructural: !element.classList.contains(
        "filter-multi-select-list-item"
      ),
    };

    return this._createElementSignature(elementInfo);
  }

  /**
   * Find the insertion point for a new section in the target container
   */
  _findSectionInsertionPoint(targetContainer, newDropdown, newItemParentList) {
    // Find elements that come after this list in the new structure
    let nextElement = newItemParentList.nextElementSibling;

    while (nextElement) {
      if (
        nextElement.tagName &&
        !nextElement.classList.contains("filter-multi-select-list-item")
      ) {
        // Check if this element exists in the target container
        const signature = this._createElementSignatureFromElement(nextElement);

        // Find this element in the target container
        const children = Array.from(targetContainer.children);
        for (const child of children) {
          const childSignature = this._createElementSignatureFromElement(child);
          if (childSignature === signature) {
            return child; // Insert before this element
          }
        }
      }
      nextElement = nextElement.nextElementSibling;
    }

    return null; // Insert at the end
  }

  /**
   * Ensure that the section structure exists for a new filter item
   * Returns the created structure if it was created, null if it already existed
   */
  _ensureSectionStructureExists(newItem, dropdownInOldPanel) {
    // First check if the section already exists
    if (this._sectionExistsForItem(newItem, dropdownInOldPanel)) {
      return null; // Section already exists, no need to create
    }

    // Section doesn't exist, create it
    return this._createMissingSectionStructure(newItem, dropdownInOldPanel);
  }

  /**
   * Check if the section structure already exists for a given item
   */
  _sectionExistsForItem(newItem, dropdownInOldPanel) {
    // Find the section structure that this item belongs to in the new panel
    const newItemParentList = newItem.closest("ul.filter-multi-select-list");
    if (!newItemParentList) {
      return true; // If no parent list, assume structure exists
    }

    // First, ensure we know where to look (find the proper container)
    const newDropdown = newItem.closest(".filter-panel-item-dropdown");
    if (!newDropdown) {
      return true;
    }

    // Get the target container where we should check for the section
    const targetContainer = this._findTargetContainer(
      newDropdown,
      dropdownInOldPanel
    );

    // Look for the preceding structural element to identify the section
    let sectionElement = null;
    let sectionText = null;
    let currentElement = newItemParentList.previousElementSibling;

    // Walk backwards to find the section identifier
    while (currentElement && !sectionElement) {
      // Check if this is a structural element (not a list item)
      if (
        currentElement.tagName &&
        !currentElement.classList.contains("filter-multi-select-list-item") &&
        currentElement.textContent.trim()
      ) {
        sectionElement = currentElement;
        sectionText = currentElement.textContent.trim();
        break;
      }
      currentElement = currentElement.previousElementSibling;
    }

    // If no section element found, assume structure exists
    if (!sectionElement || !sectionText) {
      return true;
    }

    // Check if this section element exists in the target container
    const signature = this._createElementSignatureFromElement(sectionElement);
    const exists = this._elementExistsInContainer(targetContainer, signature);

    return exists;
  }

  /**
   * Find the target container where content should be checked/added
   * (handles wrapper structure)
   */
  _findTargetContainer(newDropdown, oldDropdown) {
    // Get the structural path from the new dropdown
    const structuralPath = this._getStructuralPath(newDropdown);

    // Navigate through existing structure in old dropdown
    let currentContainer = oldDropdown;

    structuralPath.forEach((wrapperInfo) => {
      const existingWrapper = this._findWrapperInContainer(
        currentContainer,
        wrapperInfo
      );
      if (existingWrapper) {
        currentContainer = existingWrapper;
      }
      // If wrapper doesn't exist, we'll stay at the current level
      // The section creation will handle creating missing wrappers
    });

    return currentContainer;
  }

  /**
   * Ensure the complete wrapper structure exists from dropdown to content level
   * Returns the target container where content should be added
   */
  _ensureWrapperStructureExists(newDropdown, oldDropdown) {
    // Get the structural path from the new dropdown to the content
    const structuralPath = this._getStructuralPath(newDropdown);

    // Build the same structure in the old dropdown if it doesn't exist
    let currentContainer = oldDropdown;

    structuralPath.forEach((wrapperInfo) => {
      const existingWrapper = this._findWrapperInContainer(
        currentContainer,
        wrapperInfo
      );

      if (existingWrapper) {
        // Wrapper already exists, use it
        currentContainer = existingWrapper;
      } else {
        // Create the missing wrapper
        const newWrapper = this._createWrapperElement(wrapperInfo);
        currentContainer.appendChild(newWrapper);
        currentContainer = newWrapper;
      }
    });

    return currentContainer;
  }

  /**
   * Get the structural path from dropdown to content level
   */
  _getStructuralPath(dropdown) {
    const path = [];
    const directChildren = Array.from(dropdown.children);

    // Look for wrapper elements that contain the content
    directChildren.forEach((child) => {
      if (this._isWrapperElement(child)) {
        const wrapperInfo = {
          tagName: child.tagName.toLowerCase(),
          classes: Array.from(child.classList),
          signature: this._createElementSignatureFromElement(child),
        };
        path.push(wrapperInfo);
      }
    });

    return path;
  }

  /**
   * Check if an element is a wrapper element (contains content but isn't content itself)
   */
  _isWrapperElement(element) {
    // Skip list items and individual lists
    if (
      element.classList.contains("filter-multi-select-list-item") ||
      (element.tagName.toLowerCase() === "ul" &&
        element.classList.contains("filter-multi-select-list"))
    ) {
      return false;
    }

    // Check if it contains multiple structural elements or lists
    const childLists = element.querySelectorAll("ul.filter-multi-select-list");
    const childStructural = element.querySelectorAll(
      ":scope > *:not(.filter-multi-select-list-item)"
    );

    return childLists.length > 0 || childStructural.length > 1;
  }

  /**
   * Find a wrapper element in a container by its info
   */
  _findWrapperInContainer(container, wrapperInfo) {
    const children = Array.from(container.children);

    return children.find((child) => {
      const childSignature = this._createElementSignatureFromElement(child);
      return childSignature === wrapperInfo.signature;
    });
  }

  /**
   * Create a wrapper element from wrapper info
   */
  _createWrapperElement(wrapperInfo) {
    const element = document.createElement(wrapperInfo.tagName);
    wrapperInfo.classes.forEach((className) => {
      element.classList.add(className);
    });
    return element;
  }

  /**
   * Check if an element with the given signature exists in the container
   */
  _elementExistsInContainer(container, signature) {
    const children = Array.from(container.children);

    return children.some((child) => {
      const childSignature = this._createElementSignatureFromElement(child);
      return childSignature === signature;
    });
  }

  /**
   * Create a map of existing section-item relationships before structural changes
   */
  _createExistingSectionMap(oldPanel) {
    const sectionMap = new Map();

    // Find all filter elements in the old panel
    const filterElements = oldPanel.querySelectorAll(
      "[data-filter-multi-select-options]"
    );

    filterElements.forEach((filterElement) => {
      const dropdown = filterElement.querySelector(
        ".filter-panel-item-dropdown"
      );
      if (!dropdown) return;

      // Find the target container
      const targetContainer = this._findTargetContainerInExisting(dropdown);

      // Find all structural elements that could be section headers
      const structuralElements = targetContainer.querySelectorAll("*");

      structuralElements.forEach((element) => {
        // Check if this looks like a section header (has text content and is followed by a list)
        if (
          element.textContent.trim() &&
          !element.classList.contains("filter-multi-select-list-item") &&
          element.tagName.toLowerCase() !== "ul"
        ) {
          const sectionText = element.textContent.trim();
          let nextElement = element.nextElementSibling;

          // Look for the associated list
          while (nextElement) {
            if (
              nextElement.tagName.toLowerCase() === "ul" &&
              nextElement.classList.contains("filter-multi-select-list")
            ) {
              // Collect all items from this list
              const items = Array.from(
                nextElement.querySelectorAll(".filter-multi-select-list-item")
              );
              const itemsCloned = items.map((item) => item.cloneNode(true));

              if (itemsCloned.length > 0) {
                if (!sectionMap.has(sectionText)) {
                  sectionMap.set(sectionText, []);
                }
                sectionMap.get(sectionText).push(...itemsCloned);
              }
              break;
            }

            // Stop if we hit another section header
            if (
              nextElement.textContent.trim() &&
              !nextElement.classList.contains(
                "filter-multi-select-list-item"
              ) &&
              nextElement.tagName.toLowerCase() !== "ul"
            ) {
              break;
            }

            nextElement = nextElement.nextElementSibling;
          }
        }
      });
    });

    return sectionMap;
  }

  /**
   * Find the target container in existing structure (before changes)
   */
  _findTargetContainerInExisting(dropdown) {
    // Look for wrapper elements in the existing structure
    const children = Array.from(dropdown.children);

    for (const child of children) {
      if (this._isWrapperElement(child)) {
        return child;
      }
    }

    // If no wrapper found, use the dropdown itself
    return dropdown;
  }

  /**
   * Restore existing items to their correct sections after structural changes
   */
  _restoreExistingSectionAssociations(oldPanel, sectionMap) {
    if (sectionMap.size === 0) return;

    // Find all filter elements in the updated panel
    const filterElements = oldPanel.querySelectorAll(
      "[data-filter-multi-select-options]"
    );

    filterElements.forEach((filterElement) => {
      const dropdown = filterElement.querySelector(
        ".filter-panel-item-dropdown"
      );
      if (!dropdown) return;

      const targetContainer =
        this._findTargetContainer(null, dropdown) || dropdown;

      // For each preserved section, try to restore its items
      sectionMap.forEach((preservedItems, sectionText) => {
        const sectionList = this._findSectionByTextInContainer(
          targetContainer,
          sectionText
        );

        if (sectionList) {
          // Clear any incorrectly placed items first
          this._removeItemsFromIncorrectSections(
            targetContainer,
            preservedItems,
            sectionText
          );

          // Add the preserved items to the correct section
          preservedItems.forEach((item) => {
            // Check if this item is already in the correct section
            if (!this._itemExistsInList(sectionList, item)) {
              sectionList.appendChild(item.cloneNode(true));
            }
          });
        }
      });
    });
  }

  /**
   * Find a section list by section text in a container
   */
  _findSectionByTextInContainer(container, sectionText) {
    const elements = container.querySelectorAll("*");

    for (const element of elements) {
      if (
        element.textContent.trim() === sectionText &&
        !element.classList.contains("filter-multi-select-list-item") &&
        element.tagName.toLowerCase() !== "ul"
      ) {
        // Find the next list after this section header
        let nextElement = element.nextElementSibling;
        while (nextElement) {
          if (
            nextElement.tagName.toLowerCase() === "ul" &&
            nextElement.classList.contains("filter-multi-select-list")
          ) {
            return nextElement;
          }
          nextElement = nextElement.nextElementSibling;
        }
      }
    }

    return null;
  }

  /**
   * Remove items from incorrect sections (cleanup before restoration)
   */
  _removeItemsFromIncorrectSections(
    container,
    preservedItems,
    correctSectionText
  ) {
    const allLists = container.querySelectorAll("ul.filter-multi-select-list");

    allLists.forEach((list) => {
      // Skip if this is the correct section
      const sectionText = this._getSectionTextForList(list);
      if (sectionText === correctSectionText) return;

      // Remove any items that belong to the correct section
      const listItems = Array.from(
        list.querySelectorAll(".filter-multi-select-list-item")
      );

      listItems.forEach((listItem) => {
        const itemLabel = this._getItemLabel(listItem);

        // Check if this item should be in the preserved section
        const shouldBeInPreservedSection = preservedItems.some(
          (preservedItem) => {
            const preservedLabel = this._getItemLabel(preservedItem);
            return preservedLabel === itemLabel;
          }
        );

        if (shouldBeInPreservedSection) {
          listItem.remove();
        }
      });
    });
  }

  /**
   * Get the section text for a given list
   */
  _getSectionTextForList(list) {
    let prevElement = list.previousElementSibling;

    while (prevElement) {
      if (
        prevElement.textContent.trim() &&
        !prevElement.classList.contains("filter-multi-select-list-item") &&
        prevElement.tagName.toLowerCase() !== "ul"
      ) {
        return prevElement.textContent.trim();
      }
      prevElement = prevElement.previousElementSibling;
    }

    return null;
  }

  /**
   * Check if an item already exists in a list
   */
  _itemExistsInList(list, item) {
    const itemLabel = this._getItemLabel(item);
    const existingItems = list.querySelectorAll(
      ".filter-multi-select-list-item"
    );

    return Array.from(existingItems).some((existingItem) => {
      const existingLabel = this._getItemLabel(existingItem);
      return existingLabel === itemLabel;
    });
  }

  /**
   * Get the label from a filter item
   */
  _getItemLabel(item) {
    const input = item.querySelector("input[data-label]");
    return input ? input.getAttribute("data-label") : null;
  }

  /**
   * Replace the filter structure completely while preserving existing items
   */
  _replaceFilterStructureCompletely(oldPanel, newPanel, existingSectionMap) {
    // Find all filter elements in both panels
    const oldFilters = oldPanel.querySelectorAll(
      "[data-filter-multi-select-options]"
    );
    const newFilters = newPanel.querySelectorAll(
      "[data-filter-multi-select-options]"
    );

    // Create maps for comparison using filter names
    const oldFiltersMap = this._createFilterElementsMap(oldFilters);
    const newFiltersMap = this._createFilterElementsMap(newFilters);

    // Process each filter
    Object.keys(newFiltersMap).forEach((filterName) => {
      const oldFilter = oldFiltersMap[filterName];
      const newFilter = newFiltersMap[filterName];

      if (oldFilter && newFilter) {
        this._replaceFilterDropdownStructure(
          oldFilter,
          newFilter,
          existingSectionMap
        );
      } else if (newFilter && !oldFilter) {
        // Add new filters that don't exist in the old panel
        oldPanel.appendChild(newFilter);
        //this._attachEventHandlersToNewFilter(newFilter);
      }
    });

    // Remove filters that no longer exist in the new panel
    Object.keys(oldFiltersMap).forEach((filterName) => {
      if (!newFiltersMap[filterName]) {
        const obsoleteFilter = oldFiltersMap[filterName];
        obsoleteFilter.classList.add("filter-panel-item-hidden");
      } else {
        const obsoleteFilter = oldFiltersMap[filterName];
        if (obsoleteFilter.classList.contains("filter-panel-item-hidden")) {
          obsoleteFilter.classList.remove("filter-panel-item-hidden");
        }
      }
    });
  }

  /**
   * Replace the dropdown structure for a specific filter
   */
  _replaceFilterDropdownStructure(oldFilter, newFilter, existingSectionMap) {
    const oldDropdown = oldFilter.querySelector(".filter-panel-item-dropdown");
    const newDropdown = newFilter.querySelector(".filter-panel-item-dropdown");

    if (!oldDropdown || !newDropdown) return;

    // Build the complete new structure from the new panel
    const newStructure = this._buildCompleteStructureFromNew(
      newDropdown,
      existingSectionMap
    );

    // Replace the old dropdown content with the new structure
    oldDropdown.innerHTML = "";

    // Add the new structure to the old dropdown
    newStructure.forEach((element) => {
      oldDropdown.appendChild(element);
    });

    // Attach event handlers to all new items
    this._attachEventHandlersToNewDropdown(oldDropdown);
  }

  /**
   * Attach event handlers to all items in a dropdown
   */
  _attachEventHandlersToNewDropdown(dropdown) {
    const allItems = dropdown.querySelectorAll(
      ".filter-multi-select-list-item"
    );

    allItems.forEach((item) => {
      this._attachEventHandlersToNewItem(item, dropdown);
    });
  }

  /**
   * Build the complete structure from the new panel, placing existing items correctly
   */
  _buildCompleteStructureFromNew(newDropdown, existingSectionMap) {
    const structure = [];
    const newChildren = Array.from(newDropdown.children);

    newChildren.forEach((child) => {
      if (this._isWrapperElement(child)) {
        // This is a wrapper, process its contents
        const wrapper = child.cloneNode(false); // Clone without children
        const wrapperContent = this._buildWrapperContent(
          child,
          existingSectionMap
        );

        wrapperContent.forEach((contentElement) => {
          wrapper.appendChild(contentElement);
        });

        structure.push(wrapper);
      } else {
        // Direct child element
        const clonedChild = this._processStructuralElement(
          child,
          existingSectionMap
        );
        if (clonedChild) {
          structure.push(clonedChild);
        }
      }
    });

    return structure;
  }

  /**
   * Build the content for a wrapper element
   */
  _buildWrapperContent(wrapperElement, existingSectionMap) {
    const content = [];
    const children = Array.from(wrapperElement.children);
    let currentSection = null;
    let currentSectionList = null;

    children.forEach((child) => {
      if (
        child.tagName.toLowerCase() === "ul" &&
        child.classList.contains("filter-multi-select-list")
      ) {
        // This is a list - populate it with the correct items
        if (currentSection) {
          currentSectionList = this._createListForSection(
            child,
            currentSection,
            existingSectionMap
          );
          content.push(currentSectionList);
        } else {
          // List without a section - clone as is but check for existing items
          currentSectionList = this._createListWithExistingItems(
            child,
            existingSectionMap
          );
          content.push(currentSectionList);
        }
      } else if (
        child.textContent.trim() &&
        !child.classList.contains("filter-multi-select-list-item")
      ) {
        // This is a section header
        currentSection = child.textContent.trim();
        const clonedHeader = child.cloneNode(true);
        content.push(clonedHeader);
      } else {
        // Other structural element
        const clonedElement = child.cloneNode(true);
        content.push(clonedElement);
      }
    });

    return content;
  }

  /**
   * Create a list for a specific section, using existing items if available
   */
  _createListForSection(templateList, sectionText, existingSectionMap) {
    const list = templateList.cloneNode(false); // Clone without children

    // Create a map of existing items by their labels to preserve checked states
    const existingItemsMap = new Map();
    if (existingSectionMap.has(sectionText)) {
      const existingItems = existingSectionMap.get(sectionText);
      existingItems.forEach((item) => {
        const label = this._getItemLabel(item);
        if (label) {
          const input = item.querySelector("input");
          existingItemsMap.set(label, {
            element: item,
            checked: input ? input.checked : false,
          });
        }
      });
    }

    // Use items from the new template (server response) as the source of truth
    const templateItems = Array.from(templateList.children);
    templateItems.forEach((templateItem) => {
      const templateLabel = this._getItemLabel(templateItem);
      const newItem = templateItem.cloneNode(true);

      // If we have an existing item with the same label, preserve its checked state
      if (templateLabel && existingItemsMap.has(templateLabel)) {
        const existingInfo = existingItemsMap.get(templateLabel);
        const newInput = newItem.querySelector("input");
        if (newInput && existingInfo.checked) {
          newInput.checked = true;
        }
      }

      list.appendChild(newItem);
    });

    return list;
  }

  /**
   * Create a list with existing items (for lists without clear section headers)
   */
  _createListWithExistingItems(templateList, existingSectionMap) {
    const list = templateList.cloneNode(false);

    // Try to determine which section this list belongs to by looking at its items
    const templateItems = Array.from(templateList.children);
    let matchedSection = null;

    // Look for the section that contains most of these items
    existingSectionMap.forEach((existingItems, sectionText) => {
      const matchCount = templateItems.reduce((count, templateItem) => {
        const templateLabel = this._getItemLabel(templateItem);
        const hasMatch = existingItems.some((existingItem) => {
          const existingLabel = this._getItemLabel(existingItem);
          return existingLabel === templateLabel;
        });
        return hasMatch ? count + 1 : count;
      }, 0);

      if (
        matchCount > 0 &&
        (!matchedSection || matchCount > matchedSection.count)
      ) {
        matchedSection = { section: sectionText, count: matchCount };
      }
    });

    if (matchedSection) {
      // Use the matched section's items
      return this._createListForSection(
        templateList,
        matchedSection.section,
        existingSectionMap
      );
    }

    // No section match found - create a map of all existing items to preserve checked states
    const existingItemsMap = new Map();
    existingSectionMap.forEach((existingItems, sectionText) => {
      existingItems.forEach((item) => {
        const label = this._getItemLabel(item);
        if (label) {
          const input = item.querySelector("input");
          existingItemsMap.set(label, {
            element: item,
            checked: input ? input.checked : false,
          });
        }
      });
    });

    // Use items from the template (server response) as the source of truth
    templateItems.forEach((templateItem) => {
      const templateLabel = this._getItemLabel(templateItem);
      const newItem = templateItem.cloneNode(true);

      // If we have an existing item with the same label, preserve its checked state
      if (templateLabel && existingItemsMap.has(templateLabel)) {
        const existingInfo = existingItemsMap.get(templateLabel);
        const newInput = newItem.querySelector("input");
        if (newInput && existingInfo.checked) {
          newInput.checked = true;
        }
      }

      list.appendChild(newItem);
    });

    return list;
  }

  /**
   * Process a structural element (non-wrapper)
   */
  _processStructuralElement(element, existingSectionMap) {
    if (
      element.tagName.toLowerCase() === "ul" &&
      element.classList.contains("filter-multi-select-list")
    ) {
      return this._createListWithExistingItems(element, existingSectionMap);
    }

    return element.cloneNode(true);
  }
}
