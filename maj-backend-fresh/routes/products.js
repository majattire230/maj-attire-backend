// routes/products.js
const router  = require('express').Router();
const Product = require('../models/Product');
const protect = require('../middleware/auth');

// ── GET /api/products ─────────────────────────────────────
// Public — with filters, search, pagination
router.get('/', async (req, res) => {
  try {
    const { category, subcategory, featured, newArrival, search, sort, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

    const query = {};
    if (category)    query.category    = category;
    if (subcategory) query.subcategory = subcategory;
    if (featured)    query.featured    = featured === 'true';
    if (newArrival)  query.newArrival  = newArrival === 'true';
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $in: [new RegExp(search, 'i')] } },
        { fabric:      { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = {};
    switch (sort) {
      case 'price-low':  sortOption = { price: 1 };       break;
      case 'price-high': sortOption = { price: -1 };      break;
      case 'rating':     sortOption = { rating: -1 };     break;
      case 'newest':     sortOption = { createdAt: -1 };  break;
      default:           sortOption = { featured: -1, createdAt: -1 };
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortOption).skip(skip).limit(Number(limit));

    res.json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / limit),
      products,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/products/:id ─────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/products ────────────────────────────────────
// Admin only
router.post('/', protect, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT /api/products/:id ─────────────────────────────────
// Admin only
router.put('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/products/:id ──────────────────────────────
// Admin only
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/products/:id/stock ─────────────────────────
router.patch('/:id/stock', protect, async (req, res) => {
  try {
    const { inStock } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, { inStock }, { new: true });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
