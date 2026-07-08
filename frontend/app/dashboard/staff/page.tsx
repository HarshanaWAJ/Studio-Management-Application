"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Modal, FormField, Input, Select, SubmitButton } from "@/components/ui/Modal";
import { ShieldCheck, Mail, RotateCcw, Ban, CheckCircle2 } from "lucide-react";

type Staff = {
  id: string; firstName: string; lastName: string; email: string; role: string;
  phone?: string; jobTitle?: string; department?: string; employeeId?: string; hireDate?: string;
  status: string; isEmailVerified: boolean; mustSetPassword: boolean; createdAt: string;
  effectivePermissions: string[];
};

const EMPTY_INVITE = { firstName: "", lastName: "", email: "", role: "staff", phone: "", jobTitle: "", department: "", employeeId: "", hireDate: "" };
const EMPTY_EDIT = { firstName: "", lastName: "", phone: "", jobTitle: "", department: "", employeeId: "", hireDate: "" };

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin", studio_admin: "Studio Admin", manager: "Manager",
  receptionist: "Receptionist", photographer: "Photographer", editor: "Editor",
  accountant: "Accountant", staff: "Staff",
};

const STATUS_COLOR: Record<string, string> = {
  active: "#4ade80", on_leave: "#fbbf24", suspended: "#f87171", inactive: "#71717a",
};

