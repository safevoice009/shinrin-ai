# Shinrin AI Clinical Dashboard System Architecture

This document describes the high-level architecture, module breakdown, styling system, and local configuration of the Shinrin AI clinical dashboard.

---

## 1. Project Directory Structure

```
shinrin-ai/
├── analysis_documentation/    # Reference files for clinical & developer analysis
├── css/
│   └── style.css              # Main style system and Wabi-Sabi color tokens
├── js/
│   ├── abbreviations.js       # Clinical abbreviation lookups & popovers
│   ├── app.js                 # Global state controller & UI event bindings
│   ├── calculators.js         # Clinical formula algorithms (MELD, Wells, etc.)
│   ├── diagnostics.js         # Self-diagnostics test suite runner
│   ├── fhir.js                # FHIR sandbox and HIPAA de-identification client
│   └── profiles.js            # Mock patient profile data blueprints
├── index.html                 # Main single-page application document
├── package.json               # Node.js dependencies (Playwright testing)
└── tests/
    └── clinician_flow.spec.js # Playwright E2E integration tests
```

---

## 2. Sino-Japanese Wabi-Sabi Styling System

The user interface uses a warm Wabi-Sabi aesthetic, which combines a soft matcha green and gold-washi style with flat clinical controls:
*   **Warm Off-White Paper Background:** `#FAF8F5`
*   **Matcha Sage Borders:** `#8AA690`
*   **Sumi Ink Charcoal Green Text:** `#2C362F`
*   **Earthy Matcha Card Background:** `#EDF3ED`
*   **Washi Gold Highlights:** `#D1A153`

These variables are defined in the CSS `:root` node of `css/style.css` and are applied globally using Tailwind classes and custom CSS components.

---

## 3. Client-Side JS Modules

### A. Global State & App Controller (`js/app.js`)
*   **Tab Routing:** Controlled via `switchPrimaryTab()` and `switchAnalysisTab()`.
*   **Breathing Pacer:** Timed loop execution inside `initZenBreathingPacer()`.
*   **Speech Recognition:** Manages microphone stream and speech transcript capture.
*   **Telemetry Logging:** Manages logging system output to the developer console.

### B. Risk Calculators (`js/calculators.js`)
*   Calculates scores for `MELD`, `Wells'`, `CURB-65`, `MEWS`, `HAS-BLED`, and `CHA₂DS₂-VASc`.
*   Uses input sanitization to ensure mathematical safety and caps values within official medical thresholds.

### C. FHIR Sync Client (`js/fhir.js`)
*   Fetches real FHIR patient resources or falls back to de-identified mock data containing de-identification stamps.
*   Applies regex-based custom JSON colorizers for readability in the sandbox interface.
