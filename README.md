# 🎩 M.A.J Attire — Backend API

Complete Node.js + Express + SQLite backend for M.A.J Attire fashion store.

---

## 📦 Installation

```bash
# 1. Folder mein jayen
cd maj-attire-backend

# 2. Dependencies install karein
npm install

# 3. .env file banayein
cp .env.example .env

# 4. Server start karein
npm run dev      # development (auto-restart)
npm start        # production
```

Server chalega: `http://localhost:5000`

---

## 🗄️ Database

SQLite database `maj_attire.db` automatically ban jaata hai.

### Tables:
| Table | Description |
|-------|-------------|
| `customers` | Customers ka poora data (naam, email, phone, address) |
| `products` | Products (8 pre-loaded) |
| `orders` | Orders + shipping info |
| `order_items` | Order ke andar kya kya tha |
| `wishlists` | Customer wishlists |
| `newsletter` | Email subscribers |
| `admins` | Admin accounts |

### Default Admin:
```
Email:    admin@majattire.com
Password: admin123
```
⚠️ **Production mein password zaroor change karein!**

---

## 🔗 API Endpoints

### Authentication
```
POST /api/auth/register          → Customer register
POST /api/auth/login             → Customer login
POST /api/auth/admin/login       → Admin login
```

### Products
```
GET  /api/products               → Sab products (filter: category, badge, search)
GET  /api/products/categories    → Categories list
GET  /api/products/:id           → Single product
POST /api/products               → [ADMIN] Product add
PUT  /api/products/:id           → [ADMIN] Product update
DEL  /api/products/:id           → [ADMIN] Product remove
```

### Orders
```
POST /api/orders                 → [LOGIN] Order place karein
GET  /api/orders/my              → [LOGIN] Meri orders
GET  /api/orders/:id             → [LOGIN] Single order
GET  /api/orders                 → [ADMIN] Sab orders
PUT  /api/orders/:id/status      → [ADMIN] Order status update
```

### Customers
```
GET  /api/customers/profile      → [LOGIN] Profile dekhen
PUT  /api/customers/profile      → [LOGIN] Profile update
PUT  /api/customers/change-password → [LOGIN] Password change
GET  /api/customers              → [ADMIN] Sab customers
GET  /api/customers/:id          → [ADMIN] Single customer + orders
```

### Wishlist
```
POST /api/wishlist/toggle        → [LOGIN] Add/remove wishlist
GET  /api/wishlist               → [LOGIN] Meri wishlist
```

### Newsletter
```
POST /api/newsletter/subscribe   → Subscribe
GET  /api/newsletter             → [ADMIN] Sab subscribers
```

### Admin Dashboard
```
GET  /api/admin/dashboard        → Stats, revenue, recent orders
GET  /api/admin/reports/sales    → Sales report (date range)
GET  /api/admin/reports/customers → Customer spending report
```

---

## 🔐 Authentication

JWT token use karna hai. Login ke baad `token` mile ga.

```javascript
// Header mein lagayein:
Authorization: Bearer <your_token_here>
```

---

## 📝 Order Place Karne Ka Example

```json
POST /api/orders
Authorization: Bearer <customer_token>

{
  "items": [
    { "product_id": 1, "quantity": 2, "size": "L" },
    { "product_id": 3, "quantity": 1, "size": "M" }
  ],
  "shipping": {
    "name": "Ahmed Ali",
    "phone": "0300-1234567",
    "address": "House 12, Street 5, DHA",
    "city": "Karachi"
  },
  "payment_method": "COD",
  "notes": "Please pack carefully"
}
```

---

## 🗂️ File Structure

```
maj-attire-backend/
├── server.js              ← Main entry point
├── .env.example           ← Environment template
├── package.json
├── database/
│   └── db.js              ← DB setup + all tables + seed data
├── middleware/
│   └── auth.js            ← JWT verification
└── routes/
    ├── auth.js            ← Register/Login
    ├── products.js        ← Products CRUD
    ├── orders.js          ← Order management
    ├── customers.js       ← Customer profiles
    ├── wishlist.js        ← Wishlist
    ├── newsletter.js      ← Email subscription
    └── admin.js           ← Admin dashboard & reports
```
