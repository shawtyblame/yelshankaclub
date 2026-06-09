const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool(
  process.env.DATABASE_PUBLIC_URL
    ? { connectionString: process.env.DATABASE_PUBLIC_URL, ssl: { rejectUnauthorized: false } }
    : process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: 'localhost',
        port: 5432,
        database: 'Avtoservis',
        user: 'postgres',
        password: '123'
      }
);

async function init() {
  // 1NF: atomic columns only, no repeating groups
  // 2NF: all non-key columns fully depend on the primary key
  // 3NF: no transitive dependencies (no column depends on another non-key column)

  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  -- 1NF: atomic columns, single-valued. 2NF: single PK. 3NF: no transitive dependencies.

  await pool.query(`CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name_ru TEXT NOT NULL,
    name_en TEXT,
    description_ru TEXT,
    description_en TEXT,
    category TEXT DEFAULT 'other',
    price TEXT,
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS parts (
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
  )`);

  // 3NF: delivery address extracted into atomic columns (city, street, house, apartment)
  //      instead of being concatenated in a single TEXT field.
  //      Order items moved to a separate order_items table.
  await pool.query(`CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    car TEXT,
    booking_date TEXT,
    booking_time TEXT,
    message TEXT,
    status TEXT DEFAULT 'new',
    delivery_method TEXT DEFAULT 'pickup',
    delivery_city TEXT,
    delivery_street TEXT,
    delivery_house TEXT,
    delivery_apartment TEXT,
    payment_method TEXT DEFAULT 'cash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // 1NF: each ordered item is a separate row (no repeating groups in bookings)
  // 2NF: depends on full composite key (id)
  // 3NF: item_name is denormalized for historical integrity (price changes over time)
  await pool.query(`CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    item_id INTEGER,
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price TEXT
  )`);
  -- item_name and unit_price are fact-dimension (historical record regardless of future changes)

  // 1NF FIX: removed image JSON array — images moved to separate table
  await pool.query(`CREATE TABLE IF NOT EXISTS gallery (
    id SERIAL PRIMARY KEY,
    title_ru TEXT NOT NULL,
    title_en TEXT,
    description_ru TEXT,
    description_en TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // 1NF: each image is a separate row (atomic values, no JSON arrays)
  await pool.query(`CREATE TABLE IF NOT EXISTS gallery_images (
    id SERIAL PRIMARY KEY,
    gallery_id INTEGER NOT NULL REFERENCES gallery(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  )`);

  // 3NF FIX: image_id now references gallery_images.id (proper FK instead of text URL)
  await pool.query(`CREATE TABLE IF NOT EXISTS gallery_comments (
    id SERIAL PRIMARY KEY,
    gallery_id INTEGER NOT NULL REFERENCES gallery(id) ON DELETE CASCADE,
    image_id INTEGER REFERENCES gallery_images(id) ON DELETE SET NULL,
    comment_ru TEXT,
    comment_en TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    label TEXT,
    order_num INTEGER DEFAULT 0
  )`);

  const admin = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (admin.rows.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    await pool.query('INSERT INTO users (email, password, name, role) VALUES ($1,$2,$3,$4)',
      ['yelshankaclub@internet.ru', hash, 'Administrator', 'admin']);
    console.log('Admin created: yelshankaclub@internet.ru / admin123');
  }
  console.log('PostgreSQL tables initialized (3NF)!');
  pool.end();
}

init().catch(console.error).finally(() => process.exit());
