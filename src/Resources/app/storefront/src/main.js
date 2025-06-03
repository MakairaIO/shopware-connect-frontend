import ListingListener from "./makaira-filter/filter/listing.plugin";

document.addEventListener("DOMContentLoaded", () => {
  if (window.PluginManager) {
    // Only register if not already registered
    if (!window.PluginManager.getPlugin("ListingListener")) {
      window.PluginManager.register(
        "ListingListener",
        ListingListener,
        "[data-listing-listener]"
      );
    }

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
