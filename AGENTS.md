# AGENTS.md — QRX-2007 Scanner

Guidelines for AI agents (Codex Cloud, Claude Code, etc.) working on this project.

---

## Stack

This is a **plain HTML/CSS/JS project** — no React, Vue, bundler, or build step.
Do not migrate it to a framework unless explicitly instructed to do so.

---

## File map

| File | Role |
|------|------|
| `index.html` | Main application entry point. Contains HTML structure and a small inline JS patch for page-title switching. |
| `css/style.css` | All visual styling: device frame positioning, terminal LCD theme, layout, responsive compaction. Most visual tasks go here. |
| `js/app.js` | All runtime logic: QR generation, camera scanning, file scanning, copy, open URL, download. **Do not modify** unless changing functional behaviour is explicitly requested. |
| `assets/device_transparent.png` | Decorative PNG frame of the scanner device. Overlaid on top of the app UI via CSS absolute positioning. Do not replace or move. |
| `qr_studio.html` | Original single-file backup. **Never modify.** It exists as a reference/fallback only. |

---

## Screen position variables

The following CSS custom properties in `:root` define where `.device-screen` sits inside the PNG frame.
**Never change these values** unless the PNG frame itself is replaced:

```css
--scr-top:    9.6%;
--scr-left:   8.6%;
--scr-width:  82.8%;
--scr-height: 53.5%;
```

---

## What must never break

Before committing any change, verify that these features still work:

- QR code generation from text/URL input
- Camera-based live QR scanning
- QR scanning from an uploaded image file
- Copy result to clipboard
- Open decoded URL in new tab
- Download generated QR as PNG

---

## Visual changes

- Work primarily in `css/style.css`.
- The terminal palette is defined as CSS custom properties on `.device-screen` and cascades to all children — prefer editing those vars over touching individual selectors.
- Do not add inline styles to `index.html` unless there is no CSS-only alternative.
- The CRT scanlines overlay uses `z-index: 500` via `::before` on `.device-screen` — keep it non-interactive (`pointer-events: none`).

---

## Capacitor / Android / iOS

Do **not** add Capacitor, Cordova, or any native build tooling unless explicitly instructed in a separate task.
