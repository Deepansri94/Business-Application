const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const http = require('http');
const https = require('https');

let mainWindow;
let qrWindow;
let serverProcess;
let statusInterval;

// ── Start WhatsApp backend server ────────────────────────────────
function startServer() {
  const serverPath = app.isPackaged
    ? path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), 'server', 'index.js')
    : path.join(__dirname, 'server', 'index.js');

  serverProcess = fork(serverPath, [], {
    stdio: 'ignore',
    env: { ...process.env }
  });
  serverProcess.on('error', err => console.error('Server error:', err));
  serverProcess.on('exit', code => console.log('Server exited:', code));
}

// ── Poll server status ───────────────────────────────────────────
function pollStatus() {
  http.get('http://localhost:3001/status', res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const { connected, qrReady } = JSON.parse(data);
        if (mainWindow) mainWindow.webContents.send('wa-status', { connected, qrReady });
        if (qrReady && !qrWindow) openQRWindow();
        if (connected && qrWindow) { qrWindow.close(); qrWindow = null; }
      } catch {}
    });
  }).on('error', () => {
    if (mainWindow) mainWindow.webContents.send('wa-status', { connected: false, qrReady: false });
  });
}

// ── QR Window ────────────────────────────────────────────────────
function openQRWindow() {
  if (qrWindow) return;
  qrWindow = new BrowserWindow({
    width: 420,
    height: 560,
    resizable: false,
    title: 'Connect WhatsApp - Scan QR',
    parent: mainWindow,
    modal: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  qrWindow.setMenuBarVisibility(false);
  qrWindow.loadURL('http://localhost:3001/qr');
  qrWindow.on('closed', () => qrWindow = null);
}

ipcMain.on('open-qr', () => openQRWindow());
ipcMain.handle('check-update', () => checkForUpdate(true));

// ── Main Window ──────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'Shop Manager',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile('index.html');

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // poll WhatsApp status every 3 seconds
  statusInterval = setInterval(pollStatus, 3000);
  // initial check after server warms up
  setTimeout(pollStatus, 2000);
}

// ── Auto-update ──────────────────────────────────────────────────
const RELEASES_API = 'https://api.github.com/repos/Deepansri94/Business-Application/releases/latest';
const fs = require('fs');
const os = require('os');

function send(event, payload) {
  if (mainWindow) mainWindow.webContents.send(event, payload);
}

function httpsGet(url, headers, callback) {
  const opts = new URL(url);
  const req = https.get({ hostname: opts.hostname, path: opts.pathname + opts.search, headers }, res => {
    // follow redirects (GitHub asset downloads redirect to S3)
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return httpsGet(res.headers.location, {}, callback);
    }
    callback(null, res);
  });
  req.on('error', err => callback(err));
  req.end();
}

function checkForUpdate(manual = false) {
  httpsGet(RELEASES_API, {
    'User-Agent': 'ShopManager-App',
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }, (err, res) => {
    if (err) {
      if (manual) send('update-result', { status: 'error' });
      return;
    }
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const release = JSON.parse(data);
        const tag = release.tag_name || '';
        if (!tag.startsWith('build-')) {
          if (manual) send('update-result', { status: 'up-to-date' });
          return;
        }
        const remoteCode = parseInt(tag.replace('build-', ''), 10);
        const localCode = parseInt(app.getVersion().split('.')[1] || '0', 10);
        if (remoteCode > localCode) {
          const asset = (release.assets || []).find(a => a.name.endsWith('.exe'));
          if (!asset) {
            if (manual) send('update-result', { status: 'error' });
            return;
          }
          const promptAndDownload = () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Update Available',
              message: `Shop Manager ${release.name} is available!`,
              detail: 'The installer will be downloaded to your Downloads folder. Run it to update.',
              buttons: ['Download & Install', 'Later'],
              defaultId: 0,
              cancelId: 1
            }).then(({ response }) => {
              if (response === 0) downloadAndOpen(asset.browser_download_url, release.name, manual);
              else if (manual) send('update-result', { status: 'cancelled' });
            });
          };
          if (manual) send('update-result', { status: 'available', version: release.name });
          promptAndDownload();
        } else {
          if (manual) send('update-result', { status: 'up-to-date' });
        }
      } catch {
        if (manual) send('update-result', { status: 'error' });
      }
    });
  });
}

function downloadAndOpen(url, versionName, manual) {
  if (manual) send('update-result', { status: 'downloading' });
  const dest = path.join(os.homedir(), 'Downloads', 'ShopManager-Setup.exe');
  const file = fs.createWriteStream(dest);

  httpsGet(url, { 'User-Agent': 'ShopManager-App', 'Accept': 'application/octet-stream' }, (err, res) => {
    if (err) {
      file.close();
      if (manual) send('update-result', { status: 'error' });
      return;
    }
    res.pipe(file);
    file.on('finish', () => {
      file.close(() => {
        if (manual) send('update-result', { status: 'done' });
        // open the installer — user just clicks Next/Install, no GitHub needed
        shell.openPath(dest);
      });
    });
    file.on('error', () => {
      fs.unlink(dest, () => {});
      if (manual) send('update-result', { status: 'error' });
    });
  });
}

app.whenReady().then(() => {
  startServer();
  setTimeout(createWindow, 1800);
  setTimeout(checkForUpdate, 5000); // check after app is fully loaded
});

app.on('window-all-closed', () => {
  if (statusInterval) clearInterval(statusInterval);
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
});
