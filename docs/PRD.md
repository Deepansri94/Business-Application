# PRD: Inventory Manager

## 01 Product overview

| Field | Value |
| --- | --- |
| Product name | Inventory Manager |
| Tagline | Track stock and unpaid customers for small retail shops |
| Description | A desktop app for small retail shop owners to manage inventory, record purchases, track revenue, and note unpaid customer balances — replacing manual written ledgers. |
| Stage | MVP |
| Platform | Desktop (Electron, Windows) |

## 02 Problem

Today, small retail shop owners track stock, purchases, and customer credit in handwritten notebooks. Finding a product's current stock, knowing who owes money, or seeing monthly revenue requires flipping through pages. Entries get lost, totals are wrong, and there is no quick way to know what to restock.

## 03 Goal

Help shop owners replace their written ledger with a fast desktop app that shows live stock levels, purchase costs, revenue, and unpaid customer balances at a glance.

## 04 Target users

Primary user:
- Who: Small retail shop owner, runs the shop alone or with one helper
- Trigger: Stock runs out unexpectedly, or a customer disputes their unpaid balance
- Today they use: Handwritten notebook / mental memory
- They will switch because: Instant stock lookup and unpaid balance tracking without searching through pages

Not for:
- Large warehouses or multi-branch businesses
- Shops that need barcode scanning or POS hardware integration (v2)

## 05 Core features

| # | Feature | What the user can do | Done when |
| --- | --- | --- | --- |
| 1 | Inventory Management | Add products with stock quantity; update stock when items are sold or restocked | Product list shows current stock; low-stock items are highlighted |
| 2 | Purchase Tracking | Record supplier purchases with items, quantities, and cost | Purchase history is saved; stock quantity increases automatically on purchase |
| 3 | Revenue Tracking | Record sales transactions; view total, paid, and unpaid revenue | Dashboard shows today's revenue, total revenue, and total unpaid |
| 4 | Unpaid Customer Ledger | Add customers; record unpaid sales against them; mark as paid | Customer list shows each customer's unpaid balance; mark-paid clears the balance |

Key user flow:
1. Owner opens the app to the Dashboard — sees live stock alerts, today's revenue, and total unpaid
2. A customer buys items — owner records a transaction, marks paid or unpaid
3. If unpaid, the amount appears in the customer's ledger
4. Owner receives stock from supplier — records a purchase, stock count updates
5. Owner checks Inventory page to see what needs reordering

## 06 Success metrics

| Metric | Target | Measured by |
| --- | --- | --- |
| All 4 features usable end-to-end | 100% | Manual test on first run |
| Stock count updates on purchase and sale | Accurate | Add purchase → check inventory count |
| Unpaid balance clears on mark-paid | Accurate | Mark paid → balance shows ₹0 |

## 07 Out of scope

- WhatsApp messaging (not needed for inventory focus)
- Bill printing / PDF generation (v2)
- Barcode scanning
- Multi-user / cloud sync
- Mobile app

## 08 Open questions

- Should selling an item (transaction) automatically reduce stock, or should stock be managed separately?
  Recommendation: yes, auto-reduce stock on sale transaction.
- Low-stock threshold: fixed at 5 units or configurable per product?
  Recommendation: fixed at 5 for v1, configurable in v2.
