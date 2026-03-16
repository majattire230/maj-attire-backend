// models/Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
  lastLogin:{ type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
