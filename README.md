
[![LIVE DEMONSTRATION](https://img.shields.io/badge/LIVE%20DEMONSTRATION-CLICK%20HERE-brightgreen?style=for-the-badge)](https://mini-shop-vite.vercel.app/)

# 🛍️ MiniShop  
**Full-Stack MERN E-Commerce Platform with Smart Cart & Order Management**

MiniShop is a full-stack e-commerce web application built with React (Vite), Node.js, Express, and MongoDB. It includes secure JWT authentication, Email Verification, cart stock reservation with automatic expiry, transactional order processing, and role-based access control.

Users can place orders, cancel pending orders will give an automatic refund ID and also stock updated back, and track their purchases. Admins can add, update products and update order statuses (shipped, delivered). 

---

# 🌍 Live Deployment

**Frontend (Vercel):**  
https://mini-shop-vite.vercel.app/

**Backend API (Render):**  
https://minishop-lcep.onrender.com/api/health

---

# 🧱 Tech Stack

| Layer          | Technology |
|---------------|------------|
| Frontend      | React.js (Vite), CSS |
| Backend       | Node.js, Express.js |
| Database      | MongoDB Atlas |
| Authentication| JWT (JSON Web Tokens) |
| Security      | bcrypt.js |
| Email Service | Nodemailer + Brevo API |
| Hosting (FE)  | Vercel |
| Hosting (BE)  | Render |

---
---
---

### 🚀 Installation Guide

---

### 1️⃣ Clone the Repository
- Clone the MiniShop repository from GitHub
- Navigate into the project root directory
  - `git clone https://github.com/optimas009/MiniShop.git`
  - `cd MiniShop`

---

### 2️⃣ Backend Setup
- Move into the `server` directory
- Install backend dependencies
- Start the Express server
  - `cd server`
  - `npm install`
  - `npm run dev`   (for development with nodemon)
  - `npm start`     (for production mode)

---

### 3️⃣ Frontend Setup
- Move into the `client` directory
- Install frontend dependencies
- Start the React development server
  - `cd client`
  - `npm install`
  - `npm run dev`

---

### 4️⃣ Environment Variables

#### 📌 Backend (`/server/.env`)
- Create a `.env` file inside the `server` folder
- Configure the following variables:

  - `PORT=5000`
  - `MONGODB_URI=your_mongodb atlas_connection_string`
  - `JWT_SECRET=your_secret_key`
  - `JWT_EXPIRES_IN=1h`
  - `CLIENT_URL=http://localhost:5173`
  - `APP_BASE_URL=http://localhost:5000`
  - `CART_TTL_MIN=10`
  - `BREVO_API_KEY=your_brevo_api_key`
  - `EMAIL_FROM=your_verified_email (has to be Brevo Verified)`

---

#### 📌 Frontend (`/client/.env`)
- Create a `.env` file inside the `client` folder
- Configure:

  - `VITE_API_URL=http://localhost:5000`

---

### 5️⃣ Run the Application
- Backend should be running on:
  - `http://localhost:5000`
- Frontend should be running on:
  - `http://localhost:5173`

Make sure MongoDB Atlas is connected and environment variables are properly configured before starting the server.

---
---
---

# 🗄️ Database Schema (ER Overview)

## 👤 User
- _id
- name
- email
- passwordHash
- role (admin/customer)
- isVerified
- emailVerifyCode
- emailVerifyExpires
- resetPasswordCode
- resetPasswordExpires
- cancelMonth
- cancelCount (monthly cancellation limit)
- createdAt
- updatedAt

---

## 📦 Product
- _id
- name
- price
- description
- stock
- reserved
- createdAt
- updatedAt

---

## 🛒 Cart
- _id
- user (ref User, unique)
- items[]:
  - product (ref Product)
  - qty
  - priceSnapshot
- status (active, expired, checked_out)
- expiresAt
- createdAt
- updatedAt

---

## 📑 Order
- _id
- user (ref User)
- items[]:
  - product (ref Product)
  - nameSnapshot
  - priceSnapshot
  - qty
- total
- paymentMethod (card_sim, cod)
- paymentStatus (unpaid, pending, paid, failed, refunded)
- refundId
- refundedAt
- status (pending, shipped, delivered, cancelled)
- cancelledAt
- shippedAt
- deliveredAt
- createdAt
- updatedAt

---
---
---
## 🏗️ Key Architectural Decisions

- **Stock Reservation (Reserved Field)**
  - When a user adds a product to the cart, the system increases `Product.reserved` using an atomic MongoDB update.
  - This prevents overselling by ensuring available stock is calculated as:
    - `available = stock - reserved`
  - Stock is only deducted from `Product.stock` during checkout.

- **Snapshot Strategy for Cart & Orders**
  - Cart stores `priceSnapshot` so pricing stays consistent during the cart session.
  - Order stores `nameSnapshot` and `priceSnapshot` so order history remains correct even if the product changes later or gets deleted.

- **Transactional Checkout**
  - Checkout runs inside a MongoDB transaction to ensure:
    - Product stock/reserved updates and order creation happen together,
    - No partial checkout states happen during concurrent purchases.

- **Cart Expiry + Auto Release**
  - Each cart has `expiresAt` and a background job clears expired carts.
  - On expiry, reserved quantities are released automatically to keep inventory accurate.

- **Role-Based Access Control (RBAC)**
  - Users are `customer` by default; admins have `admin` role.
  - Admin-only operations include product management and updating order status (shipped/delivered).

- **Abuse Prevention: Monthly Cancellation Limit**
  - Users can cancel only up to **5 orders per month**.
  - Cancellation counter resets automatically when the month changes.


---

## 📌 Assumptions Made

- **Single-store model**
  - Only one seller/admin manages all products (no multi-vendor support).

- **Payment is simulated**
  - `card_sim` and refund logic are treated as simulation (no real payment gateway like Stripe is integrated yet).

- **Cart is one-per-user**
  - Each user has a single cart document (`user` is unique in `Cart` model).

- **Email verification is required**
  - Users must verify email (OTP) before full access/ordering (based on your verification flow).

- **Cart expiry time is environment-driven**
  - Cart expiration is controlled by `CART_TTL_MIN` and can be changed without code edits.

- **Order history must stay valid even if products change**
  - Products can be updated/deleted by admin, but orders remain correct due to snapshots in Order items.

- **Free tier hosting behavior**
  - Render free instances. Inactivity will give a cold start. Need to wait 50 sec.

---
---
---
# ✨ Core Features

## 👤 User System
- JWT Authentication
- Email Verification via OTP
- Secure password hashing (bcrypt)
- Role-based access (User / Admin)

---

## 🛒 Smart Cart System
- Stock reservation on add-to-cart
- Prevents overselling using atomic MongoDB updates
- Cart expiration timer (CART_TTL_MIN)
- Auto-release reserved stock on:
  - Cart expiration
  - Item removal
  - Checkout
- Quantity-based removal support
- Real-time stock availability calculation:

Available = stock - reserved


---

## 📦 Order Management
- Checkout converts cart → order
- Order status lifecycle:
  - Pending
  - Shipped (Admin)
  - Delivered (Admin)
  - Cancelled (User)
- Refund logic on cancellation
- Monthly cancellation limit:
  - If user cancels 5 orders in a month → ordering blocked for that month

---

## 🛠️ Admin Panel
- Product CRUD operations
- Inventory management
- View all orders
- Update order status (Shipped / Delivered)
- Secure admin-only routes

---

<hr> <div align="center"> 
<h2>Thank You</h2> <p>Thanks for taking the time to explore this project</p> </div>


