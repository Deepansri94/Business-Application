import express from 'express';
import cors from 'cors';
import qrcode from 'qrcode';
import pino from 'pino';
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';

const app = express();
app.use(cors());
app.use(express.json());

const logger = pino({ level: 'silent' });

let sock = null;
let qrCodeData = null;
let isConnected = false;

async function connectWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
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
      console.log('📱 QR Code ready — open http://localhost:3001/qr in your browser to scan');
    }

    if (connection === 'open') {
      isConnected = true;
      qrCodeData = null;
      console.log('✅ WhatsApp connected!');
    }

    if (connection === 'close') {
      isConnected = false;
      const shouldReconnect = lastDisconnect?.error instanceof Boom &&
        lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('⚠️ Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) connectWhatsApp();
    }
  });
}

// ── QR Page ──────────────────────────────────────────────────────
app.get('/qr', async (req, res) => {
  if (isConnected) return res.send(`<h2 style="font-family:sans-serif;color:green;padding:40px">✅ WhatsApp is already connected!</h2>`);
  if (!qrCodeData) return res.send(`<h2 style="font-family:sans-serif;color:orange;padding:40px">⏳ Waiting for QR code... Refresh in a moment.</h2>`);

  const imgSrc = await qrcode.toDataURL(qrCodeData);
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Scan QR - Maharajothi</title>
      <meta http-equiv="refresh" content="20">
      <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; padding: 40px; background: #f0f4f8; }
        h2 { color: #1e293b; margin-bottom: 8px; }
        p { color: #64748b; margin-bottom: 24px; font-size: 0.95rem; }
        img { border: 4px solid #6366f1; border-radius: 12px; width: 280px; }
        .note { margin-top: 16px; font-size: 0.85rem; color: #94a3b8; }
      </style>
    </head>
    <body>
      <h2>📱 Scan with WhatsApp</h2>
      <p>Open WhatsApp → Linked Devices → Link a Device → Scan this QR</p>
      <img src="${imgSrc}" />
      <p class="note">Page auto-refreshes every 20 seconds</p>
    </body>
    </html>`);
});

// ── Status ───────────────────────────────────────────────────────
app.get('/status', (req, res) => {
  res.json({ connected: isConnected, qrReady: !!qrCodeData });
});

// ── Send Message ─────────────────────────────────────────────────
app.post('/send', async (req, res) => {
  const { phone, message } = req.body;
  if (!isConnected) return res.status(503).json({ success: false, error: 'WhatsApp not connected' });
  if (!phone || !message) return res.status(400).json({ success: false, error: 'phone and message required' });

  try {
    const jid = '91' + phone.replace(/\D/g, '').slice(-10) + '@s.whatsapp.net';
    await sock.sendMessage(jid, { text: message });
    res.json({ success: true, phone });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Send Bulk ────────────────────────────────────────────────────
app.post('/send-bulk', async (req, res) => {
  const { contacts, message } = req.body;
  if (!isConnected) return res.status(503).json({ success: false, error: 'WhatsApp not connected' });
  if (!contacts?.length || !message) return res.status(400).json({ success: false, error: 'contacts and message required' });

  const results = [];
  for (const c of contacts) {
    try {
      const jid = '91' + c.phone.replace(/\D/g, '').slice(-10) + '@s.whatsapp.net';
      await sock.sendMessage(jid, { text: message });
      results.push({ name: c.name, phone: c.phone, status: 'sent' });
      // small delay between messages to avoid spam detection
      await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      results.push({ name: c.name, phone: c.phone, status: 'failed', error: err.message });
    }
  }
  res.json({ success: true, results });
});

app.listen(3001, () => {
  console.log('🚀 Server running at http://localhost:3001');
  console.log('📲 Open http://localhost:3001/qr to connect WhatsApp');
});

connectWhatsApp();
