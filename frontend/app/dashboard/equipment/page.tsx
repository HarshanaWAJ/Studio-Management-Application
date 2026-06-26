"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Modal, FormField, Input, Select, Textarea, SubmitButton } from "@/components/ui/Modal";

type Equipment = { id:number; name:string; category:string; brand:string; model:string; condition:string; isAvailable:number; lastMaintenance:string; nextMaintenance:string; maintenanceNotes:string; notes:string; serialNumber:string; purchaseDate:string; purchasePrice:number };

const EMPTY = { name:"",category:"camera",brand:"",model:"",serialNumber:"",purchaseDate:"",purchasePrice:"",condition:"good",isAvailable:1,lastMaintenance:"",nextMaintenance:"",maintenanceNotes:"",notes:"" };
const CATS = ["camera","lens","light","accessory","tripod","backdrop","other"];
const CONDS = ["excellent","good","fair","poor"];

export default function EquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Equipment|null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => { setLoading(true); api.get<Equipment[]>("/equipment").then(setItems).finally(()=>setLoading(false)); };
  useEffect(()=>{load();},[]);

  const COND_COLOR: Record<string,string> = { excellent:"#4ade80",good:"#60a5fa",fair:"#f59e0b",poor:"#f87171" };
  const f = (k:string) => ({ value:(form as Record<string,unknown>)[k] as string, onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>setForm(p=>({...p,[k]:e.target.value})) });

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = {...form, purchasePrice:form.purchasePrice?Number(form.purchasePrice):undefined, isAvailable:Number(form.isAvailable)};
      if(editing) await api.put(`/equipment/${editing.id}`,payload);
      else await api.post("/equipment",payload);
      setModal(false); load();
    } catch(e:unknown){setError(e instanceof Error?e.message:"Failed");}
    finally{setSaving(false);}
  };

  return (
    <div style={{padding:"32px"}}>
      <p style={{fontSize:12,color:"#71717a",marginBottom:24}}>Track cameras, lenses, lights and studio gear — with availability status and maintenance logs.</p>
      <DataTable
        title="Equipment" data={items as unknown as Record<string,unknown>[]} loading={loading}
        onAdd={()=>{setEditing(null);setForm({...EMPTY});setError("");setModal(true);}}
        onEdit={r=>{const eq=r as unknown as Equipment;setEditing(eq);setForm({name:eq.name,category:eq.category,brand:eq.brand||"",model:eq.model||"",serialNumber:eq.serialNumber||"",purchaseDate:eq.purchaseDate||"",purchasePrice:String(eq.purchasePrice||""),condition:eq.condition,isAvailable:eq.isAvailable,lastMaintenance:eq.lastMaintenance||"",nextMaintenance:eq.nextMaintenance||"",maintenanceNotes:eq.maintenanceNotes||"",notes:eq.notes||""});setError("");setModal(true);}}
        onDelete={async r=>{if(confirm("Delete equipment?")){ await api.delete(`/equipment/${(r as unknown as Equipment).id}`);load();}}}
        searchKeys={["name","brand","model","category"]}
        columns={[
          {key:"name",label:"Name"},
          {key:"category",label:"Category",render:r=><span style={{textTransform:"capitalize"}}>{(r as unknown as Equipment).category}</span>},
          {key:"brand",label:"Brand"},
          {key:"condition",label:"Condition",render:r=>{const c=(r as unknown as Equipment).condition;const col=COND_COLOR[c]||"#71717a";return <span style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:`${col}18`,color:col,fontWeight:600,textTransform:"capitalize"}}>{c}</span>;}},
          {key:"isAvailable",label:"Available",render:r=><span style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:(r as unknown as Equipment).isAvailable?"rgba(74,222,128,0.12)":"rgba(248,113,113,0.12)",color:(r as unknown as Equipment).isAvailable?"#4ade80":"#f87171",fontWeight:600}}>{(r as unknown as Equipment).isAvailable?"Yes":"No"}</span>},
          {key:"nextMaintenance",label:"Next Service",render:r=>(r as unknown as Equipment).nextMaintenance?new Date((r as unknown as Equipment).nextMaintenance).toLocaleDateString():"—"},
        ]}
      />
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?"Edit Equipment":"Add Equipment"} width={560}>
        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <FormField label="Equipment Name"><Input {...f("name")} placeholder="Canon EOS R5" required /></FormField>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <FormField label="Category"><Select {...f("category") as React.SelectHTMLAttributes<HTMLSelectElement>}>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</Select></FormField>
            <FormField label="Condition"><Select {...f("condition") as React.SelectHTMLAttributes<HTMLSelectElement>}>{CONDS.map(c=><option key={c} value={c}>{c}</option>)}</Select></FormField>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <FormField label="Brand"><Input {...f("brand")} placeholder="Canon" /></FormField>
            <FormField label="Model"><Input {...f("model")} placeholder="EOS R5" /></FormField>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <FormField label="Serial No."><Input {...f("serialNumber")} placeholder="SN123456" /></FormField>
            <FormField label="Purchase Price"><Input {...f("purchasePrice")} type="number" placeholder="450000" /></FormField>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <FormField label="Last Maintenance"><Input {...f("lastMaintenance")} type="date" /></FormField>
            <FormField label="Next Maintenance"><Input {...f("nextMaintenance")} type="date" /></FormField>
          </div>
          <FormField label="Available">
            <Select value={String(form.isAvailable)} onChange={e=>setForm(p=>({...p,isAvailable:Number(e.target.value)}))}>
              <option value="1">Yes</option><option value="0">No</option>
            </Select>
          </FormField>
          <FormField label="Maintenance Notes"><Textarea {...f("maintenanceNotes")} placeholder="Service history, issues…" /></FormField>
          {error && <p style={{fontSize:12,color:"#f87171"}}>{error}</p>}
          <SubmitButton loading={saving}>{editing?"Update":"Add Equipment"}</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
