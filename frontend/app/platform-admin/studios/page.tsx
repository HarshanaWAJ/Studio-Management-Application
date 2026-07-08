"use client";

import React from "react";
import { Search, Settings2, Ban, CheckCircle2 } from "lucide-react";
import { platformApi } from "@/lib/platformApi";
import { Modal, FormField, Input, Select, SubmitButton } from "@/components/ui/Modal";

type Studio = {
  id: number; studioName: string; email: string; phone: string; isActive: boolean;
  staffCount: number; createdAt: string;
  subscription: {
    planKey?: string; planName?: string; status?: string; trialEndsAt?: string;
    extraUserSlots?: number; suspendedByAdmin?: boolean; effectivePriceMonthly?: number;
  } | null;
  usage30d: { requests: number; errors: number };
};

type Plan = { id: number; key: string; name: string };

const CARD: React.CSSProperties = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" };

export default function PlatformStudiosPage() {
  const [studios, setStudios] = React.useState<Studio[]>([]);
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [error, setError] = React.useState("");

  const [manageTarget, setManageTarget] = React.useState<Studio | null>(null);
  const [planChoice, setPlanChoice] = React.useState("");
  const [extraSeats, setExtraSeats] = React.useState(0);
  const [discountPercent, setDiscountPercent] = React.useState<string>("");
  const [discountFlat, setDiscountFlat] = React.useState<string>("");
  const [discountNote, setDiscountNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const [s, p] = await Promise.all([
        platformApi.get<Studio[]>("/studios"),
        platformApi.get<{ plans: Plan[] }>("/plans"),
      ]);
      setStudios(s);
      setPlans(p.plans);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load studios.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filtered = q
    ? studios.filter((s) => s.studioName.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase()))
    : studios;

  function openManage(studio: Studio) {
    setManageTarget(studio);
    setPlanChoice(studio.subscription?.planKey || "");
    setExtraSeats(studio.subscription?.extraUserSlots || 0);
    setDiscountPercent("");
    setDiscountFlat("");
    setDiscountNote("");
    setSaveError("");
  }

  async function toggleActive(studio: Studio) {
    try {
      await platformApi.patch(`/studios/${studio.id}/status`, { isActive: !studio.isActive });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update studio status.");
    }
  }

  async function toggleSuspended(studio: Studio) {
    try {
      await platformApi.patch(`/studios/${studio.id}/suspend`, {
        suspended: !studio.subscription?.suspendedByAdmin,
        reason: studio.subscription?.suspendedByAdmin ? null : "Suspended by Super Admin",
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update suspension.");
    }
  }

  async function handleSave() {
    if (!manageTarget) return;
    setSaving(true);
    setSaveError("");
    try {
      if (planChoice && planChoice !== manageTarget.subscription?.planKey) {
        await platformApi.patch(`/studios/${manageTarget.id}/plan`, { plan: planChoice });
      }
      if (extraSeats !== (manageTarget.subscription?.extraUserSlots || 0)) {
        await platformApi.patch(`/studios/${manageTarget.id}/extra-seats`, { extraUserSlots: extraSeats });
      }
      if (discountPercent !== "" || discountFlat !== "" || discountNote !== "") {
        await platformApi.patch(`/studios/${manageTarget.id}/discount`, {
          discountPercentOverride: discountPercent === "" ? undefined : Number(discountPercent),
          discountFlatAmountOverride: discountFlat === "" ? undefined : Number(discountFlat),
          discountNote: discountNote || undefined,
        });
      }
      setManageTarget(null);
      load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4, fontFamily: "'Playfair Display',Georgia,serif" }}>Studios</h1>
      <p style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 24 }}>
        Manage studio accounts, plans, discounts, and seats. Client, booking, and gallery data stay private to each studio.
      </p>

      {error && (
        <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13 }}>{error}</div>
      )}

      <div style={{ position: "relative", marginBottom: 16, maxWidth: 320 }}>
        <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#71717a" }} />
        <input
          value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search studios…"
          style={{ width: "100%", padding: "9px 12px 9px 34px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fafafa", fontSize: 13, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      <div style={CARD}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#71717a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", background: "rgba(255,255,255,0.02)" }}>
              <th style={{ padding: "12px 16px" }}>Studio</th>
              <th style={{ padding: "12px 16px" }}>Plan</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Staff</th>
              <th style={{ padding: "12px 16px" }}>Requests (30d)</th>
              <th style={{ padding: "12px 16px" }}>Est. Price</th>
              <th style={{ padding: "12px 16px" }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} style={{ padding: 20, color: "#71717a" }}>Loading…</td></tr>
            )}
            {!loading && filtered.map((s) => (
              <tr key={s.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ color: "#fafafa", fontWeight: 600 }}>{s.studioName}</div>
                  <div style={{ color: "#71717a", fontSize: 11 }}>{s.email}</div>
                </td>
                <td style={{ padding: "12px 16px", color: "#a1a1aa" }}>{s.subscription?.planName || "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  {!s.isActive ? (
                    <span style={{ color: "#f87171", fontSize: 12, fontWeight: 600 }}>Deactivated</span>
                  ) : s.subscription?.suspendedByAdmin ? (
                    <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: 600 }}>Suspended</span>
                  ) : (
                    <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 600 }}>{s.subscription?.status || "active"}</span>
                  )}
                </td>
                <td style={{ padding: "12px 16px", color: "#a1a1aa" }}>{s.staffCount}</td>
                <td style={{ padding: "12px 16px", color: "#a1a1aa" }}>{s.usage30d?.requests ?? 0}</td>
                <td style={{ padding: "12px 16px", color: "#a1a1aa" }}>
                  {s.subscription?.effectivePriceMonthly != null ? `$${s.subscription.effectivePriceMonthly.toFixed(2)}/mo` : "—"}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <button onClick={() => openManage(s)} title="Manage plan / seats / discount" style={iconBtnStyle}>
                    <Settings2 style={{ width: 15, height: 15 }} />
                  </button>
                  <button onClick={() => toggleSuspended(s)} title={s.subscription?.suspendedByAdmin ? "Unsuspend" : "Suspend"} style={iconBtnStyle}>
                    {s.subscription?.suspendedByAdmin ? <CheckCircle2 style={{ width: 15, height: 15, color: "#4ade80" }} /> : <Ban style={{ width: 15, height: 15, color: "#fbbf24" }} />}
                  </button>
                  <button onClick={() => toggleActive(s)} title={s.isActive ? "Deactivate account" : "Reactivate account"} style={iconBtnStyle}>
                    {s.isActive ? <Ban style={{ width: 15, height: 15, color: "#f87171" }} /> : <CheckCircle2 style={{ width: 15, height: 15, color: "#4ade80" }} />}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 20, color: "#71717a" }}>No studios found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!manageTarget} onClose={() => setManageTarget(null)} title={`Manage ${manageTarget?.studioName || ""}`} width={480}>
        {saveError && (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 12 }}>{saveError}</div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <FormField label="Subscription Plan">
            <Select value={planChoice} onChange={(e) => setPlanChoice(e.target.value)}>
              <option value="">— No change —</option>
              {plans.map((p) => <option key={p.id} value={p.key}>{p.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Extra Purchased Seats (beyond plan limit)">
            <Input type="number" min={0} value={extraSeats} onChange={(e) => setExtraSeats(Number(e.target.value))} />
          </FormField>
          <FormField label="Discount % Override (optional)">
            <Input type="number" min={0} max={100} placeholder="e.g. 15" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
          </FormField>
          <FormField label="Flat $ Discount Override (optional)">
            <Input type="number" min={0} placeholder="e.g. 5" value={discountFlat} onChange={(e) => setDiscountFlat(e.target.value)} />
          </FormField>
          <FormField label="Discount Note (optional)">
            <Input value={discountNote} onChange={(e) => setDiscountNote(e.target.value)} placeholder="e.g. Loyalty discount" />
          </FormField>
          <SubmitButton loading={saving}>Save Changes</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)", marginLeft: 6, cursor: "pointer",
};
