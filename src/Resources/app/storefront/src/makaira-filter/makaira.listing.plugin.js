import ListingPlugin from "src/plugin/listing/listing.plugin";

export default class MakairaListing extends ListingPlugin {
  init() {
    super.init();
    this.initMakairaFilter();
  }

  initMakairaFilter() {
    console.log("MakairaListing initMakairaFilter");
  }

  _buildRequest(pushHistory = true, overrideParams = {}) {
    super._buildRequest(pushHistory, overrideParams);
  }

  _buildRequest(pushHistory = true, overrideParams = {}) {
    const filters = this._fetchValuesOfRegisteredFilters();
    const mapped = this._mapFilters(filters);

    if (this._filterPanelActive) {
      this._showResetAll = !!Object.keys(mapped).length;
    }

    if (this.options.params) {
      Object.keys(this.options.params).forEach((key) => {
        mapped[key] = this.options.params[key];
      });
    }

    Object.entries(overrideParams).forEach(([paramKey, paramValue]) => {
      mapped[paramKey] = paramValue;
    });

    this._registry = [];

    let query = new URLSearchParams(mapped).toString();
    this.sendDataRequest(query);

    delete mapped["slots"];
    delete mapped["no-aggregations"];
    delete mapped["reduce-aggregations"];
    delete mapped["only-aggregations"];
    query = new URLSearchParams(mapped).toString();

    if (pushHistory) {
      this._updateHistory(query);
    }

    if (this.options.scrollTopListingWrapper) {
      this._scrollTopOfListing();
    }
  }

  _buildLabels() {
    //extract the labels from this._cmsProductListingWrapper.baseURI that looks like "http://localhost/Clothing/?filter_size=M&p=1"
    const baseURI = this._cmsProductListingWrapper.baseURI;
    const url = new URL(baseURI);
    const params = url.searchParams;
    const labels = [];
    //use only keys that start with filter_
    params.forEach((value, key) => {
      //mutliple values are separated by &
      const values = value.split("|");
      values.forEach((value) => {
        if (key.startsWith("filter_")) {
          labels.push({
            id: value,
            label: value,
          });
        }
      });
    });

    //add the labels for those url params min-price=40&max-price=100
    const minPrice = params.get("min-price");
    const maxPrice = params.get("max-price");

    if (minPrice) {
      labels.push({
        id: "min-price",
        label: "Preis ab " + minPrice,
      });
    }
    if (maxPrice) {
      labels.push({
        id: "max-price",
        label: "Preis bis " + maxPrice,
      });
    }

    let labelHtml = "";
    labels.forEach((label) => {
      if (!labelHtml.includes(label)) {
        labelHtml += this.getLabelTemplate(label);
      }
    });

    /*let labelHtml = '';



        this._registry.forEach((filterPlugin) => {
            const labels = filterPlugin.getLabels();

            if (labels.length) {
                labels.forEach((label) => {
                    labelHtml += this.getLabelTemplate(label);
                });
            }
        });*/

    this.activeFilterContainer.innerHTML = labelHtml;

    let filterActiveSelector = window.Feature.isActive("ACCESSIBILITY_TWEAKS")
      ? ".filter-active"
      : ".filter-active-remove";
    const resetButtons =
      this.activeFilterContainer.querySelectorAll(filterActiveSelector);

    if (labelHtml.length) {
      this._registerLabelEvents(resetButtons);
      this.createResetAllButton();
    }
  }

  registerFilter(filterItem) {
    // check if the item is already in the _registry and skip if so
    if (
      this._registry.some(
        (item) => item.options.name === filterItem.options.name
      )
    ) {
      return;
    }

    this._registry.push(filterItem);
    this._setFilterState(filterItem);

    if (this.options.disableEmptyFilter) {
      this._allFiltersInitializedDebounce();
    }
  }
}
