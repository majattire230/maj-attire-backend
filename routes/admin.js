const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { adminMiddleware } = require('../middleware/auth');

// All admin routes require admin token
router.use(adminMiddleware);

// ── GET /api/admin/dashboard ──────────────────────────────────
// Main dashboard stats
router.get('/dashboard', (req, res) => {
  const stats = {};

  db.get('SELECT COUNT(*) as total, SUM(total_amount) as revenue FROM orders', [], (err, orders) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.total_orders = orders.total;
    stats.total_revenue = orders.revenue || 0;

    db.get("SELECT COUNT(*) as total FROM orders WHERE status = 'pending'", [], (err, pending) => {
      stats.pending_orders = pending.total;

      db.get('SELECT COUNT(*) as total FROM customers', [], (err, customers) => {
        stats.total_customers = customers.total;

        db.get('SELECT COUNT(*) as total FROM newsletter WHERE is_active = 1', [], (err, subs) => {
          stats.newsletter_subscribers = subs.total;

          // Revenue last 7 days
          db.all(
            `SELECT DATE(created_at) as date, SUM(total_amount) as revenue, COUNT(*) as orders
             FROM orders
             WHERE created_at >= datetime('now', '-7 days')
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [], (err, chart) => {
              stats.last_7_days = chart || [];

              // Top selling products
              db.all(
                `SELECT p.name, p.category, SUM(oi.quantity) as units_sold, SUM(oi.subtotal) as revenue
                 FROM order_items oi JOIN products p ON p.id = oi.product_id
                 GROUP BY oi.product_id ORDER BY units_sold DESC LIMIT 5`,
                [], (err, top) => {
                  stats.top_products = top || [];

                  // Recent orders
                  db.all(
                    `SELECT o.id, o.total_amount, o.status, o.created_at, c.name as customer_name
                     FROM orders o JOIN customers c ON c.id = o.customer_id
                     ORDER BY o.created_at DESC LIMIT 10`,
                    [], (err, recent) => {
                      stats.recent_orders = recent || [];
                      res.json(stats);
                    }
                  );
                }
              );
            }
          );
        });
      });
    });
  });
});

// ── GET /api/admin/reports/sales ─────────────────────────────
router.get('/reports/sales', (req, res) => {
  const { from, to } = req.query;
  let query = `SELECT DATE(o.created_at) as date,
               COUNT(o.id) as orders,
               SUM(o.total_amount) as revenue,
               AVG(o.total_amount) as avg_order_value
               FROM orders o WHERE 1=1`;
  const params = [];

  if (from) { query += ' AND DATE(o.created_at) >= ?'; params.push(from); }
  if (to)   { query += ' AND DATE(o.created_at) <= ?'; params.push(to); }

  query += ' GROUP BY DATE(o.created_at) ORDER BY date DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ report: rows });
  });
});

// ── GET /api/admin/reports/customers ─────────────────────────
router.get('/reports/customers', (req, res) => {
  db.all(
    `SELECT c.id, c.name, c.email, c.phone, c.city, c.created_at,
     COUNT(o.id) as orders, COALESCE(SUM(o.total_amount), 0) as spent
     FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
     GROUP BY c.id ORDER BY spent DESC`,
    [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ customers: rows });
    }
  );
});

module.exports = router;
