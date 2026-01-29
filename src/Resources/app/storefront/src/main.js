import ListingListener from "./makaira-filter/filter/listing.plugin";
import MakairaAutosuggestPlugin from "./makaira-autosuggest/makaira-autosuggest.plugin";

document.addEventListener("DOMContentLoaded", () => {
  if (window.PluginManager) {
    // Only register if not already registered
    try {
      window.PluginManager.register(
        "ListingListener",
        ListingListener,
        "[data-listing-listener]"
      );
    } catch (e) {
      console.error("Error registering ListingListener", e);
    }

    // Register Makaira Fast Autosuggest plugin
    try {
      window.PluginManager.register(
        "MakairaAutosuggest",
        MakairaAutosuggestPlugin,
        "[data-makaira-autosuggest]"
      );
    } catch (e) {
      console.error("Error registering MakairaAutosuggest", e);
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
