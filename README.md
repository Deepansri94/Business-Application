# 🖨️ Xerox & Stationery Shop — Business Management App

A desktop business management application for Xerox & Stationery shops. Manage customers, transactions, billing, products and send WhatsApp messages — all from one app.

---

## ✨ Features

### 📊 Dashboard
- Live stats — Total Customers, Today's Revenue, Total Revenue, Total Unpaid
- Recent transactions with paid/unpaid status

### 👥 Customers
- Add, Edit, Delete customers
- View unpaid balance per customer at a glance
- **📒 Kata Book** — per-customer unpaid ledger with date-wise entries
- **Mark Paid** — syncs payment status across Kata Book and Transactions
- **📲 Remind** — sends a WhatsApp payment reminder directly from the customer row

### 💰 Transactions
- Add transactions with product selection and auto price fill
- Paid / Unpaid toggle at time of entry
- Filter by **All / This Month / Last Month / Custom Date Range**
- Summary bar showing total, paid and unpaid amounts
- **Pagination** — 15 records per page
- **⬇️ Download CSV** — exports filtered transactions

### 🧾 Billing
- Generate bills with product line items
- Paid / Unpaid toggle
- Bill preview with **logo watermark**
- Save generated bills as **PDF**
- 🖨️ Print bill directly from the app
- Auto-saves to Transactions

### 📦 Products & Services
- Maintain a product/service list with category and price
- Products appear as grouped dropdowns in Bill and Transaction forms
- Price auto-fills on product selection

### 📱 WhatsApp Messaging (Silent)
- Send messages silently without opening browser
- Send to **All Customers** or **Select specific customers**
- Attach **Image or PDF** along with message
- Real-time connection status badge (🟢 Connected / 📱 Scan QR)
- **Sync WhatsApp / Scan QR** buttons on both Messages and Settings

### 📢 Payment Reminders
- One-click reminder from Customers page
- Message pre-filled from **customizable template** in Settings
- User can **edit the message** before sending
- Supports dynamic tags: `{name}`, `{items}`, `{total}`, `{shop}`, `{phone}`, `{upi}`

### ⚙️ Settings
- Configure shop name (Tamil + English), address, phone, UPI, GSTIN
- Upload **shop logo** — appears in sidebar and as watermark on bills
- Set bill footer thank you message
- Customize payment reminder template with tag helpers
- Live bill preview in settings

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Desktop | Electron |
| WhatsApp Backend | Node.js + Express + Baileys |
| Data Storage | localStorage (per machine) |
| Build & CI | GitHub Actions → Windows `.exe` |

---

## 📁 Project Structure

```
Business-Application/
├── index.html          # Main UI
├── app.js              # All frontend logic
├── style.css           # Styles
├── main.js             # Electron main process
├── preload.js          # Electron IPC bridge
├── package.json        # Electron build config
├── server/
│   ├── index.js        # WhatsApp backend (Express + Baileys)
│   └── package.json    # Server dependencies
└── .github/
    └── workflows/
        └── build.yml   # GitHub Actions Windows build
```

---

## 🚀 Installation (Client Machine)

### Option 1 — Download Installer (Recommended)
1. Go to the **Actions** tab on GitHub
2. Click the latest **Build Windows App** run
3. Download the artifact under **Artifacts**
4. Extract the `.zip` → run the `.exe` installer
5. App installs with a Desktop shortcut — just double-click to open

### Option 2 — Run from Source
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Start the app
npm start
```

---

## 📲 WhatsApp Setup

1. Open **Messages** or **Settings** and click **🔄 Sync WhatsApp / Scan QR**
2. On your phone: **WhatsApp → ⋮ Menu → Linked Devices → Link a Device**
3. Scan the QR code shown in the popup
4. Badge turns 🟢 **WhatsApp Connected**

> ✅ Auth is saved locally and reconnects automatically on next launch. Use the sync button whenever the app needs you to link the device again.

---

## ⚙️ First Time Configuration

After installing, go to **Settings** and configure:
- Shop name (shown in sidebar and on bills)
- Address, Phone, UPI ID, GSTIN
- Upload shop logo
- Customize payment reminder message template

---

## 🏗️ Build (GitHub Actions)

Every push to `main` triggers an automatic Windows build:

1. Push code to `main` branch
2. Go to the **Actions** tab on GitHub
3. Wait ~5–8 minutes for the build to complete
4. Download the `.exe` from **Artifacts**

---

## 📌 Notes

- All data (customers, transactions, products, settings) is stored in **localStorage** on the machine
- WhatsApp auth session is stored in `~/.shopmanager/auth_info/` — persists across app updates
- WhatsApp messaging requires the app to be running (server starts automatically with the app)
- Logo is stored as base64 in localStorage
