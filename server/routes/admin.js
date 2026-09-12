const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'urimai_secret_key_2025_change_in_production';

function adminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Admin auth required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.adminId) return res.status(403).json({ error: 'Not admin' });
    req.adminId = decoded.adminId;
    req.adminName = decoded.username;
    next();
  } catch { return res.status(401).json({ error: 'Invalid token' }); }
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const admin = await db.get('SELECT * FROM admins WHERE username = ?', username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ adminId: admin.id, username: admin.username, isAdmin: true }, JWT_SECRET, { expiresIn: '7d' });
  await db.run('INSERT INTO activity_log (admin_id, action) VALUES (?, ?)', admin.id, 'login');

  res.json({ success: true, token, admin: { id: admin.id, username: admin.username } });
});

router.get('/dashboard', adminAuth, async (req, res) => {
  const totalUsers = (await db.get('SELECT COUNT(*) as count FROM users')).count;
  const totalQueries = (await db.get('SELECT COUNT(*) as count FROM queries')).count;
  const pendingQueries = (await db.get("SELECT COUNT(*) as count FROM queries WHERE status = 'pending'")).count;
  const resolvedQueries = (await db.get("SELECT COUNT(*) as count FROM queries WHERE status = 'resolved'")).count;
  const totalProfiles = (await db.get('SELECT COUNT(*) as count FROM user_profiles')).count;
  const totalSaved = (await db.get('SELECT COUNT(*) as count FROM saved_reservations')).count;
  const recentUsers = await db.all('SELECT id, phone, name, created_at FROM users ORDER BY created_at DESC LIMIT 10');
  const recentQueries = await db.all('SELECT id, name, phone, message, status, admin_reply, created_at FROM queries ORDER BY created_at DESC LIMIT 10');

  const categoryStats = await db.all("SELECT category, COUNT(*) as count FROM user_profiles WHERE category != '' GROUP BY category ORDER BY count DESC");
  const genderStats = await db.all("SELECT gender, COUNT(*) as count FROM user_profiles WHERE gender != '' GROUP BY gender ORDER BY count DESC");

  res.json({
    totalUsers, totalQueries, pendingQueries, resolvedQueries,
    totalProfiles, totalSaved, recentUsers, recentQueries,
    categoryStats, genderStats
  });
});

router.get('/users', adminAuth, async (req, res) => {
  const users = await db.all(`
    SELECT u.id, u.phone, u.name, u.created_at,
           p.category, p.school, p.income, p.gender, p.age,
           (SELECT COUNT(*) FROM saved_reservations WHERE user_id = u.id) as saved_count,
           (SELECT COUNT(*) FROM queries WHERE user_id = u.id) as query_count
    FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id
    ORDER BY u.created_at DESC
  `);
  res.json({ users });
});

router.get('/users/:id', adminAuth, async (req, res) => {
  const user = await db.get('SELECT id, phone, name, created_at FROM users WHERE id = ?', req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const profile = await db.get('SELECT * FROM user_profiles WHERE user_id = ?', req.params.id);
  const saved = await db.all('SELECT reservation_id, created_at FROM saved_reservations WHERE user_id = ?', req.params.id);
  const queries = await db.all('SELECT * FROM queries WHERE user_id = ? ORDER BY created_at DESC', req.params.id);
  res.json({ user, profile, saved, queries });
});

router.delete('/users/:id', adminAuth, async (req, res) => {
  await db.run('DELETE FROM saved_reservations WHERE user_id = ?', req.params.id);
  await db.run('DELETE FROM user_profiles WHERE user_id = ?', req.params.id);
  await db.run('UPDATE queries SET user_id = NULL WHERE user_id = ?', req.params.id);
  await db.run('DELETE FROM users WHERE id = ?', req.params.id);
  await db.run('INSERT INTO activity_log (admin_id, action, details) VALUES (?, ?, ?)', req.adminId, 'delete_user', `Deleted user #${req.params.id}`);
  res.json({ success: true });
});

router.get('/queries', adminAuth, async (req, res) => {
  const status = req.query.status;
  let queries;
  if (status && status !== 'all') {
    queries = await db.all('SELECT * FROM queries WHERE status = ? ORDER BY created_at DESC', status);
  } else {
    queries = await db.all('SELECT * FROM queries ORDER BY created_at DESC');
  }
  res.json({ queries });
});

router.put('/queries/:id', adminAuth, async (req, res) => {
  const { status, admin_reply } = req.body;
  if (status) {
    await db.run('UPDATE queries SET status = ? WHERE id = ?', status, req.params.id);
  }
  if (admin_reply !== undefined) {
    await db.run('UPDATE queries SET admin_reply = ? WHERE id = ?', admin_reply, req.params.id);
  }
  await db.run('INSERT INTO activity_log (admin_id, action, details) VALUES (?, ?, ?)', req.adminId, 'update_query', `Query #${req.params.id} -> ${status || 'reply updated'}`);
  res.json({ success: true });
});

router.delete('/queries/:id', adminAuth, async (req, res) => {
  await db.run('DELETE FROM queries WHERE id = ?', req.params.id);
  await db.run('INSERT INTO activity_log (admin_id, action, details) VALUES (?, ?, ?)', req.adminId, 'delete_query', `Deleted query #${req.params.id}`);
  res.json({ success: true });
});

router.get('/stats', adminAuth, async (req, res) => {
  const daily = await db.all('SELECT date(created_at) as date, COUNT(*) as count FROM users GROUP BY date(created_at) ORDER BY date DESC LIMIT 30');
  const queryDaily = await db.all('SELECT date(created_at) as date, COUNT(*) as count FROM queries GROUP BY date(created_at) ORDER BY date DESC LIMIT 30');
  const recentActivity = await db.all('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 50');
  res.json({ daily, queryDaily, recentActivity });
});

router.put('/change-password', adminAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  const admin = await db.get('SELECT * FROM admins WHERE id = ?', req.adminId);
  if (!bcrypt.compareSync(currentPassword, admin.password_hash)) {
    return res.status(401).json({ error: 'Current password wrong' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  await db.run('UPDATE admins SET password_hash = ? WHERE id = ?', hash, req.adminId);
  res.json({ success: true, message: 'Password changed' });
});

module.exports = router;