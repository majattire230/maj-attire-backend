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
function seedProducts() {
  db.get('SELECT COUNT(*) as c FROM products', (err, row) => {
    if (row && row.c > 0) return;
    const products = [
      ['Classic White Kurta','Men',2800,null,'New','Premium cotton kurta','["S","M","L","XL"]','[]','pattern-weave',50],
      ['Navy Shalwar Kameez','Men',3500,4200,'Sale','Navy linen suit','["S","M","L","XL"]','[]','pattern-stripe',50],
      ['Charcoal Waistcoat Set','Men',5500,null,'New','Three piece set','["M","L","XL","XXL"]','[]','pattern-weave',50],
      ['Maroon Sherwani','Men',12000,15000,'Sale','Royal sherwani','["S","M","L","XL"]','[]','pattern-diamond',50],
      ['Beige Cotton Kurta','Men',2200,null,null,'Casual kurta','["S","M","L","XL"]','[]','pattern-dots',50],
      ['Floral Lawn Suit','Summers',2400,null,'New','Floral printed suit','["S","M","L","XL"]','[]','pattern-dots',50],
      ['Sky Blue Chiffon Set','Summers',3200,null,'New','Elegant chiffon suit','["S","M","L","XL"]','[]','pattern-stripe',50],
      ['Peach Organza Suit','Summers',4500,5200,'Sale','Delicate organza suit','["S","M","L","XL"]','[]','pattern-dots',50],
      ['Lavender Lawn Set','Summers',3600,null,'New','Embroidered lawn','["S","M","L","XL"]','[]','pattern-diamond',50],
      ['White Embroidered Pret','Summers',3900,4500,'Sale','Classic white pret','["S","M","L","XL"]','[]','pattern-stripe',50],
      ['Camel Wool Shawl','Winters',4800,null,'New','Luxurious wool shawl','["One Size"]','[]','pattern-weave',50],
      ['Maroon Velvet Suit','Winters',5500,null,'New','Rich velvet suit','["S","M","L","XL"]','[]','pattern-diamond',50],
      ['Grey Wool Suit','Winters',6200,7500,'Sale','Premium wool suit','["S","M","L","XL"]','[]','pattern-herringbone',50],
      ['Black Pashmina Shawl','Winters',8500,10000,'Sale','Authentic pashmina','["One Size"]','[]','pattern-dots',50],
      ['Ivory Wool Suit','Winters',8900,null,'New','Embroidered wool suit','["S","M","L","XL"]','[]','pattern-cross',50],
      ['Bridal Lehenga','Traditional',45000,null,'New','Heavy zardozi lehenga','["S","M","L","XL"]','[]','pattern-diamond',50],
      ['Banarsi Silk Suit','Traditional',12000,15000,'Sale','Authentic Banarsi silk','["S","M","L","XL"]','[]','pattern-weave',50],
      ['Anarkali Frock Set','Traditional',8500,null,'New','Flowing Anarkali frock','["S","M","L","XL"]','[]','pattern-dots',50],
      ['Kashmiri Suit','Traditional',15000,null,'New','Hand embroidered suit','["S","M","L","XL"]','[]','pattern-cross',50],
      ['Gharara Set','Traditional',14000,null,'New','Traditional gharara','["S","M","L","XL"]','[]','pattern-herringbone',50],
      ['Graphic Oversized Tee','Streetwear',1500,null,'New','Urban graphic tee','["S","M","L","XL","XXL"]','[]','pattern-cross',50],
      ['Hoodie Kurta Fusion','Streetwear',3200,null,'New','Hoodie kurta fusion','["S","M","L","XL"]','[]','pattern-stripe',50],
      ['Cargo Shalwar','Streetwear',2800,3200,'Sale','Trendy cargo shalwar','["S","M","L","XL"]','[]','pattern-weave',50]
    ];
    products.forEach(p => {
      db.run('INSERT INTO products (name,category,price,orig_price,badge,description,sizes,colors,pattern,stock,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,datetime("now"))', p);
    });
    console.log('Products seeded!');
  });
}

module.exports = { db, initDB, seedProducts };