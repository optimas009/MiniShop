import { Link, useNavigate } from "react-router-dom";
import "../../css/Nav.css";
import { useAuth } from "../../services/AuthContext";

export default function Nav() {
  const navigate = useNavigate();
  const { loading, isAuth, role, logout } = useAuth();

  if (loading) return null;

  const doLogout = () => {
    logout();
    navigate("/products");
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* LEFT */}
        <div className="nav-left">
          <Link to="/products" className="logo">
            MiniShop
          </Link>
        </div>

        {/* CENTER */}
        <ul className="nav-center">
          {!isAuth && (
            <li>
              <Link to="/products">Products</Link>
            </li>
          )}

          {isAuth && role === "customer" && (
            <>
              <li>
                <Link to="/products">Products</Link>
              </li>
              <li>
                <Link to="/orders">My Orders</Link>
              </li>
            </>
          )}

          {isAuth && role === "admin" && (
            <>
              <li>
                <Link to="/admin/add-product">Add Product</Link>
              </li>
              <li>
                <Link to="/admin/manage-products">Manage Products</Link>
              </li>
              <li>
                <Link to="/admin/orders">Orders</Link>
              </li>
              <li>
                <Link to="/products">Products</Link>
              </li>
            </>
          )}
        </ul>

        {/* RIGHT */}
        <ul className="nav-right">
          {isAuth && role === "customer" && (
            <li>
              <Link to="/cart" className="cart-link">
                <span className="cart-icon" aria-hidden="true">
                  🛒
                </span>
                <span className="cart-text">Cart</span>
              </Link>
            </li>
          )}

          {!isAuth ? (
            <>
              <li>
                <Link to="/login" className="login-link">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="btn-link">
                  Signup
                </Link>
              </li>
            </>
          ) : (
            <li>
              <button className="btn-link logout-btn" onClick={doLogout}>
                Logout
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
