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
    if (this._isEnabled()) {
      this._registerEvents();

      // Set up offcanvas visibility monitoring if needed
      if (this.options.hideItemsWhenOffcanvasHidden) {
        this._setupOffcanvasMonitoring();
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
    const containers = document.querySelectorAll(
      ".filter-panel-items-container"
    );
    containers.forEach((container) => {
      const items = container.querySelectorAll(
        ".filter-panel-item, .filter-multi-select-list-item"
      );
      items.forEach((item) => {
        this._hideFilterItem(item);
      });
    });
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

    this._updateFilterMultiSelectElements(oldPanel, newPanel);
    this._updateFilterListItemElements(oldPanel, newPanel);

    this._reregisterExistingFilters(oldPanel);
    this._restoreInputStates(oldPanel, inputStates, false);
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
   * Create a map of filter-multi-select elements keyed by their options
   */
  _createFilterMultiSelectMap(elements) {
    const map = {};
    elements.forEach((element) => {
      const options = element.getAttribute("data-filter-multi-select-options");
      if (options) {
        // Parse the options to create a unique key
        const key = `filter-multi-select-${options}`;
        map[key] = element;
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
        const parentOptions = parentFilter
          ? parentFilter.getAttribute("data-filter-multi-select-options")
          : "unknown";
        const key = `${parentOptions}-${label}`;
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
   * Add a new filter list item to the appropriate parent
   */
  _addNewFilterListItem(oldPanel, newItem) {
    // Find the parent filter in the old panel
    const parentOptions = newItem
      .closest("[data-filter-multi-select]")
      ?.getAttribute("data-filter-multi-select-options");
    if (!parentOptions) return;

    const parentInOldPanel = oldPanel.querySelector(
      `[data-filter-multi-select-options="${parentOptions}"]`
    );
    if (!parentInOldPanel) return;

    const dropdownInOldPanel = parentInOldPanel.querySelector(
      ".filter-panel-item-dropdown"
    );
    if (!dropdownInOldPanel) return;

    // Clone and add the new item
    const clonedItem = newItem.cloneNode(true);
    dropdownInOldPanel.appendChild(clonedItem);

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
    console.log(
      "_restoreInputStates called with triggerEvents =",
      triggerEvents
    );
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
          console.log("Triggering event for input:", input.name, input.value);
          input.dispatchEvent(
            new Event(
              input.type === "checkbox" || input.type === "radio"
                ? "change"
                : "input",
              { bubbles: true }
            )
          );
        } else {
          console.log(
            "Skipping event trigger for input:",
            input.name,
            input.value
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
        console.log("Reusing existing item:", key);
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
        console.log("Adding new item:", key);
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
    // For now, let's just mark that we need to reinitialize this specific dropdown
    // This is a simpler approach than trying to manually attach event handlers
    const parentFilterItem = dropdown.closest(".filter-panel-item");
    if (parentFilterItem) {
      parentFilterItem.setAttribute("data-needs-reinit", "true");
    }
  }

  /**
   * Reinitialize plugins only for new or modified elements
   */
  _reinitializePluginsSelectively(panel) {
    // Only reinitialize plugins for elements that were newly added
    const newElements = panel.querySelectorAll('[data-needs-init="true"]');

    newElements.forEach((element) => {
      // Initialize plugins for the new element and its children
      if (element.dataset.pluginName) {
        window.PluginManager.initializePlugin(
          element,
          element.dataset.pluginName
        );
      }

      // Also initialize plugins for child elements that might need it
      const childElements = element.querySelectorAll("*");
      childElements.forEach((child) => {
        if (child.dataset.pluginName) {
          window.PluginManager.initializePlugin(
            child,
            child.dataset.pluginName
          );
        }
      });

      // Remove the initialization flag
      element.removeAttribute("data-needs-init");
    });

    // If no specific elements needed initialization, try a broader approach for any new dropdowns
    if (newElements.length === 0) {
      const dropdowns = panel.querySelectorAll(".filter-panel-item-dropdown");
      dropdowns.forEach((dropdown) => {
        const parentItem = dropdown.closest(".filter-panel-item");
        if (parentItem && parentItem.dataset.pluginName) {
          window.PluginManager.initializePlugin(
            parentItem,
            parentItem.dataset.pluginName
          );
        }
      });
    }
  }

  _onAfterRenderResponse({ response }) {
    //console.log('Listing/afterRenderResponse fired!', response);
    //console.log(response);
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
        const filterPlugin = window.PluginManager.getPluginInstanceFromElement(
          element,
          pluginName
        );
        if (filterPlugin) {
          // Re-register this filter plugin with the main listing
          listingPlugin.registerFilter(filterPlugin);

          // If this element needs reinitialization, reinitialize the plugin
          if (needsReinit) {
            console.log(
              `Reinitializing ${pluginName} plugin for element with new content`
            );
            // Reinitialize the plugin to ensure new DOM elements get proper event handlers
            window.PluginManager.initializePlugin(element, pluginName);
            element.removeAttribute("data-needs-reinit");
          }
          break;
        }
      }
    });
  }

  afterContentChange() {
    console.log("ListingListener afterContentChange");

    /*if (this.buttons && this._pageChanged) {
            this._resumeFocusState();
        }

        this._pageChanged = false;*/
  }
}
