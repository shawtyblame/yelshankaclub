const Database = require('better-sqlite3');
const { Pool } = require('pg');

const sqlite = new Database('C:/auto-tuning/data/database.sqlite');
const pg = new Pool({host:'localhost',port:5432,database:'Avtoservis',user:'postgres',password:'123'});

async function migrate() {
  const users = sqlite.prepare('SELECT * FROM users').all();
  console.log('Migrating users:', users.length);
  for (const u of users) {
    try {
      await pg.query('INSERT INTO users (email, password, name, avatar, role) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING', 
        [u.email, u.password, u.name, u.avatar || null, u.role]);
    } catch(e) { console.log('User error:', e.message); }
  }
  console.log('Users migrated');

  const services = sqlite.prepare('SELECT * FROM services').all();
  console.log('Migrating services:', services.length);
  for (const s of services) {
    await pg.query('INSERT INTO services (name_ru, name_en, description_ru, description_en, category, price, image) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [s.name_ru, s.name_en, s.description_ru, s.description_en, s.category, s.price, s.image]);
  }
  console.log('Services migrated');

  const parts = sqlite.prepare('SELECT * FROM parts').all();
  console.log('Migrating parts:', parts.length);
  for (const p of parts) {
    await pg.query('INSERT INTO parts (name_ru, name_en, description_ru, description_en, category, price, image, stock) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [p.name_ru, p.name_en, p.description_ru, p.description_en, p.category, p.price, p.image, p.stock]);
  }
  console.log('Parts migrated');

  const bookings = sqlite.prepare('SELECT * FROM bookings').all();
  console.log('Migrating bookings:', bookings.length);
  for (const b of bookings) {
    await pg.query('INSERT INTO bookings (user_id, name, phone, email, car, service, date, time, message, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [b.user_id, b.name, b.phone, b.email, b.car, b.service, b.date, b.time, b.message, b.status]);
  }
  console.log('Bookings migrated');

  sqlite.close();
  await pg.end();
  console.log('Migration complete!');
}

migrate().catch(e => { console.error(e); process.exit(1); }).finally(() => process.exit());