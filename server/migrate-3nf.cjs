// Migrates existing data to 3NF schema:
// 1. gallery.image (JSON) → gallery_images table
// 2. bookings.service (concatenated text) → order_items table
// 3. bookings delivery info → structured address fields
// 4. gallery_comments.image_id (text URL) → gallery_images.id FK

const { Pool } = require('pg');

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

async function migrate() {
  console.log('Starting 3NF migration...');

  // --- Step 1: Migrate gallery images ---
  console.log('\n1. Migrating gallery images...');
  const galleries = await pool.query('SELECT id, image FROM gallery WHERE image IS NOT NULL');
  let imgCount = 0;
  for (const g of galleries.rows) {
    let urls = [];
    try { urls = JSON.parse(g.image); } catch { urls = [g.image]; }
    if (!Array.isArray(urls)) urls = [urls];
    for (let i = 0; i < urls.length; i++) {
      const existing = await pool.query(
        'SELECT id FROM gallery_images WHERE gallery_id = $1 AND image_url = $2',
        [g.id, urls[i]]
      );
      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO gallery_images (gallery_id, image_url, sort_order) VALUES ($1, $2, $3)',
          [g.id, urls[i], i]
        );
        imgCount++;
      }
    }
  }
  console.log(`   Migrated ${imgCount} gallery images`);

  // --- Step 2: Link gallery_comments to gallery_images instead of text URLs ---
  console.log('\n2. Fixing gallery comments image_id references...');
  const comments = await pool.query('SELECT * FROM gallery_comments');
  let commentFixCount = 0;
  for (const c of comments.rows) {
    if (c.image_id && isNaN(parseInt(c.image_id))) { // text URL, not numeric FK
      const gi = await pool.query(
        'SELECT id FROM gallery_images WHERE gallery_id = $1 AND image_url = $2 LIMIT 1',
        [c.gallery_id, c.image_id]
      );
      if (gi.rows.length > 0) {
        await pool.query('UPDATE gallery_comments SET image_id = $1 WHERE id = $2',
          [gi.rows[0].id, c.id]);
        commentFixCount++;
      }
    }
  }
  console.log(`   Fixed ${commentFixCount} comment references`);

  // --- Step 3: Migrate bookings ---
  console.log('\n3. Migrating bookings...');
  const bookings = await pool.query('SELECT * FROM bookings ORDER BY id');
  let bookingCount = 0;
  for (const b of bookings.rows) {
    // Extract delivery info from service text if present
    let deliveryMethod = 'pickup';
    let deliveryCity = '';
    let deliveryStreet = '';
    let deliveryHouse = '';
    let deliveryApartment = '';
    let orderText = b.service || '';

    // Check for delivery info in service text
    const deliveryMatch = orderText.match(/Доставка[^:]*:\s*([^,]+),\s*([^,]+),\s*([^,]+)(?:,\s*(.+))?/i);
    if (deliveryMatch) {
      deliveryMethod = 'delivery';
      deliveryCity = deliveryMatch[1]?.trim() || '';
      deliveryStreet = deliveryMatch[2]?.trim() || '';
      deliveryHouse = deliveryMatch[3]?.trim() || '';
      deliveryApartment = deliveryMatch[4]?.trim() || '';
    }

    // Store the full service text as an order_item for history
    const existingItems = await pool.query(
      'SELECT id FROM order_items WHERE booking_id = $1 LIMIT 1', [b.id]
    );
    if (existingItems.rows.length === 0 && orderText) {
      await pool.query(
        'INSERT INTO order_items (booking_id, item_type, item_name, quantity) VALUES ($1, $2, $3, $4)',
        [b.id, 'description', orderText, 1]
      );
      bookingCount++;
    }

    // Update booking with structured delivery fields
    await pool.query(
      `UPDATE bookings SET
        booking_date = $1, booking_time = $2,
        delivery_method = $3,
        delivery_city = $4, delivery_street = $5,
        delivery_house = $6, delivery_apartment = $7
      WHERE id = $8`,
      [
        b.date || b.booking_date,
        b.time || b.booking_time,
        b.delivery_method || deliveryMethod,
        b.delivery_city || deliveryCity,
        b.delivery_street || deliveryStreet,
        b.delivery_house || deliveryHouse,
        b.delivery_apartment || deliveryApartment,
        b.id
      ]
    );
  }
  console.log(`   Migrated ${bookingCount} booking records`);

  console.log('\n3NF migration complete!');
  pool.end();
}

migrate().catch(err => { console.error('Migration error:', err); pool.end(); process.exit(1); });
