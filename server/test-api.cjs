const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = new Pool({host:'localhost',port:5432,database:'Avtoservis',user:'postgres',password:'123'});

async function test() {
  const user = await pool.query('SELECT * FROM users WHERE email = $1', ['yelshankaclub@internet.ru']);
  const token = jwt.sign({ id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role }, 'autotuning-secret-key-2024', { expiresIn: '7d' });
  console.log('Token:', token);
  pool.end();
}
test();