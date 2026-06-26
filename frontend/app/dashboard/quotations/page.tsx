"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Modal, FormField, Input, Select, Textarea, SubmitButton } from "@/components/ui/Modal";
import { Plus, Trash2, ArrowRight } from "lucide-react";

type Client    = { id:number; firstName:string; lastName:string };
type Quotation = { id:number; quotationNumber:string; status:string; totalAmount:number; clientId:number; validUntil:string; items:string; notes:string; subtotal:number; taxRate:number; taxAmount:number; discountAmount:number; createdAt:string };
type LineItem  = { description:string; quantity:number; unitPrice:number; total:number };

const STATUS_COLORS: Record<string,string> = { draft:"#71717a",sent:"#60a5fa",accepted:"#4ade80",rejected:"#f87171",converted:"#c084fc" };

const emptyItem = (): LineItem => ({ description:"",quantity:1,unitPrice:0,total:0 });

export default function QuotationsPage() {
  const [items, setItems]     = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState<Quotation|null>(null);
  const [clientId, setClientId] = useState("");
  const [taxRate, setTaxRate]   = useState("0");
  const [discount, setDiscount] = useState("0");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes]     = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyItem()]);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([api.get<Quotation[]>("/quotations"), api.get<Client[]>("/clients")])
      .then(([q,c]) => { setItems(q); setClients(c); })
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const updateLine = (i: number, k: keyof LineItem, v: string) => {
    setLineItems(prev => {
      const next = [...prev];
      (next[i] as Record<string,unknown>)[k] = k==="description" ? v : Number(v);
      if (k==="quantity"||k==="unitPrice") next[i].total = next[i].quantity * next[i].unitPrice;
      return next;
    });
  };

  const subtotal = lineItems.reduce((s,i)=>s+i.total,0);
  const taxAmt   = subtotal * (Number(taxRate)/100);
  const total    = subtotal + taxAmt - Number(discount||0);

  const openAdd = () => { setEditing(null); setClientId(""); setTaxRate("0"); setDiscount("0"); setValidUntil(""); setNotes(""); setLineItems([emptyItem()]); setError(""); setModal(true); };

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = {
        clientId: Number(clientId),
        items: JSON.stringify(lineItems),
        subtotal, taxRate: Number(taxRate), taxAmount: taxAmt,
        discountAmount: Number(discount||0), totalAmount: total,
        validUntil: validUntil || undefined, notes,
      };
      if(editing) await api.put(`/quotations/${editing.id}`,payload);
      else await api.post("/quotations",payload);
      setModal(false); load();
    } catch(e:unknown){setError(e instanceof Error?e.message:"Failed");}
    finally{setSaving(false);}
  };

  const convertToInvoice = async (q: Quotation) => {
    if (!confirm(`Convert quotation ${q.quotationNumber} to invoice?`)) return;
    try {
      await api.post(`/quotations/${q.id}/convert`,{});
      alert("Invoice created successfully!"); load();
    } catch(e:unknown){alert(e instanceof Error?e.message:"Failed");}
  };

  return (
    <div style={{padding:"32px"}}>
      <p style={{fontSize:12,color:"#71717a",marginBottom:24}}>Always create a quotation first — then convert to a branded invoice when ready.</p>
      <DataTable
        title="Quotations" data={items as unknown as Record<string,unknown>[]} loading={loading}
        onAdd={openAdd} addLabel="New Quotation"
        onDelete={async r=>{if(confirm("Delete quotation?")){ await api.delete(`/quotations/${(r as unknown as Quotation).id}`);load();}}}
        searchKeys={["quotationNumber","status"]}
        columns={[
          {key:"quotationNumber",label:"Quotation #"},
          {key:"status",label:"Status",render:r=>{const s=(r as unknown as Quotation).status;const c=STATUS_COLORS[s]||"#71717a";return <span style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:`${c}18`,color:c,fontWeight:600,textTransform:"capitalize"}}>{s}</span>;}},
          {key:"totalAmount",label:"Total",render:r=>`Rs. ${Number((r as unknown as Quotation).totalAmount).toLocaleString()}`},
          {key:"validUntil",label:"Valid Until",render:r=>(r as unknown as Quotation).validUntil?new Date((r as unknown as Quotation).validUntil).toLocaleDateString():"—"},
          {key:"createdAt",label:"Created",render:r=>new Date((r as unknown as Quotation).createdAt).toLocaleDateString()},
          {key:"actions",label:"Convert",render:r=>{const q=r as unknown as Quotation;if(q.status==="converted") return <span style={{fontSize:10,color:"#c084fc"}}>Converted</span>;return <button onClick={()=>convertToInvoice(q)} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,padding:"4px 10px",background:"rgba(96,165,250,0.1)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:6,color:"#60a5fa",cursor:"pointer"}}>→ Invoice</button>;}},
        ]}
      />
      <Modal open={modal} onClose={()=>setModal(false)} title="New Quotation" width={620}>
        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <FormField label="Client">
              <Select value={clientId} onChange={e=>setClientId(e.target.value)} required>
                <option value="">Select client…</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </Select>
            </FormField>
            <FormField label="Valid Until"><Input type="date" value={validUntil} onChange={e=>setValidUntil(e.target.value)} /></FormField>
          </div>
          
          {/* Line Items */}
          <div>
            <div style={{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",color:"#a1a1aa",marginBottom:8}}>Line Items</div>
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"3fr 1fr 1.2fr 1.2fr auto",gap:0}}>
                {["Description","Qty","Unit Price","Total",""].map((h,i)=>(
                  <div key={i} style={{padding:"8px 10px",fontSize:9,fontWeight:600,textTransform:"uppercase",color:"#71717a",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>{h}</div>
                ))}
              </div>
              {lineItems.map((item,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"3fr 1fr 1.2fr 1.2fr auto",borderBottom:i<lineItems.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                  <input value={item.description} onChange={e=>updateLine(i,"description",e.target.value)} placeholder="Item description" style={{padding:"8px 10px",background:"transparent",border:"none",color:"#fafafa",fontSize:12,outline:"none"}} />
                  <input value={item.quantity} onChange={e=>updateLine(i,"quantity",e.target.value)} type="number" min="1" style={{padding:"8px 10px",background:"transparent",border:"none",color:"#fafafa",fontSize:12,outline:"none",textAlign:"right"}} />
                  <input value={item.unitPrice} onChange={e=>updateLine(i,"unitPrice",e.target.value)} type="number" step="0.01" style={{padding:"8px 10px",background:"transparent",border:"none",color:"#fafafa",fontSize:12,outline:"none",textAlign:"right"}} />
                  <div style={{padding:"8px 10px",fontSize:12,color:"#a1a1aa",display:"flex",alignItems:"center",justifyContent:"flex-end"}}>Rs. {item.total.toLocaleString()}</div>
                  <div style={{padding:"8px 6px",display:"flex",alignItems:"center"}}>
                    {lineItems.length>1 && <button type="button" onClick={()=>setLineItems(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#f87171",padding:2,display:"flex"}}><Trash2 style={{width:12,height:12}} /></button>}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={()=>setLineItems(p=>[...p,emptyItem()])} style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:6,fontSize:11,color:"#f59e0b",background:"none",border:"none",cursor:"pointer",padding:0}}>
              <Plus style={{width:12,height:12}} /> Add Line Item
            </button>
          </div>

          {/* Totals */}
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"14px 16px",display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#a1a1aa"}}><span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,color:"#a1a1aa"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span>Tax (%)</span><input type="number" value={taxRate} onChange={e=>setTaxRate(e.target.value)} style={{width:50,padding:"3px 6px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,color:"#fafafa",fontSize:11,outline:"none"}} /></div>
              <span>Rs. {taxAmt.toLocaleString()}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,color:"#a1a1aa"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span>Discount (Rs.)</span><input type="number" value={discount} onChange={e=>setDiscount(e.target.value)} style={{width:70,padding:"3px 6px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:5,color:"#fafafa",fontSize:11,outline:"none"}} /></div>
              <span>- Rs. {Number(discount||0).toLocaleString()}</span>
            </div>
            <div style={{height:1,background:"rgba(255,255,255,0.08)"}} />
            <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,color:"#f59e0b"}}><span>Total</span><span>Rs. {total.toLocaleString()}</span></div>
          </div>

          <FormField label="Notes"><Textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Terms, payment details, notes…" /></FormField>
          {error && <p style={{fontSize:12,color:"#f87171"}}>{error}</p>}
          <SubmitButton loading={saving}>Create Quotation</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
