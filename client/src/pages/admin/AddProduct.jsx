import { useState } from "react";
import AuthFetch from "../../services/AuthFetch";
import "../../css/AddProduct.css";
import "../../css/Form.css";

export default function AddProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    setLoading(true);

    try {
      const payload = {
        name,
        price: Number(price),
        stock: Number(stock),
        description,
      };

      const res = await AuthFetch("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to add product");

      setMsg("Product added successfully!");
      setName("");
      setPrice("");
      setStock("");
      setDescription("");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-page">
      <h1 className="add-title">Add Product (Admin)</h1>

      <form className="form" onSubmit={submit}>
        <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
        <input className="input" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />
        <input className="input" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

        {err && <div className="err">{err}</div>}
        {msg && <div className="ok">{msg}</div>}

        <button className="btn" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
