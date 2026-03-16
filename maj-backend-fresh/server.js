const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const morgan   = require('morgan');
const path     = require('path');
require('dotenv').config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/upload',    require('./routes/upload'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MAJ Attire API running', time: new Date() });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => res.status(500).json({ success: false, message: err.message }));

const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGO_URI;

if (!MONGO || MONGO === 'APNA_MONGO_URI_YAHAN_DAALO') {
  console.log('');
  console.log('===========================================');
  console.log('  ERROR: .env file mein MONGO_URI daalo!');
  console.log('===========================================');
  console.log('');
  process.exit(1);
}

mongoose.connect(MONGO)
  .then(async () => {
    console.log('');
    console.log('✅ MongoDB Connected!');
    await require('./config/seed')();
    app.listen(PORT, () => {
      console.log('🚀 Server: http://localhost:' + PORT);
      console.log('📦 Health: http://localhost:' + PORT + '/api/health');
      console.log('');
    });
  })
  .catch(err => {
    console.log('');
    console.log('❌ MongoDB Error:', err.message);
    console.log('');
    console.log('CHECK KARO:');
    console.log('1. .env file mein MONGO_URI sahi hai?');
    console.log('2. Atlas pe 0.0.0.0/0 IP allow hai?');
    console.log('3. Username/Password sahi hai?');
    process.exit(1);
  });
