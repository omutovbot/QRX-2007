# QRX-2007 Scanner

A retro QR code generator and scanner styled as a 2007-era industrial handheld device.

The app UI runs inside a PNG frame of a rugged scanner, rendered as a green phosphor LCD terminal with CRT scanlines.

**Status:** HTML/CSS/JS prototype — no build step required.

---

## Features

- Generate QR codes from any text or URL
- Scan QR codes via device camera (live)
- Scan QR codes from a local image file
- Copy decoded result to clipboard
- Open decoded URL in a new tab
- Download generated QR as PNG
- Full-screen UI embedded inside a device PNG frame
- Green phosphor terminal aesthetic with red laser scan line

---

## Run locally

Camera scanning requires a secure context (localhost or HTTPS). Opening `index.html` directly via `file://` will disable live camera access.

```bash
python -m http.server 8080
```

Then open: [http://localhost:8080](http://localhost:8080)

---

## Project structure

```
index.html                  — main application entry point
css/style.css               — all visual styling (terminal theme, layout)
js/app.js                   — QR generation, camera scan, file scan logic
assets/device_transparent.png — PNG frame of the scanner device
qr_studio.html              — original single-file backup, do not modify
```

---

## Libraries (CDN, no install needed)

- [qrcodejs](https://github.com/davidshimjs/qrcodejs) — QR code generation
- [jsQR](https://github.com/cozmo/jsQR) — QR code decoding from image data
