const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// ── POST /api/orders  ─────────────────────────────────────────
// Place a new order (requires login)
router.post('/', authMiddleware, (req, res) => {
  const { items, shipping, payment_method, notes } = req.body;
  const customer_id = req.customer.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items in order' });
  }
  if (!shipping || !shipping.address || !shipping.city) {
    return res.status(400).json({ error: 'Shipping address and city are required' });
  }

  // Calculate total from DB prices (never trust frontend prices)
  const productIds = items.map(i => i.product_id);
  const placeholders = productIds.map(() => '?').join(',');

  db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, productIds, (err, products) => {
    if (err) return res.status(500).json({ error: err.message });

    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) return res.status(400).json({ error: `Product ID ${item.product_id} not found` });

      const subtotal = product.price * item.quantity;
      total += subtotal;
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        size: item.size || 'M',
        quantity: item.quantity,
        unit_price: product.price,
        subtotal
      });
    }

    // Insert order
    db.run(
      `INSERT INTO orders (customer_id, total_amount, shipping_name, shipping_phone, shipping_address, shipping_city, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, total, shipping.name, shipping.phone, shipping.address, shipping.city,
       payment_method || 'COD', notes || null],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const order_id = this.lastID;

        const stmt = db.prepare(
          `INSERT INTO order_items (order_id, product_id, product_name, size, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        orderItems.forEach(oi => {
          stmt.run([order_id, oi.product_id, oi.product_name, oi.size, oi.quantity, oi.unit_price, oi.subtotal]);
        });
        stmt.finalize();

        res.status(201).json({
          message: '🎉 Order placed successfully!',
          order_id,
          total_amount: total,
          status: 'pending'
        });
      }
    );
  });
});

// ── GET /api/orders/my  ───────────────────────────────────────
// Get logged-in customer's orders
router.get('/my', authMiddleware, (req, res) => {
  db.all(
    `SELECT o.*, GROUP_CONCAT(oi.product_name || ' x' || oi.quantity) as items_summary
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.customer_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [req.customer.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ orders: rows });
    }
  );
});

// ── GET /api/orders/:id  ─────────────────────────────────────
// Get single order with items
router.get('/:id', authMiddleware, (req, res) => {
  db.get('SELECT * FROM orders WHERE id = ? AND customer_id = ?',
    [req.params.id, req.customer.id], (err, order) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!order) return res.status(404).json({ error: 'Order not found' });

      db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id], (err, items) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ...order, items });
      });
    }
  );
});

// ── GET /api/orders  [ADMIN] ──────────────────────────────────
// Get all orders
router.get('/', adminMiddleware, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
               FROM orders o LEFT JOIN customers c ON c.id = o.customer_id`;
  const params = [];

  if (status) { query += ' WHERE o.status = ?'; params.push(status); }
  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ orders: rows, page: Number(page), limit: Number(limit) });
  });
});

// ── PUT /api/orders/:id/status  [ADMIN] ──────────────────────
// Update order status
router.put('/:id/status', adminMiddleware, (req, res) => {
  const { status, payment_status } = req.body;
  const validStatuses = ['pending','confirmed','processing','shipped','delivered','cancelled'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status', valid: validStatuses });
  }

  db.run(
    `UPDATE orders SET status = COALESCE(?, status), payment_status = COALESCE(?, payment_status),
     updated_at = datetime('now') WHERE id = ?`,
    [status || null, payment_status || null, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Order not found' });
      res.json({ message: 'Order status updated' });
    }
  );
});

module.exports = router;
