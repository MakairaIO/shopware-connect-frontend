(() => {
  "use strict";
  var e,
    t,
    r = {
      139: (e, t, r) => {
        r.d(t, { A: () => i });
        var n = r(747);
        class i {
          static isNode(e) {
            return (
              "object" == typeof e &&
              null !== e &&
              (e === document || e === window || e instanceof Node)
            );
          }
          static hasAttribute(e, t) {
            if (!i.isNode(e))
              throw new Error("The element must be a valid HTML Node!");
            return "function" == typeof e.hasAttribute && e.hasAttribute(t);
          }
          static getAttribute(e, t, r = !0) {
            if (r && !1 === i.hasAttribute(e, t))
              throw new Error(`The required property "${t}" does not exist!`);
            if ("function" == typeof e.getAttribute) return e.getAttribute(t);
            if (r)
              throw new Error(
                "This node doesn't support the getAttribute function!"
              );
          }
          static getDataAttribute(e, t, r = !0) {
            const o = t.replace(/^data(|-)/, ""),
              s = n.A.toLowerCamelCase(o, "-");
            if (!i.isNode(e)) {
              if (r)
                throw new Error("The passed node is not a valid HTML Node!");
              return;
            }
            if (void 0 === e.dataset) {
              if (r)
                throw new Error(
                  "This node doesn't support the dataset attribute!"
                );
              return;
            }
            const a = e.dataset[s];
            if (void 0 === a) {
              if (r)
                throw new Error(
                  `The required data attribute "${t}" does not exist on ${e}!`
                );
              return a;
            }
            return n.A.parsePrimitive(a);
          }
          static querySelector(e, t, r = !0) {
            if (r && !i.isNode(e))
              throw new Error("The parent node is not a valid HTML Node!");
            const n = e.querySelector(t) || !1;
            if (r && !1 === n)
              throw new Error(
                `The required element "${t}" does not exist in parent node!`
              );
            return n;
          }
          static querySelectorAll(e, t, r = !0) {
            if (r && !i.isNode(e))
              throw new Error("The parent node is not a valid HTML Node!");
            let n = e.querySelectorAll(t);
            if ((0 === n.length && (n = !1), r && !1 === n))
              throw new Error(
                `At least one item of "${t}" must exist in parent node!`
              );
            return n;
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
      194: (e, t, r) => {
        r.d(t, { A: () => c });
        var n = r(744),
          i = r.n(n),
          o = r(139),
          s = r(747);
        class a {
          constructor(e = document) {
            (this._el = e), (e.$emitter = this), (this._listeners = []);
          }
          publish(e, t = {}, r = !1) {
            const n = new CustomEvent(e, { detail: t, cancelable: r });
            return this.el.dispatchEvent(n), n;
          }
          subscribe(e, t, r = {}) {
            const n = this,
              i = e.split(".");
            let o = r.scope ? t.bind(r.scope) : t;
            if (r.once && !0 === r.once) {
              const t = o;
              o = function (r) {
                n.unsubscribe(e), t(r);
              };
            }
            return (
              this.el.addEventListener(i[0], o),
              this.listeners.push({ splitEventName: i, opts: r, cb: o }),
              !0
            );
          }
          unsubscribe(e) {
            const t = e.split(".");
            return (
              (this.listeners = this.listeners.reduce(
                (e, r) =>
                  [...r.splitEventName].sort().toString() ===
                  t.sort().toString()
                    ? (this.el.removeEventListener(r.splitEventName[0], r.cb),
                      e)
                    : (e.push(r), e),
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
        class c {
          constructor(e, t = {}, r = !1) {
            if (!o.A.isNode(e))
              throw new Error("There is no valid element given.");
            (this.el = e),
              (this.$emitter = new a(this.el)),
              (this._pluginName = this._getPluginName(r)),
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
            const t = s.A.toDashCase(this._pluginName),
              r = o.A.getDataAttribute(this.el, `data-${t}-config`, !1),
              n = o.A.getAttribute(this.el, `data-${t}-options`, !1),
              a = [this.constructor.options, this.options, e];
            r && a.push(window.PluginConfigManager.get(this._pluginName, r));
            try {
              n && a.push(JSON.parse(n));
            } catch (e) {
              throw (
                (console.error(this.el),
                new Error(
                  `The data attribute "data-${t}-options" could not be parsed to json: ${e.message}`
                ))
              );
            }
            return i().all(
              a
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
                    return e.$$typeof === r;
                  })(e)
                );
              })(e)
            );
          },
          r =
            "function" == typeof Symbol && Symbol.for
              ? Symbol.for("react.element")
              : 60103;
        function n(e, t) {
          return !1 !== t.clone && t.isMergeableObject(e)
            ? a(((r = e), Array.isArray(r) ? [] : {}), e, t)
            : e;
          var r;
        }
        function i(e, t, r) {
          return e.concat(t).map(function (e) {
            return n(e, r);
          });
        }
        function o(e) {
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
        function s(e, t) {
          try {
            return t in e;
          } catch (e) {
            return !1;
          }
        }
        function a(e, r, c) {
          ((c = c || {}).arrayMerge = c.arrayMerge || i),
            (c.isMergeableObject = c.isMergeableObject || t),
            (c.cloneUnlessOtherwiseSpecified = n);
          var l = Array.isArray(r);
          return l === Array.isArray(e)
            ? l
              ? c.arrayMerge(e, r, c)
              : (function (e, t, r) {
                  var i = {};
                  return (
                    r.isMergeableObject(e) &&
                      o(e).forEach(function (t) {
                        i[t] = n(e[t], r);
                      }),
                    o(t).forEach(function (o) {
                      (function (e, t) {
                        return (
                          s(e, t) &&
                          !(
                            Object.hasOwnProperty.call(e, t) &&
                            Object.propertyIsEnumerable.call(e, t)
                          )
                        );
                      })(e, o) ||
                        (s(e, o) && r.isMergeableObject(t[o])
                          ? (i[o] = (function (e, t) {
                              if (!t.customMerge) return a;
                              var r = t.customMerge(e);
                              return "function" == typeof r ? r : a;
                            })(o, r)(e[o], t[o], r))
                          : (i[o] = n(t[o], r)));
                    }),
                    i
                  );
                })(e, r, c)
            : n(r, c);
        }
        a.all = function (e, t) {
          if (!Array.isArray(e))
            throw new Error("first argument should be an array");
          return e.reduce(function (e, r) {
            return a(e, r, t);
          }, {});
        };
        var c = a;
        e.exports = c;
      },
      747: (e, t, r) => {
        r.d(t, { A: () => n });
        class n {
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
            const r = n.toUpperCamelCase(e, t);
            return n.lcFirst(r);
          }
          static toUpperCamelCase(e, t) {
            return t
              ? e
                  .split(t)
                  .map((e) => n.ucFirst(e.toLowerCase()))
                  .join("")
              : n.ucFirst(e.toLowerCase());
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
    n = {};
  function i(e) {
    var t = n[e];
    if (void 0 !== t) return t.exports;
    var o = (n[e] = { exports: {} });
    return r[e](o, o.exports, i), o.exports;
  }
  (i.m = r),
    (i.n = (e) => {
      var t = e && e.__esModule ? () => e.default : () => e;
      return i.d(t, { a: t }), t;
    }),
    (i.d = (e, t) => {
      for (var r in t)
        i.o(t, r) &&
          !i.o(e, r) &&
          Object.defineProperty(e, r, { enumerable: !0, get: t[r] });
    }),
    (i.f = {}),
    (i.e = (e) =>
      Promise.all(Object.keys(i.f).reduce((t, r) => (i.f[r](e, t), t), []))),
    (i.u = (e) => e + ".makaira-shopware6-storefront.js"),
    (i.g = (function () {
      if ("object" == typeof globalThis) return globalThis;
      try {
        return this || new Function("return this")();
      } catch (e) {
        if ("object" == typeof window) return window;
      }
    })()),
    (i.o = (e, t) => Object.prototype.hasOwnProperty.call(e, t)),
    (e = {}),
    (t = "makaira-shopware6-storefront:"),
    (i.l = (r, n, o, s) => {
      if (e[r]) e[r].push(n);
      else {
        var a, c;
        if (void 0 !== o)
          for (
            var l = document.getElementsByTagName("script"), u = 0;
            u < l.length;
            u++
          ) {
            var d = l[u];
            if (
              d.getAttribute("src") == r ||
              d.getAttribute("data-webpack") == t + o
            ) {
              a = d;
              break;
            }
          }
        a ||
          ((c = !0),
          ((a = document.createElement("script")).charset = "utf-8"),
          (a.timeout = 120),
          i.nc && a.setAttribute("nonce", i.nc),
          a.setAttribute("data-webpack", t + o),
          (a.src = r)),
          (e[r] = [n]);
        var h = (t, n) => {
            (a.onerror = a.onload = null), clearTimeout(p);
            var i = e[r];
            if (
              (delete e[r],
              a.parentNode && a.parentNode.removeChild(a),
              i && i.forEach((e) => e(n)),
              t)
            )
              return t(n);
          },
          p = setTimeout(
            h.bind(null, void 0, { type: "timeout", target: a }),
            12e4
          );
        (a.onerror = h.bind(null, a.onerror)),
          (a.onload = h.bind(null, a.onload)),
          c && document.head.appendChild(a);
      }
    }),
    (i.r = (e) => {
      "undefined" != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
        Object.defineProperty(e, "__esModule", { value: !0 });
    }),
    (() => {
      var e;
      i.g.importScripts && (e = i.g.location + "");
      var t = i.g.document;
      if (
        !e &&
        t &&
        (t.currentScript &&
          "SCRIPT" === t.currentScript.tagName.toUpperCase() &&
          (e = t.currentScript.src),
        !e)
      ) {
        var r = t.getElementsByTagName("script");
        if (r.length)
          for (var n = r.length - 1; n > -1 && (!e || !/^http(s?):/.test(e)); )
            e = r[n--].src;
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
        (i.p = e);
    })(),
    (() => {
      var e = { 792: 0 };
      i.f.j = (t, r) => {
        var n = i.o(e, t) ? e[t] : void 0;
        if (0 !== n)
          if (n) r.push(n[2]);
          else {
            var o = new Promise((r, i) => (n = e[t] = [r, i]));
            r.push((n[2] = o));
            var s = i.p + i.u(t),
              a = new Error();
            i.l(
              s,
              (r) => {
                if (i.o(e, t) && (0 !== (n = e[t]) && (e[t] = void 0), n)) {
                  var o = r && ("load" === r.type ? "missing" : r.type),
                    s = r && r.target && r.target.src;
                  (a.message =
                    "Loading chunk " + t + " failed.\n(" + o + ": " + s + ")"),
                    (a.name = "ChunkLoadError"),
                    (a.type = o),
                    (a.request = s),
                    n[1](a);
                }
              },
              "chunk-" + t,
              t
            );
          }
      };
      var t = (t, r) => {
          var n,
            o,
            [s, a, c] = r,
            l = 0;
          if (s.some((t) => 0 !== e[t])) {
            for (n in a) i.o(a, n) && (i.m[n] = a[n]);
            c && c(i);
          }
          for (t && t(r); l < s.length; l++)
            (o = s[l]), i.o(e, o) && e[o] && e[o][0](), (e[o] = 0);
        },
        r = (self.webpackChunkmakaira_shopware6_storefront =
          self.webpackChunkmakaira_shopware6_storefront || []);
      r.forEach(t.bind(null, 0)), (r.push = t.bind(null, r.push.bind(r)));
    })();
  var o = i(194);
  class s extends o.A {
    static sidebarFilterSelector = ".cms-element-sidebar-filter";
    init() {
      this._registerEvents();
    }
    _registerEvents() {
      this.$emitter.subscribe("Listing/afterRenderResponse", (e) => {
        this._swapContent(e.detail.response);
      });
    }
    _swapContent(e) {
      const t = new DOMParser()
        .parseFromString(e, "text/html")
        .querySelector(".filter-panel-items-container");
      if (t) {
        const e = document.querySelector(".filter-panel-items-container");
        if (e) {
          const r = e.querySelectorAll("input"),
            n = new Map();
          r.forEach((e) => {
            const t =
              "checkbox" === e.type || "radio" === e.type
                ? e.name + "_" + e.value
                : e.name;
            n.set(t, { checked: e.checked, value: e.value });
          }),
            (e.innerHTML = t.innerHTML),
            e.querySelectorAll("input").forEach((e) => {
              const t =
                "checkbox" === e.type || "radio" === e.type
                  ? e.name + "_" + e.value
                  : e.name;
              if (n.has(t)) {
                const r = n.get(t);
                "checkbox" === e.type || "radio" === e.type
                  ? (e.checked = r.checked)
                  : (e.value = r.value),
                  e.dispatchEvent(
                    new Event(
                      "checkbox" === e.type || "radio" === e.type
                        ? "change"
                        : "input",
                      { bubbles: !0 }
                    )
                  );
              }
            }),
            window.PluginManager.initializePlugins();
        }
      }
    }
    _onAfterRenderResponse({ response: e }) {}
    afterContentChange() {
      console.log("ListingListener afterContentChange");
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    window.PluginManager &&
      (window.PluginManager.getPlugin("ListingListener") ||
        window.PluginManager.register(
          "ListingListener",
          s,
          "[data-listing-listener]"
        ),
      window.PluginManager.getPlugin("Listing") &&
        window.PluginManager.override(
          "Listing",
          () => i.e(773).then(i.bind(i, 773)),
          "[data-listing]"
        ),
      window.PluginManager.initializePlugins());
  });
})();
