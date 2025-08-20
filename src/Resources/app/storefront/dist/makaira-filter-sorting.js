(() => {
  "use strict";
  var t,
    e,
    r = {
      139: (t, e, r) => {
        r.d(e, { A: () => n });
        var i = r(747);
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
          static getAttribute(t, e, r = !0) {
            if (r && !1 === n.hasAttribute(t, e))
              throw new Error(`The required property "${e}" does not exist!`);
            if ("function" == typeof t.getAttribute) return t.getAttribute(e);
            if (r)
              throw new Error(
                "This node doesn't support the getAttribute function!"
              );
          }
          static getDataAttribute(t, e, r = !0) {
            const s = e.replace(/^data(|-)/, ""),
              l = i.A.toLowerCamelCase(s, "-");
            if (!n.isNode(t)) {
              if (r)
                throw new Error("The passed node is not a valid HTML Node!");
              return;
            }
            if (void 0 === t.dataset) {
              if (r)
                throw new Error(
                  "This node doesn't support the dataset attribute!"
                );
              return;
            }
            const o = t.dataset[l];
            if (void 0 === o) {
              if (r)
                throw new Error(
                  `The required data attribute "${e}" does not exist on ${t}!`
                );
              return o;
            }
            return i.A.parsePrimitive(o);
          }
          static querySelector(t, e, r = !0) {
            if (r && !n.isNode(t))
              throw new Error("The parent node is not a valid HTML Node!");
            const i = t.querySelector(e) || !1;
            if (r && !1 === i)
              throw new Error(
                `The required element "${e}" does not exist in parent node!`
              );
            return i;
          }
          static querySelectorAll(t, e, r = !0) {
            if (r && !n.isNode(t))
              throw new Error("The parent node is not a valid HTML Node!");
            let i = t.querySelectorAll(e);
            if ((0 === i.length && (i = !1), r && !1 === i))
              throw new Error(
                `At least one item of "${e}" must exist in parent node!`
              );
            return i;
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
      194: (t, e, r) => {
        r.d(e, { A: () => a });
        var i = r(744),
          n = r.n(i),
          s = r(139),
          l = r(747);
        class o {
          constructor(t = document) {
            (this._el = t), (t.$emitter = this), (this._listeners = []);
          }
          publish(t, e = {}, r = !1) {
            const i = new CustomEvent(t, { detail: e, cancelable: r });
            return this.el.dispatchEvent(i), i;
          }
          subscribe(t, e, r = {}) {
            const i = this,
              n = t.split(".");
            let s = r.scope ? e.bind(r.scope) : e;
            if (r.once && !0 === r.once) {
              const e = s;
              s = function (r) {
                i.unsubscribe(t), e(r);
              };
            }
            return (
              this.el.addEventListener(n[0], s),
              this.listeners.push({ splitEventName: n, opts: r, cb: s }),
              !0
            );
          }
          unsubscribe(t) {
            const e = t.split(".");
            return (
              (this.listeners = this.listeners.reduce(
                (t, r) =>
                  [...r.splitEventName].sort().toString() ===
                  e.sort().toString()
                    ? (this.el.removeEventListener(r.splitEventName[0], r.cb),
                      t)
                    : (t.push(r), t),
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
          constructor(t, e = {}, r = !1) {
            if (!s.A.isNode(t))
              throw new Error("There is no valid element given.");
            (this.el = t),
              (this.$emitter = new o(this.el)),
              (this._pluginName = this._getPluginName(r)),
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
              r = s.A.getDataAttribute(this.el, `data-${e}-config`, !1),
              i = s.A.getAttribute(this.el, `data-${e}-options`, !1),
              o = [this.constructor.options, this.options, t];
            r && o.push(window.PluginConfigManager.get(this._pluginName, r));
            try {
              i && o.push(JSON.parse(i));
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
                    return t.$$typeof === r;
                  })(t)
                );
              })(t)
            );
          },
          r =
            "function" == typeof Symbol && Symbol.for
              ? Symbol.for("react.element")
              : 60103;
        function i(t, e) {
          return !1 !== e.clone && e.isMergeableObject(t)
            ? o(((r = t), Array.isArray(r) ? [] : {}), t, e)
            : t;
          var r;
        }
        function n(t, e, r) {
          return t.concat(e).map(function (t) {
            return i(t, r);
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
        function o(t, r, a) {
          ((a = a || {}).arrayMerge = a.arrayMerge || n),
            (a.isMergeableObject = a.isMergeableObject || e),
            (a.cloneUnlessOtherwiseSpecified = i);
          var c = Array.isArray(r);
          return c === Array.isArray(t)
            ? c
              ? a.arrayMerge(t, r, a)
              : (function (t, e, r) {
                  var n = {};
                  return (
                    r.isMergeableObject(t) &&
                      s(t).forEach(function (e) {
                        n[e] = i(t[e], r);
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
                        (l(t, s) && r.isMergeableObject(e[s])
                          ? (n[s] = (function (t, e) {
                              if (!e.customMerge) return o;
                              var r = e.customMerge(t);
                              return "function" == typeof r ? r : o;
                            })(s, r)(t[s], e[s], r))
                          : (n[s] = i(e[s], r)));
                    }),
                    n
                  );
                })(t, r, a)
            : i(r, a);
        }
        o.all = function (t, e) {
          if (!Array.isArray(t))
            throw new Error("first argument should be an array");
          return t.reduce(function (t, r) {
            return o(t, r, e);
          }, {});
        };
        var a = o;
        t.exports = a;
      },
      747: (t, e, r) => {
        r.d(e, { A: () => i });
        class i {
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
            const r = i.toUpperCamelCase(t, e);
            return i.lcFirst(r);
          }
          static toUpperCamelCase(t, e) {
            return e
              ? t
                  .split(e)
                  .map((t) => i.ucFirst(t.toLowerCase()))
                  .join("")
              : i.ucFirst(t.toLowerCase());
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
    i = {};
  function n(t) {
    var e = i[t];
    if (void 0 !== e) return e.exports;
    var s = (i[t] = { exports: {} });
    return r[t](s, s.exports, n), s.exports;
  }
  (n.m = r),
    (n.n = (t) => {
      var e = t && t.__esModule ? () => t.default : () => t;
      return n.d(e, { a: e }), e;
    }),
    (n.d = (t, e) => {
      for (var r in e)
        n.o(e, r) &&
          !n.o(t, r) &&
          Object.defineProperty(t, r, { enumerable: !0, get: e[r] });
    }),
    (n.f = {}),
    (n.e = (t) =>
      Promise.all(Object.keys(n.f).reduce((e, r) => (n.f[r](t, e), e), []))),
    (n.u = (t) => t + ".makaira-filter-sorting.js"),
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
    (n.l = (r, i, s, l) => {
      if (t[r]) t[r].push(i);
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
              d.getAttribute("src") == r ||
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
          (o.src = r)),
          (t[r] = [i]);
        var m = (e, i) => {
            (o.onerror = o.onload = null), clearTimeout(f);
            var n = t[r];
            if (
              (delete t[r],
              o.parentNode && o.parentNode.removeChild(o),
              n && n.forEach((t) => t(i)),
              e)
            )
              return e(i);
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
        var r = e.getElementsByTagName("script");
        if (r.length)
          for (var i = r.length - 1; i > -1 && (!t || !/^http(s?):/.test(t)); )
            t = r[i--].src;
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
      n.f.j = (e, r) => {
        var i = n.o(t, e) ? t[e] : void 0;
        if (0 !== i)
          if (i) r.push(i[2]);
          else {
            var s = new Promise((r, n) => (i = t[e] = [r, n]));
            r.push((i[2] = s));
            var l = n.p + n.u(e),
              o = new Error();
            n.l(
              l,
              (r) => {
                if (n.o(t, e) && (0 !== (i = t[e]) && (t[e] = void 0), i)) {
                  var s = r && ("load" === r.type ? "missing" : r.type),
                    l = r && r.target && r.target.src;
                  (o.message =
                    "Loading chunk " + e + " failed.\n(" + s + ": " + l + ")"),
                    (o.name = "ChunkLoadError"),
                    (o.type = s),
                    (o.request = l),
                    i[1](o);
                }
              },
              "chunk-" + e,
              e
            );
          }
      };
      var e = (e, r) => {
          var i,
            s,
            [l, o, a] = r,
            c = 0;
          if (l.some((e) => 0 !== t[e])) {
            for (i in o) n.o(o, i) && (n.m[i] = o[i]);
            a && a(n);
          }
          for (e && e(r); c < l.length; c++)
            (s = l[c]), n.o(t, s) && t[s] && t[s][0](), (t[s] = 0);
        },
        r = (self.webpackChunkmakaira_shopware6_storefront =
          self.webpackChunkmakaira_shopware6_storefront || []);
      r.forEach(e.bind(null, 0)), (r.push = e.bind(null, r.push.bind(r)));
    })();
  var s = n(194);
  class l extends s.A {
    static sidebarFilterSelector = ".cms-element-sidebar-filter";
    static options = { hideItemsWhenOffcanvasHidden: !1, enabled: !1 };
    constructor(t, e, r) {
      super(t, e, r), (this._isUpdating = !1), this._mergeConfigFromElement(t);
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
        const r = this._getStoredFilters(),
          i = [...new Set([...r, ...e])];
        this._storeFiltersToLocalStorage(i);
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
        r = [];
      return (
        e.forEach((t) => {
          try {
            const e = t.getAttribute("data-filter-multi-select-options");
            if (e) {
              const t = JSON.parse(e);
              t.name && r.push(t.name);
            }
          } catch (e) {
            console.warn(
              "ListingListener: Failed to parse filter options for item:",
              t,
              e
            );
          }
        }),
        r
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
              const r = this._getFilterNameFromItem(e);
              r && t.includes(r) && this._hideFilterItem(e);
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
                const r = this._getFilterNameFromItem(e);
                r &&
                  (t.includes(r)
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
              const r = this._getFilterNameFromItem(e);
              r && t.includes(r) && this._showFilterItem(e);
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
        const r = t.closest("[data-filter-multi-select-options]");
        if (r) {
          const t = r.getAttribute("data-filter-multi-select-options");
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
            r = this._findFilterPanelContainers(),
            i = this._findFilterPanelContainers(e);
          this._extractAndMergeFilters(e);
          const n = new Map();
          i.forEach((t, e) => {
            const r = this._getContainerIdentifier(t) || `panel-${e}`;
            n.set(r, t);
          }),
            r.forEach((t, e) => {
              const r = this._getContainerIdentifier(t) || `panel-${e}`,
                s = n.get(r);
              if (s) this._updateFilterPanelSelectively(t, s);
              else {
                const r = i[e];
                r && this._updateFilterPanelSelectively(t, r);
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
      const r = this._getInputStates(t);
      (t.innerHTML = e.innerHTML),
        this._restoreInputStates(t, r),
        this._buildLabels();
    }
    _updateFilterPanelSelectively(t, e) {
      const r = this._getInputStates(t);
      if (this.options.enabled) {
        const r = this._createExistingSectionMap(t);
        this._replaceFilterStructureCompletely(t, e, r);
      }
      this._reregisterExistingFilters(t), this._restoreInputStates(t, r, !1);
    }
    _synchronizeFilterStructure(t, e) {
      const r = t.querySelectorAll("[data-filter-multi-select-options]"),
        i = e.querySelectorAll("[data-filter-multi-select-options]"),
        n = this._createFilterElementsMap(r),
        s = this._createFilterElementsMap(i);
      Object.keys(s).forEach((t) => {
        const e = n[t],
          r = s[t];
        e && r && this._synchronizeFilterDropdownStructure(e, r);
      });
    }
    _synchronizeFilterDropdownStructure(t, e) {
      const r = t.querySelector(".filter-panel-item-dropdown"),
        i = e.querySelector(".filter-panel-item-dropdown");
      if (!r || !i) return;
      const n = this._getDropdownStructureMap(r),
        s = this._getDropdownStructureMap(i);
      this._addMissingStructuralElements(r, s, n);
    }
    _createFilterElementsMap(t) {
      const e = {};
      return (
        t.forEach((t) => {
          const r = t.getAttribute("data-filter-multi-select-options");
          if (r)
            try {
              const i = JSON.parse(r);
              i.name && (e[i.name] = t);
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
        Array.from(t.children).forEach((t, r) => {
          const i = {
            index: r,
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
          e.push(i);
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
    _addMissingStructuralElements(t, e, r) {
      const i = new Map();
      r.forEach((t) => {
        const e = this._createElementSignature(t);
        i.set(e, t);
      }),
        e.forEach((r, n) => {
          const s = this._createElementSignature(r);
          if (!i.has(s) && r.isStructural) {
            const s = r.element.cloneNode(!0),
              l = this._findInsertionPoint(t, e, n, i);
            l ? t.insertBefore(s, l) : t.appendChild(s);
          }
        });
    }
    _createElementSignature(t) {
      if (t.isList) return `list-${t.classes.join("-")}`;
      const e = t.classes.join("-"),
        r = t.textContent.replace(/\s+/g, " ").trim();
      return `${t.tagName}-${e}-${r}`;
    }
    _findInsertionPoint(t, e, r, i) {
      for (let t = r + 1; t < e.length; t++) {
        const r = e[t],
          n = this._createElementSignature(r);
        if (i.has(n)) return i.get(n).element;
      }
      return null;
    }
    _updateFilterMultiSelectElements(t, e) {
      const r = t.querySelectorAll("[data-filter-multi-select]"),
        i = e.querySelectorAll("[data-filter-multi-select]"),
        n = this._createFilterMultiSelectMap(r),
        s = this._createFilterMultiSelectMap(i);
      Object.keys(n).forEach((t) => {
        s[t] || this._hideFilterItem(n[t]);
      }),
        Object.keys(s).forEach((e) => {
          if (n[e]) this._showFilterItem(n[e]);
          else {
            const r = s[e].cloneNode(!0);
            t.appendChild(r), r.setAttribute("data-needs-init", "true");
          }
        });
    }
    _updateFilterListItemElements(t, e) {
      const r = t.querySelectorAll(".filter-multi-select-list-item"),
        i = e.querySelectorAll(".filter-multi-select-list-item"),
        n = this._createFilterListItemMap(r),
        s = this._createFilterListItemMap(i);
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
          const r = t.getAttribute("data-filter-multi-select-options");
          if (r)
            try {
              const i = JSON.parse(r);
              if (i.name) {
                const r = `filter-multi-select-${i.name}`;
                e[r] = t;
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
          const r = t.querySelector("input[data-label]"),
            i = r ? r.getAttribute("data-label") : null;
          if (i) {
            const r = t.closest("[data-filter-multi-select]");
            let n = "unknown";
            if (r) {
              const t = r.getAttribute("data-filter-multi-select-options");
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
            e[`${n}-${i}`] = t;
          }
        }),
        e
      );
    }
    _updateFilterDropdownContent(t, e) {
      const r = t.querySelector(".filter-panel-item-dropdown"),
        i = e.querySelector(".filter-panel-item-dropdown");
      if (r && i) {
        const t = this._getInputStates(r);
        this._mergeDropdownContent(r, i), this._restoreInputStates(r, t, !1);
      }
    }
    _updateFilterListItemContent(t, e) {
      const r = t.querySelector("label"),
        i = e.querySelector("label");
      r &&
        i &&
        r.textContent !== i.textContent &&
        (r.textContent = i.textContent);
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
      const r = t.querySelectorAll("[data-filter-multi-select-options]");
      for (const t of r)
        try {
          const r = t.getAttribute("data-filter-multi-select-options");
          if (r && JSON.parse(r).name === e) return t;
        } catch (t) {
          continue;
        }
      return null;
    }
    _findTargetListForNewItem(t, e, r) {
      const i = e.closest(".filter-panel-item-dropdown"),
        n = i ? this._findTargetContainer(i, t) : t,
        s = e.closest("ul.filter-multi-select-list");
      if (s) {
        let t = null,
          e = null,
          r = s.previousElementSibling;
        for (; r && !t; ) {
          if (
            r.tagName &&
            !r.classList.contains("filter-multi-select-list-item") &&
            r.textContent.trim()
          ) {
            (t = r), (e = r.textContent.trim());
            break;
          }
          r = r.previousElementSibling;
        }
        if (t && e) {
          const r = this._findSectionByText(n, e, t.tagName);
          if (r) return r;
        }
      }
      const l = n.querySelectorAll("ul.filter-multi-select-list");
      if (1 === l.length) return l[0];
      if (l.length > 1) {
        const t = r
          .querySelector("input[data-label]")
          ?.getAttribute("data-label");
        if (t)
          for (const e of l) {
            const r = e.querySelectorAll("input[data-label]");
            for (const i of r) {
              const r = i.getAttribute("data-label");
              if (this._labelsSeemRelated(t, r)) return e;
            }
          }
        return l[0];
      }
      return null;
    }
    _findSectionByText(t, e, r) {
      const i = t.querySelectorAll(r.toLowerCase());
      for (const t of i)
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
      const r = /^\d+(-\d+)?$/;
      if (r.test(t) && r.test(e)) return !0;
      const i = /^\d*XL[K]?$/;
      if (i.test(t) && i.test(e)) return !0;
      const n = /^\d+\/\d+$/;
      return (
        !(!n.test(t) || !n.test(e)) ||
        !(!t.startsWith("W") || !e.startsWith("W"))
      );
    }
    _addNewFilterListItem(t, e) {
      const r = e
        .closest("[data-filter-multi-select]")
        ?.getAttribute("data-filter-multi-select-options");
      if (!r) return;
      let i;
      try {
        i = JSON.parse(r).name;
      } catch (t) {
        return void console.warn(
          "ListingListener: Failed to parse parent options",
          t
        );
      }
      if (!i) return;
      const n = this._findFilterElementByName(t, i);
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
          const r = this._getFilterItemKey(t);
          r && (e[r] = t);
        }),
        e
      );
    }
    _getFilterItemKey(t) {
      const e = t.querySelector("input[name]"),
        r = t.querySelector(".filter-panel-item-toggle");
      return e
        ? `input-${e.name}`
        : r
          ? `toggle-${r.textContent.trim()}`
          : null;
    }
    _getInputStates(t) {
      const e = new Map();
      return (
        t.querySelectorAll("input").forEach((t) => {
          const r =
            "checkbox" === t.type || "radio" === t.type
              ? t.name + "_" + t.value
              : t.name;
          e.set(r, { checked: t.checked, value: t.value });
        }),
        e
      );
    }
    _restoreInputStates(t, e, r = !0) {
      t.querySelectorAll("input").forEach((t) => {
        const i =
          "checkbox" === t.type || "radio" === t.type
            ? t.name + "_" + t.value
            : t.name;
        if (e.has(i)) {
          const n = e.get(i);
          "checkbox" === t.type || "radio" === t.type
            ? (t.checked = n.checked)
            : (t.value = n.value),
            r &&
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
      const r = t.querySelectorAll(".filter-multi-select-list-item"),
        i = e.querySelectorAll(".filter-multi-select-list-item");
      if (r.length !== i.length) {
        const r = t.querySelector(".filter-panel-item-dropdown"),
          i = e.querySelector(".filter-panel-item-dropdown");
        if (r && i) {
          const t = this._getInputStates(r);
          this._mergeDropdownContent(r, i), this._restoreInputStates(r, t, !1);
        }
      }
    }
    _mergeDropdownContent(t, e) {
      const r = this._getDropdownItemsMap(t),
        i = (this._getDropdownItemsMap(e), document.createElement("div"));
      for (
        e.querySelectorAll(".filter-multi-select-list-item").forEach((e, n) => {
          const s = this._getDropdownItemKey(e);
          if (r[s]) {
            const t = r[s],
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
              i.appendChild(t);
          } else {
            const r = e.cloneNode(!0);
            i.appendChild(r), this._attachEventHandlersToNewItem(r, t);
          }
        }),
          t.innerHTML = "";
        i.firstChild;

      )
        t.appendChild(i.firstChild);
    }
    _getDropdownItemsMap(t) {
      const e = {};
      return (
        t.querySelectorAll(".filter-multi-select-list-item").forEach((t) => {
          const r = this._getDropdownItemKey(t);
          r && (e[r] = t);
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
      const r = t.querySelector("label");
      return r ? `label-${r.textContent.trim()}` : null;
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
      const r = window.PluginManager.getPluginInstanceFromElement(e, "Listing");
      r &&
        r.registerFilter &&
        t
          .querySelectorAll(
            "[data-filter-multi-select], [data-filter-range-slider], [data-filter-boolean]"
          )
          .forEach((t) => {
            const e = t.hasAttribute("data-needs-reinit"),
              i = ["FilterMultiSelect", "FilterRangeSlider", "FilterBoolean"];
            for (const n of i)
              try {
                const i = window.PluginManager.getPluginInstanceFromElement(
                  t,
                  n
                );
                if (i) {
                  "function" == typeof r.registerFilter && r.registerFilter(i),
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
      const r = t.closest("ul.filter-multi-select-list");
      if (!r) return { list: null };
      const i = t.closest(".filter-panel-item-dropdown");
      if (!i) return { list: null };
      const n = this._ensureWrapperStructureExists(i, e),
        s = [];
      let l = r.previousElementSibling;
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
      const o = this._findSectionInsertionPoint(n, i, r);
      let a = null;
      s.forEach((t) => {
        const e = t.cloneNode(!0);
        o ? n.insertBefore(e, o) : n.appendChild(e), (a = e);
      });
      const c = r.cloneNode(!1);
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
    _findSectionInsertionPoint(t, e, r) {
      let i = r.nextElementSibling;
      for (; i; ) {
        if (
          i.tagName &&
          !i.classList.contains("filter-multi-select-list-item")
        ) {
          const e = this._createElementSignatureFromElement(i),
            r = Array.from(t.children);
          for (const t of r)
            if (this._createElementSignatureFromElement(t) === e) return t;
        }
        i = i.nextElementSibling;
      }
      return null;
    }
    _ensureSectionStructureExists(t, e) {
      return this._sectionExistsForItem(t, e)
        ? null
        : this._createMissingSectionStructure(t, e);
    }
    _sectionExistsForItem(t, e) {
      const r = t.closest("ul.filter-multi-select-list");
      if (!r) return !0;
      const i = t.closest(".filter-panel-item-dropdown");
      if (!i) return !0;
      const n = this._findTargetContainer(i, e);
      let s = null,
        l = null,
        o = r.previousElementSibling;
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
      const r = this._getStructuralPath(t);
      let i = e;
      return (
        r.forEach((t) => {
          const e = this._findWrapperInContainer(i, t);
          e && (i = e);
        }),
        i
      );
    }
    _ensureWrapperStructureExists(t, e) {
      const r = this._getStructuralPath(t);
      let i = e;
      return (
        r.forEach((t) => {
          const e = this._findWrapperInContainer(i, t);
          if (e) i = e;
          else {
            const e = this._createWrapperElement(t);
            i.appendChild(e), (i = e);
          }
        }),
        i
      );
    }
    _getStructuralPath(t) {
      const e = [];
      return (
        Array.from(t.children).forEach((t) => {
          if (this._isWrapperElement(t)) {
            const r = {
              tagName: t.tagName.toLowerCase(),
              classes: Array.from(t.classList),
              signature: this._createElementSignatureFromElement(t),
            };
            e.push(r);
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
        r = t.querySelectorAll(
          ":scope > *:not(.filter-multi-select-list-item)"
        );
      return e.length > 0 || r.length > 1;
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
            const r = t.querySelector(".filter-panel-item-dropdown");
            r &&
              this._findTargetContainerInExisting(r)
                .querySelectorAll("*")
                .forEach((t) => {
                  if (
                    t.textContent.trim() &&
                    !t.classList.contains("filter-multi-select-list-item") &&
                    "ul" !== t.tagName.toLowerCase()
                  ) {
                    const r = t.textContent.trim();
                    let i = t.nextElementSibling;
                    for (; i; ) {
                      if (
                        "ul" === i.tagName.toLowerCase() &&
                        i.classList.contains("filter-multi-select-list")
                      ) {
                        const t = Array.from(
                          i.querySelectorAll(".filter-multi-select-list-item")
                        ).map((t) => t.cloneNode(!0));
                        t.length > 0 &&
                          (e.has(r) || e.set(r, []), e.get(r).push(...t));
                        break;
                      }
                      if (
                        i.textContent.trim() &&
                        !i.classList.contains(
                          "filter-multi-select-list-item"
                        ) &&
                        "ul" !== i.tagName.toLowerCase()
                      )
                        break;
                      i = i.nextElementSibling;
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
            const r = t.querySelector(".filter-panel-item-dropdown");
            if (!r) return;
            const i = this._findTargetContainer(null, r) || r;
            e.forEach((t, e) => {
              const r = this._findSectionByTextInContainer(i, e);
              r &&
                (this._removeItemsFromIncorrectSections(i, t, e),
                t.forEach((t) => {
                  this._itemExistsInList(r, t) ||
                    r.appendChild(t.cloneNode(!0));
                }));
            });
          });
    }
    _findSectionByTextInContainer(t, e) {
      const r = t.querySelectorAll("*");
      for (const t of r)
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
    _removeItemsFromIncorrectSections(t, e, r) {
      t.querySelectorAll("ul.filter-multi-select-list").forEach((t) => {
        this._getSectionTextForList(t) !== r &&
          Array.from(
            t.querySelectorAll(".filter-multi-select-list-item")
          ).forEach((t) => {
            const r = this._getItemLabel(t);
            e.some((t) => this._getItemLabel(t) === r) && t.remove();
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
      const r = this._getItemLabel(e),
        i = t.querySelectorAll(".filter-multi-select-list-item");
      return Array.from(i).some((t) => this._getItemLabel(t) === r);
    }
    _getItemLabel(t) {
      const e = t.querySelector("input[data-label]");
      return e ? e.getAttribute("data-label") : null;
    }
    _replaceFilterStructureCompletely(t, e, r) {
      const i = t.querySelectorAll("[data-filter-multi-select-options]"),
        n = e.querySelectorAll("[data-filter-multi-select-options]"),
        s = this._createFilterElementsMap(i),
        l = this._createFilterElementsMap(n);
      Object.keys(l).forEach((e) => {
        const i = s[e],
          n = l[e];
        i && n
          ? this._replaceFilterDropdownStructure(i, n, r)
          : n && !i && t.appendChild(n);
      }),
        Object.keys(s).forEach((t) => {
          if (l[t]) {
            const e = s[t];
            e.classList.contains("filter-panel-item-hidden") &&
              e.classList.remove("filter-panel-item-hidden");
          } else s[t].classList.add("filter-panel-item-hidden");
        });
    }
    _replaceFilterDropdownStructure(t, e, r) {
      const i = t.querySelector(".filter-panel-item-dropdown"),
        n = e.querySelector(".filter-panel-item-dropdown");
      if (!i || !n) return;
      const s = this._buildCompleteStructureFromNew(n, r);
      (i.innerHTML = ""),
        s.forEach((t) => {
          i.appendChild(t);
        }),
        this._attachEventHandlersToNewDropdown(i);
    }
    _attachEventHandlersToNewDropdown(t) {
      t.querySelectorAll(".filter-multi-select-list-item").forEach((e) => {
        this._attachEventHandlersToNewItem(e, t);
      });
    }
    _buildCompleteStructureFromNew(t, e) {
      const r = [];
      return (
        Array.from(t.children).forEach((t) => {
          if (this._isWrapperElement(t)) {
            const i = t.cloneNode(!1);
            this._buildWrapperContent(t, e).forEach((t) => {
              i.appendChild(t);
            }),
              r.push(i);
          } else {
            const i = this._processStructuralElement(t, e);
            i && r.push(i);
          }
        }),
        r
      );
    }
    _buildWrapperContent(t, e) {
      const r = [],
        i = Array.from(t.children);
      let n = null,
        s = null;
      return (
        i.forEach((t) => {
          if (
            "ul" === t.tagName.toLowerCase() &&
            t.classList.contains("filter-multi-select-list")
          )
            n
              ? ((s = this._createListForSection(t, n, e)), r.push(s))
              : ((s = this._createListWithExistingItems(t, e)), r.push(s));
          else if (
            t.textContent.trim() &&
            !t.classList.contains("filter-multi-select-list-item")
          ) {
            n = t.textContent.trim();
            const e = t.cloneNode(!0);
            r.push(e);
          } else {
            const e = t.cloneNode(!0);
            r.push(e);
          }
        }),
        r
      );
    }
    _createListForSection(t, e, r) {
      const i = t.cloneNode(!1),
        n = new Map();
      return (
        r.has(e) &&
          r.get(e).forEach((t) => {
            const e = this._getItemLabel(t);
            if (e) {
              const r = t.querySelector("input");
              n.set(e, { element: t, checked: !!r && r.checked });
            }
          }),
        Array.from(t.children).forEach((t) => {
          const e = this._getItemLabel(t),
            r = t.cloneNode(!0);
          if (e && n.has(e)) {
            const t = n.get(e),
              i = r.querySelector("input");
            i && t.checked && (i.checked = !0);
          }
          i.appendChild(r);
        }),
        i
      );
    }
    _createListWithExistingItems(t, e) {
      const r = t.cloneNode(!1),
        i = Array.from(t.children);
      let n = null;
      if (
        (e.forEach((t, e) => {
          const r = i.reduce((e, r) => {
            const i = this._getItemLabel(r);
            return t.some((t) => this._getItemLabel(t) === i) ? e + 1 : e;
          }, 0);
          r > 0 && (!n || r > n.count) && (n = { section: e, count: r });
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
              const r = t.querySelector("input");
              s.set(e, { element: t, checked: !!r && r.checked });
            }
          });
        }),
        i.forEach((t) => {
          const e = this._getItemLabel(t),
            i = t.cloneNode(!0);
          if (e && s.has(e)) {
            const t = s.get(e),
              r = i.querySelector("input");
            r && t.checked && (r.checked = !0);
          }
          r.appendChild(i);
        }),
        r
      );
    }
    _processStructuralElement(t, e) {
      return "ul" === t.tagName.toLowerCase() &&
        t.classList.contains("filter-multi-select-list")
        ? this._createListWithExistingItems(t, e)
        : t.cloneNode(!0);
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    if (window.PluginManager) {
      try {
        window.PluginManager.register(
          "ListingListener",
          l,
          "[data-listing-listener]"
        );
      } catch (t) {
        console.error("Error registering ListingListener", t);
      }
      window.PluginManager.getPlugin("Listing") &&
        window.PluginManager.override(
          "Listing",
          () => n.e(773).then(n.bind(n, 773)),
          "[data-listing]"
        ),
        window.PluginManager.initializePlugins();
    }
  });
})();
