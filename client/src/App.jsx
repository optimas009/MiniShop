import "./App.css";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import Nav from "./pages/layout/Nav";
import Footer from "./pages/layout/Footer";
import Products from "./pages/products/Products";
import ProductDetails from "./pages/products/ProductDetails";

import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import Logout from "./pages/auth/Logout";
import AdminLogin from "./pages/auth/AdminLogin";
import Verify from "./pages/auth/Verify";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import AddProduct from "./pages/admin/AddProduct";
import ManageProducts from "./pages/admin/ManageProducts";
import AdminOrders from "./pages/admin/AdminOrders";

import PublicComponent from "./pages/layout/PublicComponent";
import AdminComponent from "./pages/layout/AdminComponent";
import UserComponent from "./pages/layout/UserComponent";

import Cart from "./pages/cart/Cart";
import MyOrders from "./pages/orders/MyOrders";
import Checkout from "./pages/checkout/Checkout";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionExpired = () => navigate("/login", { replace: true });
    window.addEventListener("session-expired", handleSessionExpired);
    return () => window.removeEventListener("session-expired", handleSessionExpired);
  }, [navigate]);

  return <div className="App">
    <Nav />
    <div className="app-content">
      <Routes>
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/logout" element={<Logout />} />

        <Route element={<PublicComponent />}>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/secret" element={<AdminLogin />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route element={<UserComponent />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/checkout" element={<Checkout />} />
        </Route>

        <Route element={<AdminComponent />}>
          <Route path="/admin/add-product" element={<AddProduct />} />
          <Route path="/admin/manage-products" element={<ManageProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
        </Route>

        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </div>
    <Footer />
  </div>;
}

export default App;
