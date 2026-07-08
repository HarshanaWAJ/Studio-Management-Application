"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Modal, FormField, Input, Select, Textarea, SubmitButton } from "@/components/ui/Modal";

type Frame = { id:number; frameName:string; woodType:string; uom:string; pricePerUom:number; glassType:string; glassPricePerUom:number; description:string; isActive:number };

const WOOD_TYPES = ["teak","pine","oak","mahogany","mdf","aluminum","plastic","other"];
const GLASS_TYPES = ["clear","anti-glare","uv-protective","none"];
const UOMS = ["cm","feet","inches","mm"];

const EMPTY = { frameName:"",woodType:"teak",uom:"cm",pricePerUom:"",glassType:"clear",glassPricePerUom:"",description:"",isActive:1 };

// ── Frame Calculator ──────────────────────────────────────────────────────────
function FrameCalculator({ frames }: { frames: Frame[] }) {
  const [frameId, setFrameId] = useState("");
  const [photoW, setPhotoW] = useState("");
  const [photoH, setPhotoH] = useState("");
  const [result, setResult] = useState<{ framePerimeter:number; glassArea:number; frameCost:number; glassCost:number; total:number; frame:Frame } | null>(null);

  const calculate = () => {
    const frame = frames.find(f => String(f.id) === frameId);
    if (!frame || !photoW || !photoH) return;
    const w = Number(photoW);
    const h = Number(photoH);
    // Frame perimeter = 2 * (width + height) in selected UOM
    const framePerimeter = 2 * (w + h);
    // Glass area = width * height
    const glassArea = w * h;
    const frameCost  = framePerimeter * Number(frame.pricePerUom);
    const glassCost  = glassArea * Number(frame.glassPricePerUom || 0);
    setResult({ framePerimeter, glassArea, frameCost, glassCost, total: frameCost + glassCost, frame });
  };

  return (
    <div style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.15)", borderRadius:16, padding:20, marginBottom:28 }}>
      <h3 style={{ fontSize:14, fontWeight:700, color:"#f59e0b", marginBottom:16 }}>🖼️ Frame Cost Calculator</h3>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:14 }}>
        <FormField label="Select Frame">
          <Select value={frameId} onChange={e=>setFrameId(e.target.value)}>
            <option value="">Choose frame…</option>
            {frames.map(f=><option key={f.id} value={f.id}>{f.frameName} ({f.woodType})</option>)}
          </Select>
        </FormField>
        <FormField label={`Photo Width (${frames.find(f=>String(f.id)===frameId)?.uom||"cm"})`}>
          <Input type="number" value={photoW} onChange={e=>setPhotoW(e.target.value)} placeholder="30" />
        </FormField>
        <FormField label={`Photo Height (${frames.find(f=>String(f.id)===frameId)?.uom||"cm"})`}>
          <Input type="number" value={photoH} onChange={e=>setPhotoH(e.target.value)} placeholder="20" />
        </FormField>
      </div>
      <button onClick={calculate} style={{ padding:"9px 20px", background:"linear-gradient(135deg,#f59e0b,#d97706)", border:"none", borderRadius:9, color:"#09090b", fontSize:12, fontWeight:700, cursor:"pointer", marginBottom:14 }}>
        Calculate
      </button>
      {result && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10 }}>
          {[
            { label:"Frame Perimeter", value:`${result.framePerimeter.toFixed(2)} ${result.frame.uom}` },
            { label:"Frame Cost",      value:`Rs. ${result.frameCost.toLocaleString("en-LK",{minimumFractionDigits:2})}` },
            { label:`Glass Area`,      value:`${result.glassArea.toFixed(2)} ${result.frame.uom}²` },
            { label:"Glass Cost",      value:`Rs. ${result.glassCost.toLocaleString("en-LK",{minimumFractionDigits:2})}` },
            { label:"Total Estimate",  value:`Rs. ${result.total.toLocaleString("en-LK",{minimumFractionDigits:2})}` },
          ].map(({label,value},i) => (
            <div key={i} style={{ background:"rgba(0,0,0,0.3)", borderRadius:10, padding:"12px 14px", border:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize:9, color:"#71717a", textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</div>
              <div style={{ fontSize:14, fontWeight:700, color:i===4?"#f59e0b":"#fafafa", marginTop:4 }}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FramesPage() {
  const [items, setItems] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Frame|null>(null);
  const [form, setForm] = useState({...EMPTY});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  const load = () => {
    setLoading(true); setLoadError("");
    api.get<Frame[]>("/frames")
      .then(setItems)
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : "Failed to load frames. Is the server running?"))
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const f = (k:string) => ({ value:(form as Record<string,unknown>)[k] as string, onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>setForm(p=>({...p,[k]:e.target.value})) });

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, pricePerUom:Number(form.pricePerUom), glassPricePerUom:Number(form.glassPricePerUom||0), isActive:Number(form.isActive) };
      if(editing) await api.put(`/frames/${editing.id}`,payload);
      else await api.post("/frames",payload);
      setModal(false); load();
    } catch(e:unknown){setError(e instanceof Error?e.message:"Failed");}
    finally{setSaving(false);}
  };

  return (
    <div style={{padding:"32px"}}>
      <p style={{fontSize:12,color:"#71717a",marginBottom:24}}>Configure frame types with wood, UOM, pricing per unit. Auto-calculates frame perimeter and glass area based on photo dimensions.</p>
      {loadError && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: 12 }}>
          {loadError}
        </div>
      )}
      <FrameCalculator frames={items} />
      <DataTable
        title="Frame Configurations" data={items as unknown as Record<string,unknown>[]} loading={loading}
        onAdd={()=>{setEditing(null);setForm({...EMPTY});setError("");setModal(true);}}
        onEdit={r=>{const fr=r as unknown as Frame;setEditing(fr);setForm({frameName:fr.frameName,woodType:fr.woodType||"teak",uom:fr.uom,pricePerUom:String(fr.pricePerUom),glassType:fr.glassType||"clear",glassPricePerUom:String(fr.glassPricePerUom||""),description:fr.description||"",isActive:fr.isActive});setError("");setModal(true);}}
        onDelete={async r=>{if(confirm("Delete frame?")){ try { await api.delete(`/frames/${(r as unknown as Frame).id}`);load(); } catch (e: unknown) { setLoadError(e instanceof Error ? e.message : "Failed to delete frame."); } }}}
        searchKeys={["frameName","woodType"]} addLabel="Add Frame"
        columns={[
          {key:"frameName",label:"Frame Name"},
          {key:"woodType",label:"Wood Type",render:r=><span style={{textTransform:"capitalize"}}>{(r as unknown as Frame).woodType}</span>},
          {key:"uom",label:"UOM",render:r=><span style={{textTransform:"uppercase"}}>{(r as unknown as Frame).uom}</span>},
          {key:"pricePerUom",label:"Price / UOM",render:r=>`Rs. ${Number((r as unknown as Frame).pricePerUom).toLocaleString()}`},
          {key:"glassType",label:"Glass",render:r=><span style={{textTransform:"capitalize"}}>{(r as unknown as Frame).glassType}</span>},
          {key:"glassPricePerUom",label:"Glass Price / UOM²",render:r=>Number((r as unknown as Frame).glassPricePerUom)>0?`Rs. ${Number((r as unknown as Frame).glassPricePerUom).toLocaleString()}`:"—"},
          {key:"isActive",label:"Active",render:r=><span style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:(r as unknown as Frame).isActive?"rgba(74,222,128,0.12)":"rgba(113,113,122,0.15)",color:(r as unknown as Frame).isActive?"#4ade80":"#71717a",fontWeight:600}}>{(r as unknown as Frame).isActive?"Yes":"No"}</span>},
        ]}
      />
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?"Edit Frame":"Add Frame Config"} width={520}>
        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <FormField label="Frame Name"><Input {...f("frameName")} placeholder="Teak Classic 2cm" required /></FormField>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <FormField label="Wood Type"><Select {...f("woodType") as React.SelectHTMLAttributes<HTMLSelectElement>}>{WOOD_TYPES.map(w=><option key={w} value={w}>{w}</option>)}</Select></FormField>
            <FormField label="Unit of Measure (UOM)"><Select {...f("uom") as React.SelectHTMLAttributes<HTMLSelectElement>}>{UOMS.map(u=><option key={u} value={u}>{u}</option>)}</Select></FormField>
          </div>
          <FormField label="Price per UOM (frame perimeter)"><Input {...f("pricePerUom")} type="number" step="0.01" placeholder="150" required /></FormField>
          <div style={{height:1,background:"rgba(255,255,255,0.06)"}} />
          <p style={{fontSize:11,color:"#71717a",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>Glass Configuration</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <FormField label="Glass Type"><Select {...f("glassType") as React.SelectHTMLAttributes<HTMLSelectElement>}>{GLASS_TYPES.map(g=><option key={g} value={g}>{g}</option>)}</Select></FormField>
            <FormField label="Glass Price per UOM² (area)"><Input {...f("glassPricePerUom")} type="number" step="0.01" placeholder="50" /></FormField>
          </div>
          <FormField label="Description"><Textarea {...f("description")} placeholder="Frame description, finish details…" /></FormField>
          {error && <p style={{fontSize:12,color:"#f87171"}}>{error}</p>}
          <SubmitButton loading={saving}>{editing?"Update Frame":"Add Frame"}</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
