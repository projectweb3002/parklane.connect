/**
 * Parklane Real Estate — Interactive Gross Rental Yield Calculator (investment-calculator.js)
 * Formula:
 *   Annual Rental Income = Monthly Rent * 12
 *   Gross Rental Yield   = (Annual Rental Income / Property Price) * 100
 */
(function () {
  "use strict";

  const inrFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });

  function initCalculator() {
    const root = document.querySelector("[data-rental-calculator]");
    if (!root) return;

    const priceInput = root.querySelector("#calc-property-price");
    const rentInput = root.querySelector("#calc-monthly-rent");
    const annualOutput = root.querySelector("[data-calc-annual-rent]");
    const yieldOutput = root.querySelector("[data-calc-gross-yield]");
    const errorEl = root.querySelector("[data-calc-error]");
    const presetButtons = root.querySelectorAll("[data-calc-preset]");

    let trackingTimer = null;
    let hasInteracted = false;

    function calculate(shouldTrack) {
      const price = parseFloat(priceInput.value);
      const monthlyRent = parseFloat(rentInput.value);

      if (!isFinite(price) || price <= 0 || !isFinite(monthlyRent) || monthlyRent < 0) {
        annualOutput.textContent = "—";
        yieldOutput.textContent = "—";
        if (errorEl) {
          errorEl.textContent = "Enter a property price above ₹0 and a valid monthly rent.";
          errorEl.hidden = false;
        }
        return;
      }

      if (errorEl) {
        errorEl.textContent = "";
        errorEl.hidden = true;
      }

      const annualRent = monthlyRent * 12;
      const grossYield = (annualRent / price) * 100;

      annualOutput.textContent = inrFormatter.format(annualRent);
      yieldOutput.textContent = grossYield.toFixed(2) + "%";

      if (shouldTrack && window.ParklaneTracking) {
        clearTimeout(trackingTimer);
        trackingTimer = setTimeout(function () {
          window.ParklaneTracking.trackCalculatorUsed(grossYield);
        }, 700);
      }
    }

    [priceInput, rentInput].forEach(function (input) {
      input.addEventListener("input", function () {
        hasInteracted = true;
        calculate(true);
      });
    });

    presetButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const presetPrice = btn.getAttribute("data-price");
        const presetRent = btn.getAttribute("data-rent");
        if (presetPrice) priceInput.value = presetPrice;
        if (presetRent) rentInput.value = presetRent;
        hasInteracted = true;
        calculate(true);
      });
    });

    // Initial render without firing an analytics event before user interaction
    calculate(false);

    // Prevent unused variable warning while keeping state clear
    void hasInteracted;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCalculator);
  } else {
    initCalculator();
  }
})();
