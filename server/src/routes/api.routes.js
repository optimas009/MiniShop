const express = require("express");
const router = express.Router();

// controllers
const {createProduct,getProducts,updateProduct,deleteProduct} = require("../controllers/productController");

const {register,loginCustomer,loginAdmin,me,verifyEmail,resendVerifyCode,forgotPassword,resetPassword} 
= require("../controllers/authController");


const cartController = require("../controllers/cartController");

const paymentController = require("../controllers/paymentController");

const orderController = require("../controllers/orderController");

const adminOrderController = require("../controllers/adminOrderController");


// middleware
const { authRequired, requireAdmin } = require("../middleware/auth");
const { requireCustomer } = require("../middleware/roles");


// ================= AUTH =================
router.post("/auth/register", register);
router.post("/auth/login", loginCustomer);
router.post("/secret", loginAdmin);
router.get("/auth/me", authRequired, me);
router.post("/auth/verify-email", verifyEmail);
router.post("/auth/resend-code", resendVerifyCode);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);


// ================= PRODUCTS =================
router.get("/products", getProducts);
router.post("/products", authRequired, requireAdmin, createProduct);
router.put("/products/:id", authRequired, requireAdmin, updateProduct);
router.delete("/products/:id", authRequired, requireAdmin, deleteProduct);

// ================= CART (CUSTOMER ONLY) =================
router.get("/cart", authRequired, requireCustomer, cartController.getMyCart);
router.post("/cart/add", authRequired, requireCustomer, cartController.addItem);
router.post("/cart/remove", authRequired, requireCustomer, cartController.removeItem);
router.post("/cart/clear", authRequired, requireCustomer, cartController.clearMyCart);

// ================= PAYMENTS (CUSTOMER ONLY) =================
router.post("/payments/simulate",authRequired,requireCustomer,paymentController.simulateCardPayment);


// ================= ORDERS (CUSTOMER ONLY) =================
router.post("/orders/checkout", authRequired, requireCustomer, orderController.checkout);
router.get("/orders/my", authRequired, requireCustomer, orderController.myOrders);
router.post("/orders/:id/cancel", authRequired, requireCustomer, orderController.cancelOrder);

// ================= ADMIN ORDERS =================
router.get("/admin/orders", authRequired, requireAdmin, adminOrderController.listOrders);
router.patch("/admin/orders/:id/status", authRequired, requireAdmin, adminOrderController.updateStatus);




module.exports = router;