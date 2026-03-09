const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { adminMiddleware } = require('../middleware/auth');

// POST /api/newsletter/subscribe
router.post('/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  db.run('INSERT OR IGNORE INTO newsletter (email) VALUES (?)', [email], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.json({ message: 'You are already subscribed!' });
    }
    res.status(201).json({ message: 'Welcome to M.A.J Attire newsletter! ✨' });
  });
});

// GET /api/newsletter [ADMIN]
router.get('/', adminMiddleware, (req, res) => {
  db.all('SELECT * FROM newsletter WHERE is_active = 1 ORDER BY joined_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ subscribers: rows, total: rows.length });
  });
});

module.exports = router;
