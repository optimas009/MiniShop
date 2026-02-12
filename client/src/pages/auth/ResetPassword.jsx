import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthFetch from "../../services/AuthFetch";
import "../../css/Form.css";

export default function ResetPassword() {
  const nav = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [codeError, setCodeError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const stEmail = location.state?.email;
    if (!stEmail) nav("/login", { replace: true });
    else setEmail(String(stEmail).trim().toLowerCase());
  }, [location.state, nav]);

  const resend = async () => {
    setCodeError("");
    setPasswordError("");
    setMessage("");
    setResending(true);

    try {
      const res = await AuthFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        skip401Handler: true,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCodeError(data?.message || "Could not resend code right now.");
        return;
      }

      setMessage("A new reset code has been sent to your email.");
    } catch {
      setCodeError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    setCodeError("");
    setPasswordError("");
    setMessage("");

    const cleanCode = String(code || "").trim();

    if (!/^\d{6}$/.test(cleanCode)) return setCodeError("Please enter the 6-digit code");
    if (!newPassword) return setPasswordError("Enter your new password");

    setLoading(true);
    try {
      const res = await AuthFetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: cleanCode, newPassword }),
        skip401Handler: true,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = String(data?.message || "Request failed");

        // Route password-policy messages to password field
        const lower = msg.toLowerCase();
        const looksLikePasswordIssue =
          lower.includes("password") ||
          lower.includes("uppercase") ||
          lower.includes("lowercase") ||
          lower.includes("special") ||
          lower.includes("character") ||
          lower.includes("length");

        if (looksLikePasswordIssue) setPasswordError(msg);
        else setCodeError(msg);

        return;
      }

      nav("/login", { replace: true });
    } catch {
      setCodeError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter the 6-digit code sent to your email</p>

        <form className="form" onSubmit={reset}>
          <div className="input-group">
            <div className="input-label">Email</div>
            <input className="input" value={email} readOnly disabled />
          </div>

          <div className="input-group">
            <div className="input-label">6-digit code</div>
            <input
              className={`input ${codeError ? "input-error" : ""}`}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCodeError("");
              }}
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              disabled={loading || resending}
            />
            {codeError && <div className="err">{codeError}</div>}
            {message && <div className="msg msg-success">{message}</div>}
          </div>

          <div className="input-group">
            <div className="input-label">New password</div>
            <input
              className={`input ${passwordError ? "input-error" : ""}`}
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError("");
              }}
              placeholder="Enter new password"
              disabled={loading || resending}
              autoComplete="new-password"
            />
            {passwordError && <div className="err">{passwordError}</div>}
          </div>

          <button className="btn" type="submit" disabled={loading || resending}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <button type="button" className="btn btn-secondary" onClick={resend} disabled={loading || resending}>
            {resending ? "Resending..." : "Resend Code"}
          </button>

          <button type="button" className="btn btn-secondary" onClick={() => nav("/login", { replace: true })} disabled={loading || resending}>
            Back to login
          </button>
        </form>
      </div>
    </div>
  );
}
