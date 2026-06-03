const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const nodemailer = require('nodemailer');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'YelshankaClub',
  user: 'postgres',
  password: '123'
});

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'autotuning-secret-key-2024';

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const transporter = nodemailer.createTransport({
  service: 'email',
  auth: {
    user: 'yelshankaclub@internet.ru',
    pass: 'KSqQeLxjOj7zZcNosx7B'
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, '../dist')));
app.use('/uploads', express.static(uploadsDir));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id',
      [email, hashedPassword, name || '']
    );

    const token = jwt.sign(
      { id: result.rows[0].id, email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      token, 
      user: { id: result.rows[0].id, email, name, role: 'user', avatar: null } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token, 
      user: { id: user.rows[0].id, email: user.rows[0].email, name: user.rows[0].name, role: user.rows[0].role, avatar: user.rows[0].avatar } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const user = await pool.query('SELECT id, email, name, role, avatar FROM users WHERE id = $1', [req.user.id]);
  if (user.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user.rows[0]);
});

app.put('/api/auth/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    if (name !== undefined) {
      await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, req.user.id]);
    }
    if (avatar !== undefined) {
      await pool.query('UPDATE users SET avatar = $1 WHERE id = $2', [avatar, req.user.id]);
    }
    
    const user = await pool.query('SELECT id, email, name, role, avatar FROM users WHERE id = $1', [req.user.id]);
    res.json(user.rows[0]);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.get('/api/services', async (req, res) => {
  const services = await pool.query('SELECT * FROM services ORDER BY created_at DESC');
  res.json(services.rows);
});

app.get('/api/services/:id', async (req, res) => {
  const service = await pool.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
  if (service.rows.length === 0) {
    return res.status(404).json({ error: 'Service not found' });
  }
  res.json(service.rows[0]);
});

app.post('/api/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name_ru, name_en, description_ru, description_en, category, price, image } = req.body;
    
    if (!name_ru) {
      return res.status(400).json({ error: 'Name (RU) is required' });
    }

    const result = await pool.query(`
      INSERT INTO services (name_ru, name_en, description_ru, description_en, category, price, image)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [name_ru, name_en, description_ru, description_en, category, price, image]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

app.put('/api/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name_ru, name_en, description_ru, description_en, category, price, image } = req.body;
    
    await pool.query(`
      UPDATE services 
      SET name_ru = $1, name_en = $2, description_ru = $3, description_en = $4, 
          category = $5, price = $6, image = $7
      WHERE id = $8
    `, [name_ru, name_en, description_ru, description_en, category, price, image, req.params.id]);

    const service = await pool.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
    res.json(service.rows[0]);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

app.delete('/api/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM services WHERE id = $1', [req.params.id]);
    res.json({ message: 'Service deleted' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

app.get('/api/parts', async (req, res) => {
  const parts = await pool.query('SELECT * FROM parts ORDER BY created_at DESC');
  res.json(parts.rows);
});

app.get('/api/parts/:id', async (req, res) => {
  const part = await pool.query('SELECT * FROM parts WHERE id = $1', [req.params.id]);
  if (part.rows.length === 0) {
    return res.status(404).json({ error: 'Part not found' });
  }
  res.json(part.rows[0]);
});

app.post('/api/parts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name_ru, name_en, description_ru, description_en, category, price, image, stock } = req.body;
    
    if (!name_ru) {
      return res.status(400).json({ error: 'Name (RU) is required' });
    }

    const result = await pool.query(`
      INSERT INTO parts (name_ru, name_en, description_ru, description_en, category, price, image, stock)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [name_ru, name_en, description_ru, description_en, category, price, image, stock || 0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create part error:', error);
    res.status(500).json({ error: 'Failed to create part' });
  }
});

app.put('/api/parts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name_ru, name_en, description_ru, description_en, category, price, image, stock } = req.body;
    
    await pool.query(`
      UPDATE parts 
      SET name_ru = $1, name_en = $2, description_ru = $3, description_en = $4, 
          category = $5, price = $6, image = $7, stock = $8
      WHERE id = $9
    `, [name_ru, name_en, description_ru, description_en, category, price, image, stock || 0, req.params.id]);

    const part = await pool.query('SELECT * FROM parts WHERE id = $1', [req.params.id]);
    res.json(part.rows[0]);
  } catch (error) {
    console.error('Update part error:', error);
    res.status(500).json({ error: 'Failed to update part' });
  }
});

