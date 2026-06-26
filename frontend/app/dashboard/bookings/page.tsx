"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Modal, FormField, Input, Select, Textarea, SubmitButton } from "@/components/ui/Modal";

type Booking = { id:number; title:string; status:string; startTime:string; endTime:string; totalAmount:number; depositPaid:number; notes:string; clientId:number; packageId:number };
type Client  = { id:number; firstName:string; lastName:string };
type Package = { id:number; name:string; price:number };

const EMPTY = { title:"",clientId:"",packageId:"",startTime:"",endTime:"",status:"pending",totalAmount:"",depositPaid:"",notes:"" };

const STATUS_COLORS: Record<string,string> = { pending:"#f59e0b",confirmed:"#4ade80",completed:"#60a5fa",cancelled:"#f87171" };

export default function BookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Booking|null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Booking[]>("/bookings"),
      api.get<Client[]>("/clients"),
      api.get<Package[]>("/packages"),
    ]).then(([b,c,p]) => { setItems(b); setClients(c); setPackages(p); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const fmt = (dt: string) => dt ? new Date(dt).toLocaleString("en-GB",{dateStyle:"short",timeStyle:"short"}) : "—";
  const f = (k: string) => ({ value: (form as Record<string,unknown>)[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value })) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, clientId: Number(form.clientId), packageId: form.packageId ? Number(form.packageId) : undefined, totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined, depositPaid: form.depositPaid ? Number(form.depositPaid) : undefined };
      if (editing) await api.put(`/bookings/${editing.id}`, payload);
      else await api.post("/bookings", payload);
      setModal(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding:"32px" }}>
      <p style={{fontSize:12,color:"#71717a",marginBottom:24}}>Smart booking system — conflict-free scheduling, status tracking and client assignments.</p>
      <DataTable
        title="Bookings" data={items as unknown as Record<string,unknown>[]} loading={loading}
        onAdd={() => { setEditing(null); setForm({...EMPTY}); setError(""); setModal(true); }}
        onEdit={r => { const b=r as unknown as Booking; setEditing(b); setForm({ title:b.title,clientId:String(b.clientId),packageId:String(b.packageId||""),startTime:b.startTime?.slice(0,16)||"",endTime:b.endTime?.slice(0,16)||"",status:b.status,totalAmount:String(b.totalAmount||""),depositPaid:String(b.depositPaid||""),notes:b.notes||"" }); setError(""); setModal(true); }}
        onDelete={async r => { if(confirm("Delete booking?")){ await api.delete(`/bookings/${(r as unknown as Booking).id}`); load(); }}}
        searchKeys={["title","status"]} addLabel="New Booking"
        columns={[
          { key:"title",label:"Title" },
          { key:"startTime",label:"Date & Time",render:r=>fmt((r as unknown as Booking).startTime) },
          { key:"status",label:"Status",render:r=>{const s=(r as unknown as Booking).status;const c=STATUS_COLORS[s]||"#71717a";return <span style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:`${c}18`,color:c,fontWeight:600,textTransform:"uppercase"}}>{s}</span>;} },
          { key:"totalAmount",label:"Amount",render:r=>r.totalAmount?`Rs. ${Number(r.totalAmount).toLocaleString()}`:"—" },
          { key:"depositPaid",label:"Deposit",render:r=>r.depositPaid?`Rs. ${Number(r.depositPaid).toLocaleString()}`:"—" },
        ]}
      />
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?"Edit Booking":"New Booking"} width={560}>
        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <FormField label="Booking Title"><Input {...f("title")} placeholder="Wedding Shoot – Perera Family" required /></FormField>
          <FormField label="Client">
            <Select {...f("clientId") as React.SelectHTMLAttributes<HTMLSelectElement>} required>
              <option value="">Select client…</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </Select>
          </FormField>
          <FormField label="Package (optional)">
            <Select {...f("packageId") as React.SelectHTMLAttributes<HTMLSelectElement>}>
              <option value="">No package</option>
              {packages.map(p=><option key={p.id} value={p.id}>{p.name} — Rs. {Number(p.price).toLocaleString()}</option>)}
            </Select>
          </FormField>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <FormField label="Start Time"><Input {...f("startTime")} type="datetime-local" required /></FormField>
            <FormField label="End Time"><Input {...f("endTime")} type="datetime-local" required /></FormField>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
            <FormField label="Status">
              <Select {...f("status") as React.SelectHTMLAttributes<HTMLSelectElement>}>
                {["pending","confirmed","completed","cancelled"].map(s=><option key={s} value={s}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="Total (Rs.)"><Input {...f("totalAmount")} type="number" placeholder="25000" /></FormField>
            <FormField label="Deposit (Rs.)"><Input {...f("depositPaid")} type="number" placeholder="5000" /></FormField>
          </div>
          <FormField label="Notes"><Textarea {...f("notes")} placeholder="Special requirements, location, etc." /></FormField>
          {error && <p style={{fontSize:12,color:"#f87171"}}>{error}</p>}
          <SubmitButton loading={saving}>{editing?"Update Booking":"Create Booking"}</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
