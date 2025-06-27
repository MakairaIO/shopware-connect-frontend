import ListingListener from "./makaira-filter/filter/listing.plugin";
import CategoryLocalStorage from "./makaira-filter/category-local-storage.plugin";

document.addEventListener("DOMContentLoaded", () => {
  if (window.PluginManager) {
    // Only register if not already registered
    window.PluginManager.register(
      "ListingListener",
      ListingListener,
      "[data-listing-listener]"
    );

    // Register CategoryLocalStorage plugin
    window.PluginManager.register(
      "CategoryLocalStorage",
      CategoryLocalStorage,
      "[data-category-local-storage]"
    );

    if (window.PluginManager.getPlugin("Listing")) {
      window.PluginManager.override(
        "Listing",
        () => import("./makaira-filter/makaira.listing.plugin"),
        "[data-listing]"
      );
    }

    window.PluginManager.initializePlugins();
  }
});
