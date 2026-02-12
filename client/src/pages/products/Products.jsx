import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthFetch from "../../services/AuthFetch";
import { useAuth } from "../../services/AuthContext";
import "../../css/Products.css";

export default function Products() {
  const nav = useNavigate();
  const { loading: authLoading, isAuth, role } = useAuth();

  const [products, setProducts] = useState([]);
  const [qtyMap, setQtyMap] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [err, setErr] = useState("");

  //  popup modal (no alerts)
  const [pop, setPop] = useState({ open: false, title: "", msg: "", type: "info" });
  const closePop = () => setPop({ open: false, title: "", msg: "", type: "info" });

  const availableOf = (p) =>
    Math.max(0, (Number(p?.stock) || 0) - (Number(p?.reserved) || 0));

  const clampQty = (val, maxAvail) => {
    const n = parseInt(val, 10);
    if (Number.isNaN(n)) return 1;
    const max = Math.max(1, Number(maxAvail) || 1);
    return Math.min(Math.max(1, n), max);
  };

  const loadProducts = async () => {
    setErr("");
    setPageLoading(true);
    try {
      const res = await AuthFetch("/api/products", { method: "GET", skip401Handler: true });
      const data = await res.json().catch(() => []);
      const list = Array.isArray(data) ? data : [];
      setProducts(list);
    } catch (e) {
      setProducts([]);
      setErr(e.message || "Failed to load products");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    setQtyMap((prev) => {
      const next = { ...prev };
      for (const p of products) {
        const avail = availableOf(p);
        const current = next[p._id];
        if (current == null) continue;
        next[p._id] = clampQty(current, avail <= 0 ? 1 : avail);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const onQtyChange = (productId, raw, avail) => {
    setQtyMap((prev) => ({
      ...prev,
      [productId]: clampQty(raw, avail <= 0 ? 1 : avail),
    }));
  };

  const addToCart = async (p) => {
    const avail = availableOf(p);

    if (!isAuth || role !== "customer") {
      nav("/login");
      return;
    }
    if (avail <= 0) {
      setPop({ open: true, title: "Out of stock", msg: "This item is not available now.", type: "error" });
      return;
    }

    const qty = clampQty(qtyMap[p._id] ?? 1, avail);

    setBusyId(p._id);
    try {
      const res = await AuthFetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p._id, qty }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Add to cart failed");

      await loadProducts();
      setPop({ open: true, title: "Success", msg: "Added to cart ", type: "success" });
    } catch (e) {
      setPop({ open: true, title: "Error", msg: e.message, type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) return null;

  return (
    <div className="p-page">
      {/*  Modal popup */}
      {pop.open && (
        <div className="p-modalOverlay" onMouseDown={closePop}>
          <div className="p-modalCard" onMouseDown={(e) => e.stopPropagation()}>
            <div className="p-modalHead">
              <div className="p-modalTitle">{pop.title}</div>
              <button className="p-modalX" onClick={closePop} aria-label="Close">✕</button>
            </div>
            <div className="p-modalBody">
              <div className={`p-pop p-pop-${pop.type}`}>{pop.msg}</div>
            </div>
            <div className="p-modalFoot">
              <button className="p-btn p-btnPrimary" onClick={closePop}>OK</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-head">
        <div>
          <h1 className="p-title">Products</h1>
          <p className="p-subtitle">Browse items and purchase when available.</p>
        </div>

        <div className="p-headActions">
          <button className="p-btn" onClick={loadProducts} disabled={pageLoading}>
            {pageLoading ? "Refreshing..." : "Refresh"}
          </button>

          {isAuth && role === "admin" && (
            <button className="p-btn p-btnPrimary" onClick={() => nav("/admin/manage-products")}>
              Manage Products
            </button>
          )}
        </div>
      </div>

      {err && <div className="p-banner p-bannerError">{err}</div>}
      {pageLoading && <div className="p-muted">Loading...</div>}

      <div className="p-grid">
        {products.map((p) => {
          const avail = availableOf(p);
          const qty = qtyMap[p._id] ?? 1;

          const availClass = avail === 0 ? "danger" : avail <= 3 ? "warn" : "success";

          return (
            <div key={p._id} className="p-card">
              <div className="p-top">
                <div className="p-main">
                  <div className="p-name">{p.name}</div>
                  {p.description && <div className="p-desc">{p.description}</div>}

                  <div className="p-badges">
                    <span className="p-badge stock">Stock: {p.stock ?? 0}</span>
                    <span className="p-badge reserved">Reserved: {p.reserved ?? 0}</span>
                    <span className={`p-badge available ${availClass}`}>Available: {avail}</span>
                  </div>
                </div>

                <div className="p-price">${p.price}</div>
              </div>

              {/* CUSTOMER */}
              {isAuth && role === "customer" && (
                <div className="p-actions">
                  <div className="p-qtyWrap">
                    <span className="p-qtyLabel">Qty</span>
                    <input
                      type="number"
                      min={1}
                      max={avail <= 0 ? 1 : avail}
                      value={qty}
                      disabled={avail <= 0 || busyId === p._id}
                      onChange={(e) => onQtyChange(p._id, e.target.value, avail)}
                      onBlur={(e) => onQtyChange(p._id, e.target.value, avail)}
                      className="p-qty"
                    />
                  </div>

                  <button
                    className="p-btn p-btnPrimary p-wide"
                    disabled={avail <= 0 || busyId === p._id}
                    onClick={() => addToCart(p)}
                  >
                    {avail <= 0 ? "Out of stock" : busyId === p._id ? "Adding..." : "Add to cart"}
                  </button>
                </div>
              )}

              {/* PUBLIC */}
              {!isAuth && (
                <div className="p-actions">
                  <button className="p-btn p-btnPrimary p-wide" onClick={() => nav("/login")}>
                    Login to buy
                  </button>
                </div>
              )}

              {/* ADMIN */}
              {isAuth && role === "admin" && <div className="p-adminNote">Admin view</div>}
            </div>
          );
        })}

        {!pageLoading && products.length === 0 && !err && (
          <div className="p-empty">No products found.</div>
        )}
      </div>
    </div>
  );
}
