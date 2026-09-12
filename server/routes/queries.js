const express = require('express');
const db = require('../db');
const auth = require('../auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const { name, phone, message } = req.body;
  if (!name || !phone || !message) {
    return res.status(400).json({ error: 'Name, phone, and message are required' });
  }

  await db.run('INSERT INTO queries (user_id, name, phone, message) VALUES (?, ?, ?, ?)',
    req.userId, name, phone, message);

  res.json({ success: true, message: 'Query submitted successfully. We will contact you within 24 hours.' });
});

router.get('/', auth, async (req, res) => {
  const queries = await db.all('SELECT * FROM queries WHERE user_id = ? ORDER BY created_at DESC', req.userId);
  res.json({ queries });
});

module.exports = router;