const express = require('express');
const db = require('../db');
const auth = require('../auth');

const router = express.Router();

router.get('/profile', auth, async (req, res) => {
  const user = await db.get('SELECT id, phone, name, created_at FROM users WHERE id = ?', req.userId);
  const profile = await db.get('SELECT * FROM user_profiles WHERE user_id = ?', req.userId);
  const saved = await db.all('SELECT reservation_id FROM saved_reservations WHERE user_id = ?', req.userId);

  res.json({
    user,
    profile: profile || null,
    savedReservations: saved.map(s => s.reservation_id)
  });
});

router.put('/profile', auth, async (req, res) => {
  const { name } = req.body;
  if (name !== undefined) {
    await db.run('UPDATE users SET name = ? WHERE id = ?', name, req.userId);
  }
  res.json({ success: true });
});

router.post('/eligibility', auth, async (req, res) => {
  const { category, school, income, gender, age, exService, differently_abled, sports } = req.body;

  const existing = await db.get('SELECT * FROM user_profiles WHERE user_id = ?', req.userId);

  if (existing) {
    await db.run(`UPDATE user_profiles SET category=?, school=?, income=?, gender=?, age=?, ex_service=?, differently_abled=?, sports=?, updated_at=datetime('now') WHERE user_id=?`,
      category || '', school || '', income || '', gender || '', age || '', exService ? 1 : 0, differently_abled ? 1 : 0, sports ? 1 : 0, req.userId);
  } else {
    await db.run(`INSERT INTO user_profiles (user_id, category, school, income, gender, age, ex_service, differently_abled, sports) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      req.userId, category || '', school || '', income || '', gender || '', age || '', exService ? 1 : 0, differently_abled ? 1 : 0, sports ? 1 : 0);
  }

  res.json({ success: true });
});

router.get('/saved', auth, async (req, res) => {
  const saved = await db.all('SELECT reservation_id, created_at FROM saved_reservations WHERE user_id = ? ORDER BY created_at DESC', req.userId);
  res.json({ saved: saved.map(s => s.reservation_id) });
});

router.post('/saved', auth, async (req, res) => {
  const { reservationId } = req.body;
  if (!reservationId) return res.status(400).json({ error: 'reservationId required' });

  try {
    await db.run('INSERT INTO saved_reservations (user_id, reservation_id) VALUES (?, ?)', req.userId, reservationId);
    res.json({ success: true });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE') || (err.code === '23505')) {
      res.json({ success: true, message: 'Already saved' });
    } else {
      throw err;
    }
  }
});

router.delete('/saved/:id', auth, async (req, res) => {
  await db.run('DELETE FROM saved_reservations WHERE user_id = ? AND reservation_id = ?', req.userId, req.params.id);
  res.json({ success: true });
});

module.exports = router;