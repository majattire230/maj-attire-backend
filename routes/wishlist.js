const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

// POST /api/wishlist/toggle
router.post('/toggle', authMiddleware, (req, res) => {
  const { product_id } = req.body;
  const customer_id = req.customer.id;

  db.get('SELECT id FROM wishlists WHERE customer_id = ? AND product_id = ?',
    [customer_id, product_id], (err, existing) => {
      if (err) return res.status(500).json({ error: err.message });

      if (existing) {
        db.run('DELETE FROM wishlists WHERE customer_id = ? AND product_id = ?',
          [customer_id, product_id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Removed from wishlist', action: 'removed' });
          });
      } else {
        db.run('INSERT INTO wishlists (customer_id, product_id) VALUES (?, ?)',
          [customer_id, product_id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Added to wishlist ♡', action: 'added' });
          });
      }
    }
  );
});

// GET /api/wishlist
router.get('/', authMiddleware, (req, res) => {
  db.all(
    `SELECT p.id, p.name, p.category, p.price, p.orig_price, p.badge, p.colors, w.added_at
     FROM wishlists w JOIN products p ON p.id = w.product_id
     WHERE w.customer_id = ?`,
    [req.customer.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ wishlist: rows.map(r => ({ ...r, colors: JSON.parse(r.colors || '[]') })) });
    }
  );
});

module.exports = router;
