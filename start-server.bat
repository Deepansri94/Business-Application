@echo off
echo Starting Maharajothi WhatsApp Server...
echo.
echo Once started, open http://localhost:3001/qr in your browser to scan QR code.
echo After scanning, you can close that tab and send messages silently.
echo.
cd server
node index.js
pause
