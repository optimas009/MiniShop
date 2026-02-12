import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";

const PublicComponent = () => {
  const { loading, isAuth, role } = useAuth();

  if (loading) return null;

  // if already logged in, block login/signup pages
  if (isAuth) {
    if (role === "admin") return <Navigate to="/admin/manage-products" replace />;
    return <Navigate to="/products" replace />;
  }

  return <Outlet />;
};

export default PublicComponent;
