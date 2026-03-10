const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'maj_attire.db');
const db = new sqlite3.Database(DB_PATH);

function initDB() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        city TEXT,
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        orig_price REAL,
        badge TEXT,
        description TEXT,
        sizes TEXT DEFAULT '["S","M","L","XL"]',
        colors TEXT DEFAULT '[]',
        pattern TEXT DEFAULT 'pattern-weave',
        stock INTEGER DEFAULT 50,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        shipping_name TEXT,
        shipping_phone TEXT,
        shipping_address TEXT,
        shipping_city TEXT,
        payment_method TEXT DEFAULT 'COD',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        size TEXT,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        product_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS newsletter (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

function seedProducts() {
  db.get('SELECT COUNT(*) as c FROM products', function(err, row) {
    if (err || (row && row.c > 0)) return;

    var products = [
      ['Classic White Kurta', 'Men', 2800, null, 'New', 'Premium cotton white kurta for everyday wear.', '["S","M","L","XL","XXL"]', '[]', 'pattern-weave', 50],
      ['Navy Linen Shalwar Kameez', 'Men', 3500, 4200, 'Sale', 'Sophisticated navy linen shalwar kameez.', '["S","M","L","XL"]', '[]', 'pattern-stripe', 50],
      ['Charcoal Waistcoat Set', 'Men', 5500, null, 'New', 'Three piece charcoal waistcoat set.', '["M","L","XL","XXL"]', '[]', 'pattern-weave', 50],
      ['Maroon Sherwani', 'Men', 12000, 15000, 'Sale', 'Royal maroon sherwani with zari work.', '["S","M","L","XL"]', '[]', 'pattern-diamond', 50],
      ['Beige Cotton Kurta', 'Men', 2200, null, null, 'Casual beige cotton kurta for daily wear.', '["S","M","L","XL","XXL"]', '[]', 'pattern-dots', 50],
      ['Black Formal Shalwar Kameez', 'Men', 4200, null, 'New', 'Elegant black formal shalwar kameez.', '["S","M","L","XL"]', '[]', 'pattern-weave', 50],
      ['Olive Green Casual Kurta', 'Men', 1900, 2400, 'Sale', 'Trendy olive green casual kurta.', '["S","M","L","XL","XXL"]', '[]', 'pattern-cross', 50],
      ['Royal Blue Embroidered Kurta', 'Men', 3800, null, 'New', 'Royal blue kurta with hand embroidery.', '["S","M","L","XL"]', '[]', 'pattern-herringbone', 50],
      ['Cream Lawn Shalwar Kameez', 'Men', 2600, null, null, 'Premium cream lawn shalwar kameez.', '["S","M","L","XL","XXL"]', '[]', 'pattern-dots', 50],
      ['Grey Wool Waistcoat', 'Men', 4800, 5500, 'Sale', 'Sophisticated grey wool waistcoat.', '["M","L","XL","XXL"]', '[]', 'pattern-stripe', 50],
      ['Dark Green Sherwani', 'Men', 13500, null, 'New', 'Majestic dark green sherwani with golden thread.', '["S","M","L","XL"]', '[]', 'pattern-diamond', 50],
      ['White Embroidered Kurta Pajama', 'Men', 3200, 3800, 'Sale', 'Classic white kurta pajama with embroidery.', '["S","M","L","XL","XXL"]', '[]', 'pattern-dots', 50],
      ['Camel Linen Trouser Set', 'Men', 4500, null, 'New', 'Modern camel linen trouser set.', '["M","L","XL","XXL"]', '[]', 'pattern-cross', 50],
      ['Burgundy Velvet Kurta', 'Men', 6500, null, 'New', 'Luxurious burgundy velvet kurta.', '["S","M","L","XL"]', '[]', 'pattern-herringbone', 50],
      ['Printed Cotton Kurta', 'Men', 1800, null, null, 'Stylish printed cotton kurta.', '["S","M","L","XL"]', '[]', 'pattern-weave', 50],

      ['Floral Lawn Suit', 'Summers', 2400, null, 'New', 'Beautiful floral printed lawn suit.', '["S","M","L","XL"]', '[]', 'pattern-dots', 50],
      ['White Cotton Patio Dress', 'Summers', 1900, 2300, 'Sale', 'Breezy white cotton patio dress.', '["S","M","L","XL","XXL"]', '[]', 'pattern-weave', 50],
      ['Sky Blue Chiffon Dupatta Set', 'Summers', 3200, null, 'New', 'Elegant sky blue chiffon suit.', '["S","M","L","XL"]', '[]', 'pattern-stripe', 50],
      ['Peach Organza Suit', 'Summers', 4500, 5200, 'Sale', 'Delicate peach organza suit.', '["S","M","L","XL"]', '[]', 'pattern-dots', 50],
      ['Lavender Lawn Embroidered Set', 'Summers', 3600, null, 'New', 'Beautiful lavender lawn set.', '["S","M","L","XL"]', '[]', 'pattern-diamond', 50],
      ['Turquoise Linen Suit', 'Summers', 2700, null, 'New', 'Striking turquoise linen suit.', '["S","M","L","XL"]', '[]', 'pattern-weave', 50],
      ['White Embroidered Pret', 'Summers', 3900, 4500, 'Sale', 'Classic white pret with embroidery.', '["S","M","L","XL"]', '[]', 'pattern-stripe', 50],
      ['Yellow Linen Co-ord', 'Summers', 2800, null, null, 'Trendy yellow linen co-ord set.', '["S","M","L","XL"]', '[]', 'pattern-cross', 50],
      ['Pink Printed Kurta', 'Summers', 2100, 2600, 'Sale', 'Pretty pink printed kurta.', '["S","M","L","XL"]', '[]', 'pattern-dots', 50],
      ['Mint Green Chiffon Set', 'Summers', 3400, null, 'New', 'Fresh mint green chiffon set.', '["S","M","L","XL"]', '[]', 'pattern-stripe', 50],
      ['Coral Embroidered Suit', 'Summers', 4200, null, 'New', 'Vibrant coral embroidered suit.', '["S","M","L","XL"]', '[]', 'pattern-diamond', 50],
      ['Cream Embroidered Lawn', 'Summers', 4800, null, 'New', 'Sophisticated cream lawn with premium embroidery.', '["S","M","L","XL"]', '[]', 'pattern-herringbone', 50],
      ['Blue Floral Dupatta Set', 'Summers', 3100, 3700, 'Sale', 'Blue floral dupatta set.', '["S","M","L","XL"]', '[]', 'pattern-dots', 50],
      ['Orange Linen Suit', 'Summers', 2500, null, null, 'Vibrant orange linen suit.', '["S","M","L","XL"]', '[]', 'pattern-cross', 50],
      ['Purple Chiffon Formal', 'Summers', 4100, null, 'New', 'Elegant purple chiffon for formal occasions.', '["S","M","L","XL"]', '[]', 'pattern-herringbone', 50],

      ['Camel Wool Shawl Suit', 'Winters', 4800, null, 'New', 'Luxurious camel wool shawl suit.', '["S","M","L","XL"]', '[]', 'pattern-weave', 50],
      ['Maroon Velvet Suit', 'Winters', 5500, null, 'New', 'Rich maroon velvet suit.', '["S","M","L","XL"]', '[]', 'pattern-diamond', 50],
      ['Grey Wool Shawl Suit', 'Winters', 6200, 7500, 'Sale', 'Premium grey wool suit with shawl.', '["S","M","L","XL"]', '[]', 'pattern-herringbone', 50],
      ['Burgundy Embroidered Suit', 'Winters', 7800, null, 'New', 'Exquisite burgundy suit with embroidery.', '["S","M","L","XL"]', '[]', 'pattern-weave', 50],
      ['Black Pashmina Shawl', 'Winters', 8500, 10000, 'Sale', 'Authentic black pashmina shawl.', '["One Size"]', '[]', 'pattern-dots', 50],
      ['Brown Tweed Jacket Set', 'Winters', 9500, null, 'New', 'Classic brown tweed jacket set.', '["S","M","L","XL"]', '[]', 'pattern-herringbone', 50],
      ['Ivory Embroidered Wool Suit', 'Winters', 8900, null, 'New', 'Stunning ivory wool suit with embroidery.', '["S","M","L","XL"]', '[]', 'pattern-cross', 50],
      ['Deep Purple Velvet Suit', 'Winters', 6800, null, 'New', 'Majestic deep purple velvet suit.', '["S","M","L","XL"]', '[]', 'pattern-dots', 50],
      ['Navy Blue Shawl Set', 'Winters', 5800, 7000, 'Sale', 'Elegant navy blue shawl suit.', '["S","M","L","XL"]', '[]', 'pattern-stripe', 50],
      ['Olive Wool Coat Suit', 'Winters', 11000, null, 'New', 'Sophisticated olive wool coat suit.', '["S","M","L","XL"]', '[]', 'pattern-weave', 50],
      ['Forest Green Velvet', 'Winters', 7200, null, 'New', 'Rich forest green velvet suit.', '["S","M","L","XL"]', '[]', 'pattern-diamond', 50],
      ['Rust Orange Shawl Suit', 'Winters', 6400, 7800, 'Sale', 'Warm rust orange shawl suit.', '["S","M","L","XL"]', '[]', 'pattern-cross', 50],
      ['Charcoal Winter Suit', 'Winters', 5200, null, null, 'Classic charcoal winter suit.', '["S","M","L","XL"]', '[]', 'pattern-herringbone', 50],
      ['Cream Pashmina Set', 'Winters', 9800, null, 'New', 'Luxurious cream pashmina set.', '["S","M","L","XL"]', '[]', 'pattern-dots', 50],
      ['Wine Red Velvet Suit', 'Winters', 7500, null, 'New', 'Stunning wine red velvet suit.', '["S","M","L","XL"]', '[]', 'pattern-weave', 50],

      ['Bridal Lehenga Set', 'Traditional', 45000, null, 'New', 'Magnificent bridal lehenga with heavy zardozi work.', '["S","M","L","XL"]', '[]', 'pattern-diamond', 50],
      ['Banarsi Silk Suit', 'Traditional', 12000, 15000, 'Sale', 'Authentic Banarsi silk suit.', '["S","M","L","XL"]', '[]', 'pattern-weave', 50],
      ['Anarkali Frock Set', 'Traditional', 8500, null, 'New', 'Flowing Anarkali frock with churidar.', '["S","M","L","XL"]', '[]', 'pattern-dots', 50],
      ['Kashmiri Hand Embroidered Suit', 'Traditional', 15000, null, 'New', 'Authentic Kashmiri hand embroidered suit.', '["S","M","L","XL"]', '[]', 'pattern-cross', 50],
      ['Gharara Set', 'Traditional', 14000, null, 'New', 'Traditional gharara set with threadwork.', '["S","M","L","XL"]', '[]', 'pattern-herringbone', 50],
      ['Sharara Bridal Set', 'Traditional', 22000, null, 'New', 'Exquisite sharara bridal set.', '["S","M","L","XL"]', '[]', 'pattern-dots', 50],
      ['Chikankari Suit', 'Traditional', 8800, null, 'New', 'Delicate Chikankari embroidered suit.', '["S","M","L","XL"]', '[]', 'pattern-weave', 50],
      ['Sindhi Ajrak Suit', 'Traditional', 6800, 8000, 'Sale', 'Traditional Sindhi ajrak block print suit.', '["S","M","L","XL","XXL"]', '[]', 'pattern-diamond', 50],
      ['Mehndi Lehenga', 'Traditional', 18000, null, 'New', 'Beautiful mehndi function lehenga.', '["S","M","L","XL"]', '[]', 'pattern-herringbone', 50],
      ['Gold Zari Saree Style Suit', 'Traditional', 25000, null, 'New', 'Elegant gold zari embroidered suit.', '["S","M","L","XL"]', '[]', 'pattern-cross', 50],
      ['Balochi Embroidered Dress', 'Traditional', 9500, 11000, 'Sale', 'Authentic Balochi embroidered dress.', '["S","M","L","XL"]', '[]', 'pattern-diamond', 50],
      ['Mughal Print Suit', 'Traditional', 7200, null, null, 'Mughal inspired print suit.', '["S","M","L","XL"]', '[]', 'pattern-weave', 50],
      ['Phulkari Dupatta Set', 'Traditional', 11500, null, 'New', 'Vibrant Phulkari embroidered set.', '["S","M","L","XL"]', '[]', 'pattern-dots', 50],
      ['Royal Walima Dress', 'Traditional', 32000, null, 'New', 'Grand royal walima dress with full embroidery.', '["S","M","L","XL"]', '[]', 'pattern-diamond', 50],
      ['Khaddar Traditional Set', 'Traditional', 5500, 6800, 'Sale', 'Warm khaddar traditional set.', '["S","M","L","XL","XXL"]', '[]', 'pattern-herringbone', 50],

      ['Graphic Oversized Tee', 'Streetwear', 1500, null, 'New', 'Urban graphic oversized tee.', '["S","M","L","XL","XXL"]', '[]', 'pattern-cross', 50],
      ['Hoodie Kurta Fusion', 'Streetwear', 3200, null, 'New', 'Unique hoodie-kurta fusion piece.', '["S","M","L","XL","XXL"]', '[]', 'pattern-stripe', 50],
      ['Cargo Shalwar', 'Streetwear', 2800, 3200, 'Sale', 'Trendy cargo shalwar with pockets.', '["S","M","L","XL"]', '[]', 'pattern-weave', 50],
      ['Denim Jacket Kurta', 'Streetwear', 4200, null, 'New', 'Denim jacket with kurta combo.', '["S","M","L","XL"]', '[]', 'pattern-dots', 50],
      ['Urban Jogger Set', 'Streetwear', 3500, null, 'New', 'Comfortable urban jogger set.', '["S","M","L","XL","XXL"]', '[]', 'pattern-cross', 50]
    ];

    var stmt = db.prepare('INSERT INTO products (name, category, price, orig_price, badge, description, sizes, colors, pattern, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    products.forEach(function(p) {
      stmt.run(p);
    });
    stmt.finalize();
    console.log('✅ ' + products.length + ' products seeded successfully!');
  });
}

function seedAdmin() {
  var bcrypt = require('bcryptjs');
  db.get('SELECT COUNT(*) as c FROM customers WHERE is_admin = 1', function(err, row) {
    if (err || (row && row.c > 0)) return;
    var hash = bcrypt.hashSync('admin123', 10);
    db.run('INSERT INTO customers (name, email, password, is_admin) VALUES (?, ?, ?, 1)',
      ['Admin', 'admin@majattire.com', hash]);
    console.log('✅ Admin seeded: admin@majattire.com / admin123');
  });
}

module.exports = { db, initDB, seedProducts, seedAdmin };