app.put('/api/parts/:id/stock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined) {
      return res.status(400).json({ error: 'Stock amount required' });
    }
    await pool.query('UPDATE parts SET stock = $1 WHERE id = $2', [parseInt(stock), req.params.id]);
    const part = await pool.query('SELECT * FROM parts WHERE id = $1', [req.params.id]);
    res.json(part.rows[0]);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

app.delete('/api/parts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM parts WHERE id = $1', [req.params.id]);
    res.json({ message: 'Part deleted' });
  } catch (error) {
    console.error('Delete part error:', error);
    res.status(500).json({ error: 'Failed to delete part' });
  }
});

app.get('/api/bookings', authenticateToken, requireAdmin, async (req, res) => {
  const bookings = await pool.query(`
    SELECT b.*, u.email as user_email 
    FROM bookings b 
    LEFT JOIN users u ON b.user_id = u.id 
    ORDER BY b.created_at DESC
  `);
  res.json(bookings.rows);
});

app.get('/api/bookings/my', authenticateToken, async (req, res) => {
  const bookings = await pool.query(
    'SELECT * FROM bookings WHERE user_id = $1 OR email = $2 ORDER BY created_at DESC',
    [req.user.id, req.user.email]
  );
  res.json(bookings.rows);
});

app.post('/api/bookings', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, phone, email, car, service, date, message, items } = req.body;
    
    if (!name || !phone || !service) {
      return res.status(400).json({ error: 'Name, phone, and service are required' });
    }

    let userId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) {}
    }

    await client.query('BEGIN');

    const result = await client.query(`
      INSERT INTO bookings (user_id, name, phone, email, car, service, date, message)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [userId, name, phone, email, car, service, date, message]);

    const bookingId = result.rows[0].id;

    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.id && item.quantity) {
          await client.query(
            'UPDATE parts SET stock = stock - $1 WHERE id = $2 AND stock >= $1',
            [item.quantity, item.id]
          );
        }
      }
    }

    await client.query('COMMIT');

    res.status(201).json({ id: bookingId, message: 'Booking created' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  } finally {
    client.release();
  }
});

app.put('/api/bookings/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.put('/api/bookings/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, phone, email, car, date, time, message, status } = req.body;
    await pool.query(`
      UPDATE bookings 
      SET name = $1, phone = $2, email = $3, car = $4, date = $5, time = $6, message = $7, status = $8
      WHERE id = $9
    `, [name, phone, email, car, date, time, message, status || 'new', req.params.id]);
    
    const booking = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    res.json(booking.rows[0]);
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

app.delete('/api/bookings/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

app.get('/api/gallery', async (req, res) => {
  const gallery = await pool.query('SELECT * FROM gallery ORDER BY created_at DESC');
  gallery.rows.forEach(item => {
    item.images = JSON.parse(item.image || '[]');
  });
  res.json(gallery.rows);
});

app.get('/api/gallery/:id', async (req, res) => {
  const item = await pool.query('SELECT * FROM gallery WHERE id = $1', [req.params.id]);
  if (item.rows.length === 0) {
    return res.status(404).json({ error: 'Gallery item not found' });
  }
  item.rows[0].images = JSON.parse(item.rows[0].image || '[]');
  res.json(item.rows[0]);
});

app.post('/api/gallery', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title_ru, title_en, description_ru, description_en, images } = req.body;
    
    if (!title_ru) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const imagesJson = JSON.stringify(images);
    
    const result = await pool.query(`
      INSERT INTO gallery (title_ru, title_en, description_ru, description_en, image)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [title_ru, title_en, description_ru, description_en, imagesJson]);

    result.rows[0].images = JSON.parse(result.rows[0].image || '[]');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create gallery error:', error);
    res.status(500).json({ error: 'Failed to create gallery item: ' + error.message });
  }
});

