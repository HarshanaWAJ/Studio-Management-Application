"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Modal, FormField, Input, Textarea, SubmitButton } from "@/components/ui/Modal";

type Client = { id: number; firstName: string; lastName: string; email: string; phone: string; address: string; notes: string; createdAt: string };

const EMPTY: Omit<Client,"id"|"createdAt"> = { firstName:"",lastName:"",email:"",phone:"",address:"",notes:"" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => { setLoading(true); api.get<Client[]>("/clients").then(setClients).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY }); setError(""); setModal(true); };
  const openEdit = (c: Client) => { setEditing(c); setForm({ firstName:c.firstName,lastName:c.lastName,email:c.email||"",phone:c.phone||"",address:c.address||"",notes:c.notes||"" }); setError(""); setModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      if (editing) await api.put(`/clients/${editing.id}`, form);
      else await api.post("/clients", form);
      setModal(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (c: Client) => {
    if (!confirm(`Delete ${c.firstName} ${c.lastName}?`)) return;
    await api.delete(`/clients/${c.id}`); load();
  };

  const f = (k: keyof typeof form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <div style={{ padding: "32px" }}>
      <p style={{ fontSize: 12, color: "#71717a", marginBottom: 24 }}>CRM — contacts, shoot history, galleries and invoices in one place.</p>
      <DataTable
        title="Clients" data={clients} loading={loading}
        onAdd={openAdd} onEdit={c => openEdit(c as unknown as Client)} onDelete={c => handleDelete(c as unknown as Client)}
        searchKeys={["firstName","lastName","email","phone"]}
        columns={[
          { key: "name", label: "Name", render: r => `${(r as unknown as Client).firstName} ${(r as unknown as Client).lastName}` },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "address", label: "Address" },
          { key: "createdAt", label: "Added", render: r => new Date((r as unknown as Client).createdAt).toLocaleDateString() },
        ]}
      />
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Client" : "Add Client"}>
        <form onSubmit={handleSubmit} style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <FormField label="First Name"><Input {...f("firstName")} placeholder="John" required /></FormField>
            <FormField label="Last Name"><Input {...f("lastName")} placeholder="Doe" required /></FormField>
          </div>
          <FormField label="Email"><Input {...f("email")} type="email" placeholder="client@email.com" /></FormField>
          <FormField label="Phone"><Input {...f("phone")} placeholder="+94 77 123 4567" /></FormField>
          <FormField label="Address"><Input {...f("address")} placeholder="City, Country" /></FormField>
          <FormField label="Notes"><Textarea {...f("notes")} placeholder="Any notes about this client…" /></FormField>
          {error && <p style={{ fontSize:12,color:"#f87171" }}>{error}</p>}
          <SubmitButton loading={saving}>{editing ? "Update Client" : "Add Client"}</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
