// models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:          { type: String, required: true },
  image:         { type: String },
  price:         { type: Number, required: true },
  qty:           { type: Number, required: true, min: 1 },
  selectedSize:  { type: String },
  selectedColor: { type: String },
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },

  // Customer info
  customer: {
    name:     { type: String, required: true },
    email:    { type: String },
    phone:    { type: String, required: true },
  },

  // Shipping address
  shippingAddress: {
    address:  { type: String, required: true },
    city:     { type: String, required: true },
    province: { type: String, required: true },
  },

  items:         [orderItemSchema],

  // Pricing
  subtotal:      { type: Number, required: true },
  shippingCost:  { type: Number, default: 0 },
  totalAmount:   { type: Number, required: true },

  // Payment
  paymentMethod: { type: String, enum: ['cod', 'jazzcash', 'easypaisa', 'bank'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },

  // Order status
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },

  notes:       { type: String },
  trackingNum: { type: String },
}, { timestamps: true });

// Auto-generate order number before save
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `MAJ-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
