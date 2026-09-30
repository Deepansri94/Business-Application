# SECURITY.md

Security review checklist. Run through every item before pushing to `main` or handing the build to a user.
If any item fails, fix it before proceeding. Do not ship with open items.

---

## 01 Secrets and credentials

- [ ] No API keys, tokens, passwords, or UPI credentials are hardcoded in any `.js`, `.html`, or `.json` file.
- [ ] `package.json` and `server/package.json` contain no private registry tokens or auth fields.
- [ ] `.gitignore` excludes `node_modules/`, `dist/`, `release/`, `server/auth_info/`, and any `.env` files.
- [ ] GitHub Actions workflows use `${{ secrets.GITHUB_TOKEN }}` only — no personal access tokens committed.
- [ ] No `console.log` statements print sensitive user data (names, phone numbers, UPI IDs, balances).

**How to check:**
```
grep -r "password\|token\|secret\|apikey\|api_key" --include="*.js" --include="*.json" --include="*.html" .
```
Expected result: zero matches outside of `node_modules/`.

---

## 02 Data storage

- [ ] All user data (customers, transactions, products, settings) is stored in `localStorage` on the user's own machine.
- [ ] No `fetch()` calls in `app.js` point to external URLs — only `http://localhost:3001` (the local WhatsApp server).
- [ ] The WhatsApp auth session is stored in `~/.shopmanager/auth_info/` on the user's machine — never committed to git.
- [ ] `server/auth_info/` is listed in `.gitignore` and excluded from the electron-builder `files` array.

**How to check:**
```
grep -n "fetch(" app.js
```
Expected: all hits point to `http://localhost:3001` only.

---

## 03 Electron security

- [ ] `nodeIntegration: false` is set in all `BrowserWindow` `webPreferences`.
- [ ] `contextIsolation: true` is set in all `BrowserWindow` `webPreferences`.
- [ ] `preload.js` only exposes `openQR`, `onWAStatus`, `checkUpdate`, `onUpdateResult` — no `require`, `fs`, or `shell` exposed to the renderer.
- [ ] `setWindowOpenHandler` returns `{ action: 'deny' }` — external URLs open via `shell.openExternal`.
- [ ] `setMenuBarVisibility(false)` is set on both the main window and the QR window.
- [ ] No `webSecurity: false` anywhere in the codebase.

**How to check:**
```
grep -n "nodeIntegration\|contextIsolation\|webSecurity\|enableRemoteModule" main.js preload.js
```
Expected: `nodeIntegration: false`, `contextIsolation: true`, no `webSecurity: false`.

---

## 04 WhatsApp server security

- [ ] The Express server (`server/index.js`) only listens on `localhost` (127.0.0.1), not on `0.0.0.0`.
- [ ] No WhatsApp session credentials are logged to stdout or stderr.
- [ ] The `/send-bulk` and `/send-bulk-media` endpoints are not accessible from outside the machine (localhost only).
- [ ] File uploads via `/send-bulk-media` are limited to image and PDF types — no arbitrary file execution.
- [ ] The server process is killed when the Electron app closes (`app.on('before-quit')`).

---

## 05 Input validation

- [ ] Customer phone number is validated as 10 digits before saving (`/^\d{10}$/`).
- [ ] Product price fields are validated as valid numbers before saving.
- [ ] No user input is passed to `eval()` or `document.write()`.
- [ ] All `innerHTML` assignments use only data from `localStorage` (user-entered data), not from external sources.

**How to check:**
```
grep -n "eval\|document\.write\|innerHTML" app.js
```
Review each `innerHTML` hit — confirm the data source is localStorage only.

---

## 06 Auto-update security

- [ ] The GitHub Releases API URL in `main.js` points to the correct repository (`Deepansri94/Business-Application`).
- [ ] The downloaded `.exe` is saved to the user's `Downloads` folder and opened via `shell.openPath` — not executed programmatically.
- [ ] HTTP redirects in `httpsGet` strip the `Authorization` header before following to S3/CDN URLs.

---

## 07 Build artefact

- [ ] The `files` array in `package.json` `build` config excludes `.git/` and `server/auth_info/`.
- [ ] `server/node_modules` is bundled via `asarUnpack` and `extraResources` — confirm no dev-only packages are included.
- [ ] The final `.exe` is signed (recommended for v2 — unsigned EXEs trigger Windows SmartScreen warnings).

---

## 08 Dependency audit

Run before every release:
```
npm audit
cd server && npm audit
```
- [ ] Zero `critical` severity vulnerabilities in both root and server dependencies.
- [ ] Zero `high` severity vulnerabilities in runtime dependencies.

---

## 09 Pre-ship smoke test

- [ ] Install the `.exe` on a clean Windows machine.
- [ ] App opens, WhatsApp server starts automatically (status badge shows connecting).
- [ ] Add a customer, record a transaction, generate a bill — all data persists after restart.
- [ ] WhatsApp QR scan works and badge turns green.
- [ ] No DevTools console errors on normal use.
- [ ] Windows Defender does not block the installer.

---

## Known accepted risks

| Risk | Reason accepted | Mitigation |
| --- | --- | --- |
| Data stored in localStorage (no encryption) | App runs on the owner's private machine | Acceptable for v1 |
| WhatsApp session stored unencrypted on disk | Standard Baileys behaviour | Stored in user home dir, not app dir |
| No code signing on the EXE | Cost and complexity for v1 | User clicks "Run anyway" on SmartScreen once |
| Auto-update does not verify checksum | GitHub CDN is trusted | Add SHA256 verification in v2 |
