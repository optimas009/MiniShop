import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthFetch from "../../services/AuthFetch";
import "../../css/Form.css";
import { isValidEmail, hasUppercase } from "../utils/validators";

export default function Signup() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passError, setPassError] = useState("");

  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    // reset all errors first
    setNameError("");
    setEmailError("");
    setPassError("");
    setInfo("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // ---- NAME VALIDATION ----
    if (!cleanName) {
      setNameError("Name is required");
      return;
    }

    // ---- EMAIL VALIDATION ----
    if (hasUppercase(email)) {
      setEmailError("Email must be lowercase");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setEmailError("Invalid email");
      return;
    }

    // ---- PASSWORD VALIDATION (ONLY SET passError HERE) ----
    if (password.length < 6) {
      setPassError("Password too short");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setPassError("Password must contain at least 1 uppercase letter");
      return;
    }

    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      setPassError("Password must contain at least 1 special character");
      return;
    }

    // ---- API CALL ----
    setLoading(true);

    try {
      const res = await AuthFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
        }),
        skip401Handler: true,
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setEmailError(data?.message || "Signup failed");
        return;
      }

      nav("/verify", { state: { email: cleanEmail } });

    } catch {
      setEmailError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Signup</h1>
        <p className="auth-subtitle">Create your account to start shopping</p>

        <form className="form" onSubmit={submit}>

          {/* NAME */}
          <div className="input-group">
            <div className="input-label">Name</div>
            <input
              className={`input ${nameError ? "input-error" : ""}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              placeholder="Your name"
            />
            {nameError && <div className="err">{nameError}</div>}
          </div>

          {/* EMAIL */}
          <div className="input-group">
            <div className="input-label">Email</div>
            <input
              className={`input ${emailError ? "input-error" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="name@email.com"
            />
            {emailError && <div className="err">{emailError}</div>}
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <div className="input-label">Password</div>
            <input
              className={`input ${passError ? "input-error" : ""}`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="At least 6 characters"
            />
            {passError && <div className="err">{passError}</div>}
          </div>

          <button className="btn" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => nav("/login", { replace: true })}
            disabled={loading}
          >
            Back to login
          </button>

        </form>
      </div>
    </div>
  );
}
