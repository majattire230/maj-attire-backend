// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  slug:          { type: String, trim: true },
  category:      { type: String, required: true, enum: ['shalwar-kameez', 'summer', 'winter'] },
  subcategory:   { type: String, trim: true },
  price:         { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
  discount:      { type: Number, default: 0, min: 0, max: 100 },
  images:        [{ type: String }],
  colors:        [{ type: String }],
  sizes:         [{ type: String }],
  fabric:        { type: String },
  details:       { type: mongoose.Schema.Types.Mixed, default: {} },
  description:   { type: String },
  tags:          [{ type: String }],
  inStock:       { type: Boolean, default: true },
  featured:      { type: Boolean, default: false },
  newArrival:    { type: Boolean, default: false },
  rating:        { type: Number, default: 0, min: 0, max: 5 },
  reviews:       { type: Number, default: 0 },
  customizable:  { type: Boolean, default: false },
  soldCount:     { type: Number, default: 0 },
}, { timestamps: true });

// Auto-generate slug from name
productSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  // Auto-calc discount
  if (this.originalPrice && this.originalPrice > this.price) {
    this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
