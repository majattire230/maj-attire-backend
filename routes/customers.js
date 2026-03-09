const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../database/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// ── GET /api/customers/profile  ───────────────────────────────
router.get('/profile', authMiddleware, (req, res) => {
  db.get(
    'SELECT id, name, email, phone, address, city, country, created_at FROM customers WHERE id = ?',
    [req.customer.id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Customer not found' });
      res.json(row);
    }
  );
});

// ── PUT /api/customers/profile  ───────────────────────────────
router.put('/profile', authMiddleware, (req, res) => {
  const { name, phone, address, city, country } = req.body;
  db.run(
    `UPDATE customers SET name=?, phone=?, address=?, city=?, country=?, updated_at=datetime('now') WHERE id=?`,
    [name, phone, address, city, country || 'Pakistan', req.customer.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// ── PUT /api/customers/change-password  ───────────────────────
router.put('/change-password', authMiddleware, (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password) {
    return res.status(400).json({ error: 'Both old and new passwords are required' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  db.get('SELECT password FROM customers WHERE id = ?', [req.customer.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!bcrypt.compareSync(old_password, row.password)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    const hashed = bcrypt.hashSync(new_password, 10);
    db.run('UPDATE customers SET password = ? WHERE id = ?', [hashed, req.customer.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Password changed successfully' });
    });
  });
});

// ── GET /api/customers  [ADMIN] ───────────────────────────────
// Get all customers
router.get('/', adminMiddleware, (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;

  let query = `SELECT c.id, c.name, c.email, c.phone, c.city, c.created_at,
               COUNT(o.id) as total_orders,
               COALESCE(SUM(o.total_amount), 0) as total_spent
               FROM customers c
               LEFT JOIN orders o ON o.customer_id = c.id`;
  const params = [];

  if (search) {
    query += ' WHERE c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ customers: rows, page: Number(page), limit: Number(limit) });
  });
});

// ── GET /api/customers/:id  [ADMIN] ───────────────────────────
router.get('/:id', adminMiddleware, (req, res) => {
  db.get(
    `SELECT id, name, email, phone, address, city, country, created_at FROM customers WHERE id = ?`,
    [req.params.id], (err, customer) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!customer) return res.status(404).json({ error: 'Customer not found' });

      db.all('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC', [customer.id], (err, orders) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ...customer, orders });
      });
    }
  );
});

module.exports = router;
