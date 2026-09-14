const path = require('path');

const HAS_PG = !!process.env.DATABASE_URL;

function convertParams(sql) {
  const pg = HAS_PG;
  if (!pg) return sql;
  let i = 0;
  sql = sql.replace(/\?/g, () => `$${++i}`);
  sql = sql.replace(/datetime\('now',\s*'localtime'\)/g, "now()");
  sql = sql.replace(/datetime\('now'\)/g, "now()");
  return sql;
}

async function init() {
  if (HAS_PG) {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, family: 4, connectionTimeoutMillis: 30000 });
    pool.on('error', err => console.error('[PG] pool error:', err.message));
    await pool.query(SCHEMA_PG);
    return seed();
  }
  const Database = require('better-sqlite3');
  sqlite = new Database(path.join(__dirname, 'urimai.db'));
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(SCHEMA_SQLITE);
  return seed();
}

let sqlite = null;
let pool = null;

const SCHEMA_SQLITE = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS otp_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    category TEXT DEFAULT '',
    school TEXT DEFAULT '',
    income TEXT DEFAULT '',
    gender TEXT DEFAULT '',
    age TEXT DEFAULT '',
    ex_service INTEGER DEFAULT 0,
    differently_abled INTEGER DEFAULT 0,
    sports INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS saved_reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reservation_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, reservation_id)
  );
  CREATE TABLE IF NOT EXISTS queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_reply TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

const SCHEMA_PG = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS otp_codes (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
    category TEXT DEFAULT '',
    school TEXT DEFAULT '',
    income TEXT DEFAULT '',
    gender TEXT DEFAULT '',
    age TEXT DEFAULT '',
    ex_service INTEGER DEFAULT 0,
    differently_abled INTEGER DEFAULT 0,
    sports INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS saved_reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    reservation_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, reservation_id)
  );
  CREATE TABLE IF NOT EXISTS queries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_reply TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER,
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
  );
`;

async function seed() {
  const bcrypt = require('bcryptjs');
  const existing = await get('SELECT id FROM admins WHERE username = ?', 'admin');
  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10);
    await run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', 'admin', hash);
    console.log('[DB] Default admin created — username: admin / password: admin123');
  }
}

async function get(sql, ...params) {
  sql = convertParams(sql);
  if (HAS_PG) {
    const res = await pool.query(sql, params);
    return res.rows[0] || null;
  }
  return sqlite.prepare(sql).get(...params);
}

async function all(sql, ...params) {
  sql = convertParams(sql);
  if (HAS_PG) {
    const res = await pool.query(sql, params);
    return res.rows;
  }
  return sqlite.prepare(sql).all(...params);
}

async function run(sql, ...params) {
  const wasPg = HAS_PG;
  if (wasPg && /^\s*INSERT/i.test(sql) && !/RETURNING/i.test(sql)) {
    sql = sql.trim().replace(/;\s*$/, '') + ' RETURNING id';
  }
  sql = convertParams(sql);
  if (wasPg) {
    const res = await pool.query(sql, params);
    return { changes: res.rowCount, lastInsertRowid: res.rows && res.rows[0] ? res.rows[0].id : 0 };
  }
  const res = sqlite.prepare(sql).run(...params);
  return { changes: res.changes, lastInsertRowid: Number(res.lastInsertRowid) };
}

module.exports = { init, get, all, run, isPg: HAS_PG };