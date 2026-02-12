import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthFetch from "../../services/AuthFetch";
import "../../css/Form.css";

export default function Verify() {
  const nav = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      nav("/products", { replace: true });
      return;
    }

    const pending = location.state?.email;
    if (!pending) {
      nav("/login", { replace: true });
      return;
    }
    setEmail(String(pending).trim().toLowerCase());
  }, [location.state, nav]);

  const resend = async () => {
    setCodeError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await AuthFetch("/api/auth/resend-code", {
        method: "POST",
        body: JSON.stringify({ email }),
        skip401Handler: true,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCodeError(data?.message || "Please wait before requesting another code.");
        return;
      }

      setMessage("A new verification code has been sent!");
    } catch {
      setCodeError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setCodeError("");
    setMessage("");

    const cleanCode = String(code || "").trim();
    if (!/^\d{6}$/.test(cleanCode)) return setCodeError("Please enter the 6-digit code");

    setLoading(true);
    try {
      const res = await AuthFetch("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, code: cleanCode }),
        skip401Handler: true,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCodeError(data?.message || "Invalid verification code.");
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
        <h1 className="auth-title">Verify Email</h1>
        <p className="auth-subtitle">Enter the 6-digit code sent to your email</p>

        <form className="form" onSubmit={verify}>
          <div className="input-group">
            <div className="input-label">Email</div>
            <input className="input" value={email} readOnly disabled />
          </div>

          <div className="input-group">
            <div className="input-label">Verification Code</div>
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
              disabled={loading}
            />
            {codeError && <div className="err">{codeError}</div>}
            {message && <div className="msg msg-success">{message}</div>}
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </button>

          <button type="button" className="btn btn-secondary" onClick={resend} disabled={loading}>
            Resend Code
          </button>

          <button type="button" className="btn btn-secondary" onClick={() => nav("/login", { replace: true })} disabled={loading}>
            Back to login
          </button>
        </form>
      </div>
    </div>
  );
}
