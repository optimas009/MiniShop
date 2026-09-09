import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiSearch, FiShoppingBag, FiSliders, FiStar } from "react-icons/fi";
import AuthFetch from "../../services/AuthFetch";
import { useAuth } from "../../services/AuthContext";
import ProductImage from "../../components/ProductImage";
import "../../css/Products.css";

export default function Products() {
  const nav = useNavigate();
  const { loading: authLoading, isAuth, role } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [busyId, setBusyId] = useState(null);
  const [pop, setPop] = useState(null);

  const availableOf = p => Math.max(0, Number(p?.stock || 0) - Number(p?.reserved || 0));

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await AuthFetch("/api/products", { method: "GET", skip401Handler: true });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.message || "Could not load products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); setProducts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const categories = useMemo(() => ["All", ...new Set(products.map(p => p.category || "General"))], [products]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter(p => {
      const matchesCategory = category === "All" || (p.category || "General") === category;
      const haystack = `${p.name} ${p.description || ""} ${p.category || ""}`.toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
    return [...list].sort((a,b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      return Number(b.featured) - Number(a.featured);
    });
  }, [products, query, category, sort]);

  const addOne = async (p) => {
    if (!isAuth || role !== "customer") return nav("/login");
    if (availableOf(p) < 1) return setPop({ title: "Sold out", msg: "This product is currently unavailable." });
    setBusyId(p._id);
    try {
      const res = await AuthFetch("/api/cart/add", { method: "POST", body: JSON.stringify({ productId: p._id, qty: 1 }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Could not add to cart");
      setPop({ title: "Added to cart", msg: `${p.name} is reserved in your cart.` });
      await load();
    } catch (e) { setPop({ title: "Could not add item", msg: e.message }); }
    finally { setBusyId(null); }
  };

  if (authLoading) return null;

  return <>
    {pop && <div className="toast-overlay" onMouseDown={() => setPop(null)}><div className="toast-card" onMouseDown={e=>e.stopPropagation()}><h3>{pop.title}</h3><p>{pop.msg}</p><div className="toast-actions"><button className="btn-ui" onClick={() => setPop(null)}>Done</button></div></div></div>}

    <section className="shop-hero">
      <div className="shell shop-hero-grid">
        <div className="shop-hero-copy">
          <p className="eyebrow">Curated essentials · simple checkout</p>
          <h1 className="display">Better things,<br/>less noise.</h1>
          <p>Discover a focused collection with live inventory, protected cart reservations and clean order tracking.</p>
          <div className="hero-actions"><a href="#catalog" className="btn-ui accent">Shop collection <FiArrowRight /></a>{isAuth && role === "admin" && <button className="btn-ui secondary" onClick={() => nav("/admin/manage-products")}>Manage catalog</button>}</div>
        </div>
        <div className="hero-card-stack">
          <div className="hero-card primary"><span>New storefront</span><strong>Cloud-ready<br/>product media</strong><div className="hero-orb" /></div>
          <div className="hero-card mini"><FiStar/><span>Fast, responsive, intentional.</span></div>
        </div>
      </div>
    </section>

    <main className="page-shell" id="catalog">
      <div className="catalog-heading"><div><p className="eyebrow">The collection</p><h2 className="page-title">Shop all products</h2></div><span className="catalog-count">{filtered.length} item{filtered.length === 1 ? "" : "s"}</span></div>
      <div className="catalog-toolbar">
        <div className="search-box"><FiSearch/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products" /></div>
        <div className="filter-box"><FiSliders/><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
        <select className="sort-select" value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured first</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select>
      </div>

      {error && <div className="catalog-error">{error} <button onClick={load}>Try again</button></div>}
      {loading ? <div className="product-grid">{Array.from({length:8}).map((_,i)=><div className="product-skeleton" key={i}/>)}</div> : filtered.length ? <div className="product-grid">
        {filtered.map(p => {
          const available = availableOf(p); const image = p.images?.[0]?.url;
          return <article className="product-card" key={p._id}>
            <button className="product-media" onClick={() => nav(`/products/${p._id}`)} aria-label={`Open ${p.name}`}>
              <ProductImage src={image} alt={p.name} />
              {p.featured && <span className="featured-pill"><FiStar/> Featured</span>}
              <span className={`stock-dot ${available ? "in" : "out"}`}>{available ? `${available} available` : "Sold out"}</span>
            </button>
            <div className="product-card-body">
              <div className="product-meta-line"><span>{p.category || "General"}</span><strong>${Number(p.price).toFixed(2)}</strong></div>
              <h3 onClick={() => nav(`/products/${p._id}`)}>{p.name}</h3>
              <div className="product-description-wrap">
                <p>{p.description || "A carefully selected MiniShop product."}</p>
                {(p.description || "").trim().length > 92 && (
                  <button className="product-see-more" onClick={() => nav(`/products/${p._id}`)}>See more <FiArrowRight/></button>
                )}
              </div>
              <div className="product-card-actions"><button className="product-details-link" onClick={() => nav(`/products/${p._id}`)}>View details <FiArrowRight/></button>{role !== "admin" && <button className="quick-add" disabled={!available || busyId===p._id} onClick={()=>addOne(p)}><FiShoppingBag/>{busyId===p._id ? "Adding" : "Add"}</button>}</div>
            </div>
          </article>;
        })}
      </div> : <div className="empty-state"><h3>No matching products</h3><p>Try a different search or category.</p><button className="btn-ui secondary" onClick={()=>{setQuery("");setCategory("All");}}>Clear filters</button></div>}
    </main>
  </>;
}
