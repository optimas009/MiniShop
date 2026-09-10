import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  FiMenu,
  FiX,
  FiShoppingBag,
  FiUser,
  FiLogOut,
  FiPackage,
  FiGrid,
} from "react-icons/fi";
import "../../css/Nav.css";
import { useAuth } from "../../services/AuthContext";

export default function Nav() {
  const navigate = useNavigate();
  const { loading, isAuth, role, user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) return <div className="nav-placeholder" />;

  const close = () => setOpen(false);
  const doLogout = () => {
    close();
    logout();
    navigate("/products");
  };
  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? "active" : ""}`;

  return (
    <header className="site-nav">
      <div className="nav-shell">
        <a href="/products" className="brand" onClick={close}>
          <span className="brand-mark">M</span>
          <span>MiniShop</span>
        </a>

        <nav className={`nav-menu ${open ? "open" : ""}`}>
          <NavLink to="/products" className={linkClass} onClick={close}>
            Shop
          </NavLink>

          {isAuth && role === "customer" && (
            <NavLink to="/orders" className={linkClass} onClick={close}>
              Orders
            </NavLink>
          )}

          {isAuth && role === "admin" && (
            <>
              <NavLink
                to="/admin/manage-products"
                className={linkClass}
                onClick={close}
              >
                <FiGrid /> Products
              </NavLink>
              <NavLink
                to="/admin/add-product"
                className={linkClass}
                onClick={close}
              >
                <FiPackage /> Add product
              </NavLink>
              <NavLink
                to="/admin/orders"
                className={linkClass}
                onClick={close}
              >
                Orders
              </NavLink>
            </>
          )}

          {/* Mobile-only account actions */}
          {!isAuth && (
            <div className="nav-mobile-only nav-mobile-account-links">
              <Link to="/login" className="nav-mobile-menu-link" onClick={close}>
                <FiUser /> Log in
              </Link>
              <Link
                to="/signup"
                className="nav-mobile-menu-link nav-mobile-create"
                onClick={close}
              >
                <FiUser /> Create account
              </Link>
            </div>
          )}

          {isAuth && role === "customer" && (
            <div className="nav-mobile-only nav-mobile-account-links">
              <button
                type="button"
                className="nav-mobile-menu-link nav-mobile-logout"
                onClick={doLogout}
              >
                <FiLogOut /> Logout
              </button>
            </div>
          )}

          {isAuth && role === "admin" && (
            <div className="nav-mobile-only nav-mobile-account-links">
              <button
                type="button"
                className="nav-mobile-menu-link nav-mobile-logout"
                onClick={doLogout}
              >
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </nav>

        <div className="nav-actions">
          {!isAuth ? (
            <>
              <Link to="/login" className="nav-login">
                Log in
              </Link>
              <Link to="/signup" className="nav-cta">
                Create account
              </Link>
            </>
          ) : (
            <>
              <div className="nav-user">
                <FiUser />
                <span>{user?.name || (role === "admin" ? "Admin" : "Account")}</span>
              </div>

              {role === "customer" && (
                <Link to="/cart" className="nav-cart-btn" aria-label="Cart">
                  <FiShoppingBag />
                  <span>Cart</span>
                </Link>
              )}

              <button
                className="nav-logout-btn"
                onClick={doLogout}
                aria-label="Logout"
              >
                <FiLogOut />
                <span>Logout</span>
              </button>
            </>
          )}

          <button
            className="nav-mobile-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            type="button"
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </header>
  );
}
