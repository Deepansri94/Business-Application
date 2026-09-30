# build-webpage.md

> **Before you start — answer this question:**
>
> | Question | Option A | Option B |
> | --- | --- | --- |
> | Does the app need a backend server? | **No** — pure HTML/JS/CSS, data stays in the browser | **Yes** — Node.js + Express, data stored in a database |
> | Where does data live? | `localStorage` in the user's browser | Server-side database (PostgreSQL, SQLite, etc.) |
> | Hosting cost | Free (GitHub Pages, Netlify, Vercel) | Paid or free tier (Render, Railway, Fly.io) |
> | Best for | Single-user, personal use, demo | Multi-user, shared data, production SaaS |
> | Current app compatibility | ✅ Works as-is, no code changes needed | ⚠️ Requires rewriting data layer to use API calls |
>
> The Inventory Manager is currently built as a static app (Option A). Choose Option B only if you need multiple users or shared data.

---

# Option A — Static Site (GitHub Pages / Netlify / Vercel)

No server. The HTML, CSS, and JS files are served directly. Data lives in the user's browser localStorage.

## How it works

```
Push to main
    │
    ▼
GitHub Actions
    │
    └── Deploy to GitHub Pages (or Netlify/Vercel via their own CI)
            └── Serves index.html, app.js, style.css directly
```

## GitHub Pages setup (free, no workflow needed)

1. Push the project to GitHub.
2. Go to repository → **Settings** → **Pages**.
3. Under **Source**, select `Deploy from a branch`.
4. Choose branch: `main`, folder: `/ (root)`.
5. Click **Save**.
6. Your app is live at `https://<your-username>.github.io/<repo-name>/`.

No workflow file needed for this option. GitHub Pages deploys automatically on every push to `main`.

---

## GitHub Actions workflow (Option A — static, with build step if needed)

Use this if you want a workflow that validates the files before deploying to GitHub Pages:

Create `.github/workflows/deploy-static.yml`:

```yaml
name: Deploy Static Site

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    name: Deploy to GitHub Pages
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Validate required files exist
        run: |
          set -e
          for f in index.html app.js style.css; do
            if [ ! -f "$f" ]; then
              echo "ERROR: $f is missing"
              exit 1
            fi
          done
          echo "All required files present."

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**After first deploy:** Go to repository → Settings → Pages → confirm Source is set to **GitHub Actions**.

---

## Netlify (Option A alternative — drag and drop)

1. Go to [netlify.com](https://netlify.com) and sign in with GitHub.
2. Click **Add new site → Import an existing project**.
3. Connect your GitHub repository.
4. Build command: *(leave blank — no build step needed)*
5. Publish directory: `.` (root)
6. Click **Deploy site**.

Netlify auto-deploys on every push to `main`. Free tier includes custom domain support.

---

## Vercel (Option A alternative)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New → Project**, import your repository.
3. Framework preset: **Other**
4. Root directory: `.`
5. Click **Deploy**.

Vercel auto-deploys on every push to `main`. Free tier available.

---

## Limitations of Option A

- Data is stored per-browser. If the user opens the app on a different device or browser, they see empty data.
- No user accounts or login.
- No shared data between multiple users.
- `localStorage` is cleared if the user clears browser data.

If any of these are a problem, use Option B.

---

---

# Option B — Node.js Web App (Express + Database)

A full server-side app. Data is stored in a database on the server. Multiple users can access the same data from any device.

## What needs to change from the current app

The current `app.js` uses `localStorage` directly. For Option B you need to:

1. Replace all `localStorage.getItem / setItem` calls with `fetch()` calls to a REST API.
2. Write an Express server with routes for each data type (products, purchases, transactions, customers, ledger).
3. Add a database (SQLite for simple single-server, PostgreSQL for production).
4. Add authentication if multiple users need separate data.

> This is a significant rewrite. Do not start Option B without completing the API and database layer first.

---

## Recommended stack for Option B

| Layer | Choice | Why |
| --- | --- | --- |
| Server | Node.js + Express | Same ecosystem as the existing project |
| Database | SQLite (single user) or PostgreSQL (multi-user) | SQLite needs zero setup; Postgres scales |
| ORM | better-sqlite3 or pg | Lightweight, no heavy ORM needed |
| Auth | express-session + bcrypt | Simple, no third-party auth service needed for v1 |
| Hosting | Render.com (free tier) or Railway | Simple Node.js deploy, free tiers available |

---

## GitHub Actions workflow (Option B — deploy to Render)

Render auto-deploys from GitHub on every push. No workflow file is strictly needed, but this workflow validates the build before Render picks it up.

Create `.github/workflows/deploy-server.yml`:

```yaml
name: Validate and Deploy Server App

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  validate:
    name: Validate Node.js App
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install
        working-directory: ./server

      - name: Check required server files exist
        run: |
          set -e
          for f in server/index.js server/package.json index.html app.js style.css; do
            if [ ! -f "$f" ]; then
              echo "ERROR: $f is missing"
              exit 1
            fi
          done
          echo "All required files present."

      - name: Run npm audit (fail on critical)
        run: npm audit --audit-level=critical
        working-directory: ./server

      - name: Confirm server starts without crashing
        run: |
          timeout 10s node server/index.js &
          sleep 5
          curl -f http://localhost:3001/health || (echo "Server health check failed" && exit 1)
          echo "Server started successfully."
        continue-on-error: false
```

> After this workflow passes, Render picks up the push and deploys automatically.
> Set up Render by connecting your GitHub repo at [render.com](https://render.com) → New Web Service.

---

## Render setup (Option B)

1. Go to [render.com](https://render.com) → **New → Web Service**.
2. Connect your GitHub repository.
3. Settings:
   - **Build command:** `npm install`
   - **Start command:** `node server/index.js`
   - **Root directory:** `./server` (or `.` if server is at root)
4. Add environment variables in the Render dashboard (never in code):
   - `PORT=3001`
   - `DATABASE_URL=<your db connection string>`
5. Click **Create Web Service**.

Render deploys automatically on every push to `main` after the GitHub Actions workflow passes.

---

## Railway setup (Option B alternative)

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**.
2. Select your repository.
3. Railway auto-detects Node.js and sets the start command.
4. Add environment variables in the Railway dashboard.
5. Attach a PostgreSQL plugin from the Railway dashboard for the database.

---

## Comparison summary

| | Option A (Static) | Option B (Node.js server) |
| --- | --- | --- |
| Code changes needed | None | Significant (rewrite data layer) |
| Hosting cost | Free | Free tier available (Render, Railway) |
| Data persistence | Browser localStorage | Server database |
| Multi-device access | No | Yes |
| Multi-user support | No | Yes (with auth) |
| Offline support | Yes | No (needs internet) |
| Deployment complexity | Very low | Medium |
| Recommended for | Personal use, single machine | Shared use, multiple users |

**Recommendation:** Start with Option A. Migrate to Option B only when you need shared data or multi-device access.
