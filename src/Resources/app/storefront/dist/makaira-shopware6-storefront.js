(() => {
  "use strict";
  var e,
    t,
    i = {
      139: (e, t, i) => {
        i.d(t, { A: () => n });
        var r = i(747);
        class n {
          static isNode(e) {
            return (
              "object" == typeof e &&
              null !== e &&
              (e === document || e === window || e instanceof Node)
            );
          }
          static hasAttribute(e, t) {
            if (!n.isNode(e))
              throw new Error("The element must be a valid HTML Node!");
            return "function" == typeof e.hasAttribute && e.hasAttribute(t);
          }
          static getAttribute(e, t, i = !0) {
            if (i && !1 === n.hasAttribute(e, t))
              throw new Error(`The required property "${t}" does not exist!`);
            if ("function" == typeof e.getAttribute) return e.getAttribute(t);
            if (i)
              throw new Error(
                "This node doesn't support the getAttribute function!"
              );
          }
          static getDataAttribute(e, t, i = !0) {
            const s = t.replace(/^data(|-)/, ""),
              l = r.A.toLowerCamelCase(s, "-");
            if (!n.isNode(e)) {
              if (i)
                throw new Error("The passed node is not a valid HTML Node!");
              return;
            }
            if (void 0 === e.dataset) {
              if (i)
                throw new Error(
                  "This node doesn't support the dataset attribute!"
                );
              return;
            }
            const o = e.dataset[l];
            if (void 0 === o) {
              if (i)
                throw new Error(
                  `The required data attribute "${t}" does not exist on ${e}!`
                );
              return o;
            }
            return r.A.parsePrimitive(o);
          }
          static querySelector(e, t, i = !0) {
            if (i && !n.isNode(e))
              throw new Error("The parent node is not a valid HTML Node!");
            const r = e.querySelector(t) || !1;
            if (i && !1 === r)
              throw new Error(
                `The required element "${t}" does not exist in parent node!`
              );
            return r;
          }
          static querySelectorAll(e, t, i = !0) {
            if (i && !n.isNode(e))
              throw new Error("The parent node is not a valid HTML Node!");
            let r = e.querySelectorAll(t);
            if ((0 === r.length && (r = !1), i && !1 === r))
              throw new Error(
                `At least one item of "${t}" must exist in parent node!`
              );
            return r;
          }
          static getFocusableElements(e = document.body) {
            return e.querySelectorAll(
              '\n            input:not([tabindex^="-"]):not([disabled]):not([type="hidden"]),\n            select:not([tabindex^="-"]):not([disabled]),\n            textarea:not([tabindex^="-"]):not([disabled]),\n            button:not([tabindex^="-"]):not([disabled]),\n            a[href]:not([tabindex^="-"]):not([disabled]),\n            [tabindex]:not([tabindex^="-"]):not([disabled])\n        '
            );
          }
          static getFirstFocusableElement(e = document.body) {
            return this.getFocusableElements(e)[0];
          }
          static getLastFocusableElement(e = document) {
            const t = this.getFocusableElements(e);
            return t[t.length - 1];
          }
        }
      },
      194: (e, t, i) => {
        i.d(t, { A: () => a });
        var r = i(744),
          n = i.n(r),
          s = i(139),
          l = i(747);
        class o {
          constructor(e = document) {
            (this._el = e), (e.$emitter = this), (this._listeners = []);
          }
          publish(e, t = {}, i = !1) {
            const r = new CustomEvent(e, { detail: t, cancelable: i });
            return this.el.dispatchEvent(r), r;
          }
          subscribe(e, t, i = {}) {
            const r = this,
              n = e.split(".");
            let s = i.scope ? t.bind(i.scope) : t;
            if (i.once && !0 === i.once) {
              const t = s;
              s = function (i) {
                r.unsubscribe(e), t(i);
              };
            }
            return (
              this.el.addEventListener(n[0], s),
              this.listeners.push({ splitEventName: n, opts: i, cb: s }),
              !0
            );
          }
          unsubscribe(e) {
            const t = e.split(".");
            return (
              (this.listeners = this.listeners.reduce(
                (e, i) =>
                  [...i.splitEventName].sort().toString() ===
                  t.sort().toString()
                    ? (this.el.removeEventListener(i.splitEventName[0], i.cb),
                      e)
                    : (e.push(i), e),
                []
              )),
              !0
            );
          }
          reset() {
            return (
              this.listeners.forEach((e) => {
                this.el.removeEventListener(e.splitEventName[0], e.cb);
              }),
              (this.listeners = []),
              !0
            );
          }
          get el() {
            return this._el;
          }
          set el(e) {
            this._el = e;
          }
          get listeners() {
            return this._listeners;
          }
          set listeners(e) {
            this._listeners = e;
          }
        }
        class a {
          constructor(e, t = {}, i = !1) {
            if (!s.A.isNode(e))
              throw new Error("There is no valid element given.");
            (this.el = e),
              (this.$emitter = new o(this.el)),
              (this._pluginName = this._getPluginName(i)),
              (this.options = this._mergeOptions(t)),
              (this._initialized = !1),
              this._registerInstance(),
              this._init();
          }
          init() {
            throw new Error(
              `The "init" method for the plugin "${this._pluginName}" is not defined.`
            );
          }
          update() {}
          _init() {
            this._initialized || (this.init(), (this._initialized = !0));
          }
          _update() {
            this._initialized && this.update();
          }
          _mergeOptions(e) {
            const t = l.A.toDashCase(this._pluginName),
              i = s.A.getDataAttribute(this.el, `data-${t}-config`, !1),
              r = s.A.getAttribute(this.el, `data-${t}-options`, !1),
              o = [this.constructor.options, this.options, e];
            i && o.push(window.PluginConfigManager.get(this._pluginName, i));
            try {
              r && o.push(JSON.parse(r));
            } catch (e) {
              throw (
                (console.error(this.el),
                new Error(
                  `The data attribute "data-${t}-options" could not be parsed to json: ${e.message}`
                ))
              );
            }
            return n().all(
              o
                .filter((e) => e instanceof Object && !(e instanceof Array))
                .map((e) => e || {})
            );
          }
          _registerInstance() {
            window.PluginManager.getPluginInstancesFromElement(this.el).set(
              this._pluginName,
              this
            ),
              window.PluginManager.getPlugin(this._pluginName, !1)
                .get("instances")
                .push(this);
          }
          _getPluginName(e) {
            return e || (e = this.constructor.name), e;
          }
        }
      },
      744: (e) => {
        var t = function (e) {
            return (
              (function (e) {
                return !!e && "object" == typeof e;
              })(e) &&
              !(function (e) {
                var t = Object.prototype.toString.call(e);
                return (
                  "[object RegExp]" === t ||
                  "[object Date]" === t ||
                  (function (e) {
                    return e.$$typeof === i;
                  })(e)
                );
              })(e)
            );
          },
          i =
            "function" == typeof Symbol && Symbol.for
              ? Symbol.for("react.element")
              : 60103;
        function r(e, t) {
          return !1 !== t.clone && t.isMergeableObject(e)
            ? o(((i = e), Array.isArray(i) ? [] : {}), e, t)
            : e;
          var i;
        }
        function n(e, t, i) {
          return e.concat(t).map(function (e) {
            return r(e, i);
          });
        }
        function s(e) {
          return Object.keys(e).concat(
            (function (e) {
              return Object.getOwnPropertySymbols
                ? Object.getOwnPropertySymbols(e).filter(function (t) {
                    return Object.propertyIsEnumerable.call(e, t);
                  })
                : [];
            })(e)
          );
        }
        function l(e, t) {
          try {
            return t in e;
          } catch (e) {
            return !1;
          }
        }
        function o(e, i, a) {
          ((a = a || {}).arrayMerge = a.arrayMerge || n),
            (a.isMergeableObject = a.isMergeableObject || t),
            (a.cloneUnlessOtherwiseSpecified = r);
          var c = Array.isArray(i);
          return c === Array.isArray(e)
            ? c
              ? a.arrayMerge(e, i, a)
              : (function (e, t, i) {
                  var n = {};
                  return (
                    i.isMergeableObject(e) &&
                      s(e).forEach(function (t) {
                        n[t] = r(e[t], i);
                      }),
                    s(t).forEach(function (s) {
                      (function (e, t) {
                        return (
                          l(e, t) &&
                          !(
                            Object.hasOwnProperty.call(e, t) &&
                            Object.propertyIsEnumerable.call(e, t)
                          )
                        );
                      })(e, s) ||
                        (l(e, s) && i.isMergeableObject(t[s])
                          ? (n[s] = (function (e, t) {
                              if (!t.customMerge) return o;
                              var i = t.customMerge(e);
                              return "function" == typeof i ? i : o;
                            })(s, i)(e[s], t[s], i))
                          : (n[s] = r(t[s], i)));
                    }),
                    n
                  );
                })(e, i, a)
            : r(i, a);
        }
        o.all = function (e, t) {
          if (!Array.isArray(e))
            throw new Error("first argument should be an array");
          return e.reduce(function (e, i) {
            return o(e, i, t);
          }, {});
        };
        var a = o;
        e.exports = a;
      },
      747: (e, t, i) => {
        i.d(t, { A: () => r });
        class r {
          static ucFirst(e) {
            return e.charAt(0).toUpperCase() + e.slice(1);
          }
          static lcFirst(e) {
            return e.charAt(0).toLowerCase() + e.slice(1);
          }
          static toDashCase(e) {
            return e
              .replace(/([A-Z])/g, "-$1")
              .replace(/^-/, "")
              .toLowerCase();
          }
          static toLowerCamelCase(e, t) {
            const i = r.toUpperCamelCase(e, t);
            return r.lcFirst(i);
          }
          static toUpperCamelCase(e, t) {
            return t
              ? e
                  .split(t)
                  .map((e) => r.ucFirst(e.toLowerCase()))
                  .join("")
              : r.ucFirst(e.toLowerCase());
          }
          static parsePrimitive(e) {
            try {
              return (
                /^\d+(.|,)\d+$/.test(e) && (e = e.replace(",", ".")),
                JSON.parse(e)
              );
            } catch (t) {
              return e.toString();
            }
          }
        }
      },
    },
    r = {};
  function n(e) {
    var t = r[e];
    if (void 0 !== t) return t.exports;
    var s = (r[e] = { exports: {} });
    return i[e](s, s.exports, n), s.exports;
  }
  (n.m = i),
    (n.n = (e) => {
      var t = e && e.__esModule ? () => e.default : () => e;
      return n.d(t, { a: t }), t;
    }),
    (n.d = (e, t) => {
      for (var i in t)
        n.o(t, i) &&
          !n.o(e, i) &&
          Object.defineProperty(e, i, { enumerable: !0, get: t[i] });
    }),
    (n.f = {}),
    (n.e = (e) =>
      Promise.all(Object.keys(n.f).reduce((t, i) => (n.f[i](e, t), t), []))),
    (n.u = (e) => e + ".makaira-shopware6-storefront.js"),
    (n.g = (function () {
      if ("object" == typeof globalThis) return globalThis;
      try {
        return this || new Function("return this")();
      } catch (e) {
        if ("object" == typeof window) return window;
      }
    })()),
    (n.o = (e, t) => Object.prototype.hasOwnProperty.call(e, t)),
    (e = {}),
    (t = "makaira-shopware6-storefront:"),
    (n.l = (i, r, s, l) => {
      if (e[i]) e[i].push(r);
      else {
        var o, a;
        if (void 0 !== s)
          for (
            var c = document.getElementsByTagName("script"), u = 0;
            u < c.length;
            u++
          ) {
            var d = c[u];
            if (
              d.getAttribute("src") == i ||
              d.getAttribute("data-webpack") == t + s
            ) {
              o = d;
              break;
            }
          }
        o ||
          ((a = !0),
          ((o = document.createElement("script")).charset = "utf-8"),
          (o.timeout = 120),
          n.nc && o.setAttribute("nonce", n.nc),
          o.setAttribute("data-webpack", t + s),
          (o.src = i)),
          (e[i] = [r]);
        var m = (t, r) => {
            (o.onerror = o.onload = null), clearTimeout(f);
            var n = e[i];
            if (
              (delete e[i],
              o.parentNode && o.parentNode.removeChild(o),
              n && n.forEach((e) => e(r)),
              t)
            )
              return t(r);
          },
          f = setTimeout(
            m.bind(null, void 0, { type: "timeout", target: o }),
            12e4
          );
        (o.onerror = m.bind(null, o.onerror)),
          (o.onload = m.bind(null, o.onload)),
          a && document.head.appendChild(o);
      }
    }),
    (n.r = (e) => {
      "undefined" != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
        Object.defineProperty(e, "__esModule", { value: !0 });
    }),
    (() => {
      var e;
      n.g.importScripts && (e = n.g.location + "");
      var t = n.g.document;
      if (
        !e &&
        t &&
        (t.currentScript &&
          "SCRIPT" === t.currentScript.tagName.toUpperCase() &&
          (e = t.currentScript.src),
        !e)
      ) {
        var i = t.getElementsByTagName("script");
        if (i.length)
          for (var r = i.length - 1; r > -1 && (!e || !/^http(s?):/.test(e)); )
            e = i[r--].src;
      }
      if (!e)
        throw new Error(
          "Automatic publicPath is not supported in this browser"
        );
      (e = e
        .replace(/^blob:/, "")
        .replace(/#.*$/, "")
        .replace(/\?.*$/, "")
        .replace(/\/[^\/]+$/, "/")),
        (n.p = e);
    })(),
    (() => {
      var e = { 792: 0 };
      n.f.j = (t, i) => {
        var r = n.o(e, t) ? e[t] : void 0;
        if (0 !== r)
          if (r) i.push(r[2]);
          else {
            var s = new Promise((i, n) => (r = e[t] = [i, n]));
            i.push((r[2] = s));
            var l = n.p + n.u(t),
              o = new Error();
            n.l(
              l,
              (i) => {
                if (n.o(e, t) && (0 !== (r = e[t]) && (e[t] = void 0), r)) {
                  var s = i && ("load" === i.type ? "missing" : i.type),
                    l = i && i.target && i.target.src;
                  (o.message =
                    "Loading chunk " + t + " failed.\n(" + s + ": " + l + ")"),
                    (o.name = "ChunkLoadError"),
                    (o.type = s),
                    (o.request = l),
                    r[1](o);
                }
              },
              "chunk-" + t,
              t
            );
          }
      };
      var t = (t, i) => {
          var r,
            s,
            [l, o, a] = i,
            c = 0;
          if (l.some((t) => 0 !== e[t])) {
            for (r in o) n.o(o, r) && (n.m[r] = o[r]);
            a && a(n);
          }
          for (t && t(i); c < l.length; c++)
            (s = l[c]), n.o(e, s) && e[s] && e[s][0](), (e[s] = 0);
        },
        i = (self.webpackChunkmakaira_shopware6_storefront =
          self.webpackChunkmakaira_shopware6_storefront || []);
      i.forEach(t.bind(null, 0)), (i.push = t.bind(null, i.push.bind(i)));
    })();
  var s = n(194);
  class l extends s.A {
    static sidebarFilterSelector = ".cms-element-sidebar-filter";
    static options = { hideItemsWhenOffcanvasHidden: !1, enabled: !1 };
    constructor(e, t, i) {
      super(e, t, i), (this._isUpdating = !1), this._mergeConfigFromElement(e);
    }
    _mergeConfigFromElement(e) {
      const t = e.getAttribute("data-listing-listener-options");
      if (t)
        try {
          const e = JSON.parse(t);
          void 0 !== e.enabled && (this.options.enabled = e.enabled),
            void 0 !== e.hideItemsWhenOffcanvasHidden &&
              (this.options.hideItemsWhenOffcanvasHidden =
                e.hideItemsWhenOffcanvasHidden);
        } catch (e) {
          console.warn(
            "ListingListener: Failed to parse configuration from data attribute",
            e
          );
        }
    }
    init() {
      this._registerEvents(),
        this.options.hideItemsWhenOffcanvasHidden &&
          this._setupOffcanvasMonitoring(),
        this._connectToListingPlugin();
    }
    _connectToListingPlugin() {
      const e = document.querySelector("[data-listing]");
      if (e) {
        const t = window.PluginManager.getPluginInstanceFromElement(
          e,
          "Listing"
        );
        t && (this.listing = t);
      }
    }
    _isEnabled() {
      return !1 !== this.options.enabled && !1 !== this.options.enabled;
    }
    _registerEvents() {
      this.$emitter.subscribe("Listing/afterRenderResponse", (e) => {
        this._swapContent(e.detail.response);
      });
    }
    _findFilterPanelContainers(e = document) {
      return Array.from(e.querySelectorAll(".filter-panel-items-container"));
    }
    _extractAndMergeFilters(e) {
      try {
        const t = this._getAvailableFiltersFromDocument(e);
        if (0 === t.length) return;
        this._storeCurrentFiltersToLocalStorage(t);
        const i = this._getStoredFilters(),
          r = [...new Set([...i, ...t])];
        this._storeFiltersToLocalStorage(r);
      } catch (e) {
        console.error(
          "ListingListener: Failed to extract and merge filters:",
          e
        );
      }
    }
    _getAvailableFiltersFromDocument(e) {
      const t = e.querySelectorAll(
          ".filter-panel-item[data-filter-multi-select-options]"
        ),
        i = [];
      return (
        t.forEach((e) => {
          try {
            const t = e.getAttribute("data-filter-multi-select-options");
            if (t) {
              const e = JSON.parse(t);
              e.name && i.push(e.name);
            }
          } catch (t) {
            console.warn(
              "ListingListener: Failed to parse filter options for item:",
              e,
              t
            );
          }
        }),
        i
      );
    }
    _getStoredFilters() {
      try {
        const e = localStorage.getItem("macatfiall");
        return e ? JSON.parse(e) : [];
      } catch (e) {
        return (
          console.error(
            "ListingListener: Failed to retrieve filters from localStorage:",
            e
          ),
          []
        );
      }
    }
    _storeFiltersToLocalStorage(e) {
      try {
        const t = JSON.stringify(e);
        localStorage.setItem("macatfiall", t);
      } catch (e) {
        console.error(
          "ListingListener: Failed to store filters to localStorage:",
          e
        );
      }
    }
    _storeCurrentFiltersToLocalStorage(e) {
      try {
        const t = JSON.stringify(e);
        localStorage.setItem("macurrfi", t);
      } catch (e) {
        console.error(
          "ListingListener: Failed to store current filters to localStorage:",
          e
        );
      }
    }
    _setupOffcanvasMonitoring() {
      document.addEventListener("shown.bs.offcanvas", () => {
        this._onOffcanvasVisibilityChange(!0);
      }),
        document.addEventListener("hidden.bs.offcanvas", () => {
          this._onOffcanvasVisibilityChange(!1);
        }),
        document.$emitter &&
          document.$emitter.subscribe("onCloseOffcanvas", () => {
            this._onOffcanvasVisibilityChange(!1);
          }),
        document.addEventListener("keydown", (e) => {
          "Escape" === e.key &&
            this._isOffcanvasVisible() &&
            setTimeout(() => this._onOffcanvasVisibilityChange(!1), 100);
        });
    }
    _onOffcanvasVisibilityChange(e) {
      !e && this.options.hideItemsWhenOffcanvasHidden
        ? this._hideAllFilterItems()
        : this._showAllActiveFilters();
    }
    _isOffcanvasVisible() {
      const e = document.querySelectorAll(".offcanvas");
      return Array.from(e).some(
        (e) =>
          e.classList.contains("show") || "none" !== getComputedStyle(e).display
      );
    }
    _hideAllFilterItems() {
      const e = this._getAvailableFiltersFromLocalStorage();
      e &&
        0 !== e.length &&
        document
          .querySelectorAll(".filter-panel-items-container")
          .forEach((t) => {
            t.querySelectorAll(".filter-panel-item").forEach((t) => {
              const i = this._getFilterNameFromItem(t);
              i && e.includes(i) && this._hideFilterItem(t);
            });
          });
    }
    _showAllActiveFilters() {
      const e = this._getCurrentFiltersFromLocalStorage();
      e && 0 !== e.length
        ? document
            .querySelectorAll(".filter-panel-items-container")
            .forEach((t) => {
              t.querySelectorAll(
                ".filter-panel-item, .filter-multi-select-list-item"
              ).forEach((t) => {
                const i = this._getFilterNameFromItem(t);
                i &&
                  (e.includes(i)
                    ? this._showFilterItem(t)
                    : this._hideFilterItem(t));
              });
            })
        : this._showAllAvailableFilters();
    }
    _showAllAvailableFilters() {
      const e = this._getAvailableFiltersFromLocalStorage();
      e &&
        0 !== e.length &&
        document
          .querySelectorAll(".filter-panel-items-container")
          .forEach((t) => {
            t.querySelectorAll(
              ".filter-panel-item, .filter-multi-select-list-item"
            ).forEach((t) => {
              const i = this._getFilterNameFromItem(t);
              i && e.includes(i) && this._showFilterItem(t);
            });
          });
    }
    _getAvailableFiltersFromLocalStorage() {
      try {
        const e = localStorage.getItem("macatfiall");
        return e ? JSON.parse(e) : [];
      } catch (e) {
        return (
          console.error(
            "ListingListener: Failed to retrieve filters from localStorage:",
            e
          ),
          []
        );
      }
    }
    _getCurrentFiltersFromLocalStorage() {
      try {
        const e = localStorage.getItem("macurrfi");
        return e ? JSON.parse(e) : [];
      } catch (e) {
        return (
          console.error(
            "ListingListener: Failed to retrieve current filters from localStorage:",
            e
          ),
          []
        );
      }
    }
    _getFilterNameFromItem(e) {
      try {
        const t = e.getAttribute("data-filter-multi-select-options");
        if (t) return JSON.parse(t).name;
        const i = e.closest("[data-filter-multi-select-options]");
        if (i) {
          const e = i.getAttribute("data-filter-multi-select-options");
          if (e) return JSON.parse(e).name;
        }
        return null;
      } catch (t) {
        return (
          console.warn(
            "ListingListener: Failed to extract filter name from item:",
            e,
            t
          ),
          null
        );
      }
    }
    _findFilterPanelContainer(e = document) {
      const t = this._findFilterPanelContainers(e);
      return t.length > 0 ? t[0] : null;
    }
    _getContainerIdentifier(e) {
      if (e.id) return `id-${e.id}`;
      if (e.dataset.filterType) return `filter-type-${e.dataset.filterType}`;
      if (e.className) {
        const t = e.className
          .split(" ")
          .filter(
            (e) =>
              e.includes("filter") ||
              e.includes("sidebar") ||
              e.includes("offcanvas")
          )
          .sort()
          .join("-");
        if (t) return `classes-${t}`;
      }
      const t = e.closest("[id], [data-filter-type]");
      if (t) {
        const e = t.id || t.dataset.filterType;
        if (e) return `parent-${e}`;
      }
      return null;
    }
    _swapContent(e) {
      if (!this._isUpdating) {
        this._isUpdating = !0;
        try {
          if (
            this.options.hideItemsWhenOffcanvasHidden &&
            !this._isOffcanvasVisible()
          )
            return void this._hideAllFilterItems();
          const t = new DOMParser().parseFromString(e, "text/html"),
            i = this._findFilterPanelContainers(),
            r = this._findFilterPanelContainers(t);
          this._extractAndMergeFilters(t);
          const n = new Map();
          r.forEach((e, t) => {
            const i = this._getContainerIdentifier(e) || `panel-${t}`;
            n.set(i, e);
          }),
            i.forEach((e, t) => {
              const i = this._getContainerIdentifier(e) || `panel-${t}`,
                s = n.get(i);
              if (s) this._updateFilterPanelSelectively(e, s);
              else {
                const i = r[t];
                i && this._updateFilterPanelSelectively(e, i);
              }
            });
        } finally {
          setTimeout(() => {
            this._isUpdating = !1;
          }, 50);
        }
      }
    }
    _updateFilterPanelWithInnerHTML(e, t) {
      const i = this._getInputStates(e);
      (e.innerHTML = t.innerHTML),
        this._restoreInputStates(e, i),
        this._buildLabels();
    }
    _updateFilterPanelSelectively(e, t) {
      const i = this._getInputStates(e);
      if (this.options.enabled) {
        const i = this._createExistingSectionMap(e);
        this._replaceFilterStructureCompletely(e, t, i);
      }
      this._reregisterExistingFilters(e), this._restoreInputStates(e, i, !1);
    }
    _synchronizeFilterStructure(e, t) {
      const i = e.querySelectorAll("[data-filter-multi-select-options]"),
        r = t.querySelectorAll("[data-filter-multi-select-options]"),
        n = this._createFilterElementsMap(i),
        s = this._createFilterElementsMap(r);
      Object.keys(s).forEach((e) => {
        const t = n[e],
          i = s[e];
        t && i && this._synchronizeFilterDropdownStructure(t, i);
      });
    }
    _synchronizeFilterDropdownStructure(e, t) {
      const i = e.querySelector(".filter-panel-item-dropdown"),
        r = t.querySelector(".filter-panel-item-dropdown");
      if (!i || !r) return;
      const n = this._getDropdownStructureMap(i),
        s = this._getDropdownStructureMap(r);
      this._addMissingStructuralElements(i, s, n);
    }
    _createFilterElementsMap(e) {
      const t = {};
      return (
        e.forEach((e) => {
          const i = e.getAttribute("data-filter-multi-select-options");
          if (i)
            try {
              const r = JSON.parse(i);
              r.name && (t[r.name] = e);
            } catch (e) {
              console.warn(
                "ListingListener: Failed to parse filter options",
                e
              );
            }
        }),
        t
      );
    }
    _getDropdownStructureMap(e) {
      const t = [];
      return (
        Array.from(e.children).forEach((e, i) => {
          const r = {
            index: i,
            element: e,
            tagName: e.tagName.toLowerCase(),
            classes: Array.from(e.classList),
            textContent: this._getElementTextSignature(e),
            isList:
              "ul" === e.tagName.toLowerCase() &&
              e.classList.contains("filter-multi-select-list"),
            isStructural: !e.classList.contains(
              "filter-multi-select-list-item"
            ),
          };
          t.push(r);
        }),
        t
      );
    }
    _getElementTextSignature(e) {
      if ("ul" === e.tagName.toLowerCase()) return "";
      let t = "";
      return (
        e.childNodes.forEach((e) => {
          e.nodeType === Node.TEXT_NODE && (t += e.textContent.trim());
        }),
        t.trim()
      );
    }
    _addMissingStructuralElements(e, t, i) {
      const r = new Map();
      i.forEach((e) => {
        const t = this._createElementSignature(e);
        r.set(t, e);
      }),
        t.forEach((i, n) => {
          const s = this._createElementSignature(i);
          if (!r.has(s) && i.isStructural) {
            const s = i.element.cloneNode(!0),
              l = this._findInsertionPoint(e, t, n, r);
            l ? e.insertBefore(s, l) : e.appendChild(s);
          }
        });
    }
    _createElementSignature(e) {
      if (e.isList) return `list-${e.classes.join("-")}`;
      const t = e.classes.join("-"),
        i = e.textContent.replace(/\s+/g, " ").trim();
      return `${e.tagName}-${t}-${i}`;
    }
    _findInsertionPoint(e, t, i, r) {
      for (let e = i + 1; e < t.length; e++) {
        const i = t[e],
          n = this._createElementSignature(i);
        if (r.has(n)) return r.get(n).element;
      }
      return null;
    }
    _updateFilterMultiSelectElements(e, t) {
      const i = e.querySelectorAll("[data-filter-multi-select]"),
        r = t.querySelectorAll("[data-filter-multi-select]"),
        n = this._createFilterMultiSelectMap(i),
        s = this._createFilterMultiSelectMap(r);
      Object.keys(n).forEach((e) => {
        s[e] || this._hideFilterItem(n[e]);
      }),
        Object.keys(s).forEach((t) => {
          if (n[t]) this._showFilterItem(n[t]);
          else {
            const i = s[t].cloneNode(!0);
            e.appendChild(i), i.setAttribute("data-needs-init", "true");
          }
        });
    }
    _updateFilterListItemElements(e, t) {
      const i = e.querySelectorAll(".filter-multi-select-list-item"),
        r = t.querySelectorAll(".filter-multi-select-list-item"),
        n = this._createFilterListItemMap(i),
        s = this._createFilterListItemMap(r);
      Object.keys(n).forEach((e) => {
        s[e] || this._hideFilterItem(n[e]);
      }),
        Object.keys(s).forEach((t) => {
          n[t]
            ? (this._showFilterItem(n[t]),
              this._updateFilterListItemContent(n[t], s[t]))
            : this._addNewFilterListItem(e, s[t]);
        });
    }
    _createFilterMultiSelectMap(e) {
      const t = {};
      return (
        e.forEach((e) => {
          const i = e.getAttribute("data-filter-multi-select-options");
          if (i)
            try {
              const r = JSON.parse(i);
              if (r.name) {
                const i = `filter-multi-select-${r.name}`;
                t[i] = e;
              }
            } catch (e) {
              console.warn(
                "ListingListener: Failed to parse filter options",
                e
              );
            }
        }),
        t
      );
    }
    _createFilterListItemMap(e) {
      const t = {};
      return (
        e.forEach((e) => {
          const i = e.querySelector("input[data-label]"),
            r = i ? i.getAttribute("data-label") : null;
          if (r) {
            const i = e.closest("[data-filter-multi-select]");
            let n = "unknown";
            if (i) {
              const e = i.getAttribute("data-filter-multi-select-options");
              if (e)
                try {
                  n = JSON.parse(e).name || "unknown";
                } catch (e) {
                  console.warn(
                    "ListingListener: Failed to parse parent filter options",
                    e
                  );
                }
            }
            t[`${n}-${r}`] = e;
          }
        }),
        t
      );
    }
    _updateFilterDropdownContent(e, t) {
      const i = e.querySelector(".filter-panel-item-dropdown"),
        r = t.querySelector(".filter-panel-item-dropdown");
      if (i && r) {
        const e = this._getInputStates(i);
        this._mergeDropdownContent(i, r), this._restoreInputStates(i, e, !1);
      }
    }
    _updateFilterListItemContent(e, t) {
      const i = e.querySelector("label"),
        r = t.querySelector("label");
      i &&
        r &&
        i.textContent !== r.textContent &&
        (i.textContent = r.textContent);
      const n = e.querySelector("input"),
        s = t.querySelector("input");
      n &&
        s &&
        ["value", "name", "data-count"].forEach((e) => {
          n.getAttribute(e) !== s.getAttribute(e) &&
            n.setAttribute(e, s.getAttribute(e) || "");
        });
    }
    _findFilterElementByName(e, t) {
      const i = e.querySelectorAll("[data-filter-multi-select-options]");
      for (const e of i)
        try {
          const i = e.getAttribute("data-filter-multi-select-options");
          if (i && JSON.parse(i).name === t) return e;
        } catch (e) {
          continue;
        }
      return null;
    }
    _findTargetListForNewItem(e, t, i) {
      const r = t.closest(".filter-panel-item-dropdown"),
        n = r ? this._findTargetContainer(r, e) : e,
        s = t.closest("ul.filter-multi-select-list");
      if (s) {
        let e = null,
          t = null,
          i = s.previousElementSibling;
        for (; i && !e; ) {
          if (
            i.tagName &&
            !i.classList.contains("filter-multi-select-list-item") &&
            i.textContent.trim()
          ) {
            (e = i), (t = i.textContent.trim());
            break;
          }
          i = i.previousElementSibling;
        }
        if (e && t) {
          const i = this._findSectionByText(n, t, e.tagName);
          if (i) return i;
        }
      }
      const l = n.querySelectorAll("ul.filter-multi-select-list");
      if (1 === l.length) return l[0];
      if (l.length > 1) {
        const e = i
          .querySelector("input[data-label]")
          ?.getAttribute("data-label");
        if (e)
          for (const t of l) {
            const i = t.querySelectorAll("input[data-label]");
            for (const r of i) {
              const i = r.getAttribute("data-label");
              if (this._labelsSeemRelated(e, i)) return t;
            }
          }
        return l[0];
      }
      return null;
    }
    _findSectionByText(e, t, i) {
      const r = e.querySelectorAll(i.toLowerCase());
      for (const e of r)
        if (e.textContent.trim() === t) {
          let t = e.nextElementSibling;
          for (; t; ) {
            if (
              "ul" === t.tagName.toLowerCase() &&
              t.classList.contains("filter-multi-select-list")
            )
              return t;
            t = t.nextElementSibling;
          }
        }
      return null;
    }
    _labelsSeemRelated(e, t) {
      if (!e || !t) return !1;
      const i = /^\d+(-\d+)?$/;
      if (i.test(e) && i.test(t)) return !0;
      const r = /^\d*XL[K]?$/;
      if (r.test(e) && r.test(t)) return !0;
      const n = /^\d+\/\d+$/;
      return (
        !(!n.test(e) || !n.test(t)) ||
        !(!e.startsWith("W") || !t.startsWith("W"))
      );
    }
    _addNewFilterListItem(e, t) {
      const i = t
        .closest("[data-filter-multi-select]")
        ?.getAttribute("data-filter-multi-select-options");
      if (!i) return;
      let r;
      try {
        r = JSON.parse(i).name;
      } catch (e) {
        return void console.warn(
          "ListingListener: Failed to parse parent options",
          e
        );
      }
      if (!r) return;
      const n = this._findFilterElementByName(e, r);
      if (!n) return;
      const s = n.querySelector(".filter-panel-item-dropdown");
      if (!s) return;
      const l = t.cloneNode(!0),
        o = this._ensureSectionStructureExists(t, s),
        a = this._findTargetListForNewItem(s, t, l);
      a
        ? a.appendChild(l)
        : o && o.list
          ? o.list.appendChild(l)
          : s.appendChild(l),
        this._attachEventHandlersToNewItem(l, s);
    }
    _hideFilterItem(e) {
      (e.style.display = "none"), e.classList.add("filter-item-hidden");
    }
    _showFilterItem(e) {
      if (e.classList.contains("filter-item-hidden")) {
        e.classList.remove("filter-item-hidden");
        const t = this._getAppropriateDisplayStyle(e);
        e.style.display = t;
      }
    }
    _getAppropriateDisplayStyle(e) {
      return e.closest(".filter-panel-item.d-grid") ||
        e.closest(".filter-panel-item.dropdown")
        ? "block"
        : e.classList.contains("filter-multi-select-list-item")
          ? "inline-block"
          : "block";
    }
    _getFilterItemsMap(e) {
      const t = {};
      return (
        e.querySelectorAll(".filter-panel-item").forEach((e) => {
          const i = this._getFilterItemKey(e);
          i && (t[i] = e);
        }),
        t
      );
    }
    _getFilterItemKey(e) {
      const t = e.querySelector("input[name]"),
        i = e.querySelector(".filter-panel-item-toggle");
      return t
        ? `input-${t.name}`
        : i
          ? `toggle-${i.textContent.trim()}`
          : null;
    }
    _getInputStates(e) {
      const t = new Map();
      return (
        e.querySelectorAll("input").forEach((e) => {
          const i =
            "checkbox" === e.type || "radio" === e.type
              ? e.name + "_" + e.value
              : e.name;
          t.set(i, { checked: e.checked, value: e.value });
        }),
        t
      );
    }
    _restoreInputStates(e, t, i = !0) {
      e.querySelectorAll("input").forEach((e) => {
        const r =
          "checkbox" === e.type || "radio" === e.type
            ? e.name + "_" + e.value
            : e.name;
        if (t.has(r)) {
          const n = t.get(r);
          "checkbox" === e.type || "radio" === e.type
            ? (e.checked = n.checked)
            : (e.value = n.value),
            i &&
              e.dispatchEvent(
                new Event(
                  "checkbox" === e.type || "radio" === e.type
                    ? "change"
                    : "input",
                  { bubbles: !0 }
                )
              );
        }
      });
    }
    _updateFilterItemContent(e, t) {
      const i = e.querySelectorAll(".filter-multi-select-list-item"),
        r = t.querySelectorAll(".filter-multi-select-list-item");
      if (i.length !== r.length) {
        const i = e.querySelector(".filter-panel-item-dropdown"),
          r = t.querySelector(".filter-panel-item-dropdown");
        if (i && r) {
          const e = this._getInputStates(i);
          this._mergeDropdownContent(i, r), this._restoreInputStates(i, e, !1);
        }
      }
    }
    _mergeDropdownContent(e, t) {
      const i = this._getDropdownItemsMap(e),
        r = (this._getDropdownItemsMap(t), document.createElement("div"));
      for (
        t.querySelectorAll(".filter-multi-select-list-item").forEach((t, n) => {
          const s = this._getDropdownItemKey(t);
          if (i[s]) {
            const e = i[s],
              n = e.querySelector("label"),
              l = t.querySelector("label");
            n &&
              l &&
              n.textContent !== l.textContent &&
              (n.textContent = l.textContent);
            const o = e.querySelector("input"),
              a = t.querySelector("input");
            o &&
              a &&
              ["value", "name", "data-count"].forEach((e) => {
                o.getAttribute(e) !== a.getAttribute(e) &&
                  o.setAttribute(e, a.getAttribute(e) || "");
              }),
              r.appendChild(e);
          } else {
            const i = t.cloneNode(!0);
            r.appendChild(i), this._attachEventHandlersToNewItem(i, e);
          }
        }),
          e.innerHTML = "";
        r.firstChild;

      )
        e.appendChild(r.firstChild);
    }
    _getDropdownItemsMap(e) {
      const t = {};
      return (
        e.querySelectorAll(".filter-multi-select-list-item").forEach((e) => {
          const i = this._getDropdownItemKey(e);
          i && (t[i] = e);
        }),
        t
      );
    }
    _getDropdownItemKey(e) {
      const t = e.querySelector("input");
      if (t) {
        const e = t.getAttribute("data-label") || t.value;
        if (e && t.name) return `${t.name}-${e}`;
      }
      const i = e.querySelector("label");
      return i ? `label-${i.textContent.trim()}` : null;
    }
    _attachEventHandlersToNewItem(e, t) {
      e.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(
        (e, t) => {
          e.addEventListener("change", (e) => {
            this._onChangeFilter(e);
          });
        }
      );
    }
    _onChangeFilter(e) {
      if (this.listing && "function" == typeof this.listing.changeListing)
        this.listing.changeListing(!0, { p: 1 });
      else {
        const e = document.querySelector("[data-listing]");
        if (e) {
          const t = window.PluginManager.getPluginInstanceFromElement(
            e,
            "Listing"
          );
          t && "function" == typeof t.changeListing
            ? t.changeListing(!0, { p: 1 })
            : console.warn(
                "ListingListener: Could not find listing plugin or changeListing method"
              );
        } else console.warn("ListingListener: Could not find listing element");
      }
    }
    _reinitializePluginsSelectively(e) {
      e.querySelectorAll('[data-needs-init="true"]').forEach((e) => {
        try {
          e.dataset.pluginName &&
            "string" == typeof e.dataset.pluginName &&
            window.PluginManager.initializePlugin(e, e.dataset.pluginName),
            e.querySelectorAll("[data-plugin-name]").forEach((e) => {
              e.dataset.pluginName &&
                "string" == typeof e.dataset.pluginName &&
                window.PluginManager.initializePlugin(e, e.dataset.pluginName);
            });
        } catch (t) {
          console.warn(
            "ListingListener: Failed to reinitialize plugin for element:",
            e,
            t
          );
        }
        e.removeAttribute("data-needs-init");
      });
    }
    _buildLabels() {}
    _reregisterExistingFilters(e) {
      const t = document.querySelector("[data-listing]");
      if (!t) return;
      const i = window.PluginManager.getPluginInstanceFromElement(t, "Listing");
      i &&
        i.registerFilter &&
        e
          .querySelectorAll(
            "[data-filter-multi-select], [data-filter-range-slider], [data-filter-boolean]"
          )
          .forEach((e) => {
            const t = e.hasAttribute("data-needs-reinit"),
              r = ["FilterMultiSelect", "FilterRangeSlider", "FilterBoolean"];
            for (const n of r)
              try {
                const r = window.PluginManager.getPluginInstanceFromElement(
                  e,
                  n
                );
                if (r) {
                  "function" == typeof i.registerFilter && i.registerFilter(r),
                    t && e.removeAttribute("data-needs-reinit");
                  break;
                }
              } catch (e) {
                console.warn(
                  `ListingListener: Error processing ${n} plugin:`,
                  e
                );
              }
          });
    }
    _createMissingSectionStructure(e, t) {
      const i = e.closest("ul.filter-multi-select-list");
      if (!i) return { list: null };
      const r = e.closest(".filter-panel-item-dropdown");
      if (!r) return { list: null };
      const n = this._ensureWrapperStructureExists(r, t),
        s = [];
      let l = i.previousElementSibling;
      for (; l; ) {
        if (
          l.tagName &&
          !l.classList.contains("filter-multi-select-list-item")
        ) {
          const e = this._createElementSignatureFromElement(l);
          if (this._elementExistsInContainer(n, e)) break;
          s.unshift(l);
        }
        l = l.previousElementSibling;
      }
      const o = this._findSectionInsertionPoint(n, r, i);
      let a = null;
      s.forEach((e) => {
        const t = e.cloneNode(!0);
        o ? n.insertBefore(t, o) : n.appendChild(t), (a = t);
      });
      const c = i.cloneNode(!1);
      return (
        (c.innerHTML = ""),
        a
          ? a.parentNode.insertBefore(c, a.nextSibling)
          : o
            ? n.insertBefore(c, o)
            : n.appendChild(c),
        { list: c }
      );
    }
    _createElementSignatureFromElement(e) {
      const t = {
        tagName: e.tagName.toLowerCase(),
        classes: Array.from(e.classList),
        textContent: this._getElementTextSignature(e),
        isList:
          "ul" === e.tagName.toLowerCase() &&
          e.classList.contains("filter-multi-select-list"),
        isStructural: !e.classList.contains("filter-multi-select-list-item"),
      };
      return this._createElementSignature(t);
    }
    _findSectionInsertionPoint(e, t, i) {
      let r = i.nextElementSibling;
      for (; r; ) {
        if (
          r.tagName &&
          !r.classList.contains("filter-multi-select-list-item")
        ) {
          const t = this._createElementSignatureFromElement(r),
            i = Array.from(e.children);
          for (const e of i)
            if (this._createElementSignatureFromElement(e) === t) return e;
        }
        r = r.nextElementSibling;
      }
      return null;
    }
    _ensureSectionStructureExists(e, t) {
      return this._sectionExistsForItem(e, t)
        ? null
        : this._createMissingSectionStructure(e, t);
    }
    _sectionExistsForItem(e, t) {
      const i = e.closest("ul.filter-multi-select-list");
      if (!i) return !0;
      const r = e.closest(".filter-panel-item-dropdown");
      if (!r) return !0;
      const n = this._findTargetContainer(r, t);
      let s = null,
        l = null,
        o = i.previousElementSibling;
      for (; o && !s; ) {
        if (
          o.tagName &&
          !o.classList.contains("filter-multi-select-list-item") &&
          o.textContent.trim()
        ) {
          (s = o), (l = o.textContent.trim());
          break;
        }
        o = o.previousElementSibling;
      }
      if (!s || !l) return !0;
      const a = this._createElementSignatureFromElement(s);
      return this._elementExistsInContainer(n, a);
    }
    _findTargetContainer(e, t) {
      const i = this._getStructuralPath(e);
      let r = t;
      return (
        i.forEach((e) => {
          const t = this._findWrapperInContainer(r, e);
          t && (r = t);
        }),
        r
      );
    }
    _ensureWrapperStructureExists(e, t) {
      const i = this._getStructuralPath(e);
      let r = t;
      return (
        i.forEach((e) => {
          const t = this._findWrapperInContainer(r, e);
          if (t) r = t;
          else {
            const t = this._createWrapperElement(e);
            r.appendChild(t), (r = t);
          }
        }),
        r
      );
    }
    _getStructuralPath(e) {
      const t = [];
      return (
        Array.from(e.children).forEach((e) => {
          if (this._isWrapperElement(e)) {
            const i = {
              tagName: e.tagName.toLowerCase(),
              classes: Array.from(e.classList),
              signature: this._createElementSignatureFromElement(e),
            };
            t.push(i);
          }
        }),
        t
      );
    }
    _isWrapperElement(e) {
      if (
        e.classList.contains("filter-multi-select-list-item") ||
        ("ul" === e.tagName.toLowerCase() &&
          e.classList.contains("filter-multi-select-list"))
      )
        return !1;
      const t = e.querySelectorAll("ul.filter-multi-select-list"),
        i = e.querySelectorAll(
          ":scope > *:not(.filter-multi-select-list-item)"
        );
      return t.length > 0 || i.length > 1;
    }
    _findWrapperInContainer(e, t) {
      return Array.from(e.children).find(
        (e) => this._createElementSignatureFromElement(e) === t.signature
      );
    }
    _createWrapperElement(e) {
      const t = document.createElement(e.tagName);
      return (
        e.classes.forEach((e) => {
          t.classList.add(e);
        }),
        t
      );
    }
    _elementExistsInContainer(e, t) {
      return Array.from(e.children).some(
        (e) => this._createElementSignatureFromElement(e) === t
      );
    }
    _createExistingSectionMap(e) {
      const t = new Map();
      return (
        e
          .querySelectorAll("[data-filter-multi-select-options]")
          .forEach((e) => {
            const i = e.querySelector(".filter-panel-item-dropdown");
            i &&
              this._findTargetContainerInExisting(i)
                .querySelectorAll("*")
                .forEach((e) => {
                  if (
                    e.textContent.trim() &&
                    !e.classList.contains("filter-multi-select-list-item") &&
                    "ul" !== e.tagName.toLowerCase()
                  ) {
                    const i = e.textContent.trim();
                    let r = e.nextElementSibling;
                    for (; r; ) {
                      if (
                        "ul" === r.tagName.toLowerCase() &&
                        r.classList.contains("filter-multi-select-list")
                      ) {
                        const e = Array.from(
                          r.querySelectorAll(".filter-multi-select-list-item")
                        ).map((e) => e.cloneNode(!0));
                        e.length > 0 &&
                          (t.has(i) || t.set(i, []), t.get(i).push(...e));
                        break;
                      }
                      if (
                        r.textContent.trim() &&
                        !r.classList.contains(
                          "filter-multi-select-list-item"
                        ) &&
                        "ul" !== r.tagName.toLowerCase()
                      )
                        break;
                      r = r.nextElementSibling;
                    }
                  }
                });
          }),
        t
      );
    }
    _findTargetContainerInExisting(e) {
      const t = Array.from(e.children);
      for (const e of t) if (this._isWrapperElement(e)) return e;
      return e;
    }
    _restoreExistingSectionAssociations(e, t) {
      0 !== t.size &&
        e
          .querySelectorAll("[data-filter-multi-select-options]")
          .forEach((e) => {
            const i = e.querySelector(".filter-panel-item-dropdown");
            if (!i) return;
            const r = this._findTargetContainer(null, i) || i;
            t.forEach((e, t) => {
              const i = this._findSectionByTextInContainer(r, t);
              i &&
                (this._removeItemsFromIncorrectSections(r, e, t),
                e.forEach((e) => {
                  this._itemExistsInList(i, e) ||
                    i.appendChild(e.cloneNode(!0));
                }));
            });
          });
    }
    _findSectionByTextInContainer(e, t) {
      const i = e.querySelectorAll("*");
      for (const e of i)
        if (
          e.textContent.trim() === t &&
          !e.classList.contains("filter-multi-select-list-item") &&
          "ul" !== e.tagName.toLowerCase()
        ) {
          let t = e.nextElementSibling;
          for (; t; ) {
            if (
              "ul" === t.tagName.toLowerCase() &&
              t.classList.contains("filter-multi-select-list")
            )
              return t;
            t = t.nextElementSibling;
          }
        }
      return null;
    }
    _removeItemsFromIncorrectSections(e, t, i) {
      e.querySelectorAll("ul.filter-multi-select-list").forEach((e) => {
        this._getSectionTextForList(e) !== i &&
          Array.from(
            e.querySelectorAll(".filter-multi-select-list-item")
          ).forEach((e) => {
            const i = this._getItemLabel(e);
            t.some((e) => this._getItemLabel(e) === i) && e.remove();
          });
      });
    }
    _getSectionTextForList(e) {
      let t = e.previousElementSibling;
      for (; t; ) {
        if (
          t.textContent.trim() &&
          !t.classList.contains("filter-multi-select-list-item") &&
          "ul" !== t.tagName.toLowerCase()
        )
          return t.textContent.trim();
        t = t.previousElementSibling;
      }
      return null;
    }
    _itemExistsInList(e, t) {
      const i = this._getItemLabel(t),
        r = e.querySelectorAll(".filter-multi-select-list-item");
      return Array.from(r).some((e) => this._getItemLabel(e) === i);
    }
    _getItemLabel(e) {
      const t = e.querySelector("input[data-label]");
      return t ? t.getAttribute("data-label") : null;
    }
    _replaceFilterStructureCompletely(e, t, i) {
      const r = e.querySelectorAll("[data-filter-multi-select-options]"),
        n = t.querySelectorAll("[data-filter-multi-select-options]"),
        s = this._createFilterElementsMap(r),
        l = this._createFilterElementsMap(n);
      Object.keys(l).forEach((t) => {
        const r = s[t],
          n = l[t];
        r && n
          ? this._replaceFilterDropdownStructure(r, n, i)
          : n && !r && e.appendChild(n);
      }),
        Object.keys(s).forEach((e) => {
          if (l[e]) {
            const t = s[e];
            t.classList.contains("filter-panel-item-hidden") &&
              t.classList.remove("filter-panel-item-hidden");
          } else s[e].classList.add("filter-panel-item-hidden");
        });
    }
    _replaceFilterDropdownStructure(e, t, i) {
      const r = e.querySelector(".filter-panel-item-dropdown"),
        n = t.querySelector(".filter-panel-item-dropdown");
      if (!r || !n) return;
      const s = this._buildCompleteStructureFromNew(n, i);
      (r.innerHTML = ""),
        s.forEach((e) => {
          r.appendChild(e);
        }),
        this._attachEventHandlersToNewDropdown(r);
    }
    _attachEventHandlersToNewDropdown(e) {
      e.querySelectorAll(".filter-multi-select-list-item").forEach((t) => {
        this._attachEventHandlersToNewItem(t, e);
      });
    }
    _buildCompleteStructureFromNew(e, t) {
      const i = [];
      return (
        Array.from(e.children).forEach((e) => {
          if (this._isWrapperElement(e)) {
            const r = e.cloneNode(!1);
            this._buildWrapperContent(e, t).forEach((e) => {
              r.appendChild(e);
            }),
              i.push(r);
          } else {
            const r = this._processStructuralElement(e, t);
            r && i.push(r);
          }
        }),
        i
      );
    }
    _buildWrapperContent(e, t) {
      const i = [],
        r = Array.from(e.children);
      let n = null,
        s = null;
      return (
        r.forEach((e) => {
          if (
            "ul" === e.tagName.toLowerCase() &&
            e.classList.contains("filter-multi-select-list")
          )
            n
              ? ((s = this._createListForSection(e, n, t)), i.push(s))
              : ((s = this._createListWithExistingItems(e, t)), i.push(s));
          else if (
            e.textContent.trim() &&
            !e.classList.contains("filter-multi-select-list-item")
          ) {
            n = e.textContent.trim();
            const t = e.cloneNode(!0);
            i.push(t);
          } else {
            const t = e.cloneNode(!0);
            i.push(t);
          }
        }),
        i
      );
    }
    _createListForSection(e, t, i) {
      const r = e.cloneNode(!1),
        n = new Map();
      return (
        i.has(t) &&
          i.get(t).forEach((e) => {
            const t = this._getItemLabel(e);
            if (t) {
              const i = e.querySelector("input");
              n.set(t, { element: e, checked: !!i && i.checked });
            }
          }),
        Array.from(e.children).forEach((e) => {
          const t = this._getItemLabel(e),
            i = e.cloneNode(!0);
          if (t && n.has(t)) {
            const e = n.get(t),
              r = i.querySelector("input");
            r && e.checked && (r.checked = !0);
          }
          r.appendChild(i);
        }),
        r
      );
    }
    _createListWithExistingItems(e, t) {
      const i = e.cloneNode(!1),
        r = Array.from(e.children);
      let n = null;
      if (
        (t.forEach((e, t) => {
          const i = r.reduce((t, i) => {
            const r = this._getItemLabel(i);
            return e.some((e) => this._getItemLabel(e) === r) ? t + 1 : t;
          }, 0);
          i > 0 && (!n || i > n.count) && (n = { section: t, count: i });
        }),
        n)
      )
        return this._createListForSection(e, n.section, t);
      const s = new Map();
      return (
        t.forEach((e, t) => {
          e.forEach((e) => {
            const t = this._getItemLabel(e);
            if (t) {
              const i = e.querySelector("input");
              s.set(t, { element: e, checked: !!i && i.checked });
            }
          });
        }),
        r.forEach((e) => {
          const t = this._getItemLabel(e),
            r = e.cloneNode(!0);
          if (t && s.has(t)) {
            const e = s.get(t),
              i = r.querySelector("input");
            i && e.checked && (i.checked = !0);
          }
          i.appendChild(r);
        }),
        i
      );
    }
    _processStructuralElement(e, t) {
      return "ul" === e.tagName.toLowerCase() &&
        e.classList.contains("filter-multi-select-list")
        ? this._createListWithExistingItems(e, t)
        : e.cloneNode(!0);
    }
  }
  let o = !1;
  function a(e) {
    if (!window.PluginManager) return !1;
    try {
      return !!window.PluginManager.getPlugin(e);
    } catch (t) {
      if (window.PluginManager.plugins && window.PluginManager.plugins[e])
        return !0;
      const i = document.querySelectorAll(`[data-${e.toLowerCase()}]`);
      if (i.length > 0)
        for (const t of i)
          try {
            if (window.PluginManager.getPluginInstanceFromElement(t, e))
              return !0;
          } catch (e) {}
      return !1;
    }
  }
  let c = null,
    u = !1;
  const d = new Map(),
    m = { "makaira.listing.plugin": () => n.e(773).then(n.bind(n, 773)) },
    f = (e) => d.get(e);
  (window.MakairaModules = {
    get: f,
    has: (e) => d.has(e),
    list: () => Array.from(d.keys()),
    cache: d,
  }),
    document.addEventListener("DOMContentLoaded", () => {
      if (window.PluginManager && !o) {
        if (
          !c &&
          ((c = window.PluginManager.initializePlugins),
          (window.PluginManager.initializePlugins = () => {
            console.log("Preventing early plugin initialization...");
          }),
          window.PluginManager._fetchAsyncPlugins)
        ) {
          const e = window.PluginManager._fetchAsyncPlugins;
          window.PluginManager._fetchAsyncPlugins = async function (...t) {
            console.log(
              "Intercepting async plugin fetch, checking cache first..."
            );
            const i = t[0];
            if (i && "string" == typeof i) {
              const e = f(i);
              if (e)
                return (
                  console.log(
                    `✅ Found module "${i}" in cache, returning immediately`
                  ),
                  e
                );
            }
            return (
              console.log(
                "Module not in cache, falling back to original async fetch..."
              ),
              e.apply(this, t)
            );
          };
        }
        if (a("ListingListener")) return void (o = !0);
        try {
          window.PluginManager.register(
            "ListingListener",
            l,
            "[data-listing-listener]"
          ),
            (o = !0);
        } catch (e) {
          console.error("Failed to register ListingListener plugin:", e);
        }
        const e = async () => {
          console.log("Preloading all modules from import map...");
          const e = Object.entries(m).map(async ([e, t]) => {
              try {
                const i = await t();
                return (
                  d.set(e, i),
                  console.log(`✅ Module "${e}" preloaded successfully`),
                  { key: e, success: !0 }
                );
              } catch (t) {
                return (
                  console.error(`❌ Failed to preload module "${e}":`, t),
                  { key: e, success: !1, error: t }
                );
              }
            }),
            t = await Promise.allSettled(e),
            i = t.filter(
              (e) => "fulfilled" === e.status && e.value.success
            ).length,
            r = t.length - i;
          console.log(
            `📦 Module preloading complete: ${i} successful, ${r} failed`
          );
        };
        setTimeout(async () => {
          try {
            await e();
            const t = d.get("makaira.listing.plugin");
            if (!t)
              throw new Error(
                "MakairaListing module not found in cache after preloading"
              );
            const i = t.default;
            a("MakairaListing") ||
              window.PluginManager.register(
                "MakairaListing",
                i,
                "[data-listing]"
              );
          } catch (e) {
            console.error("Failed to register MakairaListing plugin:", e);
          }
          if (!u && c)
            try {
              (window.PluginManager.initializePlugins = c),
                window.PluginManager.initializePlugins(),
                (u = !0);
            } catch (e) {
              console.error("Failed to initialize plugins:", e);
            }
        }, 50);
      }
    });
})();
//# sourceMappingURL=makaira-shopware6-storefront.js.map
