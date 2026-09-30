# Design System: Inventory Manager

## 01 Brand identity

- Personality: practical, clear, reliable
- Tone in UI copy: plain, short sentences, no exclamation marks
- Feel: clean, data-first, no decoration
- Matches the existing Business Application visual style exactly

## 02 Color palette

| Token | Value | Use |
| --- | --- | --- |
| --color-bg | #f0f4f8 | Page background |
| --color-surface | #ffffff | Cards, panels |
| --color-surface-alt | #f8fafc | Table headers, alt rows |
| --color-border | #e2e8f0 | Dividers, input borders |
| --color-text | #1e293b | Headings, primary text |
| --color-text-muted | #64748b | Labels, secondary text |
| --color-text-body | #334155 | Table cell text |
| --color-primary | #6366f1 | Buttons, active nav, badges |
| --color-primary-hover | #4f46e5 | Hover on primary |
| --color-success | #16a34a | Paid badges, confirmations |
| --color-success-bg | #f0fdf4 | Paid badge background |
| --color-success-border | #bbf7d0 | Paid badge border |
| --color-warning | #d97706 | Low-stock highlight |
| --color-warning-bg | #fef3c7 | Low-stock row background |
| --color-danger | #dc2626 | Unpaid badges, errors, delete |
| --color-danger-bg | #fef2f2 | Unpaid badge background |
| --color-danger-border | #fecaca | Unpaid badge border |
| --color-sidebar | #1e293b | Sidebar background |
| --color-sidebar-hover | #334155 | Sidebar item hover/active |
| --color-sidebar-accent | #6366f1 | Active nav left border |
| --color-sidebar-text | #a5b4fc | Active nav text |

## 03 Typography

Font: Segoe UI (system font, same as existing app)

| Role | Size | Weight |
| --- | --- | --- |
| Page heading (h2) | 1.5rem | 700 |
| Section heading (h3) | 1.1rem | 600 |
| Body / table cell | 0.9rem | 400 |
| Label | 0.82rem | 600 |
| Small / muted | 0.8rem | 400 |
| Stat value | 1.8rem | 700 |

## 04 Spacing

Base unit 4px. Use multiples: 4, 8, 12, 16, 20, 24, 28, 32.

- Card padding: 24px
- Page padding: 32px
- Form row gap: 14px bottom margin
- Table cell padding: 12px 16px
- Button padding: 10px 20px

## 05 Border radius and shadows

| Element | Radius | Shadow |
| --- | --- | --- |
| Cards | 12px | 0 2px 8px rgba(0,0,0,.06) |
| Buttons | 8px | none |
| Inputs | 8px | none |
| Modals | 14px | 0 8px 32px rgba(0,0,0,.15) |
| Badges | 12px | none |
| Small buttons | 6px | none |

## 06 Components

Buttons

| Class | Background | Text | Use |
| --- | --- | --- | --- |
| btn-primary | #6366f1 | white | Main action per section |
| btn-secondary | #e2e8f0 | #334155 | Supporting actions |
| btn-outline | transparent + #6366f1 border | #6366f1 | Low-emphasis |
| btn-edit | #e0f2fe | #0369a1 | Edit row action |
| btn-danger | #fee2e2 | #dc2626 | Delete row action |
| btn-pay | #dcfce7 | #166534 | Mark paid action |

Badges
- Paid: green background #f0fdf4, text #16a34a, border #bbf7d0
- Unpaid: red background #fef2f2, text #dc2626, border #fecaca
- Category: purple background #ede9fe, text #6d28d9
- Low stock: amber background #fef3c7, text #92400e

Inputs: height ~38px, border #cbd5e1, focus border #6366f1, radius 8px, padding 9px 12px.

Modals: white, radius 14px, max-width 420px (wide: 580px), overlay rgba(0,0,0,.4). Close on overlay click.

Tables: header background #f8fafc, uppercase labels at 0.82rem #64748b. Row hover background #f8fafc.

Toast: fixed bottom-right, dark #1e293b background. Success: #16a34a. Error: #dc2626. Auto-dismiss 3s.

## 07 Responsive

Desktop-first (Electron window min 960px wide). Sidebar collapses to 60px icon-only below 768px.

## 08 Motion

Transitions: 0.2s on buttons, nav items, badges. No page transition animations.
