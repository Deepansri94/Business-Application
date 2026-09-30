# build-desktopEXE.md

Builds the Shop Manager as a Windows `.exe` installer using GitHub Actions + electron-builder.
Every push to `main` triggers the workflow automatically. The installer is uploaded as a GitHub Release artifact.

---

## How it works

```
Push to main
    │
    ▼
GitHub Actions (windows-latest runner)
    │
    ├── npm install (root — Electron)
    ├── npm install (server/ — Baileys + Express)
    ├── Set version from run number (1.0.<run_number>)
    ├── electron-builder --win --x64
    │       ├── bundles app files into asar
    │       └── unpacks server/ so Node can run it at runtime
    ├── Upload artifact → Actions tab (30-day retention)
    └── Create GitHub Release → tagged build-<run_number>
                └── attaches ShopManager-Setup.exe
```

The auto-update in `main.js` polls the GitHub Releases API for a newer `build-*` tag and downloads the new `.exe` to the user's Downloads folder.

---

## One-time repository setup

1. Create a GitHub repository (e.g. `Deepansri94/Business-Application`).
2. Push this project folder to the `main` branch.
3. No extra secrets needed — the workflow uses the built-in `GITHUB_TOKEN`.
4. Enable Actions: repository → Settings → Actions → Allow all actions.
5. Set workflow permissions to **Read and write**: Settings → Actions → General → Workflow permissions.

---

## Workflow file

The workflow already exists at `.github/workflows/build.yml`. Contents for reference:

```yaml
name: Build Windows App

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

env:
  VERSION_CODE: ${{ github.run_number }}
  VERSION_NAME: '1.0.${{ github.run_number }}'

jobs:
  build:
    name: Build Shop Manager Windows App
    runs-on: windows-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install root dependencies
        run: npm install

      - name: Install server dependencies
        run: npm install
        working-directory: ./server

      - name: Set version in package.json
        shell: bash
        run: |
          node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.version='${{ env.VERSION_NAME }}';fs.writeFileSync('package.json',JSON.stringify(p,null,2));console.log('Version:',p.version);"

      - name: Build Windows Installer
        run: npm run build
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Verify EXE
        shell: bash
        run: |
          set -e
          EXE=$(find dist -name "*.exe" | head -1)
          if [ -z "$EXE" ]; then
            echo "ERROR: No .exe found in dist/"
            ls -lh dist/ || true
            exit 1
          fi
          echo "SUCCESS: $EXE"
          ls -lh "$EXE"

      - name: Prepare release artifact
        shell: bash
        run: |
          mkdir -p release
          cp dist/*.exe "release/ShopManager-Setup.exe"
          ls -lh release/

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: Shop-Manager-Windows
          path: release/ShopManager-Setup.exe
          if-no-files-found: error
          retention-days: 30

      - name: Create GitHub Release and upload EXE
        shell: bash
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAG: build-${{ env.VERSION_CODE }}
          RELEASE_NAME: Shop Manager ${{ env.VERSION_NAME }}
        run: |
          set -e

          EXISTING_ID=$(curl -sS \
            -H "Authorization: Bearer ${GH_TOKEN}" \
            -H "Accept: application/vnd.github+json" \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            "https://api.github.com/repos/${GITHUB_REPOSITORY}/releases/tags/${TAG}" \
            | jq -r '.id // empty')

          if [ -n "$EXISTING_ID" ]; then
            curl -sS -X DELETE \
              -H "Authorization: Bearer ${GH_TOKEN}" \
              -H "Accept: application/vnd.github+json" \
              -H "X-GitHub-Api-Version: 2022-11-28" \
              "https://api.github.com/repos/${GITHUB_REPOSITORY}/releases/${EXISTING_ID}"
            curl -sS -X DELETE \
              -H "Authorization: Bearer ${GH_TOKEN}" \
              -H "Accept: application/vnd.github+json" \
              -H "X-GitHub-Api-Version: 2022-11-28" \
              "https://api.github.com/repos/${GITHUB_REPOSITORY}/git/refs/tags/${TAG}"
          fi

          RELEASE_RESPONSE=$(curl -sS -X POST \
            -H "Authorization: Bearer ${GH_TOKEN}" \
            -H "Accept: application/vnd.github+json" \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            -H "Content-Type: application/json" \
            "https://api.github.com/repos/${GITHUB_REPOSITORY}/releases" \
            -d "$(jq -n --arg tag "${TAG}" --arg name "${RELEASE_NAME}" \
              '{tag_name:$tag,name:$name,body:"Automated build",draft:false,prerelease:false}')")

          UPLOAD_URL=$(echo "$RELEASE_RESPONSE" | jq -r '.upload_url' | sed 's/{.*//')

          if [ -z "$UPLOAD_URL" ]; then
            echo "ERROR: Could not extract upload_url"
            exit 1
          fi

          curl -sS -X POST \
            -H "Authorization: Bearer ${GH_TOKEN}" \
            -H "Accept: application/vnd.github+json" \
            -H "Content-Type: application/octet-stream" \
            "${UPLOAD_URL}?name=ShopManager-Setup.exe" \
            --data-binary @release/ShopManager-Setup.exe

          echo "Release ${RELEASE_NAME} published."
```

---

## How to download and install on a user machine

### Option A — From GitHub Actions (during development)
1. Go to your repository → **Actions** tab
2. Click the latest **Build Windows App** run
3. Under **Artifacts**, download `Shop-Manager-Windows.zip`
4. Extract → run `ShopManager-Setup.exe`
5. Follow installer steps → Desktop shortcut created

### Option B — From GitHub Releases (for distribution)
1. Go to your repository → **Releases**
2. Find the latest release (e.g. `Shop Manager 1.0.42`)
3. Download `ShopManager-Setup.exe` directly
4. Run the installer

---

## Version numbering

| Field | Value | Example |
| --- | --- | --- |
| `VERSION_CODE` | GitHub Actions run number | `42` |
| `VERSION_NAME` | `1.0.<run_number>` | `1.0.42` |
| Git tag | `build-<run_number>` | `build-42` |

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Build fails at `npm install` (server) | Check `server/package.json` — Baileys version must be compatible with Node 20 |
| No `.exe` in `dist/` | Confirm `win.target` is `nsis` in `package.json` build config |
| Server not starting after install | Check `asarUnpack` includes `server/**/*` and `extraResources` copies `server/node_modules` |
| WhatsApp auth lost after update | Auth is stored in `~/.shopmanager/auth_info/` — persists across updates as long as that folder exists |
| Release upload fails | Set workflow permissions to Read and write in Settings → Actions → General |
| SmartScreen blocks installer | Expected for unsigned builds — user clicks "More info → Run anyway" |
| Auto-update not detecting new version | Confirm `RELEASES_API` in `main.js` matches your GitHub repository name exactly |
