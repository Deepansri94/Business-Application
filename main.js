const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const http = require('http');

let mainWindow;
let qrWindow;
let serverProcess;

// ── Start WhatsApp backend server ────────────────────────────────
function startServer() {
  const serverPath = path.join(__dirname, 'server', 'index.js');
  serverProcess = fork(serverPath, [], { stdio: 'ignore' });
  serverProcess.on('error', err => console.error('Server error:', err));
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
    title: 'மகரஜோதி - Maharajothi Enterprises',
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
  setInterval(pollStatus, 3000);
}

app.whenReady().then(() => {
  startServer();
  setTimeout(createWindow, 1800);
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
