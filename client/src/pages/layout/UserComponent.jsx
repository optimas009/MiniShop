import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../services/AuthContext";

const UserComponent = () => {
  const { loading, isAuth, role } = useAuth();

  if (loading) return null;

  if (!isAuth) return <Navigate to="/login" replace />;

  
  if (role !== "customer") return <Navigate to="/products" replace />;

  return <Outlet />;
};

export default UserComponent;
