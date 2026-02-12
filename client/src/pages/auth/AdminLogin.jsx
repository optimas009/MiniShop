import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthFetch from "../../services/AuthFetch";
import { useAuth } from "../../services/AuthContext";
import "../../css/Form.css";

export default function AdminLogin() {
  const nav = useNavigate();
  const { reload } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) nav("/products", { replace: true });
  }, [nav]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await AuthFetch("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email: String(email || "").trim().toLowerCase(), password }),
        skip401Handler: true,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data?.message || "Admin login failed");
        return;
      }

      localStorage.setItem("token", data.token);

      const meRes = await AuthFetch("/api/auth/me");
      const meData = await meRes.json().catch(() => ({}));

      if (!meRes.ok) throw new Error("Not authorized");
      if (meData.role !== "admin") {
        localStorage.removeItem("token");
        throw new Error("This account is not admin.");
      }

      await reload();
      nav("/admin/manage-products", { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Admin Login</h1>
        <p className="auth-subtitle">Sign in to manage products</p>

        <form className="form" onSubmit={submit}>
          <div className="input-group">
            <div className="input-label">Admin Email</div>
            <input
              className={`input ${err ? "input-error" : ""}`}
              placeholder="admin@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <div className="input-label">Password</div>
            <input
              className={`input ${err ? "input-error" : ""}`}
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {err && <div className="msg msg-error">{err}</div>}

          <button className="btn" disabled={loading}>
            {loading ? "Logging in..." : "Login as Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
