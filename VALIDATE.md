# VALIDATE.md

Code review and pre-deployment validation checklist.
Complete every section before merging to `main` and triggering a build.

---

## 01 Code correctness

### app.js
- [ ] Every `save()` call is paired with an update to the in-memory array before it (never save stale data).
- [ ] Every `render*()` function reads from the current in-memory array, not a stale snapshot.
- [ ] `saveTransaction()` creates a `kataEntry` when `paidStatus === 'unpaid'` and a customer is selected.
- [ ] `generateBill()` saves to both `transactions` and `kataEntries` when unpaid — confirm both are written.
- [ ] `markKataPaid()` syncs the matching transaction using `txnId`, `billNo`, and time-based fallback — all three paths work.
- [ ] `calcTotal()` produces correct results for multi-item bill and transaction rows.
- [ ] Pagination in `renderTransactions()` does not go out of bounds on the last page.
- [ ] `downloadTransactions()` exports all filtered records, not just the current page.
- [ ] Payment reminder template tags (`{name}`, `{items}`, `{total}`, `{shop}`, `{phone}`, `{upi}`) all resolve correctly.

### main.js
- [ ] `startServer()` uses the correct path for both packaged (`app.asar.unpacked`) and unpackaged runs.
- [ ] `pollStatus()` runs every 3 seconds and sends `wa-status` to the renderer correctly.
- [ ] QR window opens only once — `if (qrWindow) return` guard is in place.
- [ ] `app.on('before-quit')` kills the server process.
- [ ] `httpsGet()` follows redirects and strips `Authorization` header on redirect.

### server/index.js
- [ ] Server listens on `localhost` only, not `0.0.0.0`.
- [ ] `/send-bulk` and `/send-bulk-media` return a structured `{ success, results }` response.
- [ ] `/status` returns `{ connected, qrReady }` — renderer depends on these exact field names.
- [ ] File upload in `/send-bulk-media` does not allow arbitrary file types.

### index.html
- [ ] Every modal has a Cancel button calling `closeModal()` and closes on overlay click.
- [ ] Every `getElementById` reference in `app.js` has a matching `id` in `index.html`.
- [ ] No inline `style` hex values conflict with the design system tokens.

### style.css
- [ ] All color values match `docs/DESIGN_SYSTEM.md` tokens.
- [ ] `.hidden { display: none !important; }` is present and used consistently.
- [ ] Responsive rule at `max-width: 768px` collapses sidebar to 60px correctly.

---

## 02 Data integrity

- [ ] Adding a customer and recording an unpaid transaction creates a matching `kataEntry` in `localStorage.kataEntries`.
- [ ] Marking a kata entry paid updates both `kataEntries` and `transactions` in localStorage.
- [ ] Generating a bill auto-saves to `transactions` — confirm bill total matches transaction total.
- [ ] Dashboard `Total Unpaid` matches the sum of all unpaid `kataEntries`.
- [ ] Deleting a transaction also removes its linked `kataEntry` (matched by `txnId`).

**How to spot-check in DevTools (F12 → Console):**
```js
JSON.parse(localStorage.getItem('customers'))
JSON.parse(localStorage.getItem('transactions'))
JSON.parse(localStorage.getItem('kataEntries'))
JSON.parse(localStorage.getItem('products'))
JSON.parse(localStorage.getItem('settings'))
```

---

## 03 UI completeness

- [ ] Every page renders an empty-state message when there is no data.
- [ ] Paid badge is green, Unpaid badge is red — consistent across Customers, Transactions, Kata Book.
- [ ] WhatsApp status badge shows correct state: 🔴 Connecting / 📱 Scan QR / 🟢 Connected.
- [ ] Toast messages appear for every save, update, delete, and error action.
- [ ] Bill preview renders with logo watermark when a logo is uploaded.
- [ ] Print bill opens a new window with correct shop header and bill items.
- [ ] All modals close on Cancel and on overlay click.
- [ ] Sidebar shows shop name and logo after settings are saved.

---

## 04 Edge cases

- [ ] Generating a bill with zero items shows an error toast and does not save.
- [ ] Adding a customer with a non-10-digit phone shows a validation error.
- [ ] Sending a WhatsApp message with no text shows an error toast.
- [ ] Sending to "Select Customers" with none checked shows an error toast.
- [ ] Custom date filter with no dates selected shows an error toast.
- [ ] Downloading CSV with zero filtered transactions shows an error toast.
- [ ] Deleting a customer who has kata entries — entries remain in `kataEntries` (orphaned, not deleted — acceptable for v1).

---

## 05 Performance

- [ ] Opening the Transactions page with 1000+ records renders within 1 second (pagination limits to 15 per page).
- [ ] WhatsApp message send to 50+ customers does not freeze the UI (async fetch).
- [ ] No `render*()` function is called more times than necessary on a single user action.

---

## 06 Pre-build checklist

Run these before pushing to `main`:

```
# 1. Check for leftover debug code
grep -n "console.log\|debugger\|TODO\|FIXME" app.js main.js server/index.js

# 2. Verify no secrets
grep -rn "password\|token\|secret" --include="*.js" --include="*.json" .

# 3. Confirm package.json values
cat package.json | grep -E "name|version|appId|productName"

# 4. Confirm server/auth_info is gitignored
cat .gitignore | grep auth_info
```

- [ ] Zero `console.log` / `debugger` in `app.js`, `main.js`, `server/index.js`.
- [ ] `package.json` `appId` is `com.xeroxshop.manager`.
- [ ] `package.json` `productName` is `Shop Manager`.
- [ ] `server/auth_info/` is in `.gitignore`.
- [ ] `build.files` excludes `server/auth_info/**`.

---

## 07 Post-install smoke test (on a clean machine)

| Step | Expected result | Pass? |
| --- | --- | --- |
| Launch app | Window opens, WhatsApp server starts, Dashboard shows zeros | |
| Add a customer | Appears in Customers table | |
| Add a product | Appears in Products table | |
| Record a paid transaction | Appears in Transactions, revenue updates on Dashboard | |
| Record an unpaid transaction | Kata entry created, customer shows red unpaid badge | |
| Open Kata Book | Unpaid entry listed with correct amount | |
| Mark kata entry paid | Badge turns green, transaction status updates | |
| Generate a bill | Bill preview renders, auto-saved to Transactions | |
| Print bill | Print dialog opens with correct content | |
| WhatsApp QR scan | Badge turns 🟢 Connected | |
| Send WhatsApp message | Message log shows sent/failed per customer | |
| Upload shop logo | Logo appears in sidebar and on bill preview | |
| Close and reopen app | All data persists | |
| Check for Update | Shows latest version or triggers download | |

All rows must pass before the build is distributed.
