import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthFetch from "../../services/AuthFetch";
import "../../css/Cart.css";

export default function Cart() {
  const nav = useNavigate();

  const [cart, setCart] = useState({ items: [], expiresAt: null, status: "active" });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState("");

  
  const [modal, setModal] = useState({
    open: false,
    type: "info", 
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: null,
  });

  const closeModal = () =>
    setModal({
      open: false,
      type: "info",
      title: "",
      message: "",
      confirmText: "Confirm",
      cancelText: "Cancel",
      onConfirm: null,
    });

  const openInfo = (title, message, type = "info") =>
    setModal({
      open: true,
      type,
      title,
      message,
      confirmText: "OK",
      cancelText: "Cancel",
      onConfirm: null,
    });

  const openConfirm = (title, message, onConfirm, confirmText = "Confirm") =>
    setModal({
      open: true,
      type: "confirm",
      title,
      message,
      confirmText,
      cancelText: "Cancel",
      onConfirm,
    });

  const loadCart = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await AuthFetch("/api/cart", { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load cart");
      setCart(data?.items ? data : { items: [], expiresAt: null, status: "active" });
    } catch (e) {
      setMsg(e.message);
      setCart({ items: [], expiresAt: null, status: "active" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const calcTotal = () => {
    const items = cart?.items || [];
    const total = items.reduce((sum, it) => {
      const qty = Number(it?.qty || 0);
      const price = Number(it?.priceSnapshot) || Number(it?.product?.price) || 0;
      return sum + qty * price;
    }, 0);
    return Math.round(total * 100) / 100;
  };

  const increase = async (productId, addQty = 1) => {
    try {
      setBusyId(productId);
      const res = await AuthFetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, qty: addQty }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to add");
      await loadCart();
    } catch (e) {
      openInfo("Error", e.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const decrease = async (productId) => {
    try {
      setBusyId(productId);
      const res = await AuthFetch("/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, qty: 1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to remove");
      await loadCart();
    } catch (e) {
      openInfo("Error", e.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const removeAll = async (productId) => {
    try {
      setBusyId(productId);
      const res = await AuthFetch("/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }), // qty omitted => remove all
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to remove item");
      await loadCart();
    } catch (e) {
      openInfo("Error", e.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const doClearCart = async () => {
    try {
      setLoading(true);
      const res = await AuthFetch("/api/cart/clear", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to clear cart");
      await loadCart();
      openInfo("Cleared", "Your cart has been cleared.", "success");
    } catch (e) {
      openInfo("Error", e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    openConfirm(
      "Clear cart?",
      "This will remove all items from your cart.",
      async () => {
        closeModal();
        await doClearCart();
      },
      "Clear"
    );
  };

  const checkout = () => {
    if (!cart?.items?.length) {
      openInfo("Cart is empty", "Add something before checkout.", "error");
      return;
    }
    nav("/checkout");
  };

  const items = cart?.items || [];
  const total = calcTotal();

  return (
    <div className="cart-page">
      {/*  Styled modal */}
      {modal.open && (
        <div className="cart-modalOverlay" onMouseDown={closeModal}>
          <div className="cart-modalCard" onMouseDown={(e) => e.stopPropagation()}>
            <div className="cart-modalHead">
              <div className="cart-modalTitle">{modal.title}</div>
              <button className="cart-modalX" onClick={closeModal} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="cart-modalBody">
              <div className={`cart-modalMsg cart-msg-${modal.type}`}>{modal.message}</div>
            </div>

            <div className="cart-modalFoot">
              {modal.type === "confirm" && (
                <button className="btn" onClick={closeModal}>
                  {modal.cancelText}
                </button>
              )}
              <button
                className={`btn ${modal.type === "confirm" ? "danger" : "primary"}`}
                onClick={modal.type === "confirm" ? modal.onConfirm : closeModal}
              >
                {modal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cart-header">
        <h1>Cart</h1>
        <div className="cart-actions">
          <button className="btn" onClick={loadCart} disabled={loading}>
            Refresh
          </button>
          <button className="btn danger" onClick={clearCart} disabled={loading || items.length === 0}>
            Clear
          </button>
          <button className="btn primary" onClick={checkout} disabled={loading || items.length === 0}>
            Checkout
          </button>
        </div>
      </div>

      {msg && <div className="cart-msg">{msg}</div>}
      {loading && <div className="cart-muted">Loading...</div>}

      {!loading && items.length === 0 && <div className="cart-empty">Your cart is empty.</div>}

      <div className="cart-list">
        {items.map((it) => {
          const p = it.product || {};
          const productId = p._id || it.product;
          const name = p.name || it.nameSnapshot || "Product";
          const price = Number(it.priceSnapshot ?? p.price ?? 0);
          const qty = Number(it.qty || 0);
          const line = Math.round(price * qty * 100) / 100;

          return (
            <div className="cart-item" key={String(productId)}>
              <div className="cart-item-left">
                <div className="cart-name">{name}</div>
                <div className="cart-sub">
                  <span className="cart-chip cart-chipPrice">${price}</span>
                  <span className="cart-chip cart-chipQty">Qty: {qty}</span>
                  <span className="cart-chip cart-chipLine">Line: ${line}</span>
                </div>
              </div>

              <div className="cart-item-right">
                <button className="btn" onClick={() => decrease(productId)} disabled={busyId === productId || qty <= 0}>
                  −
                </button>
                <span className="cart-qty">{qty}</span>
                <button className="btn" onClick={() => increase(productId, 1)} disabled={busyId === productId}>
                  +
                </button>
                <button className="btn danger" onClick={() => removeAll(productId)} disabled={busyId === productId}>
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && items.length > 0 && (
        <div className="cart-footer">
          <div className="cart-total">
            Total: <strong>${total}</strong>
          </div>
          {cart?.expiresAt && (
            <div className="cart-exp">
              Expires: <span>{new Date(cart.expiresAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
