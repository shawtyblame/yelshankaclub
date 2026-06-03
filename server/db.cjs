const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'Avtoservis',
  user: 'postgres',
  password: '123'
});

const db = {
  prepare: (sql) => ({
    all: (...args) => pool.query(sql, args).then(res => res.rows),
    get: (...args) => pool.query(sql, args).then(res => res.rows[0]),
    run: (...args) => pool.query(sql, args).then(res => ({ lastInsertRowid: res.rows[0]?.id }))
  }),
  exec: (sql) => pool.query(sql)
};

const initDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      avatar TEXT,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name_ru TEXT NOT NULL,
      name_en TEXT,
      description_ru TEXT,
      description_en TEXT,
      category TEXT DEFAULT 'other',
      price TEXT,
      image TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS parts (
      id SERIAL PRIMARY KEY,
      name_ru TEXT NOT NULL,
      name_en TEXT,
      description_ru TEXT,
      description_en TEXT,
      category TEXT DEFAULT 'other',
      price TEXT,
      image TEXT,
      stock INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      car TEXT,
      service TEXT NOT NULL,
      date TEXT,
      time TEXT,
      message TEXT,
      status TEXT DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gallery (
      id SERIAL PRIMARY KEY,
      title_ru TEXT NOT NULL,
      title_en TEXT,
      description_ru TEXT,
      description_en TEXT,
      image TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

await pool.query(`
    CREATE TABLE IF NOT EXISTS gallery_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gallery_id INTEGER NOT NULL,
      image_id TEXT NOT NULL,
      comment_ru TEXT,
      comment_en TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gallery_id) REFERENCES gallery(id) ON DELETE CASCADE
    )
  `);

  const adminExists = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (adminExists.rows.length === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      ['yelshankaclub@internet.ru', hashedPassword, 'Administrator', 'admin']
    );
    console.log('Admin user created: yelshankaclub@internet.ru / admin123');
  }

  console.log('PostgreSQL database initialized');
};

initDatabase().catch(console.error);

module.exports = db;