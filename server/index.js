const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const path = require('path');
const os = require('os');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

let sock = null;
let qrCodeData = null;
let isConnected = false;

// persist auth in user home so it survives app updates
const AUTH_DIR = path.join(os.homedir(), '.maharajothi', 'auth_info');
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

async function connectWhatsApp() {
  try {
    const baileys = require('@whiskeysockets/baileys');
    const pino = require('pino');
    const { Boom } = require('@hapi/boom');

    const makeWASocket = baileys.default || baileys.makeWASocket;
    const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;

    const logger = pino({ level: 'silent' });
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ['Maharajothi Enterprises', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        qrCodeData = qr;
        isConnected = false;
      }
      if (connection === 'open') {
        isConnected = true;
        qrCodeData = null;
        console.log('✅ WhatsApp connected!');
      }
      if (connection === 'close') {
        isConnected = false;
        const code = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = code !== DisconnectReason.loggedOut;
        console.log('Connection closed. Reconnect:', shouldReconnect, 'Code:', code);
        if (shouldReconnect) setTimeout(connectWhatsApp, 3000);
      }
    });
  } catch (err) {
    console.error('WhatsApp init error:', err.message);
    setTimeout(connectWhatsApp, 5000);
  }
}

// ── QR Page ──────────────────────────────────────────────────────
app.get('/qr', async (req, res) => {
  if (isConnected) return res.send(`
    <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#f0fdf4">
    <h2 style="color:#16a34a">✅ WhatsApp Connected!</h2>
    <p style="color:#64748b">You can close this window and use the app.</p>
    </body></html>`);

  if (!qrCodeData) return res.send(`
    <html><head><meta http-equiv="refresh" content="3"></head>
    <body style="font-family:sans-serif;text-align:center;padding:60px;background:#fefce8">
    <h2 style="color:#854d0e">⏳ Generating QR Code...</h2>
    <p style="color:#64748b">Please wait, refreshing automatically...</p>
    </body></html>`);

  const imgSrc = await qrcode.toDataURL(qrCodeData);
  res.send(`<!DOCTYPE html><html>
    <head><title>Scan QR - Maharajothi</title><meta http-equiv="refresh" content="20">
    <style>
      body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;padding:40px;background:#f0f4f8}
      h2{color:#1e293b;margin-bottom:6px}
      p{color:#64748b;margin-bottom:20px;font-size:.95rem}
      img{border:4px solid #6366f1;border-radius:12px;width:280px}
      .note{margin-top:14px;font-size:.82rem;color:#94a3b8}
    </style></head>
    <body>
      <h2>📱 Scan with WhatsApp</h2>
      <p>WhatsApp → ⋮ Menu → Linked Devices → Link a Device → Scan</p>
      <img src="${imgSrc}" />
      <p class="note">Auto-refreshes every 20 seconds</p>
    </body></html>`);
});

// ── Status ───────────────────────────────────────────────────────
app.get('/status', (req, res) => {
  res.json({ connected: isConnected, qrReady: !!qrCodeData });
});

// ── Send Bulk ────────────────────────────────────────────────────
app.post('/send-bulk', async (req, res) => {
  const { contacts, message } = req.body;
  if (!isConnected) return res.status(503).json({ success: false, error: 'WhatsApp not connected. Please scan QR first.' });
  if (!contacts?.length || !message) return res.status(400).json({ success: false, error: 'contacts and message required' });

  const results = [];
  for (const c of contacts) {
    try {
      const jid = '91' + c.phone.replace(/\D/g, '').slice(-10) + '@s.whatsapp.net';
      await sock.sendMessage(jid, { text: message });
      results.push({ name: c.name, phone: c.phone, status: 'sent' });
      await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      results.push({ name: c.name, phone: c.phone, status: 'failed', error: err.message });
    }
  }
  res.json({ success: true, results });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 WA Server running on port ${PORT}`));
connectWhatsApp();
