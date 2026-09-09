import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiCheck, FiMinus, FiPlus, FiShield, FiShoppingBag, FiTruck } from "react-icons/fi";
import AuthFetch from "../../services/AuthFetch";
import { useAuth } from "../../services/AuthContext";
import ProductImage from "../../components/ProductImage";
import "../../css/ProductDetails.css";

export default function ProductDetails() {
  const { id } = useParams(); const nav = useNavigate(); const { isAuth, role } = useAuth();
  const [product,setProduct]=useState(null); const [active,setActive]=useState(0); const [qty,setQty]=useState(1); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [pop,setPop]=useState(null);
  useEffect(()=>{(async()=>{try{const res=await AuthFetch(`/api/products/${id}`,{method:"GET",skip401Handler:true});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||"Product not found");setProduct(data);}catch(e){setError(e.message);}finally{setLoading(false);}})();},[id]);
  if(loading) return <div className="page-shell"><div className="details-loading"/></div>;
  if(error || !product) return <div className="page-shell"><div className="empty-state"><h3>{error || "Product not found"}</h3><button className="btn-ui secondary" onClick={()=>nav("/products")}>Back to shop</button></div></div>;
  const available=Math.max(0,Number(product.stock||0)-Number(product.reserved||0)); const images=product.images||[]; const main=images[active]?.url;
  const add=async()=>{if(!isAuth||role!=="customer")return nav("/login");setBusy(true);try{const res=await AuthFetch("/api/cart/add",{method:"POST",body:JSON.stringify({productId:product._id,qty})});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||"Could not add to cart");setPop({title:"Added to cart",msg:`${qty} × ${product.name} is reserved for you.`});}catch(e){setPop({title:"Could not add",msg:e.message});}finally{setBusy(false);}};
  return <main className="page-shell detail-page">
    {pop&&<div className="toast-overlay" onMouseDown={()=>setPop(null)}><div className="toast-card" onMouseDown={e=>e.stopPropagation()}><h3>{pop.title}</h3><p>{pop.msg}</p><div className="toast-actions"><button className="btn-ui secondary" onClick={()=>setPop(null)}>Continue shopping</button><button className="btn-ui" onClick={()=>nav("/cart")}>View cart</button></div></div></div>}
    <button className="back-link" onClick={()=>nav("/products")}><FiArrowLeft/> Back to shop</button>
    <div className="detail-grid">
      <section className="gallery-panel"><div className="main-product-image"><ProductImage src={main} alt={product.name}/></div>{images.length>1&&<div className="thumb-row">{images.map((img,i)=><button key={img.publicId||i} className={active===i?"active":""} onClick={()=>setActive(i)}><ProductImage src={img.url} alt={`${product.name} ${i+1}`}/></button>)}</div>}</section>
      <section className="detail-info"><span className="detail-category">{product.category||"General"}</span><h1>{product.name}</h1><div className="detail-price">${Number(product.price).toFixed(2)}</div><p className="detail-desc">{product.description||"No description provided yet."}</p>
        <div className="availability-line"><FiCheck/><span>{available>0?`${available} units ready to reserve`:"Currently sold out"}</span></div>
        {role!=="admin"&&<div className="buy-box"><div className="quantity-stepper"><button onClick={()=>setQty(q=>Math.max(1,q-1))}><FiMinus/></button><span>{qty}</span><button onClick={()=>setQty(q=>Math.min(Math.max(1,available),q+1))}><FiPlus/></button></div><button className="btn-ui accent detail-add" onClick={add} disabled={!available||busy}><FiShoppingBag/>{busy?"Adding…":available?"Add to cart":"Sold out"}</button></div>}
        <div className="detail-benefits"><div><FiShield/><span><strong>Reserved inventory</strong><small>Your cart temporarily holds stock.</small></span></div><div><FiTruck/><span><strong>Trackable order flow</strong><small>Follow pending, shipped and delivered states.</small></span></div></div>
      </section>
    </div>
  </main>;
}
