import "./App.css";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import Nav from "./pages/layout/Nav";

import Footer from "./pages/layout/Footer";

import Products from "./pages/products/Products";

// auth pages
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import Logout from "./pages/auth/Logout";
import AdminLogin from "./pages/auth/AdminLogin";
import Verify from "./pages/auth/Verify";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword"; 


// admin pages
import AddProduct from "./pages/admin/AddProduct";
import ManageProducts from "./pages/admin/ManageProducts";

// guards 
import PublicComponent from "./pages/layout/PublicComponent";
import AdminComponent from "./pages/layout/AdminComponent";
import UserComponent from "./pages/layout/UserComponent";

import Cart from "./pages/cart/Cart";
import MyOrders from "./pages/orders/MyOrders";
import AdminOrders from "./pages/admin/AdminOrders";

import Checkout from "./pages/checkout/Checkout";


function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionExpired = () => {
      alert("Session expired. Please login again.");
      navigate("/login", { replace: true });
    };
    window.addEventListener("session-expired", handleSessionExpired);
    return () => window.removeEventListener("session-expired", handleSessionExpired);
  }, [navigate]);

  return (
    <div className="App">
      <Nav />

      <div className="app-content">
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />

          {/* Public pages  */}

          <Route path="/products" element={<Products />} />


          {/* Logout  */}
          <Route path="/logout" element={<Logout />} />

          {/* Guest-only pages and blocked if logged in */}
          <Route element={<PublicComponent />}>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route path="/verify" element={<Verify />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

          </Route>

          {/* Customer-only */}
          <Route element={<UserComponent />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/checkout" element={<Checkout />} />

          </Route>


          {/* Admin-only */}
          <Route element={<AdminComponent />}>
            <Route path="/admin/add-product" element={<AddProduct />} />
            <Route path="/admin/manage-products" element={<ManageProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
          </Route>


          <Route path="*" element={<Navigate to="/products" replace />} />
          
        </Routes>
      </div>
      <Footer />
    </div >
  );
}

export default App;
