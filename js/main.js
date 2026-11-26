/**
 * Parklane Real Estate — Shared UI Interactions, Config Wiring & Thank-You Logic (main.js)
 */
(function () {
  "use strict";

  function isConfigured(val) {
    return typeof val === "string" && val.trim().length > 0 && !val.startsWith("YOUR_");
  }

  function applyConfigBindings() {
    const cfg = window.PARKLANE_CONFIG || {};
    const pageName = document.body.getAttribute("data-page") || "general";

    // Centralised hero image binding
    const heroImg = document.querySelector("[data-hero-image]");
    if (heroImg && cfg.images) {
      const key = heroImg.getAttribute("data-hero-image");
      if (key && cfg.images[key]) {
        heroImg.src = cfg.images[key];
      }
    }

    // Privacy & Terms links
    document.querySelectorAll("[data-privacy-link]").forEach(function (a) {
      if (cfg.privacyPolicyUrl) a.href = cfg.privacyPolicyUrl;
    });
    document.querySelectorAll("[data-terms-link]").forEach(function (a) {
      if (cfg.termsUrl) a.href = cfg.termsUrl;
    });

    // WhatsApp links
    document.querySelectorAll("[data-whatsapp-link]").forEach(function (a) {
      if (isConfigured(cfg.whatsappNumber)) {
        const text = encodeURIComponent(
          "Hi Parklane team, I would like assistance with residential property options."
        );
        a.href = "https://wa.me/" + cfg.whatsappNumber.replace(/\D/g, "") + "?text=" + text;
        a.addEventListener("click", function () {
          if (window.ParklaneTracking) {
            window.ParklaneTracking.trackWhatsappClick(pageName);
          }
        });
      } else {
        a.href = "#enquiry-form";
      }
    });

    // Phone links
    document.querySelectorAll("[data-phone-link]").forEach(function (a) {
      if (isConfigured(cfg.phoneNumber)) {
        a.href = "tel:" + cfg.phoneNumber.replace(/[^+\d]/g, "");
        a.addEventListener("click", function () {
          if (window.ParklaneTracking) {
            window.ParklaneTracking.trackPhoneClick(pageName);
          }
        });
      } else {
        a.href = "#enquiry-form";
      }
    });
  }

  function initScrollToFormLinks() {
    document.querySelectorAll('a[href="#enquiry-form"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        const target = document.getElementById("enquiry-form");
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        const firstInput = target.querySelector("input, select");
        if (firstInput) {
          setTimeout(function () {
            firstInput.focus({ preventScroll: true });
          }, 350);
        }
      });
    });
  }

  function initRevealAnimations() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    const prefersReduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initThankYouPage() {
    if (document.body.getAttribute("data-page") !== "thank-you") return;

    const PERSONA_MESSAGES = {
      "property-buyers": {
        eyebrow: "ENQUIRY RECEIVED",
        title: "We've Received Your Property Preferences.",
        body: "A Parklane property advisor will review your requirements and reach out with curated residential options across your preferred location.",
        returnHref: "property-buyers.html",
        returnLabel: "Back to Property Discovery"
      },
      "affordable-homes": {
        eyebrow: "BUDGET SHORTLIST REQUESTED",
        title: "Your Budget-Friendly Home Search Is Underway.",
        body: "Our advisor is reviewing your configuration and budget preferences to share practical, value-focused residential options.",
        returnHref: "affordable-homes.html",
        returnLabel: "Back to Affordable Homes"
      },
      "luxury-residences": {
        eyebrow: "PRIVATE CONSULTATION REQUESTED",
        title: "Thank You for Requesting a Private Consultation.",
        body: "A senior Parklane advisor will connect with you discreetly to discuss your residence criteria and arrange a personalised shortlist.",
        returnHref: "luxury-residences.html",
        returnLabel: "Back to Luxury Residences"
      },
      "property-investment": {
        eyebrow: "INVESTMENT BRIEF RECEIVED",
        title: "Your Investment Goals Are With Our Advisory Team.",
        body: "Our advisor will prepare location insights and residential property comparisons aligned with your investment objective and timeline.",
        returnHref: "property-investment.html",
        returnLabel: "Back to Property Investment"
      },
      "family-homes": {
        eyebrow: "FAMILY HOME ENQUIRY RECEIVED",
        title: "We're Looking for the Right Home for Your Family.",
        body: "Our advisor will shortlist spacious, family-friendly residences that match your preferred neighbourhood and everyday priorities.",
        returnHref: "family-homes.html",
        returnLabel: "Back to Family Homes"
      }
    };

    const params = new URLSearchParams(window.location.search);
    let source = params.get("source") || "";
    let lastEnquiry = null;

    try {
      const raw = sessionStorage.getItem("parklane_last_enquiry");
      if (raw) lastEnquiry = JSON.parse(raw);
    } catch (_) {
      lastEnquiry = null;
    }

    if (!source && lastEnquiry && lastEnquiry.landingPage) {
      source = lastEnquiry.landingPage;
    }

    const content = PERSONA_MESSAGES[source] || PERSONA_MESSAGES["property-buyers"];

    const eyebrowEl = document.querySelector("[data-ty-eyebrow]");
    const titleEl = document.querySelector("[data-ty-title]");
    const bodyEl = document.querySelector("[data-ty-body]");
    const returnLink = document.querySelector("[data-ty-return]");

    if (eyebrowEl) eyebrowEl.textContent = content.eyebrow;
    if (titleEl) {
      titleEl.textContent =
        lastEnquiry && lastEnquiry.firstName
          ? "Thank You, " + lastEnquiry.firstName + ". " + content.title
          : content.title;
    }
    if (bodyEl) bodyEl.textContent = content.body;
    if (returnLink) {
      returnLink.href = content.returnHref;
      returnLink.textContent = content.returnLabel;
    }

    // Render summary block if session data exists
    const summaryBox = document.querySelector("[data-ty-summary]");
    const summaryList = document.querySelector("[data-ty-summary-list]");
    if (summaryBox && summaryList && lastEnquiry) {
      const rows = [
        ["Preferred City", lastEnquiry.city],
        ["Property Type", lastEnquiry.propertyType],
        ["Budget Range", lastEnquiry.budget],
        ["Timeline", lastEnquiry.timeline]
      ].filter(function (row) {
        return row[1];
      });

      if (rows.length > 0) {
        summaryList.innerHTML = "";
        rows.forEach(function (row) {
          const dt = document.createElement("dt");
          dt.textContent = row[0];
          const dd = document.createElement("dd");
          dd.textContent = row[1];
          summaryList.appendChild(dt);
          summaryList.appendChild(dd);
        });
        summaryBox.hidden = false;
      }
    }
  }

  function init() {
    applyConfigBindings();
    initScrollToFormLinks();
    initRevealAnimations();
    initThankYouPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
