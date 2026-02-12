import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthFetch from "../../services/AuthFetch";
import "../../css/Checkout.css";

import {
  onlyDigits,
  luhnCheck,
  isValidCvv,
  isExpiryNotPast,
  parseExpiry,
  formatCardNumber,
} from "../utils/validators";

export default function Checkout() {
  const nav = useNavigate();

  const [cardNumber, setCardNumber] = useState("");
  const [name, setName] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);

  
  const [errors, setErrors] = useState({ name: "", cardNumber: "", exp: "", cvv: "" });

  
  const [modal, setModal] = useState({
    open: false,
    type: "info", 
    title: "",
    message: "",
  });

  const timerRef = useRef(null);

  const closeModal = () => setModal({ open: false, type: "info", title: "", message: "" });

  const showModal = (type, title, message) => {
    setModal({ open: true, type, title, message });
  };

  const cardDigits = useMemo(() => onlyDigits(cardNumber), [cardNumber]);

  const validateAll = () => {
    const next = { name: "", cardNumber: "", exp: "", cvv: "" };
    const cleanName = String(name || "").trim();

    if (!cleanName) next.name = "Name is required";

    if (!cardDigits) {
      next.cardNumber = "Card number is required";
    } else {
      if (cardDigits.length < 13 || cardDigits.length > 19) {
        next.cardNumber = "Card number must be 13 to 19 digits";
      } else if (!luhnCheck(cardDigits)) {
        next.cardNumber = "Invalid card number (Luhn failed)";
      }
    }

    const expParsed = parseExpiry(exp);
    if (!expParsed.ok) next.exp = expParsed.reason;
    else {
      const check = isExpiryNotPast(exp);
      if (!check.ok) next.exp = check.reason;
    }

    if (!String(cvv || "").trim()) next.cvv = "CVV is required";
    else if (!isValidCvv(cvv)) next.cvv = "CVV must be 3 or 4 digits";

    setErrors(next);

    return !next.name && !next.cardNumber && !next.exp && !next.cvv;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);

    // reset modal + errors
    closeModal();
    setErrors({ name: "", cardNumber: "", exp: "", cvv: "" });

    const ok = validateAll();
    if (!ok) return;

    setLoading(true);

    try {
      // 1) simulate payment (backend checks Luhn)
      const payRes = await AuthFetch("/api/payments/simulate", {
        method: "POST",
        body: JSON.stringify({ cardNumber: cardDigits }),
      });

      const payData = await payRes.json().catch(() => ({}));
      if (!payRes.ok) {
        showModal("error", "Payment failed", payData?.message || "Payment failed");
        // keep modal at least 5s
        timerRef.current = setTimeout(() => {}, 5000);
        return;
      }

      // 2) checkout
      const res = await AuthFetch("/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify({
          paymentMethod: "card_sim",
          paymentId: payData.paymentId,
          paymentLast4: payData.last4,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showModal("error", "Checkout failed", data?.message || "Checkout failed");
        timerRef.current = setTimeout(() => {}, 3000);
        return;
      }

      // success
      showModal("success", "Payment successful ", "Order placed! Redirecting to My Orders…");

      // show for at least 5 seconds then redirect
      timerRef.current = setTimeout(() => {
        nav("/orders", { replace: true });
      }, 3000);
    } catch (err) {
      showModal("error", "Payment failed", err?.message || "Something went wrong");
      timerRef.current = setTimeout(() => {}, 5000);
    } finally {
      setLoading(false);
    }
  };

  const onCardChange = (v) => {
    setCardNumber(formatCardNumber(v));
    setErrors((p) => ({ ...p, cardNumber: "" }));
  };

  const onExpChange = (v) => {
    
    let x = String(v || "").replace(/[^\d/]/g, "");
    if (x.length === 2 && !x.includes("/")) x = x + "/";
    x = x.slice(0, 5);
    setExp(x);
    setErrors((p) => ({ ...p, exp: "" }));
  };

  return (
    <div className="checkout-page">
      {/* Modal */}
      {modal.open && (
        <div className="co-modalOverlay" onMouseDown={closeModal}>
          <div className="co-modalCard" onMouseDown={(e) => e.stopPropagation()}>
            <div className="co-modalHead">
              <div className="co-modalTitle">{modal.title}</div>
              <button className="co-modalX" onClick={closeModal} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="co-modalBody">
              <div className={`co-modalMsg co-msg-${modal.type}`}>
                {String(modal.message || "").split("\n").map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>

            <div className="co-modalFoot">
              <button
                className={`co-btn ${modal.type === "success" ? "co-btnPrimary" : "co-btnDanger"}`}
                onClick={closeModal}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="co-head">
        <div>
          <h1 className="co-title">Checkout</h1>
          <p className="co-subtitle">Card simulation. Backend validates card using Luhn.</p>
        </div>
      </div>

      <form className="checkout-card" onSubmit={submit}>
        <div className="co-field">
          <label>Name on card</label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((p) => ({ ...p, name: "" }));
            }}
            placeholder="Full name"
            disabled={loading}
            className={errors.name ? "co-inputError" : ""}
          />
          {errors.name && <div className="co-err">{errors.name}</div>}
        </div>

        <div className="co-field">
          <label>Card number</label>
          <input
            value={cardNumber}
            onChange={(e) => onCardChange(e.target.value)}
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            disabled={loading}
            className={errors.cardNumber ? "co-inputError" : ""}
          />
          <div className="co-hint">
            Tip: try <span className="co-mono">4242 4242 4242 4242</span> (valid Luhn)
          </div>
          {errors.cardNumber && <div className="co-err">{errors.cardNumber}</div>}
        </div>

        <div className="co-row">
          <div className="co-field">
            <label>Expiry (MM/YY)</label>
            <input
              value={exp}
              onChange={(e) => onExpChange(e.target.value)}
              placeholder="12/28"
              disabled={loading}
              className={errors.exp ? "co-inputError" : ""}
            />
            <div className="co-hint">Must be this month or later.</div>
            {errors.exp && <div className="co-err">{errors.exp}</div>}
          </div>

          <div className="co-field">
            <label>CVV</label>
            <input
              value={cvv}
              onChange={(e) => {
                setCvv(String(e.target.value || "").replace(/\D/g, "").slice(0, 4));
                setErrors((p) => ({ ...p, cvv: "" }));
              }}
              placeholder="123"
              inputMode="numeric"
              disabled={loading}
              className={errors.cvv ? "co-inputError" : ""}
            />
            {errors.cvv && <div className="co-err">{errors.cvv}</div>}
          </div>
        </div>

        <button className="checkout-btn" disabled={loading}>
          {loading ? "Processing..." : "Pay & Place Order"}
        </button>

        <button type="button" className="checkout-btn ghost" onClick={() => nav("/cart")} disabled={loading}>
          Back to Cart
        </button>
      </form>
    </div>
  );
}
