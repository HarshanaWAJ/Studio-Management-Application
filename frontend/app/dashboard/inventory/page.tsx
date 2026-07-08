"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Modal, FormField, Input, Select, Textarea, SubmitButton } from "@/components/ui/Modal";
import { AlertCircle } from "lucide-react";

type Item = { id:number; itemType:string; itemName:string; sku:string; uom:string; quantity:number; minQuantity:number; costPrice:number; sellingPrice:number; location:string; notes:string };
const TYPES = ["frame","glass","mat","print","album","backdrop","prop","consumable","other"];
const EMPTY = { itemType:"frame",itemName:"",sku:"",uom:"units",quantity:"",minQuantity:"",costPrice:"",sellingPrice:"",location:"",notes:"" };

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Item|null>(null);
  const [form, setForm] = useState({...EMPTY});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  const load = () => {
    setLoading(true); setLoadError("");
    api.get<Item[]>("/inventory")
      .then(setItems)
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : "Failed to load inventory. Is the server running?"))
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const lowStock = items.filter(i => Number(i.quantity) <= Number(i.minQuantity));

  const f = (k:string) => ({ value:(form as Record<string,unknown>)[k] as string, onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>setForm(p=>({...p,[k]:e.target.value})) });

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, quantity:Number(form.quantity), minQuantity:Number(form.minQuantity||0), costPrice:form.costPrice?Number(form.costPrice):undefined, sellingPrice:form.sellingPrice?Number(form.sellingPrice):undefined };
      if(editing) await api.put(`/inventory/${editing.id}`,payload);
      else await api.post("/inventory",payload);
      setModal(false); load();
    } catch(e:unknown){setError(e instanceof Error?e.message:"Failed");}
    finally{setSaving(false);}
  };

  return (
    <div style={{padding:"32px"}}>
      <p style={{fontSize:12,color:"#71717a",marginBottom:16}}>Track stock for frames, glass, mats, prints and all studio materials.</p>
      {loadError && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: 12 }}>
          {loadError}
        </div>
      )}
      {lowStock.length > 0 && (
        <div style={{padding:14,borderRadius:12,background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",display:"flex",gap:10,marginBottom:20,alignItems:"center"}}>
          <AlertCircle style={{width:16,height:16,color:"#f87171",flexShrink:0}} />
          <span style={{fontSize:13,color:"#f87171",fontWeight:500}}>⚠️ Low stock alert: {lowStock.map(i=>i.itemName).join(", ")}</span>
        </div>
      )}
      <DataTable
        title="Inventory" data={items as unknown as Record<string,unknown>[]} loading={loading}
        onAdd={()=>{setEditing(null);setForm({...EMPTY});setError("");setModal(true);}}
        onEdit={r=>{const it=r as unknown as Item;setEditing(it);setForm({itemType:it.itemType,itemName:it.itemName,sku:it.sku||"",uom:it.uom,quantity:String(it.quantity),minQuantity:String(it.minQuantity||""),costPrice:String(it.costPrice||""),sellingPrice:String(it.sellingPrice||""),location:it.location||"",notes:it.notes||""});setError("");setModal(true);}}
        onDelete={async r=>{if(confirm("Delete item?")){ try { await api.delete(`/inventory/${(r as unknown as Item).id}`);load(); } catch (e: unknown) { setLoadError(e instanceof Error ? e.message : "Failed to delete item."); } }}}
        searchKeys={["itemName","sku","itemType"]} addLabel="Add Stock"
        columns={[
          {key:"itemName",label:"Item"},
          {key:"itemType",label:"Type",render:r=><span style={{textTransform:"capitalize",fontSize:11}}>{(r as unknown as Item).itemType}</span>},
          {key:"sku",label:"SKU",render:r=>(r as unknown as Item).sku||"—"},
          {key:"quantity",label:"Qty",render:r=>{const i=r as unknown as Item;const low=Number(i.quantity)<=Number(i.minQuantity);return <span style={{color:low?"#f87171":"#4ade80",fontWeight:600}}>{i.quantity} {i.uom}</span>;}},
          {key:"sellingPrice",label:"Selling Price",render:r=>(r as unknown as Item).sellingPrice?`Rs. ${Number((r as unknown as Item).sellingPrice).toLocaleString()}`:"—"},
          {key:"location",label:"Location",render:r=>(r as unknown as Item).location||"—"},
        ]}
      />
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?"Edit Item":"Add Inventory Item"}>
        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <FormField label="Item Type"><Select {...f("itemType") as React.SelectHTMLAttributes<HTMLSelectElement>}>{TYPES.map(t=><option key={t} value={t}>{t}</option>)}</Select></FormField>
            <FormField label="SKU"><Input {...f("sku")} placeholder="FRM-TEAK-001" /></FormField>
          </div>
          <FormField label="Item Name"><Input {...f("itemName")} placeholder="Teak Frame 30x20cm" required /></FormField>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
            <FormField label="Quantity"><Input {...f("quantity")} type="number" step="0.01" placeholder="50" required /></FormField>
            <FormField label="Min Qty (Alert)"><Input {...f("minQuantity")} type="number" placeholder="10" /></FormField>
            <FormField label="UOM"><Input {...f("uom")} placeholder="units" /></FormField>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <FormField label="Cost Price (Rs.)"><Input {...f("costPrice")} type="number" step="0.01" placeholder="200" /></FormField>
            <FormField label="Selling Price (Rs.)"><Input {...f("sellingPrice")} type="number" step="0.01" placeholder="350" /></FormField>
          </div>
          <FormField label="Storage Location"><Input {...f("location")} placeholder="Shelf A-3" /></FormField>
          <FormField label="Notes"><Textarea {...f("notes")} placeholder="Any notes…" /></FormField>
          {error && <p style={{fontSize:12,color:"#f87171"}}>{error}</p>}
          <SubmitButton loading={saving}>{editing?"Update Item":"Add Item"}</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
