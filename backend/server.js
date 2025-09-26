const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: ['https://sanguivia-app.vercel.app', 'http://localhost:3000', 'file://'],
  credentials: true
}));
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://sanguivia_db_user:hV5Jo573qoyIWfstQnv76QBZ3lHmWEO5@dpg-d3akjop5pdvs73cvbftg-a.oregon-postgres.render.com/sanguivia_db',
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  query_timeout: 10000
});

// Email transporter - home.pl
const transporter = nodemailer.createTransport({
  host: 'serwer2563321.home.pl',
  port: 465,
  secure: true,
  auth: {
    user: 'kontakt@sanguivia.pl',
    pass: 'Patelnia2015-'
  }
});

// 
// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

// Test email connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email connection error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Routes

// Register
app.post('/api/register', async (req, res) => {
  console.log('Register request received:', req.body);
  
  let responseSent = false;
  
  // Set timeout for the entire operation
  const timeout = setTimeout(() => {
    if (!responseSent) {
      responseSent = true;
      res.status(408).json({ error: 'Request timeout' });
    }
  }, 25000);
  
  try {
    const { firstname, lastname, login, email, password } = req.body;

    // Validate input
    if (!firstname || !lastname || !login || !email || !password) {
      clearTimeout(timeout);
      if (!responseSent) {
        responseSent = true;
        return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
      }
    }

    if (password.length < 6) {
      clearTimeout(timeout);
      if (!responseSent) {
        responseSent = true;
        return res.status(400).json({ error: 'Hasło musi mieć co najmniej 6 znaków' });
      }
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR login = $2',
      [email, login]
    );

    if (existingUser.rows.length > 0) {
      clearTimeout(timeout);
      if (!responseSent) {
        responseSent = true;
        return res.status(400).json({ error: 'Użytkownik o tym emailu lub loginie już istnieje' });
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET || 'h7s8df9g8sd76f6s7g9sd87g6f7sd98f7s9', { expiresIn: '24h' });

    // Insert user into database
    const result = await pool.query(
      'INSERT INTO users (firstname, lastname, login, email, password_hash, is_verified, verification_token) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [firstname, lastname, login, email, passwordHash, false, verificationToken]
    );

    const userId = result.rows[0].id;

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://sanguivia-app.vercel.app'}/verify/${verificationToken}`;
    
    try {
      await transporter.sendMail({
        from: 'Sanguivia <kontakt@sanguivia.pl>',
        to: email,
        subject: 'Aktywacja konta Sanguivia',
        html: `
          <h2>Witaj w Sanguivia!</h2>
          <p>Dziękujemy za rejestrację. Aby aktywować swoje konto, kliknij poniższy link:</p>
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Aktywuj konto</a>
          <p>Link jest ważny przez 24 godziny.</p>
          <p>Jeśli nie rejestrowałeś się w Sanguivia, zignoruj ten email.</p>
        `
      });
      console.log('✅ Activation email sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      // Continue without failing the registration
    }

    clearTimeout(timeout);
    if (!responseSent) {
      responseSent = true;
      res.status(201).json({ 
        message: 'Konto utworzone pomyślnie. Sprawdź email, aby je aktywować.',
        userId: userId,
        activationLink: verificationUrl
      });
    }

  } catch (error) {
    clearTimeout(timeout);
    if (!responseSent) {
      responseSent = true;
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Błąd serwera podczas rejestracji' });
    }
  }
});

// Verify email
app.get('/api/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'h7s8df9g8sd76f6s7g9sd87g6f7sd98f7s9');
    
    // Update user verification status
    const result = await pool.query(
      'UPDATE users SET is_verified = true, verification_token = NULL WHERE email = $1 AND verification_token = $2',
      [decoded.email, token]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Nieprawidłowy lub wygasły token' });
    }

    res.json({ message: 'Konto zostało aktywowane pomyślnie!' });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(400).json({ error: 'Token wygasł lub jest nieprawidłowy' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
    }

    const user = result.rows[0];

    // Check if account is verified
    if (!user.is_verified) {
      return res.status(401).json({ error: 'Konto nie zostało aktywowane. Sprawdź email.' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'h7s8df9g8sd76f6s7g9sd87g6f7sd98f7s9',
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Logowanie pomyślne',
      token: token,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        login: user.login,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Błąd serwera podczas logowania' });
  }
});

// Forgot password
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_verified = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nie znaleziono aktywnego konta o tym adresie email' });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'h7s8df9g8sd76f6s7g9sd87g6f7sd98f7s9', { expiresIn: '1h' });

    // Update user with reset token
    await pool.query(
      'UPDATE users SET reset_token = $1 WHERE id = $2',
      [resetToken, user.id]
    );

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    await transporter.sendMail({
      from: 'Sanguivia <kontakt@sanguivia.pl>',
      to: email,
      subject: 'Reset hasła - Sanguivia',
      html: `
        <h2>Reset hasła</h2>
        <p>Otrzymałeś prośbę o reset hasła dla konta Sanguivia.</p>
        <p>Kliknij poniższy link, aby zresetować hasło:</p>
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Resetuj hasło</a>
        <p>Link jest ważny przez 1 godzinę.</p>
        <p>Jeśli nie prosiłeś o reset hasła, zignoruj ten email.</p>
      `
    });

    res.json({ message: 'Link do resetu hasła został wysłany na email' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Błąd serwera podczas resetu hasła' });
  }
});

// Reset password
app.post('/api/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Hasło musi mieć co najmniej 6 znaków' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'h7s8df9g8sd76f6s7g9sd87g6f7sd98f7s9');
    
    // Find user with this reset token
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND reset_token = $2',
      [decoded.userId, token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Nieprawidłowy lub wygasły token' });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL WHERE id = $2',
      [passwordHash, decoded.userId]
    );

    res.json({ message: 'Hasło zostało zresetowane pomyślnie' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ error: 'Token wygasł lub jest nieprawidłowy' });
  }
});

