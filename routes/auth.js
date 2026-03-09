const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'maj_secret_key';
const JWT_EXPIRES = '7d';

// ── POST /api/auth/register ──────────────────────────────────
// Customer registration
router.post('/register', (req, res) => {
  const { name, email, phone, password, address, city } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  db.get('SELECT id FROM customers WHERE email = ?', [email], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = bcrypt.hashSync(password, 10);
    db.run(
      `INSERT INTO customers (name, email, phone, password, address, city) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone || null, hashed, address || null, city || null],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });

        const token = jwt.sign(
          { id: this.lastID, email, name, role: 'customer' },
          JWT_SECRET, { expiresIn: JWT_EXPIRES }
        );
        res.status(201).json({
          message: 'Registration successful! Welcome to M.A.J Attire ✨',
          token,
          customer: { id: this.lastID, name, email, phone, city }
        });
      }
    );
  });
});

// ── POST /api/auth/login ────────────────────────────────────
// Customer login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM customers WHERE email = ?', [email], (err, customer) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!customer) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = bcrypt.compareSync(password, customer.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: customer.id, email: customer.email, name: customer.name, role: 'customer' },
      JWT_SECRET, { expiresIn: JWT_EXPIRES }
    );
    res.json({
      message: `Welcome back, ${customer.name}!`,
      token,
      customer: {
        id: customer.id, name: customer.name, email: customer.email,
        phone: customer.phone, city: customer.city, address: customer.address
      }
    });
  });
});

// ── POST /api/auth/admin/login ──────────────────────────────
// Admin login
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM admins WHERE email = ?', [email], (err, admin) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = bcrypt.compareSync(password, admin.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, username: admin.username, role: admin.role },
      JWT_SECRET, { expiresIn: JWT_EXPIRES }
    );
    res.json({
      message: 'Admin login successful',
      token,
      admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role }
    });
  });
});

module.exports = router;
