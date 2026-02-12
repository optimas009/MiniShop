import { useEffect, useState } from "react";
import AuthFetch from "../../services/AuthFetch";
import "../../css/MyOrders.css";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  //  modal for confirm + info 
  const [modal, setModal] = useState({
    open: false,
    type: "info", 
    title: "",
    message: "",
    confirmText: "OK",
    onConfirm: null,
  });

  const closeModal = () =>
    setModal({ open: false, type: "info", title: "", message: "", confirmText: "OK", onConfirm: null });

  const openInfo = (title, message, type = "info") =>
    setModal({ open: true, type, title, message, confirmText: "OK", onConfirm: null });

  const openConfirm = (title, message, onConfirm, confirmText = "Confirm") =>
    setModal({ open: true, type: "confirm", title, message, confirmText, onConfirm });

  const load = async () => {
    setLoading(true);
    try {
      const res = await AuthFetch("/api/orders/my", { method: "GET" });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.message || "Failed to load orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      openInfo("Error", e.message, "error");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pretty = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown");

  const doCancel = async (id) => {
    try {
      setBusyId(id);
      const res = await AuthFetch(`/api/orders/${id}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Cancel failed");

      const refundMsg =
        data.paymentStatus === "refunded"
          ? `Refunded  (refundId: ${data.refundId || "N/A"})`
          : "";

      openInfo(
        "Order cancelled",
        `Cancelled (cancelCount: ${data.cancelCount})${refundMsg ? `\n\n${refundMsg}` : ""}`,
        "success"
      );

      await load();
    } catch (e) {
      openInfo("Error", e.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const cancel = (id) => {
    openConfirm("Cancel this order?", "This action cannot be undone.", async () => {
      closeModal();
      await doCancel(id);
    }, "Cancel Order");
  };

  return (
    <div className="mo-page">
      {/*  modal */}
      {modal.open && (
        <div className="mo-modalOverlay" onMouseDown={closeModal}>
          <div className="mo-modalCard" onMouseDown={(e) => e.stopPropagation()}>
            <div className="mo-modalHead">
              <div className="mo-modalTitle">{modal.title}</div>
              <button className="mo-modalX" onClick={closeModal}>✕</button>
            </div>

            <div className="mo-modalBody">
              <div className={`mo-modalMsg mo-msg-${modal.type}`}>
                {String(modal.message || "").split("\n").map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>

            <div className="mo-modalFoot">
              {modal.type === "confirm" && (
                <button className="mo-btn" onClick={closeModal}>Back</button>
              )}
              <button
                className={`mo-btn ${modal.type === "confirm" ? "mo-btnDanger" : "mo-btnPrimary"}`}
                onClick={modal.type === "confirm" ? modal.onConfirm : closeModal}
              >
                {modal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mo-header">
        <div>
          <h1 className="mo-title">My Orders</h1>
          <p className="mo-subtitle">Track your orders and cancel if still pending.</p>
        </div>

        <button className="mo-btn" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading && <div className="mo-muted">Loading...</div>}

      <div className="mo-list">
        {orders.map((o) => {
          const pay = o.paymentStatus || "unknown";
          const status = o.status || "unknown";

          return (
            <div className="mo-card" key={o._id}>
              <div className="mo-topRow">
                <div className="mo-leftTop">
                  <div className="mo-kicker">Order</div>
                  <div className="mo-idChip">{o._id}</div>
                </div>

                <div className="mo-rightTop">
                  <span className={`mo-pill status-${status}`}>{pretty(status)}</span>
                  <span className="mo-totalChip">Total: ${o.total}</span>
                </div>
              </div>

              <div className="mo-mid">
                <div className="mo-midRow">
                  <span className="mo-strongText">Payment:</span>
                  <span className={`mo-pill pay-${pay}`}>{pretty(pay)}</span>
                  {o.paymentMethod ? (
                    <span className="mo-payMeta">
                      {o.paymentMethod}
                      {o.paymentLast4 ? ` • **** ${o.paymentLast4}` : ""}
                    </span>
                  ) : null}
                </div>

                {pay === "refunded" && (o.refundId || o.refundedAt) && (
                  <div className="mo-midRow">
                    <span className="mo-strongText">Refund:</span>
                    <span className="mo-refundChip">{o.refundId || "N/A"}</span>
                    {o.refundedAt ? (
                      <span className="mo-payMeta">{new Date(o.refundedAt).toLocaleString()}</span>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="mo-items">
                {(o.items || []).map((it, idx) => (
                  <div className="mo-item" key={idx}>
                    <div className="mo-itemName">
                      {it.nameSnapshot || it.product?.name || "Product"}
                    </div>
                    <div className="mo-itemRight">
                      <span className="mo-itemPrice">${it.priceSnapshot}</span>
                      <span className="mo-itemTimes">×</span>
                      <span className="mo-itemQty">{it.qty}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mo-actions">
                {status === "pending" ? (
                  <button
                    className="mo-btn mo-btnDanger"
                    onClick={() => cancel(o._id)}
                    disabled={busyId === o._id}
                  >
                    {busyId === o._id ? "Cancelling..." : "Cancel Order"}
                  </button>
                ) : (
                  <span className="mo-muted">No actions</span>
                )}
              </div>
            </div>
          );
        })}

        {!loading && orders.length === 0 && <div className="mo-empty">No orders yet.</div>}
      </div>
    </div>
  );
}
