const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../maj_attire.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('❌ DB connection error:', err.message);
  else console.log('✅ Connected to SQLite database: maj_attire.db');
});

db.run('PRAGMA foreign_keys = ON');

function initDB() {
  db.serialize(() => {

    // ── CUSTOMERS TABLE ──────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        email       TEXT    UNIQUE NOT NULL,
        phone       TEXT,
        password    TEXT    NOT NULL,
        address     TEXT,
        city        TEXT,
        country     TEXT DEFAULT 'Pakistan',
        avatar      TEXT,
        is_verified INTEGER DEFAULT 0,
        created_at  TEXT DEFAULT (datetime('now')),
        updated_at  TEXT DEFAULT (datetime('now'))
      )
    `);

    // ── PRODUCTS TABLE ───────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        category    TEXT    NOT NULL,
        price       REAL    NOT NULL,
        orig_price  REAL,
        description TEXT,
        badge       TEXT,
        pattern     TEXT,
        colors      TEXT,
        sizes       TEXT DEFAULT '["XS","S","M","L","XL","XXL"]',
        stock       INTEGER DEFAULT 100,
        is_active   INTEGER DEFAULT 1,
        created_at  TEXT DEFAULT (datetime('now'))
      )
    `);

    // ── ORDERS TABLE ─────────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id     INTEGER NOT NULL,
        status          TEXT    DEFAULT 'pending',
        total_amount    REAL    NOT NULL,
        shipping_name   TEXT,
        shipping_phone  TEXT,
        shipping_address TEXT,
        shipping_city   TEXT,
        payment_method  TEXT    DEFAULT 'COD',
        payment_status  TEXT    DEFAULT 'unpaid',
        notes           TEXT,
        created_at      TEXT    DEFAULT (datetime('now')),
        updated_at      TEXT    DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    // ── ORDER ITEMS TABLE ────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id    INTEGER NOT NULL,
        product_id  INTEGER NOT NULL,
        product_name TEXT   NOT NULL,
        size        TEXT,
        quantity    INTEGER NOT NULL,
        unit_price  REAL    NOT NULL,
        subtotal    REAL    NOT NULL,
        FOREIGN KEY (order_id)   REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // ── WISHLIST TABLE ───────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        product_id  INTEGER NOT NULL,
        added_at    TEXT DEFAULT (datetime('now')),
        UNIQUE(customer_id, product_id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (product_id)  REFERENCES products(id)
      )
    `);

    // ── NEWSLETTER TABLE ─────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS newsletter (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        email      TEXT UNIQUE NOT NULL,
        is_active  INTEGER DEFAULT 1,
        joined_at  TEXT DEFAULT (datetime('now'))
      )
    `);

    // ── ADMINS TABLE ─────────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS admins (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        username   TEXT UNIQUE NOT NULL,
        email      TEXT UNIQUE NOT NULL,
        password   TEXT NOT NULL,
        role       TEXT DEFAULT 'admin',
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // ── SEED PRODUCTS ────────────────────────────────────────────
    db.get("SELECT COUNT(*) as cnt FROM products", (err, row) => {
      if (!err && row.cnt === 0) {
        const products = [
          [1, 'Obsidian Kurta', 'Men', 4500, null, 'A masterfully tailored dark kurta crafted from premium cotton-silk blend.', 'New', 'pattern-weave', '["#1a1a1a","#2d1208","#1a0a2d"]'],
          [2, 'Ivory Silk Ensemble', 'Women', 7800, 9500, 'Flowing ivory ensemble in pure silk with hand-embroidered accents.', 'Sale', 'pattern-dots', '["#f5f0eb","#e8d5b0","#c9a96e"]'],
          [3, 'Heritage Sherwani', 'Ethnic', 15000, null, 'A regal sherwani inspired by Mughal craftsmanship.', 'New', 'pattern-diamond', '["#1a0a2d","#2d1208","#0a1a0a"]'],
          [4, 'Urban Varsity Jacket', 'Streetwear', 6200, null, 'A statement varsity jacket blending classic silhouette with contemporary details.', null, 'pattern-cross', '["#0a0a0a","#1a2d1a","#2d1a1a"]'],
          [5, 'Gold-Thread Dupatta', 'Accessories', 2800, null, 'Luxurious dupatta woven with real gold-tone thread.', 'New', 'pattern-stripe', '["#c9a96e","#e8d5b0","#f5f0eb"]'],
          [6, 'Midnight Lawn Suit', 'Women', 5400, 6800, 'Three-piece lawn suit in deep midnight hues with intricate digital print.', 'Sale', 'pattern-herringbone', '["#0a0a1a","#1a0a2d","#2d1a1a"]'],
          [7, 'Classic Linen Shalwar', 'Men', 3200, null, 'Relaxed-fit shalwar kameez in premium linen.', null, 'pattern-dots', '["#e8d5b0","#f5f0eb","#1a1a1a"]'],
          [8, 'Structured Bucket Hat', 'Streetwear', 1800, null, 'A structured bucket hat that blurs the line between luxury and streetwear.', 'New', 'pattern-weave', '["#0a0a0a","#c9a96e","#1a2d1a"]'],
        ];
        const stmt = db.prepare(`INSERT INTO products (id, name, category, price, orig_price, description, badge, pattern, colors) VALUES (?,?,?,?,?,?,?,?,?)`);
        products.forEach(p => stmt.run(p));
        stmt.finalize();
        console.log('🌱 Products seeded successfully');
      }
    });

    // ── SEED DEFAULT ADMIN ───────────────────────────────────────
    db.get("SELECT COUNT(*) as cnt FROM admins", (err, row) => {
      if (!err && row.cnt === 0) {
        const hashed = bcrypt.hashSync('admin123', 10);
        db.run(`INSERT INTO admins (username, email, password, role) VALUES (?, ?, ?, ?)`,
          ['admin', 'admin@majattire.com', hashed, 'superadmin']);
        console.log('👤 Default admin created — email: admin@majattire.com | pass: admin123');
      }
    });

    console.log('📊 All database tables initialized');
  });
}

async function seedProducts() {
  const count = await new Promise((res) => db.get('SELECT COUNT(*) as c FROM products', (e, r) ;
