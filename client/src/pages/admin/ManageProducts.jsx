import { useEffect, useState } from "react";
import AuthFetch from "../../services/AuthFetch";
import "../../css/ManageProducts.css";
import "../../css/Form.css";

export default function ManageProducts() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");

  // ✅ styled confirm modal for delete
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
    setErr("");
    setLoading(true);
    try {
      const res = await AuthFetch("/api/products", { method: "GET" });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.message || "Failed to load products");
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (p) => {
    setEditing(p);
    setName(p.name || "");
    setPrice(String(p.price ?? ""));
    setStock(String(p.stock ?? ""));
    setDescription(p.description || "");
  };

  const cancelEdit = () => {
    setEditing(null);
    setName("");
    setPrice("");
    setStock("");
    setDescription("");
  };

  const saveEdit = async () => {
    if (!editing?._id) return;
    try {
      const payload = { name, price: Number(price), stock: Number(stock), description };
      const res = await AuthFetch(`/api/products/${editing._id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Update failed");

      cancelEdit();
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const doDelete = async (id) => {
    try {
      const res = await AuthFetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Delete failed");
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const del = (p) => {
    openConfirm({
      title: "Delete product?",
      message: `This will permanently delete "${p.name}".`,
      danger: true,
      onConfirm: async () => {
        closeConfirm();
        await doDelete(p._id);
      },
    });
  };

  return (
    <div className="mp-page">
      {/* ✅ Delete confirm modal */}
      {confirmBox.open && (
        <div className="mp-confirmOverlay" onMouseDown={closeConfirm}>
          <div className="mp-confirmCard" onMouseDown={(e) => e.stopPropagation()}>
            <div className="mp-confirmHead">
              <div className="mp-confirmTitle">{confirmBox.title}</div>
              <button className="mp-confirmX" onClick={closeConfirm}>✕</button>
            </div>

            <div className="mp-confirmBody">
              <div className="mp-confirmMsg">{confirmBox.message}</div>
            </div>

            <div className="mp-confirmFoot">
              <button className="mp-btn mp-btnSoft" onClick={closeConfirm}>Cancel</button>
              <button className="mp-btn mp-btnDanger" onClick={confirmBox.onConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Edit modal (your existing) */}
      {editing && (
        <div className="mp-modalOverlay" onMouseDown={cancelEdit}>
          <div className="mp-modalCard" onMouseDown={(e) => e.stopPropagation()}>
            <div className="mp-modalHead">
              <div className="mp-modalTitle">Edit: {editing.name}</div>
              <button className="mp-modalX" onClick={cancelEdit}>✕</button>
            </div>

            <div className="mp-modalBody">
              <div className="mp-modalGrid">
                <div className="mp-field">
                  <label className="mp-label">Name</label>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="mp-field">
                  <label className="mp-label">Price</label>
                  <input className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>

                <div className="mp-field">
                  <label className="mp-label">Stock</label>
                  <input className="input" value={stock} onChange={(e) => setStock(e.target.value)} />
                </div>

                <div className="mp-field mp-fieldWide">
                  <label className="mp-label">Description</label>
                  <input
                    className="input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mp-modalFoot">
              <button className="mp-btn mp-btnSoft" onClick={cancelEdit}>Cancel</button>
              <button className="mp-btn mp-btnPrimary" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="mp-header">
        <div>
          <h1 className="mp-title">Manage Products</h1>
          <p className="mp-subtitle">Edit price, stock, description, or delete products.</p>
        </div>

        <button className="mp-btn" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {err && <div className="mp-banner mp-bannerError">{err}</div>}
      {loading && <div className="mp-muted">Loading...</div>}

      <div className="mp-list">
        {items.map((p) => (
          <div className="mp-card" key={p._id}>
            <div className="mp-row">
              <div className="mp-main">
                <div className="mp-name">{p.name}</div>

                <div className="mp-meta">
                  <span className="mp-pill mp-pillPrice">Price: ${p.price}</span>
                  <span className="mp-pill mp-pillStock">Stock: {p.stock}</span>
                </div>
              </div>

              <div className="mp-rowActions">
                <button className="mp-btn mp-btnSoft" onClick={() => startEdit(p)}>Edit</button>
                <button className="mp-btn mp-btnDanger" onClick={() => del(p)}>Delete</button>
              </div>
            </div>

            {p.description && <div className="mp-desc">{p.description}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
