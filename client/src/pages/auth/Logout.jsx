import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthFetch from "../../services/AuthFetch";
import { useAuth } from "../../services/AuthContext";

export default function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        await AuthFetch("/api/cart/clear", { method: "POST", skip401Handler: true });
      } catch {
        
      } finally {
        logout();
        navigate("/products", { replace: true });
      }
    })();
  }, [logout, navigate]);

  return null;
}
