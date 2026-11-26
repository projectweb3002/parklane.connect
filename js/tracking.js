/**
 * Parklane Real Estate — Analytics, Ads Conversion & UTM Attribution (tracking.js)
 * Supports GA4, Meta Pixel, and Google Ads without duplicate script loads or duplicate events.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "parklane_attribution_v1";
  const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  let scriptsInitialized = false;
  const firedLeadForms = new Set();

  function isConfigured(value) {
    return (
      typeof value === "string" &&
      value.trim().length > 0 &&
      !value.startsWith("YOUR_")
    );
  }

  function captureAttribution() {
    const params = new URLSearchParams(window.location.search);
    let stored = {};

    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch (_) {
      stored = {};
    }

    const updated = {
      utm_source: stored.utm_source || "",
      utm_medium: stored.utm_medium || "",
      utm_campaign: stored.utm_campaign || "",
      utm_content: stored.utm_content || "",
      utm_term: stored.utm_term || "",
      referrer: stored.referrer || document.referrer || "direct"
    };

    UTM_KEYS.forEach(function (key) {
      const val = params.get(key);
      if (val) {
        updated[key] = val.trim();
      }
    });

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {
      // Ignore storage quota / private mode restrictions
    }

    return updated;
  }

  function getAttribution() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {
      // Fall through
    }
    return captureAttribution();
  }

  function loadScriptOnce(id, src) {
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.id = id;
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }

  function initAnalyticsScripts() {
    if (scriptsInitialized) return;
    const cfg = window.PARKLANE_CONFIG || {};

    if (cfg.requireExplicitTrackingConsent && !window.__parklaneConsentGranted) {
      return;
    }

    scriptsInitialized = true;

    const hasGA4 = isConfigured(cfg.ga4MeasurementId);
    const hasGAds = isConfigured(cfg.googleAdsConversionId);

    if (hasGA4 || hasGAds) {
      const primaryTagId = hasGA4 ? cfg.ga4MeasurementId : cfg.googleAdsConversionId;
      window.dataLayer = window.dataLayer || [];
      window.gtag =
        window.gtag ||
        function () {
          window.dataLayer.push(arguments);
        };
      window.gtag("js", new Date());

      loadScriptOnce(
        "parklane-gtag-js",
        "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(primaryTagId)
      );

      if (hasGA4) {
        window.gtag("config", cfg.ga4MeasurementId, {
          send_page_view: true
        });
      }
      if (hasGAds) {
        window.gtag("config", cfg.googleAdsConversionId);
      }
    }

    if (isConfigured(cfg.metaPixelId) && !window.fbq) {
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.id = "parklane-meta-pixel";
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

      window.fbq("init", cfg.metaPixelId);
      window.fbq("track", "PageView");
    }
  }

  function sendGAEvent(eventName, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params || {});
    }
  }

  function sendMetaEvent(eventName, params) {
    if (typeof window.fbq === "function") {
      window.fbq("track", eventName, params || {});
    }
  }

  function trackFormStart(pageName) {
    const attr = getAttribution();
    sendGAEvent("form_start", {
      landing_page: pageName,
      utm_source: attr.utm_source,
      utm_campaign: attr.utm_campaign
    });
  }

  /**
   * Called after the browser POST promise resolves. With Apps Script fetch(no-cors),
   * the response is opaque: this does NOT prove that a row was saved successfully.
   * Verify test leads in Google Sheets. For reliable conversion measurement, fire
   * confirmed conversions from the backend/CRM. `qualified_lead` remains backend-only.
   */
  function trackFormSubmit(pageName, metadata) {
    if (firedLeadForms.has(pageName)) return;
    firedLeadForms.add(pageName);

    const cfg = window.PARKLANE_CONFIG || {};
    const attr = getAttribution();
    const payload = Object.assign(
      {
        landing_page: pageName,
        utm_source: attr.utm_source,
        utm_medium: attr.utm_medium,
        utm_campaign: attr.utm_campaign
      },
      metadata || {}
    );

    sendGAEvent("form_submit", payload);
    sendMetaEvent("Lead", {
      content_name: pageName,
      content_category: "Real Estate Enquiry"
    });

    if (
      typeof window.gtag === "function" &&
      isConfigured(cfg.googleAdsConversionId) &&
      isConfigured(cfg.googleAdsConversionLabel)
    ) {
      window.gtag("event", "conversion", {
        send_to: cfg.googleAdsConversionId + "/" + cfg.googleAdsConversionLabel
      });
    }
  }

  function trackWhatsappClick(pageName) {
    sendGAEvent("whatsapp_click", { landing_page: pageName });
    sendMetaEvent("Contact", { content_name: pageName, method: "whatsapp" });
  }

  function trackPhoneClick(pageName) {
    sendGAEvent("phone_click", { landing_page: pageName });
    sendMetaEvent("Contact", { content_name: pageName, method: "phone" });
  }

  function trackCalculatorUsed(grossYieldPct) {
    sendGAEvent("investment_calculator_used", {
      landing_page: "property-investment",
      gross_yield_percent: Number(grossYieldPct.toFixed(2))
    });
  }

  function grantConsent() {
    window.__parklaneConsentGranted = true;
    initAnalyticsScripts();
  }

  // Initialise attribution immediately on load
  captureAttribution();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAnalyticsScripts);
  } else {
    initAnalyticsScripts();
  }

  window.ParklaneTracking = {
    getAttribution: getAttribution,
    trackFormStart: trackFormStart,
    trackFormSubmit: trackFormSubmit,
    trackWhatsappClick: trackWhatsappClick,
    trackPhoneClick: trackPhoneClick,
    trackCalculatorUsed: trackCalculatorUsed,
    grantConsent: grantConsent
  };
})();
