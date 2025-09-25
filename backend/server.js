const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

// Routes

// Register
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
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR login = $2',
      [email, login]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Użytkownik o tym emailu lub loginie już istnieje' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Insert user into database
    const result = await pool.query(
      'INSERT INTO users (firstname, lastname, login, email, password_hash, is_verified, verification_token) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [firstname, lastname, login, email, passwordHash, false, verificationToken]
    );

    const userId = result.rows[0].id;

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
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

    res.status(201).json({ 
      message: 'Konto utworzone pomyślnie. Sprawdź email, aby je aktywować.',
      userId: userId
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Błąd serwera podczas rejestracji' });
  }
});

// Verify email
app.get('/api/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
      process.env.JWT_SECRET,
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
    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Update user with reset token
    await pool.query(
      'UPDATE users SET reset_token = $1 WHERE id = $2',
      [resetToken, user.id]
    );

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, decoded });
  } catch (error) {
    res.json({ valid: false });
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
