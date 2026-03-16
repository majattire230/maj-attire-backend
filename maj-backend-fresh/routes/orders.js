// routes/orders.js
const router   = require('express').Router();
const Order    = require('../models/Order');
const Customer = require('../models/Customer');
const protect  = require('../middleware/auth');

// ── POST /api/orders ──────────────────────────────────────
// Public — place a new order
router.post('/', async (req, res) => {
  try {
    const { customer, shippingAddress, items, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    // Calculate totals
    const subtotal    = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const shippingCost = subtotal >= 3000 ? 0 : 250;
    const totalAmount = subtotal + shippingCost;

    const order = await Order.create({
      customer, shippingAddress, items,
      subtotal, shippingCost, totalAmount,
      paymentMethod: paymentMethod || 'cod',
      notes,
    });

    // Upsert customer record
    let cust = await Customer.findOne({ phone: customer.phone });
    if (cust) {
      cust.totalOrders += 1;
      cust.totalSpent  += totalAmount;
      cust.orders.push(order._id);
      await cust.save();
    } else {
      await Customer.create({
        name:     customer.name,
        email:    customer.email,
        phone:    customer.phone,
        city:     shippingAddress.city,
        province: shippingAddress.province,
        totalOrders: 1,
        totalSpent:  totalAmount,
        orders: [order._id],
      });
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders ───────────────────────────────────────
// Admin — all orders with filters
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { orderNumber:       { $regex: search, $options: 'i' } },
        { 'customer.name':   { $regex: search, $options: 'i' } },
        { 'customer.phone':  { $regex: search, $options: 'i' } },
      ];
    }

    const skip   = (Number(page) - 1) * Number(limit);
    const total  = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip).limit(Number(limit));

    res.json({ success: true, total, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders/:id ───────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'name images');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/orders/:id/status ──────────────────────────
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, trackingNum } = req.body;
    const update = { status };
    if (trackingNum) update.trackingNum = trackingNum;
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/orders/:id ────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
