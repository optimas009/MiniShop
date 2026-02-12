import { useEffect, useState } from "react";
import AuthFetch from "../../services/AuthFetch";
import "../../css/AdminOrders.css";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState("");

  // ✅ Styled confirm modal state
  const [confirmBox, setConfirmBox] = useState({
    open: false,
    title: "",
    message: "",
    danger: false,
    onConfirm: null,
  });

  const closeConfirm = () =>
    setConfirmBox({ open: false, title: "", message: "", danger: false, onConfirm: null });

  const openConfirm = ({ title, message, danger = false, onConfirm }) => {
    setConfirmBox({ open: true, title, message, danger, onConfirm });
  };

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const q = status ? `?status=${encodeURIComponent(status)}` : "";
      const res = await AuthFetch(`/api/admin/orders${q}`, { method: "GET" });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.message || "Failed to load admin orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const nextStatus = (curr) => {
    if (curr === "pending") return "shipped";
    if (curr === "shipped") return "delivered";
    return null;
  };

  const label = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown");

  const doUpdateStatus = async (orderId, next) => {
    try {
      setBusyId(orderId);
      const res = await AuthFetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ nextStatus: next }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Update failed");

      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const updateStatus = (orderId, curr) => {
    const ns = nextStatus(curr);
    if (!ns) return;

    // ✅ custom confirm modal (styled)
    openConfirm({
      title: "Confirm status change",
      message: `Change status: ${label(curr)} → ${label(ns)} ?`,
      onConfirm: async () => {
        closeConfirm();
        await doUpdateStatus(orderId, ns);
      },
    });
  };

  return (
    <div className="ao-page">
      {/* ✅ Styled confirm modal */}
      {confirmBox.open && (
        <div className="ao-modalOverlay" onMouseDown={closeConfirm}>
          <div className="ao-modalCard" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ao-modalHead">
              <div className="ao-modalTitle">{confirmBox.title}</div>
              <button className="ao-modalX" onClick={closeConfirm}>✕</button>
            </div>

            <div className="ao-modalBody">
              <div className="ao-modalMsg">{confirmBox.message}</div>
            </div>

            <div className="ao-modalFoot">
              <button className="ao-btn" onClick={closeConfirm}>Cancel</button>
              <button
                className={`ao-btn ${confirmBox.danger ? "ao-btnDanger" : "ao-btnPrimary"}`}
                onClick={confirmBox.onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ao-header">
        <div>
          <h1 className="ao-title">Admin Orders</h1>
          <p className="ao-subtitle">View orders and update delivery status.</p>
        </div>

        <div className="ao-controls">
          <select
            className="ao-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={loading}
          >
            <option value="">All</option>
            <option value="pending">pending</option>
            <option value="shipped">shipped</option>
            <option value="delivered">delivered</option>
            <option value="cancelled">cancelled</option>
          </select>

          <button className="ao-btn" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {err && <div className="ao-banner ao-bannerError">{err}</div>}
      {loading && <div className="ao-muted">Loading...</div>}

      <div className="ao-list">
        {orders.map((o) => {
          const deliveryStatus = o.status || "unknown";
          const pay = o.paymentStatus || "unknown";
          const action = nextStatus(deliveryStatus);

          return (
            <div className="ao-card" key={o._id}>
              <div className="ao-topRow">
                <div className="ao-leftTop">
                  <div className="ao-kicker">Order</div>
                  <div className="ao-idChip">{o._id}</div>
                </div>

                <div className="ao-rightTop">
                  <span className={`ao-pill status-${deliveryStatus}`}>{label(deliveryStatus)}</span>
                  <span className="ao-totalChip">Total: ${o.total}</span>
                </div>
              </div>

              <div className="ao-mid">
                <div className="ao-midRow">
                  <span className="ao-strongText">User:</span>{" "}
                  <span className="ao-user">
                    {o.user?.name || "Unknown"}{" "}
                    <span className="ao-userEmail">({o.user?.email || "Unknown"})</span>
                  </span>
                </div>

                <div className="ao-midRow">
                  <span className="ao-strongText">Payment:</span>{" "}
                  <span className={`ao-pill pay-${pay}`}>{label(pay)}</span>
                  {o.paymentMethod ? (
                    <span className="ao-payMeta">
                      {o.paymentMethod}
                      {o.paymentLast4 ? ` • **** ${o.paymentLast4}` : ""}
                    </span>
                  ) : null}
                </div>

                {pay === "refunded" && o.refundId ? (
                  <div className="ao-midRow">
                    <span className="ao-strongText">Refund:</span>{" "}
                    <span className="ao-refundChip">{o.refundId}</span>
                  </div>
                ) : null}
              </div>

              <div className="ao-items">
                {(o.items || []).map((it, idx) => (
                  <div className="ao-item" key={idx}>
                    <div className="ao-itemName">
                      {it.nameSnapshot || it.product?.name || "Product"}
                    </div>
                    <div className="ao-itemRight">
                      <span className="ao-itemPrice">${it.priceSnapshot}</span>
                      <span className="ao-itemTimes">×</span>
                      <span className="ao-itemQty">{it.qty}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ao-actions">
                {action ? (
                  <button
                    className="ao-btn ao-btnPrimary"
                    onClick={() => updateStatus(o._id, deliveryStatus)}
                    disabled={busyId === o._id}
                  >
                    {busyId === o._id ? "Updating..." : `Mark as ${label(action)}`}
                  </button>
                ) : (
                  <span className="ao-muted">No actions</span>
                )}
              </div>
            </div>
          );
        })}

        {!loading && orders.length === 0 && <div className="ao-empty">No orders found.</div>}
      </div>
    </div>
  );
}
