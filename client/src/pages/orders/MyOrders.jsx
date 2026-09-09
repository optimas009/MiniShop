import { useEffect, useState } from "react";
import { FiBox, FiCalendar, FiCreditCard, FiRefreshCw, FiRotateCcw, FiTruck } from "react-icons/fi";
import AuthFetch from "../../services/AuthFetch";
import ProductImage from "../../components/ProductImage";
import "../../css/MyOrders.css";

const pretty = value => value ? value.charAt(0).toUpperCase()+value.slice(1) : "Unknown";
const paymentStatusFor = order =>
  order?.paymentMethod === "cod" && order?.status === "delivered" && order?.paymentStatus === "pending"
    ? "paid"
    : order?.paymentStatus;

export default function MyOrders(){
 const [orders,setOrders]=useState([]); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(null); const [modal,setModal]=useState(null);
 const load=async()=>{setLoading(true);try{const res=await AuthFetch("/api/orders/my",{method:"GET"});const data=await res.json().catch(()=>[]);if(!res.ok)throw new Error(data?.message||"Could not load orders");setOrders(Array.isArray(data)?data:[]);}catch(e){setModal({title:"Orders unavailable",msg:e.message});setOrders([]);}finally{setLoading(false);}};
 useEffect(()=>{load();},[]);
 const cancel=async order=>{setBusy(order._id);try{const res=await AuthFetch(`/api/orders/${order._id}/cancel`,{method:"POST"});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data?.message||"Cancel failed");setModal({title:"Order cancelled",msg:data.paymentStatus==="refunded"?`Your payment was marked refunded. Refund reference: ${data.refundId||"N/A"}`:"The order was cancelled and reserved stock was restored."});await load();}catch(e){setModal({title:"Could not cancel",msg:e.message});}finally{setBusy(null);}};
 return <main className="page-shell orders-page">
  {modal&&<div className="toast-overlay" onMouseDown={()=>setModal(null)}><div className="toast-card" onMouseDown={e=>e.stopPropagation()}><h3>{modal.title}</h3><p>{modal.msg}</p><div className="toast-actions">{modal.confirm&&<button className="btn-ui secondary" onClick={()=>setModal(null)}>Keep order</button>}<button className={`btn-ui ${modal.confirm?"danger":""}`} onClick={()=>{const action=modal.confirm;if(action){setModal(null);action();}else setModal(null);}}>{modal.confirm?"Cancel order":"Done"}</button></div></div></div>}
  <div className="orders-heading"><div><p className="eyebrow">Purchase history</p><h1 className="page-title">My orders</h1><p className="page-copy">Track fulfillment, payment state and order contents in one timeline.</p></div><button className="btn-ui secondary" onClick={load} disabled={loading}><FiRefreshCw/> Refresh</button></div>
  {loading?<div className="order-skeleton"/>:orders.length?<div className="order-list">{orders.map(o=><article className="order-card" key={o._id}>
   <div className="order-head"><div><span className="order-number">Order #{o._id.slice(-8).toUpperCase()}</span><span className="order-date"><FiCalendar/>{new Date(o.createdAt).toLocaleString()}</span></div><div className="order-statuses"><span className={`order-pill status-${o.status}`}>{pretty(o.status)}</span><span className={`order-pill pay-${paymentStatusFor(o)}`}>{pretty(paymentStatusFor(o))}</span></div></div>
   <div className="order-progress"><div className={o.status!=="cancelled"?"done":""}><span><FiBox/></span><small>Placed</small></div><i/><div className={["shipped","delivered"].includes(o.status)?"done":""}><span><FiTruck/></span><small>Shipped</small></div><i/><div className={o.status==="delivered"?"done":""}><span>✓</span><small>Delivered</small></div></div>
   <div className="order-items">{(o.items||[]).map((it,i)=><div className="order-item" key={`${o._id}-${i}`}><div className="order-item-img"><ProductImage src={it.imageSnapshot} alt={it.nameSnapshot}/></div><div><strong>{it.nameSnapshot||"Product"}</strong><small>${Number(it.priceSnapshot).toFixed(2)} × {it.qty}</small></div><b>${(Number(it.priceSnapshot)*Number(it.qty)).toFixed(2)}</b></div>)}</div>
   <div className="order-foot"><div className="order-payment-meta">{o.shippingAddress?.city&&<span className="ship-destination">Ship to {o.shippingAddress.city}{o.shippingAddress.country?`, ${o.shippingAddress.country}`:""}</span>}<FiCreditCard/><span>{o.paymentMethod==="cod"?"Cash on delivery":`Card${o.paymentLast4?` ·•••• ${o.paymentLast4}`:""}`}</span>{o.refundId&&<span className="refund-ref"><FiRotateCcw/> {o.refundId}</span>}</div><div className="order-total"><span>Total</span><strong>${Number(o.total).toFixed(2)}</strong></div>{o.status==="pending"&&<button className="btn-ui danger" disabled={busy===o._id} onClick={()=>setModal({title:"Cancel this order?",msg:"Pending orders can be cancelled. Stock will be restored and paid card orders receive a simulated refund.",confirm:()=>cancel(o)})}>{busy===o._id?"Cancelling…":"Cancel order"}</button>}</div>
  </article>)}</div>:<div className="empty-state"><FiBox/><h3>No orders yet</h3><p>Your completed checkouts will appear here.</p></div>}
 </main>;
}
