import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiImage, FiPlus, FiStar, FiUploadCloud, FiX } from "react-icons/fi";
import AuthFetch from "../../services/AuthFetch";
import "../../css/AddProduct.css";

const MAX_IMAGES = 6;

export default function AddProduct() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", price: "", stock: "", category: "General", description: "", featured: false });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const previews = useMemo(() => files.map(file => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach(p => URL.revokeObjectURL(p.url)), [previews]);

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const chooseFiles = (selected) => {
    const incoming = Array.from(selected || []).filter(f => f.type.startsWith("image/"));
    setFiles(prev => [...prev, ...incoming].slice(0, MAX_IMAGES));
  };

  const submit = async (e) => {
    e.preventDefault();
    setNotice(null);
    if (!form.name.trim()) return setNotice({ type: "error", text: "Product name is required." });
    if (Number(form.price) < 0 || form.price === "") return setNotice({ type: "error", text: "Enter a valid price." });
    if (Number(form.stock) < 0 || form.stock === "") return setNotice({ type: "error", text: "Enter a valid stock quantity." });

    setLoading(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, String(value)));
      files.forEach(file => body.append("images", file));

      const res = await AuthFetch("/api/products", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Could not create product");

      setNotice({ type: "success", text: "Product created and ready in the storefront." });
      setForm({ name: "", price: "", stock: "", category: "General", description: "", featured: false });
      setFiles([]);
    } catch (e2) {
      setNotice({ type: "error", text: e2.message });
    } finally { setLoading(false); }
  };

  return <main className="page-shell add-product-page">
    <button className="back-link" onClick={() => nav("/admin/manage-products")}><FiArrowLeft /> Catalog</button>
    <div className="admin-page-heading"><div><p className="eyebrow">Admin · catalog</p><h1 className="page-title">Create a product</h1><p className="page-copy">Add inventory details and up to six product photos. Images upload directly to Cloudinary through the server.</p></div></div>

    <form className="product-editor" onSubmit={submit}>
      <section className="editor-card editor-fields">
        <div className="editor-card-head"><span>01</span><div><h2>Product details</h2><p>What customers will see in the catalog.</p></div></div>
        <div className="editor-form-grid">
          <label className="field-wide"><span className="field-label">Product name</span><input className="field-control" value={form.name} onChange={e=>setField("name",e.target.value)} placeholder="e.g. Minimal desk lamp" /></label>
          <label><span className="field-label">Price (USD)</span><input className="field-control" type="number" min="0" step="0.01" value={form.price} onChange={e=>setField("price",e.target.value)} placeholder="49.00" /></label>
          <label><span className="field-label">Opening stock</span><input className="field-control" type="number" min="0" step="1" value={form.stock} onChange={e=>setField("stock",e.target.value)} placeholder="25" /></label>
          <label className="field-wide"><span className="field-label">Category</span><input className="field-control" value={form.category} onChange={e=>setField("category",e.target.value)} placeholder="Home, Tech, Fashion…" /></label>
          <label className="field-wide"><span className="field-label">Description</span><textarea className="field-control" value={form.description} onChange={e=>setField("description",e.target.value)} placeholder="Describe what makes this product useful or different." /></label>
          <label className="featured-toggle field-wide"><input type="checkbox" checked={form.featured} onChange={e=>setField("featured",e.target.checked)} /><span className="toggle-ui"><FiStar /></span><span><strong>Feature this product</strong><small>Featured products appear first in the storefront.</small></span></label>
        </div>
      </section>

      <section className="editor-card">
        <div className="editor-card-head"><span>02</span><div><h2>Product photography</h2><p>The first image becomes the primary catalog image.</p></div></div>
        <label className="image-dropzone">
          <input type="file" accept="image/*" multiple onChange={e=>chooseFiles(e.target.files)} disabled={files.length>=MAX_IMAGES} />
          <FiUploadCloud /><strong>Choose product images</strong><span>JPG, PNG, WEBP · max 5 MB each · {files.length}/{MAX_IMAGES}</span>
        </label>
        {previews.length ? <div className="image-preview-grid">{previews.map((p,i)=><div className="image-preview" key={`${p.file.name}-${i}`}><img src={p.url} alt="Preview"/><span>{i===0?"Primary":`Image ${i+1}`}</span><button type="button" onClick={()=>setFiles(prev=>prev.filter((_,idx)=>idx!==i))} aria-label="Remove image"><FiX/></button></div>)}</div> : <div className="image-empty"><FiImage/><span>No photos selected yet.</span></div>}
      </section>

      <div className="editor-submit-bar">
        <div>{notice && <span className={`editor-notice ${notice.type}`}>{notice.text}</span>}</div>
        <button className="btn-ui accent" disabled={loading}><FiPlus /> {loading ? "Uploading & saving…" : "Create product"}</button>
      </div>
    </form>
  </main>;
}
