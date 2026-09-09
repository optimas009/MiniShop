# [![LIVE DEMONSTRATION](https://img.shields.io/badge/LIVE%20DEMONSTRATION-CLICK%20HERE-brightgreen?style=for-the-badge)](https://mini-shop-vite.vercel.app/)

# 🛍️ MiniShop

**Full-Stack MERN E-Commerce Platform with Smart Cart, Cloudinary Product Media & Order Management**

MiniShop is a full-stack e-commerce application built with React, Vite, Node.js, Express, and MongoDB Atlas. It includes JWT authentication, email verification, Cloudinary product images, stock reservation, cart expiry, transactional checkout, order tracking, simulated card payments, Cash on Delivery, refunds, and role-based admin management.

---

## 🌍 Live Deployment

**Frontend:**  
https://mini-shop-vite.vercel.app/

**Backend API:**  
https://mini-shop-backend-ten.vercel.app/

**Health Check:**  
https://mini-shop-backend-ten.vercel.app/api/health

**Admin Login Route:**  
https://mini-shop-vite.vercel.app/secret

---

## ✨ Core Features

### 👤 Authentication
- Customer registration and login
- Admin login
- JWT authentication
- Email verification with OTP
- Forgot/reset password flow
- Role-based access control

### 🛍️ Product Store
- Responsive storefront
- Product search
- Category filtering
- Sorting
- Featured products
- Dedicated product detail pages
- Multiple product images
- Cloudinary image storage
- Product image gallery
- Responsive image handling without cropping

### 🛒 Smart Cart
- Stock reservation when items are added
- Prevents overselling
- Cart expiry controlled by `CART_TTL_MIN`
- Reserved stock is released on expiry, removal, clear cart, cancellation, or checkout
- Available stock is calculated as:

```text
available = stock - reserved
```

### 💳 Checkout & Orders
- Transactional checkout using MongoDB transactions
- Simulated card payment
- Cash on Delivery
- Shipping address stored with each order
- Order status tracking:
  - Pending
  - Shipped
  - Delivered
  - Cancelled
- Refund ID generated for eligible simulated-card cancellations
- Product name, price, and image snapshots stored in orders
- Monthly cancellation limit

### 🛠️ Admin Panel
- Add products
- Update products
- Delete products
- Upload up to 6 Cloudinary images per product
- Replace/remove existing product images
- Manage stock
- Set category and featured status
- View customer orders
- Update orders from Pending → Shipped → Delivered

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, CSS |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, bcryptjs |
| Product Images | Cloudinary, Multer |
| Email | Brevo Transactional Email API |
| Hosting | Vercel |
| Cart Cleanup | Local timer + Vercel Cron / serverless cleanup |

---

## 🚀 Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/optimas009/MiniShop.git
```

```bash
cd MiniShop
```

### 2. Backend setup

```bash
cd server
```

```bash
npm install
```

```bash
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

### 3. Frontend setup

Open another terminal:

```bash
cd client
```

```bash
npm install
```

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

## 🔐 Environment Variables

### Backend — `server/.env`

```env
PORT=5000

MONGODB_URI=your_mongodb_atlas_connection_string

JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=1h

CLIENT_URL=http://localhost:5173
APP_BASE_URL=http://localhost:5000

CART_TTL_MIN=10

BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=your_verified_brevo_email

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_PRODUCT_FOLDER=minishop/products

CRON_SECRET=your_long_random_cron_secret
```

### Frontend — `client/.env`

```env
VITE_API_URL=http://localhost:5000
```

Do not commit real `.env` files or production secrets to GitHub.

---

## 🗄️ Main Data Models

### User
- Name and email
- Password hash
- Customer/Admin role
- Email verification fields
- Password reset fields
- Monthly cancellation tracking

### Product
- Name
- Price
- Description
- Category
- Featured status
- Cloudinary images
- Stock
- Reserved stock

### Cart
- One cart per customer
- Product reference
- Quantity
- Price snapshot
- Cart status
- Expiry time

### Order
- Customer reference
- Product snapshots
- Image snapshots
- Shipping address
- Total
- Payment method/status
- Refund information
- Fulfillment status and timestamps

---

## 🏗️ Key Architecture

### Stock Reservation

When a customer adds an item to the cart, MiniShop reserves stock using MongoDB updates. This prevents two customers from purchasing the same unavailable inventory.

### Transactional Checkout

Checkout uses a MongoDB transaction so stock updates, reserved-stock release, cart completion, and order creation succeed together.

### Product & Order Snapshots

Cart items preserve the price at reservation time. Orders preserve product name, price, and image so order history remains valid even if a product is later changed or deleted.

### Cart Expiry

For local development and traditional Node hosting, a timed cleanup job releases expired reservations.

On Vercel, the backend does not rely on a permanently running process. Expired reservations are also cleaned during product availability requests and reservation retries, with `/api/cron/cart-expiry` available as a Vercel Cron maintenance endpoint.

### Cloudinary Product Images

Cloudinary handling is isolated in:

```text
server/src/cloudinary/
├── config.js
├── imageService.js
└── upload.js
```

Product images are uploaded from the admin panel and stored online in Cloudinary.

---

## 📁 Project Structure

```text
MiniShop/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── css/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── layout/
│   │   │   ├── orders/
│   │   │   └── products/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vercel.json
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── cloudinary/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── email/
│   │   ├── helpers/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.js
│   ├── vercel.json
│   └── package.json
│
└── README.md
```

---

## ☁️ Vercel Deployment

### Backend

Set the `server` directory as the Vercel project root and configure the backend environment variables in Vercel.

Production values should include:

```env
CLIENT_URL=https://mini-shop-vite.vercel.app
MONGODB_URI=...
JWT_SECRET=...
JWT_EXPIRES_IN=1h
CART_TTL_MIN=10
BREVO_API_KEY=...
EMAIL_FROM=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_PRODUCT_FOLDER=minishop/products
CRON_SECRET=...
```

`PORT` is not required on Vercel.

### Frontend

Set the `client` directory as the frontend project root.

```env
VITE_API_URL=https://mini-shop-backend-ten.vercel.app
```

Redeploy the frontend after changing `VITE_API_URL`.

---

## 📌 Notes

- Card payments and refunds are simulated; no real payment gateway is connected.
- Cash on Delivery is supported.
- MongoDB Atlas, Cloudinary, and Brevo are online services.
- Product and inventory management are handled by the admin role.

---

<div align="center">
  <h2>Thank You</h2>
  <p>Thanks for taking the time to explore MiniShop.</p>
</div>
