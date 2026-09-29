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

// ── Auto-update check ───────────────────────────────────────────
const RELEASES_API = 'https://api.github.com/repos/Deepansri94/Business-Application/releases/latest';

function checkForUpdate() {
  const req = https.get(RELEASES_API, {
    headers: {
      'User-Agent': 'ShopManager-App',
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  }, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const release = JSON.parse(data);
        const tag = release.tag_name || '';
        if (!tag.startsWith('build-')) return;
        const remoteCode = parseInt(tag.replace('build-', ''), 10);
        const localCode = parseInt(app.getVersion().split('.')[1] || '0', 10);
        if (remoteCode > localCode) {
          const asset = (release.assets || []).find(a => a.name.endsWith('.exe'));
          const downloadUrl = asset
            ? asset.browser_download_url
            : `https://github.com/Deepansri94/Business-Application/releases/tag/${tag}`;
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `Shop Manager ${release.name} is available.`,
            detail: 'Click Update to download the latest installer.',
            buttons: ['Update', 'Later'],
            defaultId: 0,
            cancelId: 1
          }).then(({ response }) => {
            if (response === 0) shell.openExternal(downloadUrl);
          });
        }
      } catch {}
    });
  });
  req.on('error', () => {}); // silently skip if no network
  req.end();
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
