// config/seed.js — Seeds admin user and initial products
const bcrypt  = require('bcryptjs');
const Admin   = require('../models/Admin');
const Product = require('../models/Product');

const initialProducts = [
  {
    name: "Classic White Lawn Shalwar Kameez",
    category: "shalwar-kameez", subcategory: "lawn",
    price: 2800, originalPrice: 3500, discount: 20,
    images: ["https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=600&q=80"],
    colors: ["White", "Off White", "Cream"],
    sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
    fabric: "Premium Lawn",
    details: { fit: "Regular Fit", collar: "Mandarin Collar", work: "Minimal Embroidery", pieces: 2 },
    description: "A timeless classic — crisp white lawn kameez with minimal embroidery. Perfect for Fridays and casual gatherings.",
    tags: ["lawn", "white", "casual", "eid"],
    inStock: true, featured: true, newArrival: false, rating: 4.8, reviews: 234,
  },
  {
    name: "Essential Oversized T-Shirt",
    category: "summer", subcategory: "t-shirts",
    price: 1200, originalPrice: 1500, discount: 20,
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80"],
    colors: ["Black", "White", "Olive", "Navy", "Charcoal"],
    sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
    fabric: "100% Cotton (220 GSM)",
    details: { fit: "Oversized Fit", collar: "Crew Neck", work: "Plain", pieces: 1 },
    description: "Heavy 220 GSM cotton in a relaxed oversized cut — the ultimate daily driver.",
    tags: ["t-shirt", "oversized", "cotton", "summer"],
    inStock: true, featured: true, newArrival: true, rating: 4.8, reviews: 312,
  },
  {
    name: "Dropped Shoulder Oversized Tee",
    category: "summer", subcategory: "dropped-shoulders",
    price: 1600, originalPrice: 1600, discount: 0,
    images: ["https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&q=80"],
    colors: ["Black", "Cream", "Washed Brown", "Slate Grey"],
    sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
    fabric: "Heavy Cotton (240 GSM)",
    details: { fit: "Boxy / Oversized", collar: "Crew Neck", work: "Plain / Minimal", pieces: 1 },
    description: "Boxy silhouette, dropped shoulders and heavyweight cotton — the streetwear essential.",
    tags: ["dropped-shoulder", "oversized", "streetwear", "summer"],
    inStock: true, featured: true, newArrival: true, rating: 4.9, reviews: 267,
  },
  {
    name: "Essential Pullover Hoodie",
    category: "winter", subcategory: "hoodies",
    price: 3200, originalPrice: 3900, discount: 18,
    images: ["https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&q=80"],
    colors: ["Black", "Grey Marl", "Navy", "Olive", "Brown"],
    sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
    fabric: "Brushed Fleece Cotton",
    details: { fit: "Regular Fit", collar: "Adjustable Hood", work: "Kangaroo Pocket / Logo", pieces: 1 },
    description: "350 GSM brushed fleece, kangaroo pocket and drawstring hood — warm, soft, essential.",
    tags: ["hoodie", "pullover", "fleece", "winter"],
    inStock: true, featured: true, newArrival: false, rating: 4.9, reviews: 345,
  },
  {
    name: "Quilted Puffer Jacket",
    category: "winter", subcategory: "jackets",
    price: 6500, originalPrice: 8000, discount: 19,
    images: ["https://images.unsplash.com/photo-1544923246-77307dd654cb?w=600&q=80"],
    colors: ["Black", "Olive Green", "Navy", "Camel"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    fabric: "Nylon Shell + Poly Fill",
    details: { fit: "Regular Fit", collar: "Stand Collar", work: "Quilted Stitching", pieces: 1 },
    description: "Lightweight warmth without the bulk. Quilted puffer jacket — windproof and stylish.",
    tags: ["jacket", "puffer", "winter", "outerwear"],
    inStock: true, featured: true, newArrival: false, rating: 4.8, reviews: 176,
  },
];

module.exports = async function seed() {
  try {
    // Seed Admin
    const existing = await Admin.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
    if (!existing) {
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'majattire2024', 10);
      await Admin.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        email:    process.env.ADMIN_EMAIL    || 'admin@majattire.com',
        password: hashed,
        role: 'superadmin',
      });
      console.log('✅ Admin user created');
    }

    // Seed Products
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(initialProducts);
      console.log(`✅ ${initialProducts.length} products seeded`);
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};
