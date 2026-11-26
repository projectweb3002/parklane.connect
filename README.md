# Parklane Real Estate — 5 High-Converting Landing Pages

Production-ready HTML5, CSS3, and vanilla JavaScript lead-generation landing pages built to match Parklane Real Estate's brand identity (deep olive/moss green, warm ivory, crisp charcoal typography, geometric house-roof logo, serving Jaipur, Gurgaon, Alwar, and Delhi NCR).

## Included Pages
1. `property-buyers.html` — General Property Buyers
2. `affordable-homes.html` — Affordable Home Buyers
3. `luxury-residences.html` — Luxury Property Buyers (Private Consultation)
4. `property-investment.html` — Property Investors (includes interactive Gross Rental Yield Calculator)
5. `family-homes.html` — Family Home Buyers (includes preferred facilities multi-select chips)
6. `index.html` — Campaign Hub linking to all 5 landing pages
7. `thank-you.html` — Persona-aware confirmation page with submitted enquiry summary

## Configuration Before Going Live
Open `config/config.js` and replace the remaining placeholders:

- `whatsappNumber`: digits including country code (e.g. `9198XXXXXXXX`).
- `phoneNumber`: the public display phone number.
- `ga4MeasurementId`: GA4 Measurement ID (e.g. `G-XXXXXXXXXX`).
- `metaPixelId`: Meta Pixel ID.
- `googleAdsConversionId` & `googleAdsConversionLabel`: Google Ads conversion ID (`AW-...`) and conversion label.
- `images`: replace files in `assets/images/` or use hosted CDN URLs.
- Canonical URLs: replace `https://YOUR_DOMAIN.com/...` in each page after the final public deployment URL is confirmed.

The Google Apps Script `/exec` endpoint is already configured. Keep it unchanged unless you deploy a replacement web app. The two supplied official Parklane mark variants are used for the white header/footer mark and black favicon.

## Tracking Events Wired
- **GA4**: `page_view`, `form_start`, `form_submit` (the browser cannot verify the Apps Script response in `no-cors` mode), `whatsapp_click`, `phone_click`, `investment_calculator_used`. (`qualified_lead` is intentionally reserved for backend/CRM verification.)
- **Meta Pixel**: `PageView`, `Lead` (sent after the browser POST resolves; verify receipt in the Sheet), `Contact`.
- **Google Ads**: Conversion event sent after the browser POST resolves; verify receipt in the Sheet.
- **UTM Attribution**: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, and `referrer` are captured into `sessionStorage` and attached automatically to every lead submission.
