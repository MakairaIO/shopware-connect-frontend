"use strict";
(self.webpackChunkmakaira_shopware6_storefront =
  self.webpackChunkmakaira_shopware6_storefront || []).push([
  [773],
  {
    773: (e, t, r) => {
      r.r(t), r.d(t, { default: () => I });
      var s = {};
      r.r(s),
        r.d(s, {
          exclude: () => j,
          extract: () => E,
          parse: () => w,
          parseUrl: () => R,
          pick: () => P,
          stringify: () => S,
          stringifyUrl: () => C,
        });
      var i = r(194);
      class n {
        constructor() {
          (this._request = null), (this._errorHandlingInternal = !1);
        }
        get(e, t, r = "application/json") {
          const s = this._createPreparedRequest("GET", e, r);
          return this._sendRequest(s, null, t);
        }
        post(e, t, r, s = "application/json") {
          s = this._getContentType(t, s);
          const i = this._createPreparedRequest("POST", e, s);
          return this._sendRequest(i, t, r);
        }
        delete(e, t, r, s = "application/json") {
          s = this._getContentType(t, s);
          const i = this._createPreparedRequest("DELETE", e, s);
          return this._sendRequest(i, t, r);
        }
        patch(e, t, r, s = "application/json") {
          s = this._getContentType(t, s);
          const i = this._createPreparedRequest("PATCH", e, s);
          return this._sendRequest(i, t, r);
        }
        abort() {
          if (this._request) return this._request.abort();
        }
        setErrorHandlingInternal(e) {
          this._errorHandlingInternal = e;
        }
        _registerOnLoaded(e, t) {
          t &&
            (!0 === this._errorHandlingInternal
              ? (e.addEventListener("load", () => {
                  t(e.responseText, e);
                }),
                e.addEventListener("abort", () => {
                  console.warn(`the request to ${e.responseURL} was aborted`);
                }),
                e.addEventListener("error", () => {
                  console.warn(
                    `the request to ${e.responseURL} failed with status ${e.status}`
                  );
                }),
                e.addEventListener("timeout", () => {
                  console.warn(`the request to ${e.responseURL} timed out`);
                }))
              : e.addEventListener("loadend", () => {
                  t(e.responseText, e);
                }));
        }
        _sendRequest(e, t, r) {
          return this._registerOnLoaded(e, r), e.send(t), e;
        }
        _getContentType(e, t) {
          return e instanceof FormData && (t = !1), t;
        }
        _createPreparedRequest(e, t, r) {
          return (
            (this._request = new XMLHttpRequest()),
            this._request.open(e, t),
            this._request.setRequestHeader(
              "X-Requested-With",
              "XMLHttpRequest"
            ),
            r && this._request.setRequestHeader("Content-type", r),
            this._request
          );
        }
      }
      class a {
        static iterate(e, t) {
          if (e instanceof Map) return e.forEach(t);
          if (Array.isArray(e)) return e.forEach(t);
          if (!(e instanceof FormData)) {
            if (e instanceof NodeList) return e.forEach(t);
            if (e instanceof HTMLCollection) return Array.from(e).forEach(t);
            if (e instanceof Object)
              return Object.keys(e).forEach((r) => {
                t(e[r], r);
              });
            throw new Error(`The element type ${typeof e} is not iterable!`);
          }
          for (var r of e.entries()) t(r[1], r[0]);
        }
      }
      var o = r(139);
      const l = "%[a-f0-9]{2}",
        c = new RegExp("(" + l + ")|([^%]+?)", "gi"),
        p = new RegExp("(" + l + ")+", "gi");
      function u(e, t) {
        try {
          return [decodeURIComponent(e.join(""))];
        } catch {}
        if (1 === e.length) return e;
        t = t || 1;
        const r = e.slice(0, t),
          s = e.slice(t);
        return Array.prototype.concat.call([], u(r), u(s));
      }
      function d(e) {
        try {
          return decodeURIComponent(e);
        } catch {
          let t = e.match(c) || [];
          for (let r = 1; r < t.length; r++)
            t = (e = u(t, r).join("")).match(c) || [];
          return e;
        }
      }
      function h(e, t) {
        const r = {};
        if (Array.isArray(t))
          for (const s of t) {
            const t = Object.getOwnPropertyDescriptor(e, s);
            t?.enumerable && Object.defineProperty(r, s, t);
          }
        else
          for (const s of Reflect.ownKeys(e)) {
            const i = Object.getOwnPropertyDescriptor(e, s);
            i.enumerable && t(s, e[s], e) && Object.defineProperty(r, s, i);
          }
        return r;
      }
      function f(e, t) {
        if ("string" != typeof e || "string" != typeof t)
          throw new TypeError("Expected the arguments to be of type `string`");
        if ("" === e || "" === t) return [];
        const r = e.indexOf(t);
        return -1 === r ? [] : [e.slice(0, r), e.slice(r + t.length)];
      }
      const g = (e) => null == e,
        m = (e) =>
          encodeURIComponent(e).replaceAll(
            /[!'()*]/g,
            (e) => `%${e.charCodeAt(0).toString(16).toUpperCase()}`
          ),
        b = Symbol("encodeFragmentIdentifier");
      function y(e) {
        if ("string" != typeof e || 1 !== e.length)
          throw new TypeError(
            "arrayFormatSeparator must be single character string"
          );
      }
      function L(e, t) {
        return t.encode ? (t.strict ? m(e) : encodeURIComponent(e)) : e;
      }
      function _(e, t) {
        return t.decode
          ? (function (e) {
              if ("string" != typeof e)
                throw new TypeError(
                  "Expected `encodedURI` to be of type `string`, got `" +
                    typeof e +
                    "`"
                );
              try {
                return decodeURIComponent(e);
              } catch {
                return (function (e) {
                  const t = { "%FE%FF": "��", "%FF%FE": "��" };
                  let r = p.exec(e);
                  for (; r; ) {
                    try {
                      t[r[0]] = decodeURIComponent(r[0]);
                    } catch {
                      const e = d(r[0]);
                      e !== r[0] && (t[r[0]] = e);
                    }
                    r = p.exec(e);
                  }
                  t["%C2"] = "�";
                  const s = Object.keys(t);
                  for (const r of s) e = e.replace(new RegExp(r, "g"), t[r]);
                  return e;
                })(e);
              }
            })(e)
          : e;
      }
      function v(e) {
        return Array.isArray(e)
          ? e.sort()
          : "object" == typeof e
            ? v(Object.keys(e))
                .sort((e, t) => Number(e) - Number(t))
                .map((t) => e[t])
            : e;
      }
      function F(e) {
        const t = e.indexOf("#");
        return -1 !== t && (e = e.slice(0, t)), e;
      }
      function A(e, t, r) {
        return "string" === r && "string" == typeof e
          ? e
          : "function" == typeof r && "string" == typeof e
            ? r(e)
            : "string[]" === r &&
                "none" !== t.arrayFormat &&
                "string" == typeof e
              ? [e]
              : "number[]" !== r ||
                  "none" === t.arrayFormat ||
                  Number.isNaN(Number(e)) ||
                  "string" != typeof e ||
                  "" === e.trim()
                ? "number" !== r ||
                  Number.isNaN(Number(e)) ||
                  "string" != typeof e ||
                  "" === e.trim()
                  ? !t.parseBooleans ||
                    null === e ||
                    ("true" !== e.toLowerCase() && "false" !== e.toLowerCase())
                    ? t.parseNumbers &&
                      !Number.isNaN(Number(e)) &&
                      "string" == typeof e &&
                      "" !== e.trim()
                      ? Number(e)
                      : e
                    : "true" === e.toLowerCase()
                  : Number(e)
                : [Number(e)];
      }
      function E(e) {
        const t = (e = F(e)).indexOf("?");
        return -1 === t ? "" : e.slice(t + 1);
      }
      function w(e, t) {
        y(
          (t = {
            decode: !0,
            sort: !0,
            arrayFormat: "none",
            arrayFormatSeparator: ",",
            parseNumbers: !1,
            parseBooleans: !1,
            types: Object.create(null),
            ...t,
          }).arrayFormatSeparator
        );
        const r = (function (e) {
            let t;
            switch (e.arrayFormat) {
              case "index":
                return (e, r, s) => {
                  (t = /\[(\d*)]$/.exec(e)),
                    (e = e.replace(/\[\d*]$/, "")),
                    t
                      ? (void 0 === s[e] && (s[e] = {}), (s[e][t[1]] = r))
                      : (s[e] = r);
                };
              case "bracket":
                return (e, r, s) => {
                  (t = /(\[])$/.exec(e)),
                    (e = e.replace(/\[]$/, "")),
                    t
                      ? void 0 !== s[e]
                        ? (s[e] = [...s[e], r])
                        : (s[e] = [r])
                      : (s[e] = r);
                };
              case "colon-list-separator":
                return (e, r, s) => {
                  (t = /(:list)$/.exec(e)),
                    (e = e.replace(/:list$/, "")),
                    t
                      ? void 0 !== s[e]
                        ? (s[e] = [...s[e], r])
                        : (s[e] = [r])
                      : (s[e] = r);
                };
              case "comma":
              case "separator":
                return (t, r, s) => {
                  const i =
                      "string" == typeof r &&
                      r.includes(e.arrayFormatSeparator),
                    n =
                      "string" == typeof r &&
                      !i &&
                      _(r, e).includes(e.arrayFormatSeparator);
                  r = n ? _(r, e) : r;
                  const a =
                    i || n
                      ? r.split(e.arrayFormatSeparator).map((t) => _(t, e))
                      : null === r
                        ? r
                        : _(r, e);
                  s[t] = a;
                };
              case "bracket-separator":
                return (t, r, s) => {
                  const i = /(\[])$/.test(t);
                  if (((t = t.replace(/\[]$/, "")), !i))
                    return void (s[t] = r ? _(r, e) : r);
                  const n =
                    null === r ? [] : _(r, e).split(e.arrayFormatSeparator);
                  void 0 !== s[t] ? (s[t] = [...s[t], ...n]) : (s[t] = n);
                };
              default:
                return (e, t, r) => {
                  void 0 !== r[e] ? (r[e] = [...[r[e]].flat(), t]) : (r[e] = t);
                };
            }
          })(t),
          s = Object.create(null);
        if ("string" != typeof e) return s;
        if (!(e = e.trim().replace(/^[?#&]/, ""))) return s;
        for (const i of e.split("&")) {
          if ("" === i) continue;
          const e = t.decode ? i.replaceAll("+", " ") : i;
          let [n, a] = f(e, "=");
          void 0 === n && (n = e),
            (a =
              void 0 === a
                ? null
                : ["comma", "separator", "bracket-separator"].includes(
                      t.arrayFormat
                    )
                  ? a
                  : _(a, t)),
            r(_(n, t), a, s);
        }
        for (const [e, r] of Object.entries(s))
          if ("object" == typeof r && null !== r && "string" !== t.types[e])
            for (const [s, i] of Object.entries(r)) {
              const n = t.types[e] ? t.types[e].replace("[]", "") : void 0;
              r[s] = A(i, t, n);
            }
          else
            "object" == typeof r && null !== r && "string" === t.types[e]
              ? (s[e] = Object.values(r).join(t.arrayFormatSeparator))
              : (s[e] = A(r, t, t.types[e]));
        return !1 === t.sort
          ? s
          : (!0 === t.sort
              ? Object.keys(s).sort()
              : Object.keys(s).sort(t.sort)
            ).reduce((e, t) => {
              const r = s[t];
              return (
                (e[t] =
                  Boolean(r) && "object" == typeof r && !Array.isArray(r)
                    ? v(r)
                    : r),
                e
              );
            }, Object.create(null));
      }
      function S(e, t) {
        if (!e) return "";
        y(
          (t = {
            encode: !0,
            strict: !0,
            arrayFormat: "none",
            arrayFormatSeparator: ",",
            ...t,
          }).arrayFormatSeparator
        );
        const r = (r) =>
            (t.skipNull && g(e[r])) || (t.skipEmptyString && "" === e[r]),
          s = (function (e) {
            switch (e.arrayFormat) {
              case "index":
                return (t) => (r, s) => {
                  const i = r.length;
                  return void 0 === s ||
                    (e.skipNull && null === s) ||
                    (e.skipEmptyString && "" === s)
                    ? r
                    : null === s
                      ? [...r, [L(t, e), "[", i, "]"].join("")]
                      : [...r, [L(t, e), "[", L(i, e), "]=", L(s, e)].join("")];
                };
              case "bracket":
                return (t) => (r, s) =>
                  void 0 === s ||
                  (e.skipNull && null === s) ||
                  (e.skipEmptyString && "" === s)
                    ? r
                    : null === s
                      ? [...r, [L(t, e), "[]"].join("")]
                      : [...r, [L(t, e), "[]=", L(s, e)].join("")];
              case "colon-list-separator":
                return (t) => (r, s) =>
                  void 0 === s ||
                  (e.skipNull && null === s) ||
                  (e.skipEmptyString && "" === s)
                    ? r
                    : null === s
                      ? [...r, [L(t, e), ":list="].join("")]
                      : [...r, [L(t, e), ":list=", L(s, e)].join("")];
              case "comma":
              case "separator":
              case "bracket-separator": {
                const t = "bracket-separator" === e.arrayFormat ? "[]=" : "=";
                return (r) => (s, i) =>
                  void 0 === i ||
                  (e.skipNull && null === i) ||
                  (e.skipEmptyString && "" === i)
                    ? s
                    : ((i = null === i ? "" : i),
                      0 === s.length
                        ? [[L(r, e), t, L(i, e)].join("")]
                        : [[s, L(i, e)].join(e.arrayFormatSeparator)]);
              }
              default:
                return (t) => (r, s) =>
                  void 0 === s ||
                  (e.skipNull && null === s) ||
                  (e.skipEmptyString && "" === s)
                    ? r
                    : null === s
                      ? [...r, L(t, e)]
                      : [...r, [L(t, e), "=", L(s, e)].join("")];
            }
          })(t),
          i = {};
        for (const [t, s] of Object.entries(e)) r(t) || (i[t] = s);
        const n = Object.keys(i);
        return (
          !1 !== t.sort && n.sort(t.sort),
          n
            .map((r) => {
              const i = e[r];
              return void 0 === i
                ? ""
                : null === i
                  ? L(r, t)
                  : Array.isArray(i)
                    ? 0 === i.length && "bracket-separator" === t.arrayFormat
                      ? L(r, t) + "[]"
                      : i.reduce(s(r), []).join("&")
                    : L(r, t) + "=" + L(i, t);
            })
            .filter((e) => e.length > 0)
            .join("&")
        );
      }
      function R(e, t) {
        t = { decode: !0, ...t };
        let [r, s] = f(e, "#");
        return (
          void 0 === r && (r = e),
          {
            url: r?.split("?")?.[0] ?? "",
            query: w(E(e), t),
            ...(t && t.parseFragmentIdentifier && s
              ? { fragmentIdentifier: _(s, t) }
              : {}),
          }
        );
      }
      function C(e, t) {
        t = { encode: !0, strict: !0, [b]: !0, ...t };
        const r = F(e.url).split("?")[0] || "";
        let s = S({ ...w(E(e.url), { sort: !1 }), ...e.query }, t);
        s &&= `?${s}`;
        let i = (function (e) {
          let t = "";
          const r = e.indexOf("#");
          return -1 !== r && (t = e.slice(r)), t;
        })(e.url);
        if ("string" == typeof e.fragmentIdentifier) {
          const s = new URL(r);
          (s.hash = e.fragmentIdentifier),
            (i = t[b] ? s.hash : `#${e.fragmentIdentifier}`);
        }
        return `${r}${s}${i}`;
      }
      function P(e, t, r) {
        r = { parseFragmentIdentifier: !0, [b]: !1, ...r };
        const { url: s, query: i, fragmentIdentifier: n } = R(e, r);
        return C({ url: s, query: h(i, t), fragmentIdentifier: n }, r);
      }
      function j(e, t, r) {
        return P(
          e,
          Array.isArray(t) ? (e) => !t.includes(e) : (e, r) => !t(e, r),
          r
        );
      }
      const T = s,
        q = Object.freeze(
          new (class {
            constructor() {
              this._domParser = new DOMParser();
            }
            replaceFromMarkup(e, t, r = !0) {
              let s = e;
              "string" == typeof s && (s = this._createMarkupFromString(s)),
                "string" == typeof t && (t = [t]),
                this._replaceSelectors(s, t, r);
            }
            replaceElement(e, t, r = !0) {
              return (
                "string" == typeof e &&
                  (e = o.A.querySelectorAll(document, e, r)),
                "string" == typeof t &&
                  (t = o.A.querySelectorAll(document, t, r)),
                e instanceof NodeList &&
                t instanceof NodeList &&
                t.length > e.length
                  ? (a.iterate(t, (t) => {
                      a.iterate(e, (e) => {
                        e.innerHTML &&
                          e.className === t.className &&
                          (t.innerHTML = e.innerHTML);
                      });
                    }),
                    !0)
                  : e instanceof NodeList
                    ? (a.iterate(e, (e, r) => {
                        e.innerHTML && (t[r].innerHTML = e.innerHTML);
                      }),
                      !0)
                    : t instanceof NodeList
                      ? (a.iterate(t, (t) => {
                          e.innerHTML && (t.innerHTML = e.innerHTML);
                        }),
                        !0)
                      : !!(t && e && e.innerHTML) &&
                        ((t.innerHTML = e.innerHTML), !0)
              );
            }
            _replaceSelectors(e, t, r) {
              a.iterate(t, (t) => {
                const s = o.A.querySelectorAll(e, t, r),
                  i = o.A.querySelectorAll(document, t, r);
                this.replaceElement(s, i, r);
              });
            }
            _createMarkupFromString(e) {
              return this._domParser.parseFromString(e, "text/html");
            }
          })()
        );
      class O {
        static replaceFromMarkup(e, t, r) {
          q.replaceFromMarkup(e, t, r);
        }
        static replaceElement(e, t, r) {
          return q.replaceElement(e, t, r);
        }
      }
      class k {
        static debounce(e, t, r = !1) {
          let s;
          return (...i) => {
            r && !s && setTimeout(e.bind(e, ...i), 0),
              clearTimeout(s),
              (s = setTimeout(e.bind(e, ...i), t));
          };
        }
      }
      class $ extends i.A {
        static options = {
          dataUrl: "",
          filterUrl: "",
          params: {},
          filterPanelSelector: ".filter-panel",
          cmsProductListingSelector: ".cms-element-product-listing",
          cmsProductListingWrapperSelector:
            ".cms-element-product-listing-wrapper",
          cmsProductListingResultsSelector: ".js-listing-wrapper",
          activeFilterContainerSelector: ".filter-panel-active-container",
          activeFilterLabelClass: "filter-active",
          activeFilterLabelClasses: "filter-active btn",
          activeFilterLabelSelector: ".filter-active",
          activeFilterLabelRemoveClass: "filter-active-remove",
          activeFilterLabelPreviewClass: "filter-active-preview",
          resetAllFilterButtonClasses:
            "filter-reset-all btn btn-outline-danger",
          resetAllFilterButtonSelector: ".filter-reset-all",
          loadingIndicatorClass: "is-loading",
          loadingElementLoaderClass: "has-element-loader",
          ariaLiveSelector: ".filter-panel-aria-live",
          ariaLiveUpdates: !0,
          disableEmptyFilter: !1,
          snippets: {
            resetAllButtonText: "Reset all",
            resetAllFiltersAriaLabel: "Reset all filters",
            removeFilterAriaLabel: "Remove filter",
          },
          scrollTopListingWrapper: !0,
          scrollOffset: 15,
        };
        init() {
          (this._registry = []),
            (this.httpClient = new n()),
            (this._urlFilterParams = T.parse(window.location.search)),
            (this._filterPanel = o.A.querySelector(
              document,
              this.options.filterPanelSelector,
              !1
            )),
            (this._filterPanelActive = !!this._filterPanel),
            this._filterPanelActive &&
              ((this._showResetAll = !1),
              (this.activeFilterContainer = o.A.querySelector(
                document,
                this.options.activeFilterContainerSelector
              )),
              (this.ariaLiveContainer = o.A.querySelector(
                document,
                this.options.ariaLiveSelector,
                !1
              ))),
            (this._cmsProductListingWrapper = o.A.querySelector(
              document,
              this.options.cmsProductListingWrapperSelector,
              !1
            )),
            (this._cmsProductListingWrapperActive =
              !!this._cmsProductListingWrapper),
            (this._allFiltersInitializedDebounce = k.debounce(
              this.sendDisabledFiltersRequest.bind(this),
              100
            )),
            this._registerEvents();
        }
        refreshRegistry() {
          const e = this._registry.filter((e) => document.body.contains(e.el));
          this.init(),
            (this._registry = e),
            window.PluginManager.initializePlugins();
        }
        changeListing(e = !0, t = {}) {
          this._buildRequest(e, t),
            this._filterPanelActive && this._buildLabels();
        }
        registerFilter(e) {
          this._registry.push(e),
            this._setFilterState(e),
            this.options.disableEmptyFilter &&
              this._allFiltersInitializedDebounce();
        }
        _setFilterState(e) {
          if (
            Object.keys(this._urlFilterParams).length > 0 &&
            "function" == typeof e.setValuesFromUrl
          ) {
            if (
              !e.setValuesFromUrl(this._urlFilterParams) ||
              !this._filterPanelActive
            )
              return;
            (this._showResetAll = !0), this._buildLabels();
          }
        }
        deregisterFilter(e) {
          this._registry = this._registry.filter((t) => t !== e);
        }
        _fetchValuesOfRegisteredFilters() {
          const e = {};
          return (
            this._registry.forEach((t) => {
              const r = t.getValues();
              Object.keys(r).forEach((t) => {
                Object.prototype.hasOwnProperty.call(e, t)
                  ? Object.values(r[t]).forEach((r) => {
                      e[t].push(r);
                    })
                  : (e[t] = r[t]);
              });
            }),
            e
          );
        }
        _mapFilters(e) {
          const t = {};
          return (
            Object.keys(e).forEach((r) => {
              let s = e[r];
              Array.isArray(s) && (s = s.join("|")),
                `${s}`.length && (t[r] = s);
            }),
            t
          );
        }
        _buildRequest(e = !0, t = {}) {
          const r = this._fetchValuesOfRegisteredFilters(),
            s = this._mapFilters(r);
          this._filterPanelActive &&
            (this._showResetAll = !!Object.keys(s).length),
            this.options.params &&
              Object.keys(this.options.params).forEach((e) => {
                s[e] = this.options.params[e];
              }),
            Object.entries(t).forEach(([e, t]) => {
              s[e] = t;
            });
          let i = T.stringify(s);
          this.sendDataRequest(i),
            delete s.slots,
            delete s["no-aggregations"],
            delete s["reduce-aggregations"],
            delete s["only-aggregations"],
            (i = T.stringify(s)),
            e && this._updateHistory(i),
            this.options.scrollTopListingWrapper && this._scrollTopOfListing();
        }
        _scrollTopOfListing() {
          const e = this._cmsProductListingWrapper.getBoundingClientRect();
          if (e.top >= 0) return;
          const t = e.top + window.scrollY - this.options.scrollOffset;
          window.scrollTo({ top: t, behavior: "smooth" });
        }
        _getDisabledFiltersParamsFromParams(e) {
          const t = Object.assign(
            {},
            { "only-aggregations": 1, "reduce-aggregations": 1 },
            e
          );
          return delete t.p, delete t.order, delete t["no-aggregations"], t;
        }
        _updateHistory(e) {
          window.history.pushState({}, "", `${window.location.pathname}?${e}`);
        }
        _buildLabels() {
          let e = "";
          this._registry.forEach((t) => {
            const r = t.getLabels();
            r.length &&
              r.forEach((t) => {
                e += this.getLabelTemplate(t);
              });
          }),
            (this.activeFilterContainer.innerHTML = e);
          const t = window.Feature.isActive("ACCESSIBILITY_TWEAKS")
            ? o.A.querySelectorAll(
                this.activeFilterContainer,
                this.options.activeFilterLabelSelector,
                !1
              )
            : o.A.querySelectorAll(
                this.activeFilterContainer,
                `.${this.options.activeFilterLabelRemoveClass}`,
                !1
              );
          e.length &&
            (this._registerLabelEvents(t), this.createResetAllButton());
        }
        _registerLabelEvents(e) {
          a.iterate(e, (e) => {
            e.addEventListener("click", () => this.resetFilter(e));
          });
        }
        createResetAllButton() {
          this.activeFilterContainer.insertAdjacentHTML(
            "beforeend",
            this.getResetAllButtonTemplate()
          );
          const e = o.A.querySelector(
            this.activeFilterContainer,
            this.options.resetAllFilterButtonSelector
          );
          e.removeEventListener("click", this.resetAllFilter.bind(this)),
            e.addEventListener("click", this.resetAllFilter.bind(this)),
            this._showResetAll || e.remove();
        }
        resetFilter(e) {
          this._registry.forEach((t) => {
            t.reset(e.dataset.id);
          }),
            this._buildRequest(),
            this._buildLabels();
        }
        resetAllFilter() {
          this._registry.forEach((e) => {
            e.resetAll();
          }),
            this._buildRequest(),
            this._buildLabels();
        }
        getLabelTemplate(e) {
          return window.Feature.isActive("ACCESSIBILITY_TWEAKS")
            ? `\n            <button\n                class="${this.options.activeFilterLabelClasses}"\n                data-id="${e.id}"\n                title="${this.options.snippets.removeFilterAriaLabel}: ${e.label}"\n                aria-label="${this.options.snippets.removeFilterAriaLabel}: ${e.label}">\n                ${this.getLabelPreviewTemplate(e)}\n                ${e.label}\n                <span aria-hidden="true" class="ms-1 fs-4">&times;</span>\n            </button>\n            `
            : `\n        <span class="${this.options.activeFilterLabelClass}">\n            ${this.getLabelPreviewTemplate(e)}\n            <span aria-hidden="true">${e.label}</span>\n            <button class="${this.options.activeFilterLabelRemoveClass}"\n                    data-id="${e.id}"\n                    title="${this.options.snippets.removeFilterAriaLabel}: ${e.label}"\n                    aria-label="${this.options.snippets.removeFilterAriaLabel}: ${e.label}">\n                &times;\n            </button>\n        </span>\n        `;
        }
        getLabelPreviewTemplate(e) {
          const t = this.options.activeFilterLabelPreviewClass;
          return e.previewHex
            ? `\n                <span class="${t}" style="background-color: ${e.previewHex};"></span>\n            `
            : e.previewImageUrl
              ? `\n                <span class="${t}" style="background-image: url('${e.previewImageUrl}');"></span>\n            `
              : "";
        }
        getResetAllButtonTemplate() {
          return `\n        <button class="${this.options.resetAllFilterButtonClasses}" aria-label="${this.options.snippets.resetAllFiltersAriaLabel}">\n            ${this.options.snippets.resetAllButtonText}\n        </button>\n        `;
        }
        addLoadingIndicatorClass() {
          this._filterPanel.classList.add(this.options.loadingIndicatorClass);
        }
        removeLoadingIndicatorClass() {
          this._filterPanel.classList.remove(
            this.options.loadingIndicatorClass
          );
        }
        addLoadingElementLoaderClass() {
          this._cmsProductListingWrapper.classList.add(
            this.options.loadingElementLoaderClass
          );
        }
        removeLoadingElementLoaderClass() {
          this._cmsProductListingWrapper.classList.remove(
            this.options.loadingElementLoaderClass
          );
        }
        sendDataRequest(e) {
          this._filterPanelActive && this.addLoadingIndicatorClass(),
            this._cmsProductListingWrapperActive &&
              this.addLoadingElementLoaderClass(),
            this.options.disableEmptyFilter &&
              this.sendDisabledFiltersRequest(),
            this.httpClient.get(`${this.options.dataUrl}?${e}`, (e) => {
              this.renderResponse(e),
                this._filterPanelActive &&
                  (this.removeLoadingIndicatorClass(), this._updateAriaLive()),
                this._cmsProductListingWrapperActive &&
                  this.removeLoadingElementLoaderClass();
            });
        }
        sendDisabledFiltersRequest() {
          const e = this._fetchValuesOfRegisteredFilters(),
            t = this._mapFilters(e);
          this.options.params &&
            Object.keys(this.options.params).forEach((e) => {
              t[e] = this.options.params[e];
            }),
            (this._allFiltersInitializedDebounce = () => {});
          const r = this._getDisabledFiltersParamsFromParams(t);
          this.httpClient.get(
            `${this.options.filterUrl}?${T.stringify(r)}`,
            (e) => {
              const t = JSON.parse(e);
              this._registry.forEach((e) => {
                "function" == typeof e.refreshDisabledState &&
                  e.refreshDisabledState(t, r);
              });
            }
          );
        }
        renderResponse(e) {
          O.replaceFromMarkup(e, this.options.cmsProductListingSelector, !1),
            this._registry.forEach((e) => {
              "function" == typeof e.afterContentChange &&
                e.afterContentChange();
            }),
            window.PluginManager.initializePlugins(),
            this.$emitter.publish("Listing/afterRenderResponse", {
              response: e,
            });
        }
        _updateAriaLive() {
          if (!this.options.ariaLiveUpdates) return;
          if (!this.ariaLiveContainer) return;
          const e = this.el.querySelector(
            this.options.cmsProductListingResultsSelector
          );
          this.ariaLiveContainer.innerHTML = e.dataset.ariaLiveText;
        }
        _registerEvents() {
          window.onpopstate = this._onWindowPopstate.bind(this);
        }
        _onWindowPopstate() {
          this.refreshRegistry(),
            this._registry.forEach((e) => {
              0 === Object.keys(this._urlFilterParams).length &&
                (this._urlFilterParams.p = 1),
                this._setFilterState(e);
            }),
            this.options.disableEmptyFilter &&
              this._allFiltersInitializedDebounce(),
            this.changeListing(!1);
        }
      }
      class I extends $ {
        init() {
          super.init();
        }
        _buildRequest(e = !0, t = {}) {
          const r = this._fetchValuesOfRegisteredFilters(),
            s = this._mapFilters(r),
            i = document.querySelector('[data-listing-sorting="true"]');
          if (i) {
            const e = i.querySelector("select");
            if (e && e.value) {
              const t = e.name || "order";
              s[t] = e.value;
            }
          }
          this._filterPanelActive &&
            (this._showResetAll = !!Object.keys(s).length),
            this.options.params &&
              Object.keys(this.options.params).forEach((e) => {
                s[e] = this.options.params[e];
              }),
            Object.entries(t).forEach(([e, t]) => {
              s[e] = t;
            });
          let n = new URLSearchParams(s).toString();
          this.sendDataRequest(n),
            delete s.slots,
            delete s["no-aggregations"],
            delete s["reduce-aggregations"],
            delete s["only-aggregations"],
            (n = new URLSearchParams(s).toString()),
            e && this._updateHistory(n),
            this.options.scrollTopListingWrapper && this._scrollTopOfListing();
        }
        _buildLabels() {
          const e = this._cmsProductListingWrapper.baseURI,
            t = new URL(e).searchParams,
            r = [];
          t.forEach((e, t) => {
            e.split("|").forEach((e) => {
              t.startsWith("filter_") && r.push({ id: e, label: e });
            });
          });
          const s = t.get("min-price"),
            i = t.get("max-price");
          s && r.push({ id: "min-price", label: "Preis ab " + s }),
            i && r.push({ id: "max-price", label: "Preis bis " + i });
          let n = "";
          r.forEach((e) => {
            n.includes(e) || (n += this.getLabelTemplate(e));
          }),
            (this.activeFilterContainer.innerHTML = n);
          let a = window.Feature.isActive("ACCESSIBILITY_TWEAKS")
            ? ".filter-active"
            : ".filter-active-remove";
          const o = this.activeFilterContainer.querySelectorAll(a);
          n.length &&
            (this._registerLabelEvents(o), this.createResetAllButton());
        }
        registerFilter(e) {
          this._registry.some((t) => t.options.name === e.options.name) ||
            (this._registry.push(e),
            this._setFilterState(e),
            this.options.disableEmptyFilter &&
              this._allFiltersInitializedDebounce());
        }
      }
    },
  },
]);
//# sourceMappingURL=773.makaira-shopware6-storefront.js.map
