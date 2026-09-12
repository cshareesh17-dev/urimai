const express = require('express');
const jwt = require('jsonwebtoken');
const https = require('https');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'urimai_secret_key_2025_change_in_production';

function generateOTP() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function sendMSG91(phone, otp) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!authKey || !templateId) return;

  const payload = JSON.stringify({
    mobile: `91${phone}`,
    OTP: otp,
    authkey: authKey,
    template_id: templateId
  });

  const options = {
    hostname: 'api.msg91.com',
    path: '/api/v5/otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) console.log(`[MSG91] OTP sent to +91${phone}`);
      else console.error(`[MSG91] Error ${res.statusCode}: ${body}`);
    });
  });
  req.on('error', err => console.error('[MSG91] Request error:', err.message));
  req.write(payload);
  req.end();
}

function sendFast2SMS(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return;

  const payload = 'authorization=' + encodeURIComponent(apiKey) +
    '&variables_values=' + encodeURIComponent(otp) +
    '&route=otp&numbers=' + encodeURIComponent('91' + phone);

  const options = {
    hostname: 'www.fast2sms.com',
    path: '/dev/bulkV2',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(payload) }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      const done = res.statusCode === 200 && body.includes('"return":true');
      if (done) console.log(`[Fast2SMS] OTP sent to +91${phone}`);
      else console.error(`[Fast2SMS] Error ${res.statusCode}: ${body}`);
    });
  });
  req.on('error', err => console.error('[Fast2SMS] Request error:', err.message));
  req.write(payload);
  req.end();
}

router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length !== 10) {
    return res.status(400).json({ error: 'Valid 10-digit phone number required' });
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await db.run('INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)', phone, code, expiresAt);

  console.log(`[OTP] Sent to +91${phone}: ${code}`);

  sendMSG91(phone, code);
  sendFast2SMS(phone, code);

  res.json({ success: true, message: 'OTP sent successfully', demo: code });
});

router.post('/verify-otp', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and OTP required' });
  }

  const record = await db.get(
    "SELECT * FROM otp_codes WHERE phone = ? AND code = ? AND used = 0 AND expires_at > datetime('now', 'localtime') ORDER BY id DESC LIMIT 1",
    phone, code
  );

  if (!record) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }

  await db.run('UPDATE otp_codes SET used = 1 WHERE id = ?', record.id);

  let user = await db.get('SELECT * FROM users WHERE phone = ?', phone);
  if (!user) {
    const result = await db.run('INSERT INTO users (phone) VALUES (?)', phone);
    user = await db.get('SELECT * FROM users WHERE id = ?', result.lastInsertRowid);
  }

  const token = jwt.sign({ userId: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '30d' });

  res.json({
    success: true,
    token,
    user: { id: user.id, phone: user.phone, name: user.name }
  });
});

module.exports = router;