import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";

const AdminComponent = () => {
  const { loading, isAuth, role } = useAuth();

  if (loading) return null;

  if (!isAuth) return <Navigate to="/admin/login" replace />;

  if (role !== "admin") return <Navigate to="/products" replace />;

  return <Outlet />;
};

export default AdminComponent;
