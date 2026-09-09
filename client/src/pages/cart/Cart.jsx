import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiClock, FiMinus, FiPlus, FiShoppingBag, FiTrash2 } from "react-icons/fi";
import AuthFetch from "../../services/AuthFetch";
import ProductImage from "../../components/ProductImage";
import "../../css/Cart.css";

export default function Cart() {
  const nav=useNavigate();
  const [cart,setCart]=useState({items:[],expiresAt:null}); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(null); const [tick,setTick]=useState(Date.now()); const [pop,setPop]=useState(null);
  const load=async()=>{setLoading(true);try{const res=await AuthFetch("/api/cart",{method:"GET"});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data?.message||"Could not load cart");setCart({items:Array.isArray(data.items)?data.items:[],expiresAt:data.expiresAt||null,status:data.status});}catch(e){setPop({title:"Cart unavailable",msg:e.message});}finally{setLoading(false);}};
  useEffect(()=>{load();},[]); useEffect(()=>{const t=setInterval(()=>setTick(Date.now()),1000);return()=>clearInterval(t);},[]);
  const items=cart.items||[];
  const total=useMemo(()=>items.reduce((sum,it)=>sum+Number(it.priceSnapshot||0)*Number(it.qty||0),0),[items]);
  const remaining=cart.expiresAt?Math.max(0,new Date(cart.expiresAt).getTime()-tick):0; const mins=Math.floor(remaining/60000); const secs=Math.floor((remaining%60000)/1000);
  const change=async(it,delta)=>{if(!it.product?._id)return;setBusy(it.product._id);try{const endpoint=delta>0?"/api/cart/add":"/api/cart/remove";const res=await AuthFetch(endpoint,{method:"POST",body:JSON.stringify({productId:it.product._id,qty:1})});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||"Cart update failed");await load();}catch(e){setPop({title:"Could not update cart",msg:e.message});}finally{setBusy(null);}};
  const remove=async it=>{if(!it.product?._id)return;setBusy(it.product._id);try{const res=await AuthFetch("/api/cart/remove",{method:"POST",body:JSON.stringify({productId:it.product._id,qty:it.qty})});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||"Remove failed");await load();}catch(e){setPop({title:"Could not remove item",msg:e.message});}finally{setBusy(null);}};
  const clear=async()=>{try{await AuthFetch("/api/cart/clear",{method:"POST"});setPop(null);await load();}catch(e){setPop({title:"Could not clear cart",msg:e.message});}};

  return <main className="page-shell cart-page">
    {pop&&<div className="toast-overlay" onMouseDown={()=>setPop(null)}><div className="toast-card" onMouseDown={e=>e.stopPropagation()}><h3>{pop.title}</h3><p>{pop.msg}</p><div className="toast-actions"><button className="btn-ui secondary" onClick={()=>setPop(null)}>Close</button>{pop.title==="Clear cart?"&&<button className="btn-ui danger" onClick={clear}>Clear cart</button>}</div></div></div>}
    <div className="cart-heading"><div><p className="eyebrow">Your selection</p><h1 className="page-title">Shopping cart</h1><p className="page-copy">Inventory is reserved while your cart timer is active.</p></div>{items.length>0&&<div className="reservation-chip"><FiClock/><span><small>Reservation</small><strong>{mins}:{String(secs).padStart(2,"0")}</strong></span></div>}</div>
    {loading?<div className="cart-loading"/>:!items.length?<div className="empty-state"><FiShoppingBag/><h3>Your cart is empty</h3><p>Explore the collection and add something you like.</p><button className="btn-ui accent" onClick={()=>nav("/products")}>Browse products</button></div>:<div className="cart-layout">
      <section className="cart-items">{items.map(it=>{const p=it.product; if(!p)return null; const available=Math.max(0,Number(p.stock||0)-Number(p.reserved||0));return <article className="cart-item" key={p._id}><button className="cart-item-image" onClick={()=>nav(`/products/${p._id}`)}><ProductImage src={p.images?.[0]?.url} alt={p.name}/></button><div className="cart-item-info"><span>{p.category||"Product"}</span><h3 onClick={()=>nav(`/products/${p._id}`)}>{p.name}</h3><p>${Number(it.priceSnapshot).toFixed(2)} each</p></div><div className="cart-qty"><button disabled={busy===p._id} onClick={()=>change(it,-1)}><FiMinus/></button><strong>{it.qty}</strong><button disabled={busy===p._id||available<=0} onClick={()=>change(it,1)}><FiPlus/></button></div><strong className="cart-line-total">${(Number(it.priceSnapshot)*Number(it.qty)).toFixed(2)}</strong><button className="cart-trash" disabled={busy===p._id} onClick={()=>remove(it)}><FiTrash2/></button></article>})}</section>
      <aside className="cart-summary"><p className="eyebrow">Order summary</p><div className="summary-row"><span>Items</span><span>{items.reduce((n,it)=>n+Number(it.qty||0),0)}</span></div><div className="summary-row"><span>Subtotal</span><span>${total.toFixed(2)}</span></div><div className="summary-row"><span>Shipping</span><span>Calculated later</span></div><div className="summary-total"><span>Total</span><strong>${total.toFixed(2)}</strong></div><button className="btn-ui accent checkout-main" onClick={()=>nav("/checkout")}>Continue to checkout <FiArrowRight/></button><button className="clear-cart-link" onClick={()=>setPop({title:"Clear cart?",msg:"All reserved items will be released back to inventory."})}>Clear cart</button></aside>
    </div>}
  </main>;
}