// Verify token (for frontend)
app.get('/api/verify-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'h7s8df9g8sd76f6s7g9sd87g6f7sd98f7s9');
    res.json({ valid: true, decoded });
  } catch (error) {
    res.json({ valid: false });
  }
});

// Send activation email manually
app.post('/api/send-activation', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email jest wymagany' });
    }
    
    // Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    const user = result.rows[0];
    
    if (user.is_verified) {
      return res.status(400).json({ error: 'Konto już jest aktywowane' });
    }
    
    // Generate new verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET || 'h7s8df9g8sd76f6s7g9sd87g6f7sd98f7s9', { expiresIn: '24h' });
    
    // Update user with new token
    await pool.query('UPDATE users SET verification_token = $1 WHERE email = $2', [verificationToken, email]);
    
    // Send activation email
    const activationLink = `${process.env.FRONTEND_URL || 'https://sanguivia-app.vercel.app'}/activate?token=${verificationToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'turkawki15@gmail.com',
      to: email,
      subject: 'Aktywacja konta Sanguivia',
      html: `
        <h2>Witaj w Sanguivia!</h2>
        <p>Dziękujemy za rejestrację. Aby aktywować swoje konto, kliknij poniższy link:</p>
        <a href="${activationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Aktywuj konto</a>
        <p>Link jest ważny przez 24 godziny.</p>
        <p>Jeśli nie rejestrowałeś się w Sanguivia, zignoruj ten email.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({ message: 'Email aktywacyjny został wysłany' });
  } catch (error) {
    console.error('Send activation error:', error);
    res.status(500).json({ error: 'Błąd wysyłania emaila' });
  }
});

// Resend activation email endpoint
app.post('/api/resend-activation', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email jest wymagany' });
    }
    
    // Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    const user = result.rows[0];
    
    if (user.is_verified) {
      return res.status(400).json({ error: 'Konto już jest aktywowane' });
    }
    
    // Generate new verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET || 'h7s8df9g8sd76f6s7g9sd87g6f7sd98f7s9', { expiresIn: '24h' });
    
    // Update user with new token
    await pool.query('UPDATE users SET verification_token = $1 WHERE email = $2', [verificationToken, email]);
    
    // Send activation email
    const activationLink = `${process.env.FRONTEND_URL || 'https://sanguivia-app.vercel.app'}/verify/${verificationToken}`;
    
    try {
      await transporter.sendMail({
        from: 'Sanguivia <kontakt@sanguivia.pl>',
        to: email,
        subject: 'Aktywacja konta Sanguivia - Ponownie',
        html: `
          <h2>Witaj w Sanguivia!</h2>
          <p>Oto nowy link aktywacyjny dla Twojego konta:</p>
          <a href="${activationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Aktywuj konto</a>
          <p>Link jest ważny przez 24 godziny.</p>
          <p>Jeśli nie rejestrowałeś się w Sanguivia, zignoruj ten email.</p>
        `
      });
      
      console.log('✅ Resend activation email sent successfully to:', email);
      res.json({ message: 'Email aktywacyjny został wysłany ponownie' });
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      res.status(500).json({ error: 'Błąd wysyłania emaila: ' + emailError.message });
    }
  } catch (error) {
    console.error('Resend activation error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Activate user endpoint (for testing)
app.post('/api/activate-user', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email jest wymagany' });
    }
    
    // Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    const user = result.rows[0];
    
    if (user.is_verified) {
      return res.status(400).json({ error: 'Konto już jest aktywowane' });
    }
    
    // Activate user
    await pool.query('UPDATE users SET is_verified = true WHERE email = $1', [email]);
    
    res.json({ message: 'Konto zostało aktywowane pomyślnie' });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Delete user endpoint
app.delete('/api/delete-user', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email jest wymagany' });
    }
    
    // Delete user from database
    const result = await pool.query('DELETE FROM users WHERE email = $1', [email]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    res.json({ message: 'Użytkownik został usunięty' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Błąd usuwania użytkownika' });
  }
});

// List all users endpoint
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, firstname, lastname, login, email, is_verified, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Błąd pobierania użytkowników' });
  }
});

// Initialize database
app.post('/api/init-db', async (req, res) => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        firstname VARCHAR(100) NOT NULL,
        lastname VARCHAR(100) NOT NULL,
        login VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    res.json({ status: 'OK', message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ error: 'Database initialization failed' });
  }
});


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sanguivia API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
