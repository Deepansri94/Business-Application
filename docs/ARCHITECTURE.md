# Architecture: Inventory Manager

## 01 System overview

```
Electron Main Process (main.js)
    |
    v
BrowserWindow loads index.html
    |
    v
app.js (all frontend logic)  <-->  localStorage (all data)
    |
    v
preload.js (IPC bridge — update check only)
```

- No backend server. No network calls except the GitHub releases API for auto-update.
- All data lives in localStorage on the machine.
- The frontend reads and writes localStorage directly. There is no API layer.

## 02 Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Desktop shell | Electron | Same as Business Application, no new dependency |
| Frontend | HTML + Vanilla JS + CSS | Same as Business Application, no build step |
| Data storage | localStorage | Per-machine, zero setup, same as Business Application |
| Build | electron-builder (NSIS) | Same as Business Application |

Do not add React, Vue, a database, or a backend server without asking.

## 03 Project structure

```
Inventory Manager/
  index.html       page structure and all modals
  app.js           all UI logic and localStorage operations
  style.css        all styles, tokens from DESIGN_SYSTEM.md
  main.js          Electron main: creates window, handles auto-update
  preload.js       exposes electronAPI (checkUpdate, onUpdateResult)
  package.json     Electron + electron-builder config
```

Where new code belongs:
- New page/section: add a `<section>` in index.html and a render function in app.js
- New modal: add the modal HTML at the bottom of index.html, open/close via openModal/closeModal
- New data type: add a load/save pair at the top of app.js, initialize from localStorage

## 04 Data model

All stored in localStorage as JSON arrays.

```
products[]        { id, name, category, price, unit, stock }
purchases[]       { id, date, supplierId?, supplierName, items[{productId,name,qty,cost}], totalCost }
transactions[]    { id, date, customerId?, customerName, items[{productId,name,qty,rate,amount}], total, paidStatus }
customers[]       { id, name, phone, email?, address? }
ledgerEntries[]   { id, customerId, customerName, date, items[{name,qty}], total, paidStatus, txnId? }
settings          { nameEnglish, phone, addr1, addr2, city, state, upi, gst, footer }
```

Rules:
- ids are Date.now().toString() strings.
- Selling a product (saveTransaction) reduces product.stock by qty sold.
- Recording a purchase (savePurchase) increases product.stock by qty purchased.
- Unpaid transaction with a customer → also creates a ledgerEntry.
- Marking a ledgerEntry paid → syncs matching transaction to paid.

## 05 Boundaries

- app.js reads and writes localStorage directly. No abstraction layer needed at this scale.
- main.js only handles: window creation, auto-update check/download, IPC.
- preload.js only exposes: checkUpdate, onUpdateResult.
- No business logic in index.html. HTML is structure only.

Never:
- Fetch external URLs from app.js (except the WA server in Business App — not present here).
- Store secrets or credentials anywhere (there are none in this app).

## 06 Decisions that look wrong but are intentional

- Stock is stored on the product record itself (not computed from transactions) so manual stock corrections are possible without a full transaction history.
- ledgerEntries duplicate some transaction data (items, total) so the ledger is readable even if a transaction is deleted.
- No ORM or query layer — localStorage at this scale does not need one.

## 07 Scalability

- Expected scale: hundreds of products, thousands of transactions per year on a single machine.
- localStorage limit (~5MB) is sufficient for this volume.
- Not planned: cloud sync, multi-device, multi-user.

## 08 When to stop and ask

Stop and ask if a task requires:
- Adding a backend server or database
- Network calls from app.js to external services
- A new npm dependency
- Changing the stock update logic (section 04 rules)
