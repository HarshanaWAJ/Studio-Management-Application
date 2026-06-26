"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Modal, FormField, Input, Textarea, SubmitButton } from "@/components/ui/Modal";

type Package = { id: number; name: string; description: string; price: number; duration: number; includes: string; isActive: number };
const EMPTY = { name:"",description:"",price:"",duration:"",includes:"",isActive:1 };

export default function PackagesPage() {
  const [items, setItems] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Package|null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => { setLoading(true); api.get<Package[]>("/packages").then(setItems).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, price: Number(form.price), duration: Number(form.duration) };
      if (editing) await api.put(`/packages/${editing.id}`, payload);
      else await api.post("/packages", payload);
      setModal(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const f = (k: string) => ({ value: (form as Record<string,unknown>)[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <div style={{ padding: "32px" }}>
      <p style={{ fontSize: 12, color: "#71717a", marginBottom: 24 }}>Configure studio packages — names, pricing, duration and what's included. All booking fees are studio-independent.</p>
      <DataTable
        title="Packages" data={items as unknown as Record<string,unknown>[]} loading={loading}
        onAdd={() => { setEditing(null); setForm({...EMPTY}); setError(""); setModal(true); }}
        onEdit={r => { const p=r as unknown as Package; setEditing(p); setForm({ name:p.name,description:p.description||"",price:String(p.price),duration:String(p.duration||""),includes:p.includes||"",isActive:p.isActive }); setError(""); setModal(true); }}
        onDelete={async r => { if (confirm("Delete package?")) { await api.delete(`/packages/${(r as unknown as Package).id}`); load(); } }}
        searchKeys={["name"]}
        columns={[
          { key:"name",label:"Package Name" },
          { key:"price",label:"Price",render:r=>`Rs. ${Number((r as unknown as Package).price).toLocaleString()}` },
          { key:"duration",label:"Duration",render:r=>`${(r as unknown as Package).duration||"—"} min` },
          { key:"description",label:"Description",render:r=>String((r as unknown as Package).description||"").slice(0,60)||"—" },
          { key:"isActive",label:"Status",render:r=><span style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:(r as unknown as Package).isActive?"rgba(74,222,128,0.12)":"rgba(113,113,122,0.15)",color:(r as unknown as Package).isActive?"#4ade80":"#71717a",fontWeight:600}}>{(r as unknown as Package).isActive?"Active":"Inactive"}</span> },
        ]}
      />
      <Modal open={modal} onClose={() => setModal(false)} title={editing?"Edit Package":"New Package"}>
        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <FormField label="Package Name"><Input {...f("name")} placeholder="Wedding Photography" required /></FormField>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <FormField label="Price (Rs.)"><Input {...f("price")} type="number" placeholder="25000" required /></FormField>
            <FormField label="Duration (min)"><Input {...f("duration")} type="number" placeholder="120" /></FormField>
          </div>
          <FormField label="What's Included"><Input {...f("includes")} placeholder="e.g. 2 photographers, 100 edited photos" /></FormField>
          <FormField label="Description"><Textarea {...f("description")} placeholder="Package description…" /></FormField>
          {error && <p style={{fontSize:12,color:"#f87171"}}>{error}</p>}
          <SubmitButton loading={saving}>{editing?"Update Package":"Create Package"}</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
