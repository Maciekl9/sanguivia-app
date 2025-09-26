const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const dns = require('dns').promises;
const net = require('net');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Global preflight handler
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Database connection (optional - only if DATABASE_URL is present)
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  });
}

// In-memory storage (fallback if no database)
const users = new Map();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || 'true') === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 60000,
  socketTimeout: 90000,
  requireTLS: true
});

// Test SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP connection error:', error.message);
  } else {
    console.log('✅ SMTP server is ready to take our messages');
  }
});

// Test database connection on startup
if (pool) {
  pool.connect((err, client, release) => {
    if (err) {
      console.error('❌ Database connection error:', err.message);
    } else {
      console.log('✅ Connected to PostgreSQL database');
      release();
    }
  });
}

// Helper function to get user by email
async function getUserByEmail(email) {
  if (pool) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  } else {
    return users.get(email) || null;
  }
}

// Helper function to save user
async function saveUser(user) {
  if (pool) {
    const result = await pool.query(
      'INSERT INTO users (firstname, lastname, login, email, password_hash, is_verified, verification_token, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [user.firstname, user.lastname, user.login, user.email, user.password_hash, user.is_verified, user.verification_token, user.created_at]
    );
    return result.rows[0].id;
  } else {
    const id = Date.now();
    users.set(user.email, { ...user, id });
    return id;
  }
}

// Helper function to update user
async function updateUser(email, updates) {
  if (pool) {
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [email, ...Object.values(updates)];
    await pool.query(`UPDATE users SET ${setClause} WHERE email = $1`, values);
  } else {
    const user = users.get(email);
    if (user) {
      Object.assign(user, updates);
      users.set(email, user);
    }
  }
}

// Routes

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// GET /api/diag/smtp
app.get('/api/diag/smtp', async (req, res) => {
  try {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT || 465);
    
    const lookup = await dns.lookup(host, { family: 4 });
    
    const socket = net.connect({ host: lookup.address, port, timeout: 10000 }, () => {
      socket.end();
      res.json({ ok: true, host, ip: lookup.address, port });
    });
    
    socket.on('error', (e) => {
      res.status(502).json({ ok: false, error: e.message });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      res.status(504).json({ ok: false, error: 'connect timeout' });
    });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message });
  }
});

// POST /api/init-db (optional)
app.post('/api/init-db', async (req, res) => {
  if (!pool) {
    return res.status(400).json({ error: 'Database not configured' });
  }
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        firstname VARCHAR(100) NOT NULL,
        lastname VARCHAR(100) NOT NULL,
        login VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    res.json({ ok: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ error: 'Database initialization failed', detail: error.message });
  }
});

// POST /api/register
app.post('/api/register', async (req, res) => {
  try {
    const { firstname, lastname, login, email, password } = req.body;

    // Validate input
    if (!firstname || !lastname || !login || !email || !password) {
      return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Hasło musi mieć co najmniej 6 znaków' });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Użytkownik o tym emailu już istnieje' });
    }

    // Check if login already exists (if using database)
    if (pool) {
      const existingLogin = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
      if (existingLogin.rows.length > 0) {
        return res.status(400).json({ error: 'Użytkownik o tym loginie już istnieje' });
      }
    } else {
      // Check in memory storage
      for (const user of users.values()) {
        if (user.login === login) {
          return res.status(400).json({ error: 'Użytkownik o tym loginie już istnieje' });
        }
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = jwt.sign(
      { email }, 
      process.env.APP_JWT_SECRET || 'default-secret-key-min-32-chars', 
      { expiresIn: '24h' }
    );

    // Create user object
    const user = {
      firstname,
      lastname,
      login,
      email,
      password_hash: passwordHash,
      is_verified: false,
      verification_token: verificationToken,
      created_at: new Date()
    };

    // Save user
    const userId = await saveUser(user);

    // Send verification email
    const verificationUrl = `${process.env.APP_BASE_URL || 'https://sanguivia.pl'}/verify/${verificationToken}`;
    
    try {
      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'Sanguivia <noreply@sanguivia.pl>',
        to: email,
        subject: 'Aktywacja konta — Sanguivia',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Witaj w Sanguivia!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Kliknij, aby potwierdzić konto (ważne 24h)
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
                Aktywuj konto
              </a>
            </div>
            <p style="color: #999; font-size: 14px; text-align: center;">
              Jeśli to nie Ty – zignoruj tę wiadomość.
            </p>
          </div>
        `
      });
      
      console.log('MAIL OK', info.messageId);
      res.status(201).json({ ok: true, userId });
      
    } catch (mailError) {
      console.error('MAIL ERR', mailError.message);
      res.status(500).json({ error: 'MAIL_SEND_FAILED', detail: mailError.message });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error', detail: error.message });
  }
});

// GET /api/verify/:token
app.get('/api/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.APP_JWT_SECRET || 'default-secret-key-min-32-chars');
    
    // Update user verification status
    await updateUser(decoded.email, { 
      is_verified: true, 
      verification_token: null 
    });

    res.json({ ok: true });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(400).json({ error: 'Token wygasł lub nieprawidłowy' });
  }
});

// POST /api/resend-activation
app.post('/api/resend-activation', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email jest wymagany' });
    }

    // Find user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: 'Konto już jest aktywowane' });
    }

    // Generate new verification token
    const verificationToken = jwt.sign(
      { email }, 
      process.env.APP_JWT_SECRET || 'default-secret-key-min-32-chars', 
      { expiresIn: '24h' }
    );

    // Update user with new token
    await updateUser(email, { verification_token: verificationToken });

    // Send activation email
    const verificationUrl = `${process.env.APP_BASE_URL || 'https://sanguivia.pl'}/verify/${verificationToken}`;
    
    try {
      const info = await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'Sanguivia <noreply@sanguivia.pl>',
        to: email,
        subject: 'Aktywacja konta — Sanguivia',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Witaj w Sanguivia!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Kliknij, aby potwierdzić konto (ważne 24h)
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
                Aktywuj konto
              </a>
            </div>
            <p style="color: #999; font-size: 14px; text-align: center;">
              Jeśli to nie Ty – zignoruj tę wiadomość.
            </p>
          </div>
        `
      });
      
      console.log('MAIL OK', info.messageId);
      res.json({ ok: true });
      
    } catch (mailError) {
      console.error('MAIL ERR', mailError.message);
      res.status(500).json({ error: 'MAIL_SEND_FAILED', detail: mailError.message });
    }

  } catch (error) {
    console.error('Resend activation error:', error);
    res.status(500).json({ error: 'Server error', detail: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 SMTP diagnostic: http://localhost:${PORT}/api/diag/smtp`);
  console.log(`🌐 Server accessible from: http://0.0.0.0:${PORT}`);
});