// ════════════════════════════════════
//  routes/auth.js — Authentication
// ════════════════════════════════════
const express = require('express');
const router  = express.Router();
const DB      = require('../db');

// In-memory OTP store  { email → { code, userId, expiresAt } }
const otpStore = {};

// ── POST /api/auth/login ──
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required.' });

  const user = DB.filter('users', u => u.email === email && u.password === password)[0];
  if (!user)
    return res.status(401).json({ error: 'Invalid email or password.' });

  const { password: _, ...safeUser } = user;
  res.json({ message: 'Login successful', user: safeUser });
});

// ── POST /api/auth/register ──
router.post('/register', (req, res) => {
  const { name, email, password, role, branch_id } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  if (DB.filter('users', u => u.email === email).length > 0)
    return res.status(409).json({ error: 'Email already registered.' });

  const user = DB.insert('users', {
    name, email, password,
    role: role || 'user',
    branch_id: branch_id || null
  });

  const { password: _, ...safeUser } = user;
  res.status(201).json({ message: 'Account created successfully', user: safeUser });
});

// ── POST /api/auth/forgot-password ──
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ error: 'Email required.' });

  const user = DB.filter('users', u => u.email === email)[0];
  if (!user)
    return res.status(404).json({ error: 'No account found with this email.' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { code, userId: user.id, expiresAt: Date.now() + 10 * 60 * 1000 };

  // NOTE: In production, send email via nodemailer/SendGrid here.
  // For demo, we return the OTP in the response.
  console.log(`📧 OTP for ${email}: ${code}`);
  res.json({ message: 'OTP sent to email.', otp_demo: code }); // remove otp_demo in production
});

// ── POST /api/auth/verify-otp ──
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const entry = otpStore[email];
  if (!entry)
    return res.status(400).json({ error: 'No OTP requested for this email.' });
  if (Date.now() > entry.expiresAt)
    return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
  if (entry.code !== otp)
    return res.status(400).json({ error: 'Incorrect OTP.' });

  res.json({ message: 'OTP verified', token: `reset_${email}_${Date.now()}` });
});

// ── POST /api/auth/reset-password ──
router.post('/reset-password', (req, res) => {
  const { email, otp, newPassword } = req.body;
  const entry = otpStore[email];
  if (!entry || entry.code !== otp)
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  DB.update('users', entry.userId, { password: newPassword });
  delete otpStore[email];
  res.json({ message: 'Password reset successfully.' });
});

module.exports = router;
