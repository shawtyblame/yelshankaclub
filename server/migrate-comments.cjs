const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'Avtoservis',
  user: 'postgres',
  password: '123'
});

async function migrate() {
  // Check if column exists
  const check = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'gallery_comments' AND column_name = 'image_index'
  `);
  
  if (check.rows.length > 0) {
    // Add new column
    await pool.query(`ALTER TABLE gallery_comments ADD COLUMN IF NOT EXISTS image_id TEXT`);
    
    // Migrate data: convert index to id
    await pool.query(`
      UPDATE gallery_comments 
      SET image_id = 'img-' || image_index::text
      WHERE image_id IS NULL
    `);
    
    // Drop old column (optional - data is already migrated)
    console.log('Migration complete! image_index -> image_id');
  } else {
    console.log('Column image_index not found, maybe already migrated?');
  }
  
  pool.end();
}

migrate().catch(console.error).finally(() => process.exit());
