const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { adminMiddleware } = require('../middleware/auth');

// GET /api/products
router.get('/', (req, res) => {
  const { category, badge, search, min_price, max_price } = req.query;

  let query = 'SELECT * FROM products WHERE is_active = 1';
  const params = [];

  if (category)  { query += ' AND category = ?';  params.push(category); }
  if (badge)     { query += ' AND badge = ?';      params.push(badge); }
  if (search)    { query += ' AND name LIKE ?';    params.push(`%${search}%`); }
  if (min_price) { query += ' AND price >= ?';     params.push(Number(min_price)); }
  if (max_price) { query += ' AND price <= ?';     params.push(Number(max_price)); }

  query += ' ORDER BY id ASC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const parsed = rows.map(r => ({
      ...r,
      colors: JSON.parse(r.colors || '[]'),
      sizes: JSON.parse(r.sizes || '[]')
    }));
    res.json({ products: parsed, total: parsed.length });
  });
});

// GET /api/products/categories
router.get('/categories', (req, res) => {
  db.all('SELECT DISTINCT category FROM products WHERE is_active = 1', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ categories: ['All', ...rows.map(r => r.category)] });
  });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ? AND is_active = 1', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json({
      ...row,
      colors: JSON.parse(row.colors || '[]'),
      sizes: JSON.parse(row.sizes || '[]')
    });
  });
});

// POST /api/products [ADMIN]
router.post('/', adminMiddleware, (req, res) => {
  const { name, category, price, orig_price, description, badge, pattern, colors, sizes, stock } = req.body;
  if (!name || !category || !price) {
    return res.status(400).json({ error: 'name, category, and price are required' });
  }
  db.run(
    `INSERT INTO products (name, category, price, orig_price, description, badge, pattern, colors, sizes, stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, category, price, orig_price || null, description, badge || null, pattern,
     JSON.stringify(colors || []), JSON.stringify(sizes || ['XS','S','M','L','XL','XXL']), stock || 100],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Product created', id: this.lastID });
    }
  );
});

// PUT /api/products/:id [ADMIN]
router.put('/:id', adminMiddleware, (req, res) => {
  const { name, category, price, orig_price, description, badge, pattern, colors, stock, is_active } = req.body;
  db.run(
    `UPDATE products SET name=?, category=?, price=?, orig_price=?, description=?,
     badge=?, pattern=?, colors=?, stock=?, is_active=? WHERE id=?`,
    [name, category, price, orig_price, description, badge, pattern,
     JSON.stringify(colors), stock, is_active, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });
      res.json({ message: 'Product updated' });
    }
  );
});

// DELETE /api/products/:id [ADMIN]
router.delete('/:id', adminMiddleware, (req, res) => {
  db.run('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Product removed' });
  });
});

module.exports = router;
