import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiCreditCard, FiLock, FiMapPin, FiPackage } from "react-icons/fi";
import AuthFetch from "../../services/AuthFetch";
import ProductImage from "../../components/ProductImage";
import { onlyDigits, luhnCheck, isValidCvv, isExpiryNotPast, parseExpiry, formatCardNumber } from "../utils/validators";
import "../../css/Checkout.css";

export default function Checkout(){
 const nav=useNavigate();
 const [cart,setCart]=useState({items:[]});
 const [method,setMethod]=useState("card_sim");
 const [shipping,setShipping]=useState({fullName:"",phone:"",addressLine1:"",addressLine2:"",city:"",postalCode:"",country:"Bangladesh"});
 const [card,setCard]=useState({name:"",number:"",exp:"",cvv:""});
 const [errors,setErrors]=useState({}); const [loading,setLoading]=useState(false); const [pageLoading,setPageLoading]=useState(true); const [pop,setPop]=useState(null);

 useEffect(()=>{(async()=>{try{const res=await AuthFetch("/api/cart",{method:"GET"});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||"Could not load cart");if(!data.items?.length){nav("/cart",{replace:true});return;}setCart(data);}catch(e){setPop({title:"Checkout unavailable",msg:e.message,error:true});}finally{setPageLoading(false);}})();},[nav]);
 const total=useMemo(()=>(cart.items||[]).reduce((s,it)=>s+Number(it.priceSnapshot||0)*Number(it.qty||0),0),[cart]);
 const setCardField=(k,v)=>setCard(prev=>({...prev,[k]:v}));
 const setShippingField=(k,v)=>setShipping(prev=>({...prev,[k]:v}));

 const validate=()=>{
   const next={};
   if(!shipping.fullName.trim())next.fullName="Recipient name is required";
   if(!shipping.phone.trim())next.phone="Phone number is required";
   if(!shipping.addressLine1.trim())next.addressLine1="Street address is required";
   if(!shipping.city.trim())next.city="City is required";
   if(!shipping.country.trim())next.country="Country is required";

   if(method==="card_sim"){
     const digits=onlyDigits(card.number);
     if(!card.name.trim())next.cardName="Name is required";
     if(!digits)next.number="Card number is required";
     else if(digits.length<13||digits.length>19||!luhnCheck(digits))next.number="Enter a valid card number";
     const parsed=parseExpiry(card.exp);
     if(!parsed.ok)next.exp=parsed.reason;else{const chk=isExpiryNotPast(card.exp);if(!chk.ok)next.exp=chk.reason;}
     if(!isValidCvv(card.cvv))next.cvv="Use a 3 or 4 digit CVV";
   }
   setErrors(next); return Object.keys(next).length===0;
 };

 const submit=async e=>{e.preventDefault();setPop(null);if(!validate())return;setLoading(true);try{let paymentId=null,paymentLast4=null;if(method==="card_sim"){const payRes=await AuthFetch("/api/payments/simulate",{method:"POST",body:JSON.stringify({cardNumber:onlyDigits(card.number)})});const pay=await payRes.json().catch(()=>({}));if(!payRes.ok)throw new Error(pay.message||"Payment simulation failed");paymentId=pay.paymentId;paymentLast4=pay.last4;}const res=await AuthFetch("/api/orders/checkout",{method:"POST",body:JSON.stringify({paymentMethod:method,paymentId,paymentLast4,shippingAddress:shipping})});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||"Checkout failed");setPop({title:"Order placed",msg:method==="cod"?"Your order is confirmed. Payment will be collected on delivery.":"Payment approved and your order is confirmed.",success:true});}catch(e2){setPop({title:"Checkout failed",msg:e2.message,error:true});}finally{setLoading(false);}};
 if(pageLoading)return <div className="page-shell"><div className="checkout-loading"/></div>;

 return <main className="page-shell checkout-page">
  {pop&&<div className="toast-overlay"><div className="toast-card"><h3>{pop.title}</h3><p>{pop.msg}</p><div className="toast-actions">{pop.success?<button className="btn-ui accent" onClick={()=>nav("/orders",{replace:true})}>View my orders</button>:<button className="btn-ui" onClick={()=>setPop(null)}>Try again</button>}</div></div></div>}
  <button className="back-link" onClick={()=>nav("/cart")}><FiArrowLeft/> Back to cart</button><div className="checkout-heading"><p className="eyebrow">Secure checkout</p><h1 className="page-title">Finish your order</h1></div>
  <div className="checkout-layout"><form className="checkout-form" onSubmit={submit}>
    <section className="checkout-section"><div className="checkout-section-head"><span>01</span><div><h2>Delivery details</h2><p>Where this order should be delivered.</p></div></div><div className="checkout-fields">
      <label><span className="field-label">Full name</span><input className={`field-control ${errors.fullName?"invalid":""}`} value={shipping.fullName} onChange={e=>setShippingField("fullName",e.target.value)} placeholder="Recipient name"/>{errors.fullName&&<small className="field-error">{errors.fullName}</small>}</label>
      <label><span className="field-label">Phone</span><input className={`field-control ${errors.phone?"invalid":""}`} value={shipping.phone} onChange={e=>setShippingField("phone",e.target.value)} placeholder="Phone number"/>{errors.phone&&<small className="field-error">{errors.phone}</small>}</label>
      <label className="field-wide"><span className="field-label">Street address</span><input className={`field-control ${errors.addressLine1?"invalid":""}`} value={shipping.addressLine1} onChange={e=>setShippingField("addressLine1",e.target.value)} placeholder="House, road, area"/>{errors.addressLine1&&<small className="field-error">{errors.addressLine1}</small>}</label>
      <label className="field-wide"><span className="field-label">Apartment / additional address <em>optional</em></span><input className="field-control" value={shipping.addressLine2} onChange={e=>setShippingField("addressLine2",e.target.value)} placeholder="Apartment, floor, landmark"/></label>
      <label><span className="field-label">City</span><input className={`field-control ${errors.city?"invalid":""}`} value={shipping.city} onChange={e=>setShippingField("city",e.target.value)} placeholder="Dhaka"/>{errors.city&&<small className="field-error">{errors.city}</small>}</label>
      <label><span className="field-label">Postal code</span><input className="field-control" value={shipping.postalCode} onChange={e=>setShippingField("postalCode",e.target.value)} placeholder="1207"/></label>
      <label className="field-wide"><span className="field-label">Country</span><input className={`field-control ${errors.country?"invalid":""}`} value={shipping.country} onChange={e=>setShippingField("country",e.target.value)} placeholder="Bangladesh"/>{errors.country&&<small className="field-error">{errors.country}</small>}</label>
    </div><div className="secure-note"><FiMapPin/> Delivery details are stored with the order snapshot.</div></section>

    <section className="checkout-section"><div className="checkout-section-head"><span>02</span><div><h2>Payment method</h2><p>Choose how you want to pay.</p></div></div><div className="payment-options"><button type="button" className={method==="card_sim"?"active":""} onClick={()=>setMethod("card_sim")}><FiCreditCard/><span><strong>Card simulation</strong><small>Validated securely on the server</small></span></button><button type="button" className={method==="cod"?"active":""} onClick={()=>setMethod("cod")}><FiPackage/><span><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span></button></div></section>

    {method==="card_sim"&&<section className="checkout-section"><div className="checkout-section-head"><span>03</span><div><h2>Card details</h2><p>Use 4242 4242 4242 4242 for the demo.</p></div></div><div className="checkout-fields"><label className="field-wide"><span className="field-label">Name on card</span><input className={`field-control ${errors.cardName?"invalid":""}`} value={card.name} onChange={e=>setCardField("name",e.target.value)} placeholder="Full name"/>{errors.cardName&&<small className="field-error">{errors.cardName}</small>}</label><label className="field-wide"><span className="field-label">Card number</span><input className={`field-control ${errors.number?"invalid":""}`} value={card.number} onChange={e=>setCardField("number",formatCardNumber(e.target.value))} placeholder="4242 4242 4242 4242" inputMode="numeric"/>{errors.number&&<small className="field-error">{errors.number}</small>}</label><label><span className="field-label">Expiry</span><input className={`field-control ${errors.exp?"invalid":""}`} value={card.exp} onChange={e=>{let x=e.target.value.replace(/[^\d/]/g,"");if(x.length===2&&!x.includes("/"))x+="/";setCardField("exp",x.slice(0,5));}} placeholder="12/28"/>{errors.exp&&<small className="field-error">{errors.exp}</small>}</label><label><span className="field-label">CVV</span><input className={`field-control ${errors.cvv?"invalid":""}`} value={card.cvv} onChange={e=>setCardField("cvv",e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="123" inputMode="numeric"/>{errors.cvv&&<small className="field-error">{errors.cvv}</small>}</label></div><div className="secure-note"><FiLock/> Demo payment data is only validated for this simulation and is not stored.</div></section>}
    {method==="cod"&&<section className="checkout-section cod-note"><FiCheckCircle/><div><strong>Cash on delivery selected</strong><p>Your order will be created with payment status “Pending”.</p></div></section>}
    <button className="btn-ui accent place-order" disabled={loading}>{loading?"Placing order…":`Place order · $${total.toFixed(2)}`}</button>
  </form>
  <aside className="checkout-summary"><p className="eyebrow">Your order</p><div className="checkout-summary-items">{(cart.items||[]).map(it=><div className="checkout-summary-item" key={it.product?._id}><div className="checkout-mini-img"><ProductImage src={it.product?.images?.[0]?.url} alt={it.product?.name}/><span>{it.qty}</span></div><div><strong>{it.product?.name||"Product"}</strong><small>${Number(it.priceSnapshot).toFixed(2)}</small></div><b>${(Number(it.priceSnapshot)*Number(it.qty)).toFixed(2)}</b></div>)}</div><div className="summary-total"><span>Total</span><strong>${total.toFixed(2)}</strong></div></aside></div>
 </main>;
}
