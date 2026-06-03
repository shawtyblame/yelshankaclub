const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'Avtoservis',
  user: 'postgres',
  password: '123'
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      label TEXT,
      order_num INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('Contacts table created!');
  
  const existing = await pool.query('SELECT id FROM contacts LIMIT 1');
  if (existing.rows.length === 0) {
    await pool.query(`INSERT INTO contacts (type, value, label, order_num) VALUES 
      ('phone', '+7 (999) 123-45-67', 'Телефон', 1),
      ('email', 'info@yelshankaclub.ru', 'Email', 2),
      ('address', 'Москва, ул. Примерная, 10', 'Адрес', 3),
      ('instagram', 'yelshanka_club', 'Instagram', 4),
      ('telegram', 'yelshankaclub', 'Telegram', 5)
    `);
    console.log('Default contacts added!');
  }
  
  pool.end();
}

init().catch(console.error).finally(() => process.exit());