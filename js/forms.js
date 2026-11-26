/**
 * Parklane Real Estate — Lead Form Validation & Google Sheets Submission
 * Sends URL-encoded form data to the Parklane Google Apps Script Web App.
 * Uses a hidden iframe form POST to avoid fetch/CORS redirect failures with Apps Script.
 */
(function () {
  "use strict";

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const INDIAN_MOBILE_REGEX = /^(?:\+91|91|0)?[6-9]\d{9}$/;

  function normalizePhone(raw) {
    return String(raw || "").replace(/[\s\-()]/g, "");
  }

  function validateField(fieldWrap) {
    const input = fieldWrap.querySelector("input, select, textarea");
    if (!input) return true;

    const errorEl = fieldWrap.querySelector(".field-error");
    const type = input.getAttribute("data-validate") || input.type;
    const isRequired = input.hasAttribute("required");
    let valid = true;
    let message = "";

    if (input.type === "checkbox") {
      if (isRequired && !input.checked) {
        valid = false;
        message = "Please confirm that you agree to the privacy policy so our advisor can contact you.";
      }
    } else {
      const value = input.value.trim();
      if (isRequired && !value) {
        valid = false;
        message = "This field is required.";
      } else if (value) {
        if (type === "email" && !EMAIL_REGEX.test(value)) {
          valid = false;
          message = "Please enter a valid email address (e.g. name@example.com).";
        } else if (type === "indian-phone" && !INDIAN_MOBILE_REGEX.test(normalizePhone(value))) {
          valid = false;
          message = "Please enter a valid 10-digit Indian mobile number (starting with 6–9).";
        } else if (type === "name" && value.length < 2) {
          valid = false;
          message = "Please enter your full name.";
        }
      }
    }

    fieldWrap.classList.toggle("is-invalid", !valid);
    input.setAttribute("aria-invalid", valid ? "false" : "true");
    if (errorEl && message) errorEl.textContent = message;
    return valid;
  }

  function showStatus(statusEl, type, message) {
    if (!statusEl) return;
    statusEl.className = "form-status is-visible form-status--" + type;
    statusEl.textContent = message;
    statusEl.setAttribute("role", type === "error" ? "alert" : "status");
  }

  function clearStatus(statusEl) {
    if (!statusEl) return;
    statusEl.className = "form-status";
    statusEl.textContent = "";
  }

  function initLeadForm(form) {
    const pageName = form.getAttribute("data-landing-page") || "general";
    const submitBtn = form.querySelector('button[type="submit"]');
    const statusEl = form.querySelector("[data-form-status]");
    const fieldWraps = Array.prototype.slice.call(form.querySelectorAll(".form-field, .consent-field"));
    let formStarted = false;
    let isSubmitting = false;

    form.addEventListener("focusin", function () {
      if (!formStarted) {
        formStarted = true;
        if (window.ParklaneTracking) window.ParklaneTracking.trackFormStart(pageName);
      }
    }, { passive: true });

    fieldWraps.forEach(function (wrap) {
      const control = wrap.querySelector("input, select, textarea");
      if (!control) return;
      control.addEventListener("blur", function () { validateField(wrap); });
      const evtName = control.tagName === "SELECT" || control.type === "checkbox" ? "change" : "input";
      control.addEventListener(evtName, function () {
        if (wrap.classList.contains("is-invalid")) validateField(wrap);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (isSubmitting) return;
      clearStatus(statusEl);

      let firstInvalid = null;
      fieldWraps.forEach(function (wrap) {
        if (!validateField(wrap) && !firstInvalid) {
          firstInvalid = wrap.querySelector("input, select, textarea");
        }
      });
      if (firstInvalid) {
        firstInvalid.focus();
        showStatus(statusEl, "error", "Please review the highlighted fields and try again.");
        return;
      }

      const cfg = window.PARKLANE_CONFIG || {};
      const endpoint = cfg.googleAppsScriptEndpoint || "";
      if (!endpoint || endpoint.indexOf("/exec") === -1) {
        showStatus(statusEl, "error", "Google Sheets connection is not configured. Please contact the website administrator.");
        return;
      }

      isSubmitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("is-loading");
      }
      if (statusEl) showStatus(statusEl, "success", "Sending your enquiry securely. Please wait...");

      const formData = new FormData(form);
      const facilities = Array.from(form.querySelectorAll('input[name="preferred_facilities"]:checked'))
        .map(function (cb) { return cb.value; });
      if (facilities.length) {
        formData.delete("preferred_facilities");
        formData.set("preferred_facilities", facilities.join(", "));
      }

      const attr = window.ParklaneTracking ? window.ParklaneTracking.getAttribution() : {};
      formData.set("landing_page", pageName);
      formData.set("submission_timestamp", new Date().toISOString());
      formData.set("utm_source", attr.utm_source || "direct");
      formData.set("utm_medium", attr.utm_medium || "");
      formData.set("utm_campaign", attr.utm_campaign || "");
      formData.set("utm_content", attr.utm_content || "");
      formData.set("utm_term", attr.utm_term || "");
      formData.set("referrer", attr.referrer || document.referrer || "direct");
      // These map to the existing Source and Campaign columns in the Leads sheet.
      formData.set("source", attr.utm_source || "direct");
      formData.set("campaign", attr.utm_campaign || "");

      // Apps Script ContentService commonly redirects POST requests. A cross-origin
      // fetch(no-cors) can reject on that redirect in some browsers. Submit a native
      // HTML form into a hidden iframe instead; this avoids CORS response restrictions.
      let iframe = document.getElementById("parklane-submit-frame");
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "parklane-submit-frame";
        iframe.name = "parklane-submit-frame";
        iframe.hidden = true;
        iframe.setAttribute("aria-hidden", "true");
        document.body.appendChild(iframe);
      }

      const transportForm = document.createElement("form");
      transportForm.method = "POST";
      transportForm.action = endpoint;
      transportForm.target = iframe.name;
      transportForm.enctype = "application/x-www-form-urlencoded";
      transportForm.acceptCharset = "UTF-8";
      transportForm.style.display = "none";

      formData.forEach(function (value, key) {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = key;
        hidden.value = String(value);
        transportForm.appendChild(hidden);
      });

      document.body.appendChild(transportForm);
      try {
        transportForm.submit();
        if (window.ParklaneTracking) {
          window.ParklaneTracking.trackFormDispatch(pageName, {
            preferred_city: formData.get("preferred_city") || "",
            budget: formData.get("budget") || "",
            property_type: formData.get("property_type") || ""
          });
        }

        try {
          const fullName = String(formData.get("full_name") || "").trim();
          sessionStorage.setItem("parklane_last_enquiry", JSON.stringify({
            firstName: fullName.split(/\s+/)[0] || "",
            landingPage: pageName,
            city: formData.get("preferred_city") || "",
            propertyType: formData.get("property_type") || "",
            budget: formData.get("budget") || "",
            timeline: formData.get("purchase_timeline") || ""
          }));
        } catch (_) {}

        showStatus(statusEl, "success", "Your enquiry has been submitted. Please wait...");
        window.setTimeout(function () {
          transportForm.remove();
          window.location.href = "thank-you.html?source=" + encodeURIComponent(pageName);
        }, 1800);
      } catch (error) {
        transportForm.remove();
        isSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("is-loading");
        }
        showStatus(statusEl, "error", "We couldn't submit your enquiry. Please try again or contact us by phone.");
      }
    });
  }

  function initAllForms() {
    document.querySelectorAll("[data-lead-form]").forEach(initLeadForm);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAllForms);
  } else {
    initAllForms();
  }
})();
