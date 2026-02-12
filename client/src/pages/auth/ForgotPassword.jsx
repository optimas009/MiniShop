import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthFetch from "../../services/AuthFetch";
import "../../css/Form.css";
import { isValidEmail, hasUppercase } from "../utils/validators";

export default function ForgotPassword() {
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) nav("/products", { replace: true });
  }, [nav]);

  useEffect(() => {
    const pending = location.state?.email;
    if (pending) setEmail(String(pending).trim().toLowerCase());
  }, [location.state]);

  const sendCode = async (e) => {
    e.preventDefault();
    setEmailError("");
    const clean = String(email || "").trim().toLowerCase();

    if (hasUppercase(email)) return setEmailError("Email must be lowercase");
    if (!isValidEmail(clean)) return setEmailError("Enter a valid email address");

    setLoading(true);
    try {
      const res = await AuthFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: clean }),
        skip401Handler: true,
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 403 && data?.reason === "NOT_VERIFIED") {
        nav("/verify", { replace: true, state: { email: clean } });
        return;
      }
      if (!res.ok) {
        setEmailError(data?.message || "Please wait before requesting another code.");
        return;
      }
      nav("/reset-password", { replace: true, state: { email: clean } });
    } catch {
      setEmailError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-subtitle">We’ll send a 6-digit reset code</p>

        <form className="form" onSubmit={sendCode}>
          <div className="input-group">
            <div className="input-label">Email</div>
            <input
              className={`input ${emailError ? "input-error" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              disabled={loading}
            />
            {emailError && <div className="err">{emailError}</div>}
            <div className="hint">We’ll email you a 6-digit code.</div>
          </div>

          <button className="btn" disabled={loading}>
            {loading ? "Sending..." : "Send reset code"}
          </button>

          <button type="button" className="btn btn-secondary" onClick={() => nav("/login", { replace: true })} disabled={loading}>
            Back to login
          </button>
        </form>
      </div>
    </div>
  );
}
