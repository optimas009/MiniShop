import { createContext, useContext, useEffect, useState, useCallback } from "react";
import AuthFetch from "./AuthFetch";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setIsAuth(false);
    setRole(null);
    setUser(null);
  }, []);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("token");
    setLoading(true);

    if (!token) {
      logout();
      setLoading(false);
      return;
    }

    try {
      
      const res = await AuthFetch("/api/auth/me", { method: "GET", skip401Handler: true });
      if (!res.ok) throw new Error("Not logged in");

      const data = await res.json().catch(() => ({}));
      setIsAuth(true);
      setRole(data.role);
      setUser({ id: data.id, name: data.name, role: data.role });
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  
  useEffect(() => {
    const onExpired = () => {
      logout(); 
    };

    window.addEventListener("session-expired", onExpired);
    return () => window.removeEventListener("session-expired", onExpired);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        loading,
        isAuth,
        role,
        user,
        logout,
        reload: loadMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
