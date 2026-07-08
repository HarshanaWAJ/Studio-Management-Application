"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Modal, FormField, Input, Select, Textarea, SubmitButton } from "@/components/ui/Modal";
import { Image as ImageIcon, Link as LinkIcon, Copy } from "lucide-react";

type Client  = { id:number; firstName:string; lastName:string };
type Gallery = { id:number; title:string; clientId:number; isPublic:number; shareToken:string; description:string; coverPhoto:string; photos:string; expiresAt:string; createdAt:string };

const EMPTY = { title:"",clientId:"",isPublic:0,description:"",coverPhoto:"",photos:"",expiresAt:"" };

export default function GalleriesPage() {
  const [items, setItems]     = useState<Gallery[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState<Gallery|null>(null);
  const [form, setForm]       = useState({ ...EMPTY });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState<number|null>(null);
  const [loadError, setLoadError] = useState("");

  const load = () => {
    setLoading(true); setLoadError("");
    Promise.all([api.get<Gallery[]>("/galleries"), api.get<Client[]>("/clients")])
      .then(([g,c]) => { setItems(g); setClients(c); })
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : "Failed to load galleries. Is the server running?"))
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const f = (k:string) => ({ value:(form as Record<string,unknown>)[k] as string, onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>setForm(p=>({...p,[k]:e.target.value})) });

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, clientId:Number(form.clientId), isPublic:Number(form.isPublic) };
      if(editing) await api.put(`/galleries/${editing.id}`,payload);
      else await api.post("/galleries",payload);
      setModal(false); load();
    } catch(e:unknown){setError(e instanceof Error?e.message:"Failed");}
    finally{setSaving(false);}
  };

  const copyLink = (g:Gallery) => {
    const link = `${window.location.origin}/gallery/${g.shareToken}`;
    navigator.clipboard.writeText(link);
    setCopied(g.id);
    setTimeout(()=>setCopied(null),2000);
  };

  return (
    <div style={{padding:"32px"}}>
      <p style={{fontSize:12,color:"#71717a",marginBottom:24}}>Upload, curate and share proofing galleries with clients directly from your studio dashboard.</p>
      {loadError && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: 12 }}>
          {loadError}
        </div>
      )}
      <DataTable
        title="Galleries" data={items as unknown as Record<string,unknown>[]} loading={loading}
        onAdd={()=>{setEditing(null);setForm({...EMPTY});setError("");setModal(true);}}
        onEdit={r=>{const g=r as unknown as Gallery;setEditing(g);setForm({title:g.title,clientId:String(g.clientId),isPublic:g.isPublic as unknown as number,description:g.description||"",coverPhoto:g.coverPhoto||"",photos:g.photos||"",expiresAt:g.expiresAt||""});setError("");setModal(true);}}
        onDelete={async r=>{if(confirm("Delete gallery?")){ try { await api.delete(`/galleries/${(r as unknown as Gallery).id}`);load(); } catch (e: unknown) { setLoadError(e instanceof Error ? e.message : "Failed to delete gallery."); } }}}
        searchKeys={["title"]} addLabel="New Gallery"
        columns={[
          {key:"title",label:"Gallery Title",render:r=><div style={{display:"flex",alignItems:"center",gap:8}}><ImageIcon style={{width:14,height:14,color:"#c084fc"}} />{(r as unknown as Gallery).title}</div>},
          {key:"clientId",label:"Client",render:r=>{const c=clients.find(c=>c.id===(r as unknown as Gallery).clientId);return c?`${c.firstName} ${c.lastName}`:"—";}},
          {key:"isPublic",label:"Visibility",render:r=><span style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:(r as unknown as Gallery).isPublic?"rgba(96,165,250,0.12)":"rgba(113,113,122,0.15)",color:(r as unknown as Gallery).isPublic?"#60a5fa":"#71717a",fontWeight:600}}>{(r as unknown as Gallery).isPublic?"Public":"Private"}</span>},
          {key:"createdAt",label:"Created",render:r=>new Date((r as unknown as Gallery).createdAt).toLocaleDateString()},
          {key:"share",label:"Share Link",render:r=>{const g=r as unknown as Gallery;if(!g.shareToken) return <span style={{color:"#52525b",fontSize:11}}>—</span>;return <button onClick={()=>copyLink(g)} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,padding:"3px 9px",background:"rgba(192,132,252,0.1)",border:"1px solid rgba(192,132,252,0.2)",borderRadius:5,color:"#c084fc",cursor:"pointer"}}>{copied===g.id?<><Copy style={{width:11,height:11}} /> Copied!</>:<><LinkIcon style={{width:11,height:11}} /> Copy Link</>}</button>;}},
        ]}
      />
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?"Edit Gallery":"New Gallery"}>
        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <FormField label="Gallery Title"><Input {...f("title")} placeholder="Perera Wedding — Jan 2026" required /></FormField>
          <FormField label="Client">
            <Select {...f("clientId") as React.SelectHTMLAttributes<HTMLSelectElement>} required>
              <option value="">Select client…</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </Select>
          </FormField>
          <FormField label="Visibility">
            <Select value={String(form.isPublic)} onChange={e=>setForm(p=>({...p,isPublic:Number(e.target.value)}))}>
              <option value="0">Private (client only)</option>
              <option value="1">Public (shareable link)</option>
            </Select>
          </FormField>
          <FormField label="Cover Photo URL"><Input {...f("coverPhoto")} placeholder="https://…" type="url" /></FormField>
          <FormField label="Description"><Textarea {...f("description")} placeholder="Gallery description or notes for the client…" /></FormField>
          <FormField label="Expires At (optional)"><Input {...f("expiresAt")} type="datetime-local" /></FormField>
          {error && <p style={{fontSize:12,color:"#f87171"}}>{error}</p>}
          <SubmitButton loading={saving}>{editing?"Update Gallery":"Create Gallery"}</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
