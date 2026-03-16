// models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, lowercase: true, trim: true },
  phone:   { type: String, required: true },
  city:    { type: String },
  province:{ type: String },

  totalOrders: { type: Number, default: 0 },
  totalSpent:  { type: Number, default: 0 },

  // Reference to their orders
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
