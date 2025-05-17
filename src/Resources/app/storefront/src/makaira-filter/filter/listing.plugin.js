// Import PluginOverride from Shopware's storefront-sdk
//import Plugin from '../plugin';
import Plugin from "src/plugin-system/plugin.class";

export default class ListingListener extends Plugin {
  static sidebarFilterSelector = ".cms-element-sidebar-filter";

  init() {
    this._registerEvents();
  }

  _registerEvents() {
    this.$emitter.subscribe("Listing/afterRenderResponse", (event) => {
      this._swapContent(event.detail.response);
    });
  }

  _swapContent(data) {
    const doc = new DOMParser().parseFromString(data, "text/html");
    const newFilterPanel = doc.querySelector(".filter-panel-items-container");

    if (newFilterPanel) {
      // Get the old filter panel first
      const oldFilterPanel = document.querySelector(
        ".filter-panel-items-container"
      );
      if (oldFilterPanel) {
        // Store states of all inputs from old panel
        const oldInputs = oldFilterPanel.querySelectorAll("input");
        const inputStates = new Map();

        oldInputs.forEach((input) => {
          const key =
            input.type === "checkbox" || input.type === "radio"
              ? input.name + "_" + input.value
              : input.name;
          inputStates.set(key, {
            checked: input.checked,
            value: input.value,
          });
        });

        // Replace the entire HTML content
        oldFilterPanel.innerHTML = newFilterPanel.innerHTML;

        // Restore states to the new inputs
        const newInputs = oldFilterPanel.querySelectorAll("input");
        newInputs.forEach((input) => {
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
            // Trigger appropriate event
            input.dispatchEvent(
              new Event(
                input.type === "checkbox" || input.type === "radio"
                  ? "change"
                  : "input",
                { bubbles: true }
              )
            );
          }
        });

        // Reinitialize plugins
        window.PluginManager.initializePlugins();
      }
    }
  }

  _onAfterRenderResponse({ response }) {
    //console.log('Listing/afterRenderResponse fired!', response);
    //console.log(response);
  }

  afterContentChange() {
    console.log("ListingListener afterContentChange");

    /*if (this.buttons && this._pageChanged) {
            this._resumeFocusState();
        }

        this._pageChanged = false;*/
  }
}