function currentUserRole(): string {
  if (typeof window === "undefined") return "";
  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  if (!token) return "";
  try { return JSON.parse(atob(token.split(".")[1])).role; } catch { return ""; }
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ ...EMPTY_INVITE });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const [editModal, setEditModal] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_EDIT });
  const [saving, setSaving] = useState(false);

  const [permModal, setPermModal] = useState(false);
  const [permTarget, setPermTarget] = useState<Staff | null>(null);
  const [grant, setGrant] = useState<Set<string>>(new Set());

  const myRole = currentUserRole();
  const canDelete = myRole === "studio_admin" || myRole === "super_admin";
  const [loadError, setLoadError] = useState("");

  const load = () => {
    setLoading(true); setLoadError("");
    api.get<Staff[]>("/staff")
      .then(setStaff)
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : "Failed to load staff. Is the server running?"))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    api.get<{ roles: string[]; permissions: string[] }>("/staff/meta/roles-permissions")
      .then((d) => { setRoles(d.roles); setPermissions(d.permissions); })
      .catch(() => {});
  }, []);

  // ── Invite ──────────────────────────────────────────────────────
  const openInvite = () => { setInviteForm({ ...EMPTY_INVITE }); setInviteError(""); setInviteModal(true); };
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault(); setInviting(true); setInviteError("");
    try {
      await api.post("/staff/invite", inviteForm);
      setInviteModal(false); load();
    } catch (err: unknown) { setInviteError(err instanceof Error ? err.message : "Failed to invite staff member"); }
    finally { setInviting(false); }
  };

  // ── Edit profile ────────────────────────────────────────────────
  const openEdit = (s: Staff) => {
    setEditing(s);
    setEditForm({
      firstName: s.firstName, lastName: s.lastName, phone: s.phone || "",
      jobTitle: s.jobTitle || "", department: s.department || "",
      employeeId: s.employeeId || "", hireDate: s.hireDate ? s.hireDate.slice(0, 10) : "",
    });
    setEditModal(true);
  };
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editing) return; setSaving(true);
    try { await api.put(`/staff/${editing.id}`, editForm); setEditModal(false); load(); }
    finally { setSaving(false); }
  };

  // ── Role change ─────────────────────────────────────────────────
  const changeRole = async (s: Staff, role: string) => {
    await api.put(`/staff/${s.id}/role`, { role }); load();
  };

  // ── Status ──────────────────────────────────────────────────────
  const setStatus = async (s: Staff, status: string) => {
    await api.put(`/staff/${s.id}/status`, { status }); load();
  };

  // ── Permissions ─────────────────────────────────────────────────
  const openPermissions = (s: Staff) => {
    setPermTarget(s);
    setGrant(new Set(s.effectivePermissions));
    setPermModal(true);
  };
  const savePermissions = async () => {
    if (!permTarget) return;
    const roleDefault = new Set(permTarget.effectivePermissions); // approximate baseline
    const grantList: string[] = [];
    const revokeList: string[] = [];
    permissions.forEach((p) => {
      const has = grant.has(p);
      const hadByDefault = roleDefault.has(p);
      if (has && !hadByDefault) grantList.push(p);
      if (!has && hadByDefault) revokeList.push(p);
    });
    await api.put(`/staff/${permTarget.id}/permissions`, { grant: grantList, revoke: revokeList });
    setPermModal(false); load();
  };

  const handleDelete = async (s: Staff) => {
    if (!confirm(`Remove ${s.firstName} ${s.lastName} from the studio?`)) return;
    try {
      await api.delete(`/staff/${s.id}`); load();
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Failed to remove staff member.");
    }
  };

  const resendInvite = async (s: Staff) => {
    try {
      await api.post(`/staff/${s.id}/resend-invite`, {});
      alert("Invite email resent.");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to resend invite.");
    }
  };

  return (
    <div style={{ padding: "32px" }}>
      <p style={{ fontSize: 12, color: "#71717a", marginBottom: 24 }}>
        Manage your team — invite staff, assign roles, fine-tune permissions and track status.
      </p>
      {loadError && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: 12 }}>
          {loadError}
        </div>
      )}

      <DataTable
        title="Staff" data={staff as unknown as Record<string, unknown>[]} loading={loading}
        onAdd={openInvite} addLabel="Invite Staff"
        onEdit={(r) => openEdit(r as unknown as Staff)}
        onDelete={canDelete ? (r) => handleDelete(r as unknown as Staff) : undefined}
        searchKeys={["firstName", "lastName", "email", "jobTitle", "department"]}
        columns={[
          { key: "name", label: "Name", render: (r) => {
              const s = r as unknown as Staff;
              return (
                <div>
                  <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                  <div style={{ fontSize: 11, color: "#71717a" }}>{s.email}</div>
                </div>
              );
            } },
          { key: "role", label: "Role", render: (r) => {
              const s = r as unknown as Staff;
              return (
                <Select value={s.role} onChange={(e) => changeRole(s, e.target.value)} style={{ padding: "6px 10px", fontSize: 12, minWidth: 140 }}>
                  {roles.map((role) => <option key={role} value={role}>{ROLE_LABEL[role] || role}</option>)}
                </Select>
              );
            } },
          { key: "jobTitle", label: "Title", render: (r) => (r as unknown as Staff).jobTitle || "—" },
          { key: "status", label: "Status", render: (r) => {
              const s = r as unknown as Staff;
              return (
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: STATUS_COLOR[s.status] || "#a1a1aa" }}>
                  ● {s.status.replace("_", " ")}
                </span>
              );
            } },
          { key: "verified", label: "Email", render: (r) => {
              const s = r as unknown as Staff;
              return s.mustSetPassword
                ? <span style={{ fontSize: 11, color: "#fbbf24" }}>Invite pending</span>
                : s.isEmailVerified
                  ? <span style={{ fontSize: 11, color: "#4ade80" }}>Verified</span>
                  : <span style={{ fontSize: 11, color: "#71717a" }}>Unverified</span>;
            } },
          { key: "manage", label: "Manage", render: (r) => {
              const s = r as unknown as Staff;
              const btn: React.CSSProperties = { width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#a1a1aa", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", marginRight: 6 };
              return (
                <div style={{ display: "flex" }}>
                  <button title="Permissions" style={btn} onClick={() => openPermissions(s)}><ShieldCheck style={{ width: 14, height: 14 }} /></button>
                  {s.mustSetPassword && (
                    <button title="Resend invite" style={btn} onClick={() => resendInvite(s)}><Mail style={{ width: 14, height: 14 }} /></button>
                  )}
                  {s.status === "active" ? (
                    <button title="Suspend" style={{ ...btn, color: "#f87171" }} onClick={() => setStatus(s, "suspended")}><Ban style={{ width: 14, height: 14 }} /></button>
                  ) : (
                    <button title="Reactivate" style={{ ...btn, color: "#4ade80" }} onClick={() => setStatus(s, "active")}><CheckCircle2 style={{ width: 14, height: 14 }} /></button>
                  )}
                </div>
              );
            } },
        ]}
      />

      {/* Invite modal */}
      <Modal open={inviteModal} onClose={() => setInviteModal(false)} title="Invite Staff Member" width={560}>
        <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="First Name"><Input required value={inviteForm.firstName} onChange={(e) => setInviteForm((p) => ({ ...p, firstName: e.target.value }))} /></FormField>
            <FormField label="Last Name"><Input required value={inviteForm.lastName} onChange={(e) => setInviteForm((p) => ({ ...p, lastName: e.target.value }))} /></FormField>
          </div>
          <FormField label="Email"><Input required type="email" value={inviteForm.email} onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))} placeholder="staff@email.com" /></FormField>
          <FormField label="Role">
            <Select value={inviteForm.role} onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value }))}>
              {(roles.length ? roles : Object.keys(ROLE_LABEL)).map((role) => <option key={role} value={role}>{ROLE_LABEL[role] || role}</option>)}
            </Select>
          </FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="Job Title"><Input value={inviteForm.jobTitle} onChange={(e) => setInviteForm((p) => ({ ...p, jobTitle: e.target.value }))} placeholder="Lead Photographer" /></FormField>
            <FormField label="Department"><Input value={inviteForm.department} onChange={(e) => setInviteForm((p) => ({ ...p, department: e.target.value }))} placeholder="Studio Operations" /></FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="Phone"><Input value={inviteForm.phone} onChange={(e) => setInviteForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+94 77 123 4567" /></FormField>
            <FormField label="Hire Date"><Input type="date" value={inviteForm.hireDate} onChange={(e) => setInviteForm((p) => ({ ...p, hireDate: e.target.value }))} /></FormField>
          </div>
          {inviteError && <p style={{ fontSize: 12, color: "#f87171" }}>{inviteError}</p>}
          <p style={{ fontSize: 11, color: "#71717a" }}>An invite email with a set-password link will be sent to this address.</p>
          <SubmitButton loading={inviting}>Send Invite</SubmitButton>
        </form>
      </Modal>

      {/* Edit profile modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Staff Profile" width={560}>
        <form onSubmit={handleEditSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="First Name"><Input required value={editForm.firstName} onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))} /></FormField>
            <FormField label="Last Name"><Input required value={editForm.lastName} onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))} /></FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="Job Title"><Input value={editForm.jobTitle} onChange={(e) => setEditForm((p) => ({ ...p, jobTitle: e.target.value }))} /></FormField>
            <FormField label="Department"><Input value={editForm.department} onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))} /></FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="Phone"><Input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} /></FormField>
            <FormField label="Employee ID"><Input value={editForm.employeeId} onChange={(e) => setEditForm((p) => ({ ...p, employeeId: e.target.value }))} /></FormField>
          </div>
          <FormField label="Hire Date"><Input type="date" value={editForm.hireDate} onChange={(e) => setEditForm((p) => ({ ...p, hireDate: e.target.value }))} /></FormField>
          <SubmitButton loading={saving}>Save Changes</SubmitButton>
        </form>
      </Modal>

      {/* Permissions modal */}
      <Modal open={permModal} onClose={() => setPermModal(false)} title={`Permissions — ${permTarget?.firstName ?? ""} ${permTarget?.lastName ?? ""}`} width={520}>
        <p style={{ fontSize: 12, color: "#71717a", marginBottom: 16 }}>
          Fine-tune access beyond the {ROLE_LABEL[permTarget?.role || ""] || "role"} default. Toggle individual permissions on or off.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 360, overflowY: "auto", marginBottom: 20 }}>
          {permissions.map((p) => {
            const active = grant.has(p);
            return (
              <label key={p} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, background: active ? "rgba(245,158,11,0.08)" : "transparent", cursor: "pointer", fontSize: 12, color: active ? "#f59e0b" : "#a1a1aa" }}>
                <input
                  type="checkbox" checked={active}
                  onChange={() => setGrant((prev) => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; })}
                />
                {p}
              </label>
            );
          })}
        </div>
        <button onClick={savePermissions} style={{ width: "100%", padding: "12px 24px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 10, color: "#09090b", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Save Permissions
        </button>
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setGrant(new Set(permissions))} style={{ fontSize: 11, color: "#71717a", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}><RotateCcw style={{ width: 10, height: 10, display: "inline", marginRight: 4 }} />Grant all</button>
          <button onClick={() => setGrant(new Set())} style={{ fontSize: 11, color: "#71717a", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Revoke all</button>
        </div>
      </Modal>
    </div>
  );
}
