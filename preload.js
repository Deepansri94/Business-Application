const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openQR: () => ipcRenderer.send('open-qr'),
  onWAStatus: (callback) => ipcRenderer.on('wa-status', (_, data) => callback(data))
});
