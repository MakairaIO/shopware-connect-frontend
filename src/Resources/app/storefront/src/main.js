import ListingListener from "./makaira-filter/filter/listing.plugin";

// Flag to prevent double registration
let isListingListenerRegistered = false;

/**
 * Safely check if a plugin is already registered
 * @param {string} pluginName - Name of the plugin to check
 * @returns {boolean} - True if plugin exists, false otherwise
 */
function isPluginRegistered(pluginName) {
  if (!window.PluginManager) {
    return false;
  }

  try {
    // Method 1: Try to get the plugin directly
    const plugin = window.PluginManager.getPlugin(pluginName);
    return !!plugin;
  } catch (error) {
    // Method 2: Check if PluginManager has a registry or plugins property
    if (
      window.PluginManager.plugins &&
      window.PluginManager.plugins[pluginName]
    ) {
      return true;
    }

    // Method 3: Check if there are any elements with the plugin's data attribute
    const elements = document.querySelectorAll(
      `[data-${pluginName.toLowerCase()}]`
    );
    if (elements.length > 0) {
      // Check if any of these elements have the plugin instance
      for (const element of elements) {
        try {
          const instance = window.PluginManager.getPluginInstanceFromElement(
            element,
            pluginName
          );
          if (instance) {
            return true;
          }
        } catch (e) {
          // Continue checking other elements
        }
      }
    }

    return false;
  }
}

// Store the original methods to prevent early initialization and async loading issues
let originalInitializePlugins = null;
let pluginsInitialized = false;

document.addEventListener("DOMContentLoaded", () => {
  if (window.PluginManager && !isListingListenerRegistered) {
    // Store the original method to prevent automatic initialization
    if (!originalInitializePlugins) {
      originalInitializePlugins = window.PluginManager.initializePlugins;

      window.PluginManager.initializePlugins = () => {
        // Do nothing - we'll call the original method when ready
      };
    }

    // Only register if not already registered
    if (isPluginRegistered("ListingListener")) {
      isListingListenerRegistered = true;
      return;
    }

    // Register the ListingListener plugin
    try {
      window.PluginManager.register(
        "ListingListener",
        ListingListener,
        "[data-listing-listener]"
      );
      isListingListenerRegistered = true;
    } catch (error) {
      console.error("Failed to register ListingListener plugin:", error);
    }

    // Register MakairaListing as a separate plugin to avoid override issues
    const initializeWithMakairaListing = async () => {
      try {
        // Preload the MakairaListing module
        const MakairaListingModule = await import(
          "./makaira-filter/makaira.listing.plugin"
        );
        const MakairaListing = MakairaListingModule.default;

        // Register MakairaListing as a separate plugin instead of overriding
        if (!isPluginRegistered("MakairaListing")) {
          window.PluginManager.register(
            "MakairaListing",
            MakairaListing,
            "[data-listing]"
          );
        } else {
        }
      } catch (error) {
        console.error("Failed to register MakairaListing plugin:", error);
      }

      // Now initialize plugins
      if (!pluginsInitialized && originalInitializePlugins) {
        try {
          // Restore the original method and call it
          window.PluginManager.initializePlugins = originalInitializePlugins;
          window.PluginManager.initializePlugins();
          pluginsInitialized = true;
        } catch (error) {
          console.error("Failed to initialize plugins:", error);
        }
      }
    };

    // Start the async initialization process
    setTimeout(initializeWithMakairaListing, 50);
  }
});
