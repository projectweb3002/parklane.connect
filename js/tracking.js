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

    // Keep attribution across navigation and return visits (up to 90 days).
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch (_) {
      stored = {};
    }

    const now = Date.now();
    const isFresh = stored.captured_at && (now - Number(stored.captured_at)) < 90 * 24 * 60 * 60 * 1000;
    if (!isFresh) stored = {};

    const incoming = {};
    UTM_KEYS.forEach(function (key) {
      const value = params.get(key);
      if (value) incoming[key] = value.trim();
    });

    // Accept common campaign parameter aliases as well as standard UTMs.
    const campaignAlias = params.get("campaign") || params.get("campaign_id") || params.get("utm_id");
    if (!incoming.utm_campaign && campaignAlias) incoming.utm_campaign = campaignAlias.trim();

    const gclid = params.get("gclid") || params.get("gbraid") || params.get("wbraid") || "";
    const fbclid = params.get("fbclid") || "";
    let detectedSource = incoming.utm_source || "";
    let detectedMedium = incoming.utm_medium || "";
    if (!detectedSource && gclid) detectedSource = "google";
    if (!detectedMedium && gclid) detectedMedium = "cpc";
    if (!detectedSource && fbclid) detectedSource = "facebook";
    if (!detectedMedium && fbclid) detectedMedium = "paid_social";

    if (!detectedSource && document.referrer) {
      try { detectedSource = new URL(document.referrer).hostname.replace(/^www\./, ""); }
      catch (_) { detectedSource = "referral"; }
    }
    if (!detectedSource) detectedSource = "direct";

    const hasNewCampaignClick = Object.keys(incoming).length > 0 || Boolean(gclid || fbclid);
    const updated = Object.assign({}, stored, incoming);
    updated.utm_source = incoming.utm_source || (hasNewCampaignClick ? detectedSource : (stored.utm_source || detectedSource));
    updated.utm_medium = incoming.utm_medium || (hasNewCampaignClick ? detectedMedium : (stored.utm_medium || detectedMedium));
    updated.utm_campaign = incoming.utm_campaign || stored.utm_campaign || "";
    updated.utm_content = incoming.utm_content || stored.utm_content || "";
    updated.utm_term = incoming.utm_term || stored.utm_term || "";
    updated.referrer = stored.referrer || document.referrer || "direct";
    updated.gclid = params.get("gclid") || stored.gclid || "";
    updated.gbraid = params.get("gbraid") || stored.gbraid || "";
    updated.wbraid = params.get("wbraid") || stored.wbraid || "";
    updated.fbclid = params.get("fbclid") || stored.fbclid || "";
    updated.captured_at = stored.captured_at || now;
    updated.last_seen_at = now;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      // Also mirror into session storage for compatibility with older page code.
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (__) {}
    }
    return updated;
  }

  function getAttribution() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {
      // Fall through and capture the current URL.
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
   * the response is opaque. Record only a dispatch attempt here; do not fire a
   * Meta Lead or Google Ads conversion until a server/CRM-confirmed event exists.
   */
  function trackFormDispatch(pageName, metadata) {
    if (firedLeadForms.has(pageName)) return;
    firedLeadForms.add(pageName);

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

    sendGAEvent("form_submission_attempt", payload);
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
    trackFormDispatch: trackFormDispatch,
    trackWhatsappClick: trackWhatsappClick,
    trackPhoneClick: trackPhoneClick,
    trackCalculatorUsed: trackCalculatorUsed,
    grantConsent: grantConsent
  };
})();
