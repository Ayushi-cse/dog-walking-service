# Dog Walking Service &mdash; Digital Operations & Dispatch Portal

**Ticket**: [ENG-11833] Core Infrastructure Overhaul  
**Priority**: P1 (High) &middot; **Story Points**: 5  
**Tech Stack**: Pure Semantic HTML5, Vanilla CSS (Strict Monochromatic Corporate Design System), Vanilla ES Modules, Vitest, ESLint.

---

## 🐕 Overview

This digital Static Landing Page replaces legacy manual paper systems and Excel spreadsheets for the **Dog Walking Service** floor staff and management team.

Designed for instant reactivity, accessibility, and offline/spotty internet resilience, this portal allows staff to:
- Schedule new dog walks with instant input validation.
- Manage live floor walks through real-time status transitions (`Scheduled` &rarr; `In Progress` &rarr; `Completed`).
- Filter walks by operational status or assigned staff walker.
- Perform instant multi-field searches (dog name, breed, walker, phone, handling notes) with the `/` keyboard shortcut.
- Export clean, structured manifests in JSON or CSV format for management reporting.
- Audit real-time telemetry interactions (`[Analytics] User interacted with Static Landing Page`).
- Simulate and test slow 3G network conditions with visible loading indicators.

---

## 🚀 Getting Started

### 1. Run the Test Suite (TDD)
```bash
npm test
```

### 2. Run the Code Linter
```bash
npm run lint
```

### 3. Open the Landing Page
You can open `index.html` directly in any web browser, or serve it locally using any static HTTP server:
```bash
npx serve .
```

---

## 🛡️ Edge Cases & Non-Functional Requirements (TRD Compliance)

### 1. Unhappy Path Handlers
- **Empty States**: If a filter or search produces no results, the screen displays a user-friendly *"No data found"* container with a one-click *"Reset Search / Filters"* button.
- **Bad Connectivity (Slow 3G)**: The header includes an interactive *Slow 3G Simulation* switch (1.4s artificial latency). All asynchronous dispatches display a prominent visual loading indicator banner with a CSS spinner and `aria-live="polite"` status text.
- **Invalid Inputs**: Submitting missing or malformed inputs (e.g. invalid phone number, blank fields) immediately prevents submission, focuses the first offending element, and highlights the inputs in red (`.input-invalid`, `aria-invalid="true"`) with inline error descriptions.

### 2. Security & A11y Standards
- **XSS Defense**: All inputs pass through `js/sanitize.js` before reaching the application state or `localStorage`, neutralizing `<script>`, `onerror`, and HTML tag breakouts.
- **100% Lighthouse A11y Target**: Semantic tags (`<header>`, `<main>`, `<dialog>`, `<article>`), keyboard accessible controls, skip links, and WCAG-compliant contrast.
- **Telemetry Logging**: Emits mandated corporate telemetry strings to the console and in-app inspector:
  `[Analytics] User interacted with Static Landing Page - Action: <Action> | Details: <Payload>`

---

## 📁 Repository Structure

```text
dog-walking-service/
├── css/
│   └── styles.css           # Monochromatic design system & 16px/32px scale
├── js/
│   ├── app.js               # Main application orchestration & event binding
│   ├── network.js           # Slow 3G network simulation & delay handler
│   ├── sanitize.js          # Enterprise XSS input sanitizer
│   ├── store.js             # Structured data schema, CRUD & export (JSON/CSV)
│   ├── telemetry.js         # Mandated analytics logging & event stream
│   ├── ui.js                # Renderers for cards, empty states & loading indicators
│   └── validator.js         # Input validation & red field highlighting
├── tests/
│   ├── sanitize.test.js     # XSS security unit tests
│   ├── store.test.js        # Schema & data management unit tests
│   ├── telemetry.test.js    # Analytics ping unit tests
│   ├── ui.test.js           # Empty state & connectivity indicator tests
│   └── validator.test.js    # Invalid input & red highlight tests
├── index.html               # Semantic HTML5 digital landing page
├── package.json             # Scripts & devDependencies (Vitest, JSDOM, ESLint)
├── eslint.config.js         # ESLint 9 flat configuration
├── vitest.config.js         # Vitest configuration with JSDOM
├── PROMPTS.md               # AI prompt traceability log
└── README.md                # Project documentation
```
