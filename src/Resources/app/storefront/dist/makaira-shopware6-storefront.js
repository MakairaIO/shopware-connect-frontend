(() => {
  "use strict";
  var t,
    e,
    i = {
      139: (t, e, i) => {
        i.d(e, { A: () => n });
        var r = i(747);
        class n {
          static isNode(t) {
            return (
              "object" == typeof t &&
              null !== t &&
              (t === document || t === window || t instanceof Node)
            );
          }
          static hasAttribute(t, e) {
            if (!n.isNode(t))
              throw new Error("The element must be a valid HTML Node!");
            return "function" == typeof t.hasAttribute && t.hasAttribute(e);
          }
          static getAttribute(t, e, i = !0) {
            if (i && !1 === n.hasAttribute(t, e))
              throw new Error(`The required property "${e}" does not exist!`);
            if ("function" == typeof t.getAttribute) return t.getAttribute(e);
            if (i)
              throw new Error(
                "This node doesn't support the getAttribute function!"
              );
          }
          static getDataAttribute(t, e, i = !0) {
            const s = e.replace(/^data(|-)/, ""),
              l = r.A.toLowerCamelCase(s, "-");
            if (!n.isNode(t)) {
              if (i)
                throw new Error("The passed node is not a valid HTML Node!");
              return;
            }
            if (void 0 === t.dataset) {
              if (i)
                throw new Error(
                  "This node doesn't support the dataset attribute!"
                );
              return;
            }
            const o = t.dataset[l];
            if (void 0 === o) {
              if (i)
                throw new Error(
                  `The required data attribute "${e}" does not exist on ${t}!`
                );
              return o;
            }
            return r.A.parsePrimitive(o);
          }
          static querySelector(t, e, i = !0) {
            if (i && !n.isNode(t))
              throw new Error("The parent node is not a valid HTML Node!");
            const r = t.querySelector(e) || !1;
            if (i && !1 === r)
              throw new Error(
                `The required element "${e}" does not exist in parent node!`
              );
            return r;
          }
          static querySelectorAll(t, e, i = !0) {
            if (i && !n.isNode(t))
              throw new Error("The parent node is not a valid HTML Node!");
            let r = t.querySelectorAll(e);
            if ((0 === r.length && (r = !1), i && !1 === r))
              throw new Error(
                `At least one item of "${e}" must exist in parent node!`
              );
            return r;
          }
          static getFocusableElements(t = document.body) {
            return t.querySelectorAll(
              '\n            input:not([tabindex^="-"]):not([disabled]):not([type="hidden"]),\n            select:not([tabindex^="-"]):not([disabled]),\n            textarea:not([tabindex^="-"]):not([disabled]),\n            button:not([tabindex^="-"]):not([disabled]),\n            a[href]:not([tabindex^="-"]):not([disabled]),\n            [tabindex]:not([tabindex^="-"]):not([disabled])\n        '
            );
          }
          static getFirstFocusableElement(t = document.body) {
            return this.getFocusableElements(t)[0];
          }
          static getLastFocusableElement(t = document) {
            const e = this.getFocusableElements(t);
            return e[e.length - 1];
          }
        }
      },
      194: (t, e, i) => {
        i.d(e, { A: () => a });
        var r = i(744),
          n = i.n(r),
          s = i(139),
          l = i(747);
        class o {
          constructor(t = document) {
            (this._el = t), (t.$emitter = this), (this._listeners = []);
          }
          publish(t, e = {}, i = !1) {
            const r = new CustomEvent(t, { detail: e, cancelable: i });
            return this.el.dispatchEvent(r), r;
          }
          subscribe(t, e, i = {}) {
            const r = this,
              n = t.split(".");
            let s = i.scope ? e.bind(i.scope) : e;
            if (i.once && !0 === i.once) {
              const e = s;
              s = function (i) {
                r.unsubscribe(t), e(i);
              };
            }
            return (
              this.el.addEventListener(n[0], s),
              this.listeners.push({ splitEventName: n, opts: i, cb: s }),
              !0
            );
          }
          unsubscribe(t) {
            const e = t.split(".");
            return (
              (this.listeners = this.listeners.reduce(
                (t, i) =>
                  [...i.splitEventName].sort().toString() ===
                  e.sort().toString()
                    ? (this.el.removeEventListener(i.splitEventName[0], i.cb),
                      t)
                    : (t.push(i), t),
                []
              )),
              !0
            );
          }
          reset() {
            return (
              this.listeners.forEach((t) => {
                this.el.removeEventListener(t.splitEventName[0], t.cb);
              }),
              (this.listeners = []),
              !0
            );
          }
          get el() {
            return this._el;
          }
          set el(t) {
            this._el = t;
          }
          get listeners() {
            return this._listeners;
          }
          set listeners(t) {
            this._listeners = t;
          }
        }
        class a {
          constructor(t, e = {}, i = !1) {
            if (!s.A.isNode(t))
              throw new Error("There is no valid element given.");
            (this.el = t),
              (this.$emitter = new o(this.el)),
              (this._pluginName = this._getPluginName(i)),
              (this.options = this._mergeOptions(e)),
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
          _mergeOptions(t) {
            const e = l.A.toDashCase(this._pluginName),
              i = s.A.getDataAttribute(this.el, `data-${e}-config`, !1),
              r = s.A.getAttribute(this.el, `data-${e}-options`, !1),
              o = [this.constructor.options, this.options, t];
            i && o.push(window.PluginConfigManager.get(this._pluginName, i));
            try {
              r && o.push(JSON.parse(r));
            } catch (t) {
              throw (
                (console.error(this.el),
                new Error(
                  `The data attribute "data-${e}-options" could not be parsed to json: ${t.message}`
                ))
              );
            }
            return n().all(
              o
                .filter((t) => t instanceof Object && !(t instanceof Array))
                .map((t) => t || {})
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
          _getPluginName(t) {
            return t || (t = this.constructor.name), t;
          }
        }
      },
      744: (t) => {
        var e = function (t) {
            return (
              (function (t) {
                return !!t && "object" == typeof t;
              })(t) &&
              !(function (t) {
                var e = Object.prototype.toString.call(t);
                return (
                  "[object RegExp]" === e ||
                  "[object Date]" === e ||
                  (function (t) {
                    return t.$$typeof === i;
                  })(t)
                );
              })(t)
            );
          },
          i =
            "function" == typeof Symbol && Symbol.for
              ? Symbol.for("react.element")
              : 60103;
        function r(t, e) {
          return !1 !== e.clone && e.isMergeableObject(t)
            ? o(((i = t), Array.isArray(i) ? [] : {}), t, e)
            : t;
          var i;
        }
        function n(t, e, i) {
          return t.concat(e).map(function (t) {
            return r(t, i);
          });
        }
        function s(t) {
          return Object.keys(t).concat(
            (function (t) {
              return Object.getOwnPropertySymbols
                ? Object.getOwnPropertySymbols(t).filter(function (e) {
                    return Object.propertyIsEnumerable.call(t, e);
                  })
                : [];
            })(t)
          );
        }
        function l(t, e) {
          try {
            return e in t;
          } catch (t) {
            return !1;
          }
        }
        function o(t, i, a) {
          ((a = a || {}).arrayMerge = a.arrayMerge || n),
            (a.isMergeableObject = a.isMergeableObject || e),
            (a.cloneUnlessOtherwiseSpecified = r);
          var c = Array.isArray(i);
          return c === Array.isArray(t)
            ? c
              ? a.arrayMerge(t, i, a)
              : (function (t, e, i) {
                  var n = {};
                  return (
                    i.isMergeableObject(t) &&
                      s(t).forEach(function (e) {
                        n[e] = r(t[e], i);
                      }),
                    s(e).forEach(function (s) {
                      (function (t, e) {
                        return (
                          l(t, e) &&
                          !(
                            Object.hasOwnProperty.call(t, e) &&
                            Object.propertyIsEnumerable.call(t, e)
                          )
                        );
                      })(t, s) ||
                        (l(t, s) && i.isMergeableObject(e[s])
                          ? (n[s] = (function (t, e) {
                              if (!e.customMerge) return o;
                              var i = e.customMerge(t);
                              return "function" == typeof i ? i : o;
                            })(s, i)(t[s], e[s], i))
                          : (n[s] = r(e[s], i)));
                    }),
                    n
                  );
                })(t, i, a)
            : r(i, a);
        }
        o.all = function (t, e) {
          if (!Array.isArray(t))
            throw new Error("first argument should be an array");
          return t.reduce(function (t, i) {
            return o(t, i, e);
          }, {});
        };
        var a = o;
        t.exports = a;
      },
      747: (t, e, i) => {
        i.d(e, { A: () => r });
        class r {
          static ucFirst(t) {
            return t.charAt(0).toUpperCase() + t.slice(1);
          }
          static lcFirst(t) {
            return t.charAt(0).toLowerCase() + t.slice(1);
          }
          static toDashCase(t) {
            return t
              .replace(/([A-Z])/g, "-$1")
              .replace(/^-/, "")
              .toLowerCase();
          }
          static toLowerCamelCase(t, e) {
            const i = r.toUpperCamelCase(t, e);
            return r.lcFirst(i);
          }
          static toUpperCamelCase(t, e) {
            return e
              ? t
                  .split(e)
                  .map((t) => r.ucFirst(t.toLowerCase()))
                  .join("")
              : r.ucFirst(t.toLowerCase());
          }
          static parsePrimitive(t) {
            try {
              return (
                /^\d+(.|,)\d+$/.test(t) && (t = t.replace(",", ".")),
                JSON.parse(t)
              );
            } catch (e) {
              return t.toString();
            }
          }
        }
      },
    },
    r = {};
  function n(t) {
    var e = r[t];
    if (void 0 !== e) return e.exports;
    var s = (r[t] = { exports: {} });
    return i[t](s, s.exports, n), s.exports;
  }
  (n.m = i),
    (n.n = (t) => {
      var e = t && t.__esModule ? () => t.default : () => t;
      return n.d(e, { a: e }), e;
    }),
    (n.d = (t, e) => {
      for (var i in e)
        n.o(e, i) &&
          !n.o(t, i) &&
          Object.defineProperty(t, i, { enumerable: !0, get: e[i] });
    }),
    (n.f = {}),
    (n.e = (t) =>
      Promise.all(Object.keys(n.f).reduce((e, i) => (n.f[i](t, e), e), []))),
    (n.u = (t) => t + ".makaira-shopware6-storefront.js"),
    (n.g = (function () {
      if ("object" == typeof globalThis) return globalThis;
      try {
        return this || new Function("return this")();
      } catch (t) {
        if ("object" == typeof window) return window;
      }
    })()),
    (n.o = (t, e) => Object.prototype.hasOwnProperty.call(t, e)),
    (t = {}),
    (e = "makaira-shopware6-storefront:"),
    (n.l = (i, r, s, l) => {
      if (t[i]) t[i].push(r);
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
              d.getAttribute("data-webpack") == e + s
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
          o.setAttribute("data-webpack", e + s),
          (o.src = i)),
          (t[i] = [r]);
        var m = (e, r) => {
            (o.onerror = o.onload = null), clearTimeout(f);
            var n = t[i];
            if (
              (delete t[i],
              o.parentNode && o.parentNode.removeChild(o),
              n && n.forEach((t) => t(r)),
              e)
            )
              return e(r);
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
    (n.r = (t) => {
      "undefined" != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(t, Symbol.toStringTag, { value: "Module" }),
        Object.defineProperty(t, "__esModule", { value: !0 });
    }),
    (() => {
      var t;
      n.g.importScripts && (t = n.g.location + "");
      var e = n.g.document;
      if (
        !t &&
        e &&
        (e.currentScript &&
          "SCRIPT" === e.currentScript.tagName.toUpperCase() &&
          (t = e.currentScript.src),
        !t)
      ) {
        var i = e.getElementsByTagName("script");
        if (i.length)
          for (var r = i.length - 1; r > -1 && (!t || !/^http(s?):/.test(t)); )
            t = i[r--].src;
      }
      if (!t)
        throw new Error(
          "Automatic publicPath is not supported in this browser"
        );
      (t = t
        .replace(/^blob:/, "")
        .replace(/#.*$/, "")
        .replace(/\?.*$/, "")
        .replace(/\/[^\/]+$/, "/")),
        (n.p = t);
    })(),
    (() => {
      var t = { 792: 0 };
      n.f.j = (e, i) => {
        var r = n.o(t, e) ? t[e] : void 0;
        if (0 !== r)
          if (r) i.push(r[2]);
          else {
            var s = new Promise((i, n) => (r = t[e] = [i, n]));
            i.push((r[2] = s));
            var l = n.p + n.u(e),
              o = new Error();
            n.l(
              l,
              (i) => {
                if (n.o(t, e) && (0 !== (r = t[e]) && (t[e] = void 0), r)) {
                  var s = i && ("load" === i.type ? "missing" : i.type),
                    l = i && i.target && i.target.src;
                  (o.message =
                    "Loading chunk " + e + " failed.\n(" + s + ": " + l + ")"),
                    (o.name = "ChunkLoadError"),
                    (o.type = s),
                    (o.request = l),
                    r[1](o);
                }
              },
              "chunk-" + e,
              e
            );
          }
      };
      var e = (e, i) => {
          var r,
            s,
            [l, o, a] = i,
            c = 0;
          if (l.some((e) => 0 !== t[e])) {
            for (r in o) n.o(o, r) && (n.m[r] = o[r]);
            a && a(n);
          }
          for (e && e(i); c < l.length; c++)
            (s = l[c]), n.o(t, s) && t[s] && t[s][0](), (t[s] = 0);
        },
        i = (self.webpackChunkmakaira_shopware6_storefront =
          self.webpackChunkmakaira_shopware6_storefront || []);
      i.forEach(e.bind(null, 0)), (i.push = e.bind(null, i.push.bind(i)));
    })();
  var s = n(194);
  class l extends s.A {
    static sidebarFilterSelector = ".cms-element-sidebar-filter";
    static options = { hideItemsWhenOffcanvasHidden: !1, enabled: !1 };
    constructor(t, e, i) {
      super(t, e, i), (this._isUpdating = !1), this._mergeConfigFromElement(t);
    }
    _mergeConfigFromElement(t) {
      const e = t.getAttribute("data-listing-listener-options");
      if (e)
        try {
          const t = JSON.parse(e);
          void 0 !== t.enabled && (this.options.enabled = t.enabled),
            void 0 !== t.hideItemsWhenOffcanvasHidden &&
              (this.options.hideItemsWhenOffcanvasHidden =
                t.hideItemsWhenOffcanvasHidden);
        } catch (t) {
          console.warn(
            "ListingListener: Failed to parse configuration from data attribute",
            t
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
      const t = document.querySelector("[data-listing]");
      if (t) {
        const e = window.PluginManager.getPluginInstanceFromElement(
          t,
          "Listing"
        );
        e && (this.listing = e);
      }
    }
    _isEnabled() {
      return !1 !== this.options.enabled && !1 !== this.options.enabled;
    }
    _registerEvents() {
      this.$emitter.subscribe("Listing/afterRenderResponse", (t) => {
        this._swapContent(t.detail.response);
      });
    }
    _findFilterPanelContainers(t = document) {
      return Array.from(t.querySelectorAll(".filter-panel-items-container"));
    }
    _extractAndMergeFilters(t) {
      try {
        const e = this._getAvailableFiltersFromDocument(t);
        if (0 === e.length) return;
        this._storeCurrentFiltersToLocalStorage(e);
        const i = this._getStoredFilters(),
          r = [...new Set([...i, ...e])];
        this._storeFiltersToLocalStorage(r);
      } catch (t) {
        console.error(
          "ListingListener: Failed to extract and merge filters:",
          t
        );
      }
    }
    _getAvailableFiltersFromDocument(t) {
      const e = t.querySelectorAll(
          ".filter-panel-item[data-filter-multi-select-options]"
        ),
        i = [];
      return (
        e.forEach((t) => {
          try {
            const e = t.getAttribute("data-filter-multi-select-options");
            if (e) {
              const t = JSON.parse(e);
              t.name && i.push(t.name);
            }
          } catch (e) {
            console.warn(
              "ListingListener: Failed to parse filter options for item:",
              t,
              e
            );
          }
        }),
        i
      );
    }
    _getStoredFilters() {
      try {
        const t = localStorage.getItem("macatfiall");
        return t ? JSON.parse(t) : [];
      } catch (t) {
        return (
          console.error(
            "ListingListener: Failed to retrieve filters from localStorage:",
            t
          ),
          []
        );
      }
    }
    _storeFiltersToLocalStorage(t) {
      try {
        const e = JSON.stringify(t);
        localStorage.setItem("macatfiall", e);
      } catch (t) {
        console.error(
          "ListingListener: Failed to store filters to localStorage:",
          t
        );
      }
    }
    _storeCurrentFiltersToLocalStorage(t) {
      try {
        const e = JSON.stringify(t);
        localStorage.setItem("macurrfi", e);
      } catch (t) {
        console.error(
          "ListingListener: Failed to store current filters to localStorage:",
          t
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
        document.addEventListener("keydown", (t) => {
          "Escape" === t.key &&
            this._isOffcanvasVisible() &&
            setTimeout(() => this._onOffcanvasVisibilityChange(!1), 100);
        });
    }
    _onOffcanvasVisibilityChange(t) {
      !t && this.options.hideItemsWhenOffcanvasHidden
        ? this._hideAllFilterItems()
        : this._showAllActiveFilters();
    }
    _isOffcanvasVisible() {
      const t = document.querySelectorAll(".offcanvas");
      return Array.from(t).some(
        (t) =>
          t.classList.contains("show") || "none" !== getComputedStyle(t).display
      );
    }
    _hideAllFilterItems() {
      const t = this._getAvailableFiltersFromLocalStorage();
      t &&
        0 !== t.length &&
        document
          .querySelectorAll(".filter-panel-items-container")
          .forEach((e) => {
            e.querySelectorAll(".filter-panel-item").forEach((e) => {
              const i = this._getFilterNameFromItem(e);
              i && t.includes(i) && this._hideFilterItem(e);
            });
          });
    }
    _showAllActiveFilters() {
      const t = this._getCurrentFiltersFromLocalStorage();
      t && 0 !== t.length
        ? document
            .querySelectorAll(".filter-panel-items-container")
            .forEach((e) => {
              e.querySelectorAll(
                ".filter-panel-item, .filter-multi-select-list-item"
              ).forEach((e) => {
                const i = this._getFilterNameFromItem(e);
                i &&
                  (t.includes(i)
                    ? this._showFilterItem(e)
                    : this._hideFilterItem(e));
              });
            })
        : this._showAllAvailableFilters();
    }
    _showAllAvailableFilters() {
      const t = this._getAvailableFiltersFromLocalStorage();
      t &&
        0 !== t.length &&
        document
          .querySelectorAll(".filter-panel-items-container")
          .forEach((e) => {
            e.querySelectorAll(
              ".filter-panel-item, .filter-multi-select-list-item"
            ).forEach((e) => {
              const i = this._getFilterNameFromItem(e);
              i && t.includes(i) && this._showFilterItem(e);
            });
          });
    }
    _getAvailableFiltersFromLocalStorage() {
      try {
        const t = localStorage.getItem("macatfiall");
        return t ? JSON.parse(t) : [];
      } catch (t) {
        return (
          console.error(
            "ListingListener: Failed to retrieve filters from localStorage:",
            t
          ),
          []
        );
      }
    }
    _getCurrentFiltersFromLocalStorage() {
      try {
        const t = localStorage.getItem("macurrfi");
        return t ? JSON.parse(t) : [];
      } catch (t) {
        return (
          console.error(
            "ListingListener: Failed to retrieve current filters from localStorage:",
            t
          ),
          []
        );
      }
    }
    _getFilterNameFromItem(t) {
      try {
        const e = t.getAttribute("data-filter-multi-select-options");
        if (e) return JSON.parse(e).name;
        const i = t.closest("[data-filter-multi-select-options]");
        if (i) {
          const t = i.getAttribute("data-filter-multi-select-options");
          if (t) return JSON.parse(t).name;
        }
        return null;
      } catch (e) {
        return (
          console.warn(
            "ListingListener: Failed to extract filter name from item:",
            t,
            e
          ),
          null
        );
      }
    }
    _findFilterPanelContainer(t = document) {
      const e = this._findFilterPanelContainers(t);
      return e.length > 0 ? e[0] : null;
    }
    _getContainerIdentifier(t) {
      if (t.id) return `id-${t.id}`;
      if (t.dataset.filterType) return `filter-type-${t.dataset.filterType}`;
      if (t.className) {
        const e = t.className
          .split(" ")
          .filter(
            (t) =>
              t.includes("filter") ||
              t.includes("sidebar") ||
              t.includes("offcanvas")
          )
          .sort()
          .join("-");
        if (e) return `classes-${e}`;
      }
      const e = t.closest("[id], [data-filter-type]");
      if (e) {
        const t = e.id || e.dataset.filterType;
        if (t) return `parent-${t}`;
      }
      return null;
    }
    _swapContent(t) {
      if (!this._isUpdating) {
        this._isUpdating = !0;
        try {
          if (
            this.options.hideItemsWhenOffcanvasHidden &&
            !this._isOffcanvasVisible()
          )
            return void this._hideAllFilterItems();
          const e = new DOMParser().parseFromString(t, "text/html"),
            i = this._findFilterPanelContainers(),
            r = this._findFilterPanelContainers(e);
          this._extractAndMergeFilters(e);
          const n = new Map();
          r.forEach((t, e) => {
            const i = this._getContainerIdentifier(t) || `panel-${e}`;
            n.set(i, t);
          }),
            i.forEach((t, e) => {
              const i = this._getContainerIdentifier(t) || `panel-${e}`,
                s = n.get(i);
              if (s) this._updateFilterPanelSelectively(t, s);
              else {
                const i = r[e];
                i && this._updateFilterPanelSelectively(t, i);
              }
            });
        } finally {
          setTimeout(() => {
            this._isUpdating = !1;
          }, 50);
        }
      }
    }
    _updateFilterPanelWithInnerHTML(t, e) {
      const i = this._getInputStates(t);
      (t.innerHTML = e.innerHTML),
        this._restoreInputStates(t, i),
        this._buildLabels();
    }
    _updateFilterPanelSelectively(t, e) {
      const i = this._getInputStates(t);
      if (this.options.enabled) {
        const i = this._createExistingSectionMap(t);
        this._replaceFilterStructureCompletely(t, e, i);
      }
      this._reregisterExistingFilters(t), this._restoreInputStates(t, i, !1);
    }
    _synchronizeFilterStructure(t, e) {
      const i = t.querySelectorAll("[data-filter-multi-select-options]"),
        r = e.querySelectorAll("[data-filter-multi-select-options]"),
        n = this._createFilterElementsMap(i),
        s = this._createFilterElementsMap(r);
      Object.keys(s).forEach((t) => {
        const e = n[t],
          i = s[t];
        e && i && this._synchronizeFilterDropdownStructure(e, i);
      });
    }
    _synchronizeFilterDropdownStructure(t, e) {
      const i = t.querySelector(".filter-panel-item-dropdown"),
        r = e.querySelector(".filter-panel-item-dropdown");
      if (!i || !r) return;
      const n = this._getDropdownStructureMap(i),
        s = this._getDropdownStructureMap(r);
      this._addMissingStructuralElements(i, s, n);
    }
    _createFilterElementsMap(t) {
      const e = {};
      return (
        t.forEach((t) => {
          const i = t.getAttribute("data-filter-multi-select-options");
          if (i)
            try {
              const r = JSON.parse(i);
              r.name && (e[r.name] = t);
            } catch (t) {
              console.warn(
                "ListingListener: Failed to parse filter options",
                t
              );
            }
        }),
        e
      );
    }
    _getDropdownStructureMap(t) {
      const e = [];
      return (
        Array.from(t.children).forEach((t, i) => {
          const r = {
            index: i,
            element: t,
            tagName: t.tagName.toLowerCase(),
            classes: Array.from(t.classList),
            textContent: this._getElementTextSignature(t),
            isList:
              "ul" === t.tagName.toLowerCase() &&
              t.classList.contains("filter-multi-select-list"),
            isStructural: !t.classList.contains(
              "filter-multi-select-list-item"
            ),
          };
          e.push(r);
        }),
        e
      );
    }
    _getElementTextSignature(t) {
      if ("ul" === t.tagName.toLowerCase()) return "";
      let e = "";
      return (
        t.childNodes.forEach((t) => {
          t.nodeType === Node.TEXT_NODE && (e += t.textContent.trim());
        }),
        e.trim()
      );
    }
    _addMissingStructuralElements(t, e, i) {
      const r = new Map();
      i.forEach((t) => {
        const e = this._createElementSignature(t);
        r.set(e, t);
      }),
        e.forEach((i, n) => {
          const s = this._createElementSignature(i);
          if (!r.has(s) && i.isStructural) {
            const s = i.element.cloneNode(!0),
              l = this._findInsertionPoint(t, e, n, r);
            l ? t.insertBefore(s, l) : t.appendChild(s);
          }
        });
    }
    _createElementSignature(t) {
      if (t.isList) return `list-${t.classes.join("-")}`;
      const e = t.classes.join("-"),
        i = t.textContent.replace(/\s+/g, " ").trim();
      return `${t.tagName}-${e}-${i}`;
    }
    _findInsertionPoint(t, e, i, r) {
      for (let t = i + 1; t < e.length; t++) {
        const i = e[t],
          n = this._createElementSignature(i);
        if (r.has(n)) return r.get(n).element;
      }
      return null;
    }
    _updateFilterMultiSelectElements(t, e) {
      const i = t.querySelectorAll("[data-filter-multi-select]"),
        r = e.querySelectorAll("[data-filter-multi-select]"),
        n = this._createFilterMultiSelectMap(i),
        s = this._createFilterMultiSelectMap(r);
      Object.keys(n).forEach((t) => {
        s[t] || this._hideFilterItem(n[t]);
      }),
        Object.keys(s).forEach((e) => {
          if (n[e]) this._showFilterItem(n[e]);
          else {
            const i = s[e].cloneNode(!0);
            t.appendChild(i), i.setAttribute("data-needs-init", "true");
          }
        });
    }
    _updateFilterListItemElements(t, e) {
      const i = t.querySelectorAll(".filter-multi-select-list-item"),
        r = e.querySelectorAll(".filter-multi-select-list-item"),
        n = this._createFilterListItemMap(i),
        s = this._createFilterListItemMap(r);
      Object.keys(n).forEach((t) => {
        s[t] || this._hideFilterItem(n[t]);
      }),
        Object.keys(s).forEach((e) => {
          n[e]
            ? (this._showFilterItem(n[e]),
              this._updateFilterListItemContent(n[e], s[e]))
            : this._addNewFilterListItem(t, s[e]);
        });
    }
    _createFilterMultiSelectMap(t) {
      const e = {};
      return (
        t.forEach((t) => {
          const i = t.getAttribute("data-filter-multi-select-options");
          if (i)
            try {
              const r = JSON.parse(i);
              if (r.name) {
                const i = `filter-multi-select-${r.name}`;
                e[i] = t;
              }
            } catch (t) {
              console.warn(
                "ListingListener: Failed to parse filter options",
                t
              );
            }
        }),
        e
      );
    }
    _createFilterListItemMap(t) {
      const e = {};
      return (
        t.forEach((t) => {
          const i = t.querySelector("input[data-label]"),
            r = i ? i.getAttribute("data-label") : null;
          if (r) {
            const i = t.closest("[data-filter-multi-select]");
            let n = "unknown";
            if (i) {
              const t = i.getAttribute("data-filter-multi-select-options");
              if (t)
                try {
                  n = JSON.parse(t).name || "unknown";
                } catch (t) {
                  console.warn(
                    "ListingListener: Failed to parse parent filter options",
                    t
                  );
                }
            }
            e[`${n}-${r}`] = t;
          }
        }),
        e
      );
    }
    _updateFilterDropdownContent(t, e) {
      const i = t.querySelector(".filter-panel-item-dropdown"),
        r = e.querySelector(".filter-panel-item-dropdown");
      if (i && r) {
        const t = this._getInputStates(i);
        this._mergeDropdownContent(i, r), this._restoreInputStates(i, t, !1);
      }
    }
    _updateFilterListItemContent(t, e) {
      const i = t.querySelector("label"),
        r = e.querySelector("label");
      i &&
        r &&
        i.textContent !== r.textContent &&
        (i.textContent = r.textContent);
      const n = t.querySelector("input"),
        s = e.querySelector("input");
      n &&
        s &&
        ["value", "name", "data-count"].forEach((t) => {
          n.getAttribute(t) !== s.getAttribute(t) &&
            n.setAttribute(t, s.getAttribute(t) || "");
        });
    }
    _findFilterElementByName(t, e) {
      const i = t.querySelectorAll("[data-filter-multi-select-options]");
      for (const t of i)
        try {
          const i = t.getAttribute("data-filter-multi-select-options");
          if (i && JSON.parse(i).name === e) return t;
        } catch (t) {
          continue;
        }
      return null;
    }
    _findTargetListForNewItem(t, e, i) {
      const r = e.closest(".filter-panel-item-dropdown"),
        n = r ? this._findTargetContainer(r, t) : t,
        s = e.closest("ul.filter-multi-select-list");
      if (s) {
        let t = null,
          e = null,
          i = s.previousElementSibling;
        for (; i && !t; ) {
          if (
            i.tagName &&
            !i.classList.contains("filter-multi-select-list-item") &&
            i.textContent.trim()
          ) {
            (t = i), (e = i.textContent.trim());
            break;
          }
          i = i.previousElementSibling;
        }
        if (t && e) {
          const i = this._findSectionByText(n, e, t.tagName);
          if (i) return i;
        }
      }
      const l = n.querySelectorAll("ul.filter-multi-select-list");
      if (1 === l.length) return l[0];
      if (l.length > 1) {
        const t = i
          .querySelector("input[data-label]")
          ?.getAttribute("data-label");
        if (t)
          for (const e of l) {
            const i = e.querySelectorAll("input[data-label]");
            for (const r of i) {
              const i = r.getAttribute("data-label");
              if (this._labelsSeemRelated(t, i)) return e;
            }
          }
        return l[0];
      }
      return null;
    }
    _findSectionByText(t, e, i) {
      const r = t.querySelectorAll(i.toLowerCase());
      for (const t of r)
        if (t.textContent.trim() === e) {
          let e = t.nextElementSibling;
          for (; e; ) {
            if (
              "ul" === e.tagName.toLowerCase() &&
              e.classList.contains("filter-multi-select-list")
            )
              return e;
            e = e.nextElementSibling;
          }
        }
      return null;
    }
    _labelsSeemRelated(t, e) {
      if (!t || !e) return !1;
      const i = /^\d+(-\d+)?$/;
      if (i.test(t) && i.test(e)) return !0;
      const r = /^\d*XL[K]?$/;
      if (r.test(t) && r.test(e)) return !0;
      const n = /^\d+\/\d+$/;
      return (
        !(!n.test(t) || !n.test(e)) ||
        !(!t.startsWith("W") || !e.startsWith("W"))
      );
    }
    _addNewFilterListItem(t, e) {
      const i = e
        .closest("[data-filter-multi-select]")
        ?.getAttribute("data-filter-multi-select-options");
      if (!i) return;
      let r;
      try {
        r = JSON.parse(i).name;
      } catch (t) {
        return void console.warn(
          "ListingListener: Failed to parse parent options",
          t
        );
      }
      if (!r) return;
      const n = this._findFilterElementByName(t, r);
      if (!n) return;
      const s = n.querySelector(".filter-panel-item-dropdown");
      if (!s) return;
      const l = e.cloneNode(!0),
        o = this._ensureSectionStructureExists(e, s),
        a = this._findTargetListForNewItem(s, e, l);
      a
        ? a.appendChild(l)
        : o && o.list
          ? o.list.appendChild(l)
          : s.appendChild(l),
        this._attachEventHandlersToNewItem(l, s);
    }
    _hideFilterItem(t) {
      (t.style.display = "none"), t.classList.add("filter-item-hidden");
    }
    _showFilterItem(t) {
      if (t.classList.contains("filter-item-hidden")) {
        t.classList.remove("filter-item-hidden");
        const e = this._getAppropriateDisplayStyle(t);
        t.style.display = e;
      }
    }
    _getAppropriateDisplayStyle(t) {
      return t.closest(".filter-panel-item.d-grid") ||
        t.closest(".filter-panel-item.dropdown")
        ? "block"
        : t.classList.contains("filter-multi-select-list-item")
          ? "inline-block"
          : "block";
    }
    _getFilterItemsMap(t) {
      const e = {};
      return (
        t.querySelectorAll(".filter-panel-item").forEach((t) => {
          const i = this._getFilterItemKey(t);
          i && (e[i] = t);
        }),
        e
      );
    }
    _getFilterItemKey(t) {
      const e = t.querySelector("input[name]"),
        i = t.querySelector(".filter-panel-item-toggle");
      return e
        ? `input-${e.name}`
        : i
          ? `toggle-${i.textContent.trim()}`
          : null;
    }
    _getInputStates(t) {
      const e = new Map();
      return (
        t.querySelectorAll("input").forEach((t) => {
          const i =
            "checkbox" === t.type || "radio" === t.type
              ? t.name + "_" + t.value
              : t.name;
          e.set(i, { checked: t.checked, value: t.value });
        }),
        e
      );
    }
    _restoreInputStates(t, e, i = !0) {
      t.querySelectorAll("input").forEach((t) => {
        const r =
          "checkbox" === t.type || "radio" === t.type
            ? t.name + "_" + t.value
            : t.name;
        if (e.has(r)) {
          const n = e.get(r);
          "checkbox" === t.type || "radio" === t.type
            ? (t.checked = n.checked)
            : (t.value = n.value),
            i &&
              t.dispatchEvent(
                new Event(
                  "checkbox" === t.type || "radio" === t.type
                    ? "change"
                    : "input",
                  { bubbles: !0 }
                )
              );
        }
      });
    }
    _updateFilterItemContent(t, e) {
      const i = t.querySelectorAll(".filter-multi-select-list-item"),
        r = e.querySelectorAll(".filter-multi-select-list-item");
      if (i.length !== r.length) {
        const i = t.querySelector(".filter-panel-item-dropdown"),
          r = e.querySelector(".filter-panel-item-dropdown");
        if (i && r) {
          const t = this._getInputStates(i);
          this._mergeDropdownContent(i, r), this._restoreInputStates(i, t, !1);
        }
      }
    }
    _mergeDropdownContent(t, e) {
      const i = this._getDropdownItemsMap(t),
        r = (this._getDropdownItemsMap(e), document.createElement("div"));
      for (
        e.querySelectorAll(".filter-multi-select-list-item").forEach((e, n) => {
          const s = this._getDropdownItemKey(e);
          if (i[s]) {
            const t = i[s],
              n = t.querySelector("label"),
              l = e.querySelector("label");
            n &&
              l &&
              n.textContent !== l.textContent &&
              (n.textContent = l.textContent);
            const o = t.querySelector("input"),
              a = e.querySelector("input");
            o &&
              a &&
              ["value", "name", "data-count"].forEach((t) => {
                o.getAttribute(t) !== a.getAttribute(t) &&
                  o.setAttribute(t, a.getAttribute(t) || "");
              }),
              r.appendChild(t);
          } else {
            const i = e.cloneNode(!0);
            r.appendChild(i), this._attachEventHandlersToNewItem(i, t);
          }
        }),
          t.innerHTML = "";
        r.firstChild;

      )
        t.appendChild(r.firstChild);
    }
    _getDropdownItemsMap(t) {
      const e = {};
      return (
        t.querySelectorAll(".filter-multi-select-list-item").forEach((t) => {
          const i = this._getDropdownItemKey(t);
          i && (e[i] = t);
        }),
        e
      );
    }
    _getDropdownItemKey(t) {
      const e = t.querySelector("input");
      if (e) {
        const t = e.getAttribute("data-label") || e.value;
        if (t && e.name) return `${e.name}-${t}`;
      }
      const i = t.querySelector("label");
      return i ? `label-${i.textContent.trim()}` : null;
    }
    _attachEventHandlersToNewItem(t, e) {
      t.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(
        (t, e) => {
          t.addEventListener("change", (t) => {
            this._onChangeFilter(t);
          });
        }
      );
    }
    _onChangeFilter(t) {
      if (this.listing && "function" == typeof this.listing.changeListing)
        this.listing.changeListing(!0, { p: 1 });
      else {
        const t = document.querySelector("[data-listing]");
        if (t) {
          const e = window.PluginManager.getPluginInstanceFromElement(
            t,
            "Listing"
          );
          e && "function" == typeof e.changeListing
            ? e.changeListing(!0, { p: 1 })
            : console.warn(
                "ListingListener: Could not find listing plugin or changeListing method"
              );
        } else console.warn("ListingListener: Could not find listing element");
      }
    }
    _reinitializePluginsSelectively(t) {
      t.querySelectorAll('[data-needs-init="true"]').forEach((t) => {
        try {
          t.dataset.pluginName &&
            "string" == typeof t.dataset.pluginName &&
            window.PluginManager.initializePlugin(t, t.dataset.pluginName),
            t.querySelectorAll("[data-plugin-name]").forEach((t) => {
              t.dataset.pluginName &&
                "string" == typeof t.dataset.pluginName &&
                window.PluginManager.initializePlugin(t, t.dataset.pluginName);
            });
        } catch (e) {
          console.warn(
            "ListingListener: Failed to reinitialize plugin for element:",
            t,
            e
          );
        }
        t.removeAttribute("data-needs-init");
      });
    }
    _buildLabels() {}
    _reregisterExistingFilters(t) {
      const e = document.querySelector("[data-listing]");
      if (!e) return;
      const i = window.PluginManager.getPluginInstanceFromElement(e, "Listing");
      i &&
        i.registerFilter &&
        t
          .querySelectorAll(
            "[data-filter-multi-select], [data-filter-range-slider], [data-filter-boolean]"
          )
          .forEach((t) => {
            const e = t.hasAttribute("data-needs-reinit"),
              r = ["FilterMultiSelect", "FilterRangeSlider", "FilterBoolean"];
            for (const n of r)
              try {
                const r = window.PluginManager.getPluginInstanceFromElement(
                  t,
                  n
                );
                if (r) {
                  "function" == typeof i.registerFilter && i.registerFilter(r),
                    e && t.removeAttribute("data-needs-reinit");
                  break;
                }
              } catch (t) {
                console.warn(
                  `ListingListener: Error processing ${n} plugin:`,
                  t
                );
              }
          });
    }
    _createMissingSectionStructure(t, e) {
      const i = t.closest("ul.filter-multi-select-list");
      if (!i) return { list: null };
      const r = t.closest(".filter-panel-item-dropdown");
      if (!r) return { list: null };
      const n = this._ensureWrapperStructureExists(r, e),
        s = [];
      let l = i.previousElementSibling;
      for (; l; ) {
        if (
          l.tagName &&
          !l.classList.contains("filter-multi-select-list-item")
        ) {
          const t = this._createElementSignatureFromElement(l);
          if (this._elementExistsInContainer(n, t)) break;
          s.unshift(l);
        }
        l = l.previousElementSibling;
      }
      const o = this._findSectionInsertionPoint(n, r, i);
      let a = null;
      s.forEach((t) => {
        const e = t.cloneNode(!0);
        o ? n.insertBefore(e, o) : n.appendChild(e), (a = e);
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
    _createElementSignatureFromElement(t) {
      const e = {
        tagName: t.tagName.toLowerCase(),
        classes: Array.from(t.classList),
        textContent: this._getElementTextSignature(t),
        isList:
          "ul" === t.tagName.toLowerCase() &&
          t.classList.contains("filter-multi-select-list"),
        isStructural: !t.classList.contains("filter-multi-select-list-item"),
      };
      return this._createElementSignature(e);
    }
    _findSectionInsertionPoint(t, e, i) {
      let r = i.nextElementSibling;
      for (; r; ) {
        if (
          r.tagName &&
          !r.classList.contains("filter-multi-select-list-item")
        ) {
          const e = this._createElementSignatureFromElement(r),
            i = Array.from(t.children);
          for (const t of i)
            if (this._createElementSignatureFromElement(t) === e) return t;
        }
        r = r.nextElementSibling;
      }
      return null;
    }
    _ensureSectionStructureExists(t, e) {
      return this._sectionExistsForItem(t, e)
        ? null
        : this._createMissingSectionStructure(t, e);
    }
    _sectionExistsForItem(t, e) {
      const i = t.closest("ul.filter-multi-select-list");
      if (!i) return !0;
      const r = t.closest(".filter-panel-item-dropdown");
      if (!r) return !0;
      const n = this._findTargetContainer(r, e);
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
    _findTargetContainer(t, e) {
      const i = this._getStructuralPath(t);
      let r = e;
      return (
        i.forEach((t) => {
          const e = this._findWrapperInContainer(r, t);
          e && (r = e);
        }),
        r
      );
    }
    _ensureWrapperStructureExists(t, e) {
      const i = this._getStructuralPath(t);
      let r = e;
      return (
        i.forEach((t) => {
          const e = this._findWrapperInContainer(r, t);
          if (e) r = e;
          else {
            const e = this._createWrapperElement(t);
            r.appendChild(e), (r = e);
          }
        }),
        r
      );
    }
    _getStructuralPath(t) {
      const e = [];
      return (
        Array.from(t.children).forEach((t) => {
          if (this._isWrapperElement(t)) {
            const i = {
              tagName: t.tagName.toLowerCase(),
              classes: Array.from(t.classList),
              signature: this._createElementSignatureFromElement(t),
            };
            e.push(i);
          }
        }),
        e
      );
    }
    _isWrapperElement(t) {
      if (
        t.classList.contains("filter-multi-select-list-item") ||
        ("ul" === t.tagName.toLowerCase() &&
          t.classList.contains("filter-multi-select-list"))
      )
        return !1;
      const e = t.querySelectorAll("ul.filter-multi-select-list"),
        i = t.querySelectorAll(
          ":scope > *:not(.filter-multi-select-list-item)"
        );
      return e.length > 0 || i.length > 1;
    }
    _findWrapperInContainer(t, e) {
      return Array.from(t.children).find(
        (t) => this._createElementSignatureFromElement(t) === e.signature
      );
    }
    _createWrapperElement(t) {
      const e = document.createElement(t.tagName);
      return (
        t.classes.forEach((t) => {
          e.classList.add(t);
        }),
        e
      );
    }
    _elementExistsInContainer(t, e) {
      return Array.from(t.children).some(
        (t) => this._createElementSignatureFromElement(t) === e
      );
    }
    _createExistingSectionMap(t) {
      const e = new Map();
      return (
        t
          .querySelectorAll("[data-filter-multi-select-options]")
          .forEach((t) => {
            const i = t.querySelector(".filter-panel-item-dropdown");
            i &&
              this._findTargetContainerInExisting(i)
                .querySelectorAll("*")
                .forEach((t) => {
                  if (
                    t.textContent.trim() &&
                    !t.classList.contains("filter-multi-select-list-item") &&
                    "ul" !== t.tagName.toLowerCase()
                  ) {
                    const i = t.textContent.trim();
                    let r = t.nextElementSibling;
                    for (; r; ) {
                      if (
                        "ul" === r.tagName.toLowerCase() &&
                        r.classList.contains("filter-multi-select-list")
                      ) {
                        const t = Array.from(
                          r.querySelectorAll(".filter-multi-select-list-item")
                        ).map((t) => t.cloneNode(!0));
                        t.length > 0 &&
                          (e.has(i) || e.set(i, []), e.get(i).push(...t));
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
        e
      );
    }
    _findTargetContainerInExisting(t) {
      const e = Array.from(t.children);
      for (const t of e) if (this._isWrapperElement(t)) return t;
      return t;
    }
    _restoreExistingSectionAssociations(t, e) {
      0 !== e.size &&
        t
          .querySelectorAll("[data-filter-multi-select-options]")
          .forEach((t) => {
            const i = t.querySelector(".filter-panel-item-dropdown");
            if (!i) return;
            const r = this._findTargetContainer(null, i) || i;
            e.forEach((t, e) => {
              const i = this._findSectionByTextInContainer(r, e);
              i &&
                (this._removeItemsFromIncorrectSections(r, t, e),
                t.forEach((t) => {
                  this._itemExistsInList(i, t) ||
                    i.appendChild(t.cloneNode(!0));
                }));
            });
          });
    }
    _findSectionByTextInContainer(t, e) {
      const i = t.querySelectorAll("*");
      for (const t of i)
        if (
          t.textContent.trim() === e &&
          !t.classList.contains("filter-multi-select-list-item") &&
          "ul" !== t.tagName.toLowerCase()
        ) {
          let e = t.nextElementSibling;
          for (; e; ) {
            if (
              "ul" === e.tagName.toLowerCase() &&
              e.classList.contains("filter-multi-select-list")
            )
              return e;
            e = e.nextElementSibling;
          }
        }
      return null;
    }
    _removeItemsFromIncorrectSections(t, e, i) {
      t.querySelectorAll("ul.filter-multi-select-list").forEach((t) => {
        this._getSectionTextForList(t) !== i &&
          Array.from(
            t.querySelectorAll(".filter-multi-select-list-item")
          ).forEach((t) => {
            const i = this._getItemLabel(t);
            e.some((t) => this._getItemLabel(t) === i) && t.remove();
          });
      });
    }
    _getSectionTextForList(t) {
      let e = t.previousElementSibling;
      for (; e; ) {
        if (
          e.textContent.trim() &&
          !e.classList.contains("filter-multi-select-list-item") &&
          "ul" !== e.tagName.toLowerCase()
        )
          return e.textContent.trim();
        e = e.previousElementSibling;
      }
      return null;
    }
    _itemExistsInList(t, e) {
      const i = this._getItemLabel(e),
        r = t.querySelectorAll(".filter-multi-select-list-item");
      return Array.from(r).some((t) => this._getItemLabel(t) === i);
    }
    _getItemLabel(t) {
      const e = t.querySelector("input[data-label]");
      return e ? e.getAttribute("data-label") : null;
    }
    _replaceFilterStructureCompletely(t, e, i) {
      const r = t.querySelectorAll("[data-filter-multi-select-options]"),
        n = e.querySelectorAll("[data-filter-multi-select-options]"),
        s = this._createFilterElementsMap(r),
        l = this._createFilterElementsMap(n);
      Object.keys(l).forEach((e) => {
        const r = s[e],
          n = l[e];
        r && n
          ? this._replaceFilterDropdownStructure(r, n, i)
          : n && !r && t.appendChild(n);
      }),
        Object.keys(s).forEach((t) => {
          if (l[t]) {
            const e = s[t];
            e.classList.contains("filter-panel-item-hidden") &&
              e.classList.remove("filter-panel-item-hidden");
          } else s[t].classList.add("filter-panel-item-hidden");
        });
    }
    _replaceFilterDropdownStructure(t, e, i) {
      const r = t.querySelector(".filter-panel-item-dropdown"),
        n = e.querySelector(".filter-panel-item-dropdown");
      if (!r || !n) return;
      const s = this._buildCompleteStructureFromNew(n, i);
      (r.innerHTML = ""),
        s.forEach((t) => {
          r.appendChild(t);
        }),
        this._attachEventHandlersToNewDropdown(r);
    }
    _attachEventHandlersToNewDropdown(t) {
      t.querySelectorAll(".filter-multi-select-list-item").forEach((e) => {
        this._attachEventHandlersToNewItem(e, t);
      });
    }
    _buildCompleteStructureFromNew(t, e) {
      const i = [];
      return (
        Array.from(t.children).forEach((t) => {
          if (this._isWrapperElement(t)) {
            const r = t.cloneNode(!1);
            this._buildWrapperContent(t, e).forEach((t) => {
              r.appendChild(t);
            }),
              i.push(r);
          } else {
            const r = this._processStructuralElement(t, e);
            r && i.push(r);
          }
        }),
        i
      );
    }
    _buildWrapperContent(t, e) {
      const i = [],
        r = Array.from(t.children);
      let n = null,
        s = null;
      return (
        r.forEach((t) => {
          if (
            "ul" === t.tagName.toLowerCase() &&
            t.classList.contains("filter-multi-select-list")
          )
            n
              ? ((s = this._createListForSection(t, n, e)), i.push(s))
              : ((s = this._createListWithExistingItems(t, e)), i.push(s));
          else if (
            t.textContent.trim() &&
            !t.classList.contains("filter-multi-select-list-item")
          ) {
            n = t.textContent.trim();
            const e = t.cloneNode(!0);
            i.push(e);
          } else {
            const e = t.cloneNode(!0);
            i.push(e);
          }
        }),
        i
      );
    }
    _createListForSection(t, e, i) {
      const r = t.cloneNode(!1),
        n = new Map();
      return (
        i.has(e) &&
          i.get(e).forEach((t) => {
            const e = this._getItemLabel(t);
            if (e) {
              const i = t.querySelector("input");
              n.set(e, { element: t, checked: !!i && i.checked });
            }
          }),
        Array.from(t.children).forEach((t) => {
          const e = this._getItemLabel(t),
            i = t.cloneNode(!0);
          if (e && n.has(e)) {
            const t = n.get(e),
              r = i.querySelector("input");
            r && t.checked && (r.checked = !0);
          }
          r.appendChild(i);
        }),
        r
      );
    }
    _createListWithExistingItems(t, e) {
      const i = t.cloneNode(!1),
        r = Array.from(t.children);
      let n = null;
      if (
        (e.forEach((t, e) => {
          const i = r.reduce((e, i) => {
            const r = this._getItemLabel(i);
            return t.some((t) => this._getItemLabel(t) === r) ? e + 1 : e;
          }, 0);
          i > 0 && (!n || i > n.count) && (n = { section: e, count: i });
        }),
        n)
      )
        return this._createListForSection(t, n.section, e);
      const s = new Map();
      return (
        e.forEach((t, e) => {
          t.forEach((t) => {
            const e = this._getItemLabel(t);
            if (e) {
              const i = t.querySelector("input");
              s.set(e, { element: t, checked: !!i && i.checked });
            }
          });
        }),
        r.forEach((t) => {
          const e = this._getItemLabel(t),
            r = t.cloneNode(!0);
          if (e && s.has(e)) {
            const t = s.get(e),
              i = r.querySelector("input");
            i && t.checked && (i.checked = !0);
          }
          i.appendChild(r);
        }),
        i
      );
    }
    _processStructuralElement(t, e) {
      return "ul" === t.tagName.toLowerCase() &&
        t.classList.contains("filter-multi-select-list")
        ? this._createListWithExistingItems(t, e)
        : t.cloneNode(!0);
    }
  }
  let o = !1;
  function a(t) {
    if (!window.PluginManager) return !1;
    try {
      return !!window.PluginManager.getPlugin(t);
    } catch (e) {
      if (window.PluginManager.plugins && window.PluginManager.plugins[t])
        return !0;
      const i = document.querySelectorAll(`[data-${t.toLowerCase()}]`);
      if (i.length > 0)
        for (const e of i)
          try {
            if (window.PluginManager.getPluginInstanceFromElement(e, t))
              return !0;
          } catch (t) {}
      return !1;
    }
  }
  let c = null,
    u = !1;
  document.addEventListener("DOMContentLoaded", () => {
    if (window.PluginManager && !o) {
      if (
        (c ||
          ((c = window.PluginManager.initializePlugins),
          (window.PluginManager.initializePlugins = () => {})),
        a("ListingListener"))
      )
        return void (o = !0);
      try {
        window.PluginManager.register(
          "ListingListener",
          l,
          "[data-listing-listener]"
        ),
          (o = !0);
      } catch (t) {
        console.error("Failed to register ListingListener plugin:", t);
      }
      setTimeout(async () => {
        try {
          const t = (await n.e(773).then(n.bind(n, 773))).default;
          a("MakairaListing") ||
            window.PluginManager.register(
              "MakairaListing",
              t,
              "[data-listing]"
            );
        } catch (t) {
          console.error("Failed to register MakairaListing plugin:", t);
        }
        if (!u && c)
          try {
            (window.PluginManager.initializePlugins = c),
              window.PluginManager.initializePlugins(),
              (u = !0);
          } catch (t) {
            console.error("Failed to initialize plugins:", t);
          }
      }, 50);
    }
  });
})();