app.put('/api/gallery/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title_ru, title_en, description_ru, description_en, images } = req.body;
    
    const imagesJson = Array.isArray(images) ? JSON.stringify(images) : images;
    
    await pool.query(`
      UPDATE gallery 
      SET title_ru = $1, title_en = $2, description_ru = $3, description_en = $4, image = $5
      WHERE id = $6
    `, [title_ru, title_en, description_ru, description_en, imagesJson, req.params.id]);

    const item = await pool.query('SELECT * FROM gallery WHERE id = $1', [req.params.id]);
    if (item.rows[0].image) {
      item.rows[0].images = JSON.parse(item.rows[0].image);
    }
    res.json(item.rows[0]);
  } catch (error) {
    console.error('Update gallery error:', error);
    res.status(500).json({ error: 'Failed to update gallery item' });
  }
});

app.delete('/api/gallery/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM gallery WHERE id = $1', [req.params.id]);
    res.json({ message: 'Gallery item deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete gallery item' });
  }
});

app.get('/api/gallery/:id/comments', async (req, res) => {
  try {
    const comments = await pool.query('SELECT * FROM gallery_comments WHERE gallery_id = $1 ORDER BY image_id', [req.params.id]);
    res.json(comments.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/api/gallery/:id/comments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { image_id, comment_ru, comment_en } = req.body;
    if (!image_id || !comment_ru) {
      return res.status(400).json({ error: 'Image ID and comment (RU) are required' });
    }
    
    const existing = await pool.query('SELECT id FROM gallery_comments WHERE gallery_id = $1 AND image_id = $2', [req.params.id, image_id]);
    
    if (existing.rows.length > 0) {
      await pool.query('UPDATE gallery_comments SET comment_ru = $1, comment_en = $2 WHERE gallery_id = $3 AND image_id = $4',
        [comment_ru, comment_en || '', req.params.id, image_id]);
    } else {
      await pool.query('INSERT INTO gallery_comments (gallery_id, image_id, comment_ru, comment_en) VALUES ($1, $2, $3, $4)',
        [req.params.id, image_id, comment_ru, comment_en || '']);
    }
    
    const comments = await pool.query('SELECT * FROM gallery_comments WHERE gallery_id = $1 ORDER BY image_id', [req.params.id]);
    res.json(comments.rows);
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Failed to save comment' });
  }
});

app.delete('/api/gallery/:id/comments/:commentId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM gallery_comments WHERE id = $1', [req.params.commentId]);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

app.post('/api/upload', authenticateToken, requireAdmin, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const files = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ files });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/contacts', async (req, res) => {
  const contacts = await pool.query('SELECT * FROM contacts ORDER BY order_num');
  res.json(contacts.rows);
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    
    if (!name || !message) {
      return res.status(400).json({ error: 'Name and message are required' });
    }

    const emailContact = await pool.query("SELECT value FROM contacts WHERE type = 'email' LIMIT 1");
    const toEmail = emailContact.rows[0]?.value || 'info@yelshankaclub.ru';

    await transporter.sendMail({
      from: 'yelshanka.club@gmail.com',
      to: toEmail,
      subject: `Новая заявка с сайта Автосервис от ${name}`,
      text: `Имя: ${name}\nТелефон: ${phone}\nEmail: ${email}\n\nСообщение:\n${message}`
    });

    res.json({ message: 'Сообщение отправлено!' });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.post('/api/contacts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type, value, label, order_num } = req.body;
    if (!type || !value) {
      return res.status(400).json({ error: 'Type and value are required' });
    }
    const result = await pool.query(
      'INSERT INTO contacts (type, value, label, order_num) VALUES ($1, $2, $3, $4) RETURNING *',
      [type, value, label || '', order_num || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

app.put('/api/contacts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type, value, label, order_num } = req.body;
    await pool.query(
      'UPDATE contacts SET type = $1, value = $2, label = $3, order_num = $4 WHERE id = $5',
      [type, value, label || '', order_num || 0, req.params.id]
    );
    const result = await pool.query('SELECT * FROM contacts WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

app.delete('/api/contacts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM contacts WHERE id = $1', [req.params.id]);
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

app.delete('/api/upload/:filename', authenticateToken, requireAdmin, (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(uploadsDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ message: 'File deleted' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = pool;