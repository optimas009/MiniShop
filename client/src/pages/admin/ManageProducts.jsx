import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiImage, FiPlus, FiRefreshCw, FiSearch, FiStar, FiTrash2, FiUploadCloud, FiX } from "react-icons/fi";
import AuthFetch from "../../services/AuthFetch";
import ProductImage from "../../components/ProductImage";
import "../../css/ManageProducts.css";

export default function ManageProducts() {
  const nav = useNavigate();
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true); const [err,setErr]=useState(""); const [query,setQuery]=useState("");
  const [editing,setEditing]=useState(null); const [editForm,setEditForm]=useState({}); const [newFiles,setNewFiles]=useState([]); const [removeIds,setRemoveIds]=useState([]); const [saving,setSaving]=useState(false); const [confirmDelete,setConfirmDelete]=useState(null); const [notice,setNotice]=useState(null);

  const load=async()=>{setLoading(true);setErr("");try{const res=await AuthFetch("/api/products",{method:"GET"});const data=await res.json().catch(()=>[]);if(!res.ok)throw new Error(data?.message||"Failed to load products");setItems(Array.isArray(data)?data:[]);}catch(e){setErr(e.message);}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);
  const filtered=useMemo(()=>{const q=query.toLowerCase().trim();return items.filter(p=>!q||`${p.name} ${p.category||""}`.toLowerCase().includes(q));},[items,query]);
  const previews=useMemo(()=>newFiles.map(file=>({file,url:URL.createObjectURL(file)})),[newFiles]);
  useEffect(()=>()=>previews.forEach(p=>URL.revokeObjectURL(p.url)),[previews]);

  const startEdit=p=>{setEditing(p);setEditForm({name:p.name||"",price:String(p.price??""),stock:String(p.stock??""),category:p.category||"General",description:p.description||"",featured:Boolean(p.featured)});setNewFiles([]);setRemoveIds([]);setNotice(null);};
  const closeEdit=()=>{setEditing(null);setNewFiles([]);setRemoveIds([]);setNotice(null);};
  const setField=(k,v)=>setEditForm(prev=>({...prev,[k]:v}));
  const addFiles=selected=>setNewFiles(prev=>[...prev,...Array.from(selected||[]).filter(f=>f.type.startsWith("image/"))].slice(0,Math.max(0,6-((editing?.images?.length||0)-removeIds.length))));
  const toggleRemove=id=>setRemoveIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);

  const save=async()=>{if(!editing)return;setSaving(true);setNotice(null);try{const body=new FormData();Object.entries(editForm).forEach(([k,v])=>body.append(k,String(v)));body.append("removeImagePublicIds",JSON.stringify(removeIds));newFiles.forEach(f=>body.append("images",f));const res=await AuthFetch(`/api/products/${editing._id}`,{method:"PUT",body});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data?.message||"Update failed");closeEdit();await load();}catch(e){setNotice({type:"error",text:e.message});}finally{setSaving(false);}};
  const remove=async p=>{try{const res=await AuthFetch(`/api/products/${p._id}`,{method:"DELETE"});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data?.message||"Delete failed");setConfirmDelete(null);await load();}catch(e){setConfirmDelete(null);setErr(e.message);}};

  return <main className="page-shell manage-page">
    {confirmDelete&&<div className="toast-overlay" onMouseDown={()=>setConfirmDelete(null)}><div className="toast-card" onMouseDown={e=>e.stopPropagation()}><h3>Delete product?</h3><p>“{confirmDelete.name}” will be removed from the catalog and its Cloudinary product images will be deleted.</p><div className="toast-actions"><button className="btn-ui secondary" onClick={()=>setConfirmDelete(null)}>Keep it</button><button className="btn-ui danger" onClick={()=>remove(confirmDelete)}>Delete</button></div></div></div>}

    {editing&&<div className="edit-overlay"><div className="edit-drawer">
      <div className="edit-drawer-head"><div><p className="eyebrow">Edit product</p><h2>{editing.name}</h2></div><button className="btn-ui icon secondary" onClick={closeEdit}><FiX/></button></div>
      <div className="edit-scroll">
        <div className="edit-grid"><label className="field-wide"><span className="field-label">Name</span><input className="field-control" value={editForm.name} onChange={e=>setField("name",e.target.value)}/></label><label><span className="field-label">Price</span><input className="field-control" type="number" min="0" step=".01" value={editForm.price} onChange={e=>setField("price",e.target.value)}/></label><label><span className="field-label">Stock</span><input className="field-control" type="number" min="0" value={editForm.stock} onChange={e=>setField("stock",e.target.value)}/></label><label className="field-wide"><span className="field-label">Category</span><input className="field-control" value={editForm.category} onChange={e=>setField("category",e.target.value)}/></label><label className="field-wide"><span className="field-label">Description</span><textarea className="field-control" value={editForm.description} onChange={e=>setField("description",e.target.value)}/></label><label className="featured-toggle field-wide"><input type="checkbox" checked={editForm.featured} onChange={e=>setField("featured",e.target.checked)}/><span className="toggle-ui"><FiStar/></span><span><strong>Featured</strong><small>Keep this product at the front of the collection.</small></span></label></div>
        <div className="edit-media-section"><div className="media-section-title"><div><strong>Product images</strong><small>Click an existing image to mark it for removal.</small></div><label className="mini-upload"><FiUploadCloud/> Add images<input type="file" accept="image/*" multiple onChange={e=>addFiles(e.target.files)}/></label></div>
          <div className="edit-images">{(editing.images||[]).map((img,i)=><button type="button" className={removeIds.includes(img.publicId)?"remove-marked":""} key={img.publicId} onClick={()=>toggleRemove(img.publicId)}><ProductImage src={img.url} alt={editing.name}/><span>{removeIds.includes(img.publicId)?"Will remove":i===0?"Primary":"Existing"}</span></button>)}{previews.map((p,i)=><div className="new-image" key={`${p.file.name}-${i}`}><img src={p.url} alt="New preview"/><span>New</span><button onClick={()=>setNewFiles(prev=>prev.filter((_,idx)=>idx!==i))}><FiX/></button></div>)}</div>
        </div>
        {notice&&<div className={`editor-notice ${notice.type}`}>{notice.text}</div>}
      </div>
      <div className="edit-drawer-foot"><button className="btn-ui secondary" onClick={closeEdit}>Cancel</button><button className="btn-ui accent" onClick={save} disabled={saving}>{saving?"Saving…":"Save changes"}</button></div>
    </div></div>}

    <div className="manage-heading"><div><p className="eyebrow">Admin · inventory</p><h1 className="page-title">Product catalog</h1><p className="page-copy">Manage pricing, stock, product media and featured placement from one place.</p></div><button className="btn-ui accent" onClick={()=>nav("/admin/add-product")}><FiPlus/> Add product</button></div>
    <div className="manage-stats"><div><strong>{items.length}</strong><span>Total products</span></div><div><strong>{items.reduce((n,p)=>n+Number(p.stock||0),0)}</strong><span>Units in stock</span></div><div><strong>{items.filter(p=>Math.max(0,p.stock-p.reserved)<=0).length}</strong><span>Sold out</span></div><div><strong>{items.filter(p=>p.featured).length}</strong><span>Featured</span></div></div>
    <div className="manage-toolbar"><div className="search-box"><FiSearch/><input placeholder="Search catalog" value={query} onChange={e=>setQuery(e.target.value)}/></div><button className="btn-ui secondary" onClick={load} disabled={loading}><FiRefreshCw/> Refresh</button></div>
    {err&&<div className="catalog-error">{err}</div>}
    <div className="catalog-admin-list">{filtered.map(p=>{const available=Math.max(0,Number(p.stock||0)-Number(p.reserved||0));return <article className="admin-product-row" key={p._id}><div className="admin-product-thumb"><ProductImage src={p.images?.[0]?.url} alt={p.name}/></div><div className="admin-product-main"><div className="admin-product-title"><h3>{p.name}</h3>{p.featured&&<span className="badge"><FiStar/> Featured</span>}</div><div className="admin-product-sub"><span>{p.category||"General"}</span><span>•</span><span>{p.images?.length||0} image{p.images?.length===1?"":"s"}</span></div></div><div className="admin-product-metric"><span>Price</span><strong>${Number(p.price).toFixed(2)}</strong></div><div className="admin-product-metric"><span>Available</span><strong className={available===0?"danger-text":""}>{available}</strong></div><div className="admin-product-actions"><button className="btn-ui icon secondary" onClick={()=>startEdit(p)} aria-label="Edit"><FiEdit2/></button><button className="btn-ui icon danger" onClick={()=>setConfirmDelete(p)} aria-label="Delete"><FiTrash2/></button></div></article>})}{!loading&&!filtered.length&&<div className="empty-state"><FiImage/><h3>No products here</h3><p>Create your first product or change the search.</p></div>}</div>
  </main>;
}
