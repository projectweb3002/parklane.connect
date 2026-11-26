/**
 * Parklane Real Estate — Central Campaign & Integration Configuration
 * ===================================================================
 * Replace placeholder values below with your live credentials before
 * launching Google Ads, Meta Ads, or organic lead-generation campaigns.
 * Never store private API keys or backend secrets in frontend JavaScript.
 */
window.PARKLANE_CONFIG = Object.freeze({
  brandName: "Parklane",
  websiteUrl: "https://projectweb3002.github.io/parklane.connect/",
  landingPagesBaseUrl: "https://projectweb3002.github.io/parklane.connect/",
  privacyPolicyUrl: "https://projectweb3002.github.io/parklane/privacy.html",
  termsUrl: "https://projectweb3002.github.io/parklane/terms.html",

  // Lead Form Submission (Parklane Google Apps Script Web App)
  // Keep this URL in sync with the deployed Apps Script /exec endpoint.
  googleAppsScriptEndpoint: "https://script.google.com/macros/s/AKfycbxmJ1M5dfLMnCiHYk9-F3j1EzqTO70TxP0DWIjRdpItDVBHv8juXDgKz7afgzgMVwFH/exec",

  // Contact Channels (replace with live numbers before publishing)
  // WhatsApp format: country code + number, digits only, e.g. "9198XXXXXXXX"
  whatsappNumber: "YOUR_WHATSAPP_NUMBER",
  // Display phone number, e.g. "+91 98XXX XXXXX"
  phoneNumber: "YOUR_PHONE_NUMBER",

  // Google Analytics 4
  // Example: "G-XXXXXXXXXX"
  ga4MeasurementId: "YOUR_GA4_ID",

  // Meta Pixel
  // Example: "123456789012345"
  metaPixelId: "YOUR_META_PIXEL_ID",

  // Google Ads Conversion Tracking
  // Example: "AW-123456789" and "AbCdEfGhIjKlMnOpQrSt"
  googleAdsConversionId: "YOUR_GOOGLE_ADS_CONVERSION_ID",
  googleAdsConversionLabel: "YOUR_GOOGLE_ADS_CONVERSION_LABEL",

  // Consent Mode: set to true if you integrate a Cookie Consent Manager
  // that calls window.ParklaneTracking.grantConsent() after user opt-in.
  requireExplicitTrackingConsent: false,

  // Centralised Hero Image Registry (swap URLs here or replace files in assets/images/)
  images: {
    propertyBuyers: "assets/images/hero-property-buyers.jpg",
    affordableHomes: "assets/images/hero-affordable-homes.jpg",
    luxuryResidences: "assets/images/hero-luxury-residences.jpg",
    propertyInvestment: "assets/images/hero-property-investment.jpg",
    familyHomes: "assets/images/hero-family-homes.jpg"
  }
});
