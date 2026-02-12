import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthFetch from "../../services/AuthFetch";
import { useAuth } from "../../services/AuthContext";
import "../../css/Form.css";
import { isValidEmail, hasUppercase } from "../utils/validators";

export default function Login() {
  const nav = useNavigate();
  const { reload } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passError, setPassError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) nav("/products", { replace: true });
  }, [nav]);

  const submit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPassError("");
    const clean = String(email || "").trim().toLowerCase();

    if (hasUppercase(email)) return setEmailError("Email must be lowercase");
    if (!isValidEmail(clean)) return setEmailError("Enter a valid email address");
    if (!password) return setPassError("Password is required");

    setLoading(true);
    try {
      const res = await AuthFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: clean, password }),
        skip401Handler: true,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // If not verified -> go verify (keep same behavior)
        if (
          res.status === 403 &&
          String(data?.message || "").toLowerCase().includes("verify")
        ) {
          nav("/verify", { replace: true, state: { email: clean } });
          return;
        }

        // SECURITY: Never show backend password-policy details here
        setPassError("Invalid email or password");
        return;
      }

      localStorage.setItem("token", data.token);
      await reload();
      nav("/products", { replace: true });
    } catch {
      setPassError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">Welcome back — continue shopping</p>

        <form className="form" onSubmit={submit}>
          <div className="input-group">
            <div className="input-label">Email</div>
            <input
              className={`input ${emailError ? "input-error" : ""}`}
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            {emailError && <div className="err">{emailError}</div>}
          </div>

          <div className="input-group">
            <div className="input-label">Password</div>
            <input
              className={`input ${passError ? "input-error" : ""}`}
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            {passError && <div className="err">{passError}</div>}
          </div>

          <div className="link-row">
            <span />
            <button
              type="button"
              className="link-btn"
              onClick={() => nav("/forgot-password", { state: { email: email.toLowerCase() } })}
            >
              Forgot password?
            </button>
          </div>

          <button className="btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <button type="button" className="btn btn-secondary" onClick={() => nav("/signup")} disabled={loading}>
            Create account
          </button>
        </form>
      </div>
    </div>
  );
}
