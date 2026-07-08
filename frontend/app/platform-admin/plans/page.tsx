"use client";

import React from "react";
import { Loader2, Save, Percent, Tag } from "lucide-react";
import { platformApi } from "@/lib/platformApi";

type Plan = {
  id: number; key: string; name: string; tagline: string;
  priceMonthly: number; maxUsers: number | null; overagePricePerUser: number | null;
  allowOverage: boolean; discountPercent: number; discountFlatAmount: number;
  discountLabel: string | null; discountActive: boolean; isTrial: boolean; trialDays: number;
  features: Record<string, boolean>; isActive: boolean;
};

const CARD: React.CSSProperties = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 22 };
const FIELD_LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a1a1aa", marginBottom: 6, display: "block" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fafafa", fontSize: 13, outline: "none", boxSizing: "border-box" };

export default function PlatformPlansPage() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [featureLabels, setFeatureLabels] = React.useState<Record<string, string>>({});
  const [featureKeys, setFeatureKeys] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [savedKey, setSavedKey] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await platformApi.get<{ plans: Plan[]; featureKeys: string[]; featureLabels: Record<string, string> }>("/plans");
      setPlans(res.plans);
      setFeatureKeys(res.featureKeys);
      setFeatureLabels(res.featureLabels);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  function updateLocal(key: string, patch: Partial<Plan>) {
    setPlans((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  function toggleFeature(key: string, featureKey: string) {
    setPlans((prev) => prev.map((p) => (p.key === key ? { ...p, features: { ...p.features, [featureKey]: !p.features[featureKey] } } : p)));
  }

  async function handleSave(plan: Plan) {
    setSavingKey(plan.key);
    setSavedKey(null);
    setError("");
    try {
      await platformApi.patch(`/plans/${plan.id}`, {
        name: plan.name,
        tagline: plan.tagline,
        priceMonthly: plan.priceMonthly,
        maxUsers: plan.maxUsers,
        overagePricePerUser: plan.overagePricePerUser,
        allowOverage: plan.allowOverage,
        discountPercent: plan.discountPercent,
        discountFlatAmount: plan.discountFlatAmount,
        discountLabel: plan.discountLabel,
        discountActive: plan.discountActive,
        trialDays: plan.trialDays,
        features: plan.features,
      });
      setSavedKey(plan.key);
      setTimeout(() => setSavedKey(null), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save plan.");
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) return <p style={{ color: "#71717a", fontSize: 13 }}>Loading plans…</p>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4, fontFamily: "'Playfair Display',Georgia,serif" }}>Plans & Pricing</h1>
      <p style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 24 }}>
        Configure pricing, discounts, user limits, overage cost, and feature access for each SaaS tier.
      </p>

      {error && (
        <div style={{ marginBottom: 20, padding: 14, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13 }}>{error}</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {plans.sort((a, b) => (a.isTrial ? -1 : 1)).map((plan) => (
          <div key={plan.key} style={CARD}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{plan.name}</div>
                <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{plan.key}</div>
              </div>
              {plan.isTrial && <span style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", background: "rgba(34,197,94,0.12)", padding: "4px 10px", borderRadius: 999 }}>TRIAL</span>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={FIELD_LABEL}>Plan Name</label>
              <input style={inputStyle} value={plan.name} onChange={(e) => updateLocal(plan.key, { name: e.target.value })} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={FIELD_LABEL}>Tagline</label>
              <input style={inputStyle} value={plan.tagline || ""} onChange={(e) => updateLocal(plan.key, { tagline: e.target.value })} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={FIELD_LABEL}>Price ($/month)</label>
                <input type="number" min={0} style={inputStyle} value={plan.priceMonthly} onChange={(e) => updateLocal(plan.key, { priceMonthly: Number(e.target.value) })} />
              </div>
              <div>
                <label style={FIELD_LABEL}>Max Users {plan.isTrial && "(blank = unlimited)"}</label>
                <input
                  type="number" min={0} style={inputStyle}
                  value={plan.maxUsers ?? ""}
                  placeholder="Unlimited"
                  onChange={(e) => updateLocal(plan.key, { maxUsers: e.target.value === "" ? null : Number(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={FIELD_LABEL}>Overage $/extra user</label>
                <input type="number" min={0} style={inputStyle} value={plan.overagePricePerUser ?? ""} placeholder="Platform default"
                  onChange={(e) => updateLocal(plan.key, { overagePricePerUser: e.target.value === "" ? null : Number(e.target.value) })} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 9 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#a1a1aa" }}>
                  <input type="checkbox" checked={plan.allowOverage} onChange={(e) => updateLocal(plan.key, { allowOverage: e.target.checked })} />
                  Allow paid overage
                </label>
              </div>
            </div>

            <div style={{ marginBottom: 14, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 11, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <Tag style={{ width: 12, height: 12 }} /> Discount
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={FIELD_LABEL}><Percent style={{ width: 10, height: 10, display: "inline", marginRight: 4 }} />Percent off</label>
                  <input type="number" min={0} max={100} style={inputStyle} value={plan.discountPercent} onChange={(e) => updateLocal(plan.key, { discountPercent: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={FIELD_LABEL}>Flat $ off</label>
                  <input type="number" min={0} style={inputStyle} value={plan.discountFlatAmount} onChange={(e) => updateLocal(plan.key, { discountFlatAmount: Number(e.target.value) })} />
                </div>
              </div>
              <input style={{ ...inputStyle, marginBottom: 10 }} placeholder="Discount label, e.g. Launch Offer" value={plan.discountLabel || ""} onChange={(e) => updateLocal(plan.key, { discountLabel: e.target.value })} />
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#a1a1aa" }}>
                <input type="checkbox" checked={plan.discountActive} onChange={(e) => updateLocal(plan.key, { discountActive: e.target.checked })} />
                Discount active
              </label>
            </div>

            {plan.isTrial && (
              <div style={{ marginBottom: 14 }}>
                <label style={FIELD_LABEL}>Trial length (days)</label>
                <input type="number" min={1} style={inputStyle} value={plan.trialDays} onChange={(e) => updateLocal(plan.key, { trialDays: Number(e.target.value) })} />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={FIELD_LABEL}>Features Included</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {featureKeys.map((fk) => (
                  <label key={fk} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: plan.features[fk] ? "#fafafa" : "#71717a" }}>
                    <input type="checkbox" checked={!!plan.features[fk]} onChange={() => toggleFeature(plan.key, fk)} />
                    {featureLabels[fk] || fk}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleSave(plan)}
              disabled={savingKey === plan.key}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "10px 20px", background: savedKey === plan.key ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg,#6366f1,#4338ca)",
                border: savedKey === plan.key ? "1px solid rgba(34,197,94,0.3)" : "none", borderRadius: 10,
                color: savedKey === plan.key ? "#4ade80" : "#fff", fontSize: 13, fontWeight: 700,
                cursor: savingKey === plan.key ? "not-allowed" : "pointer", opacity: savingKey === plan.key ? 0.7 : 1,
              }}
            >
              {savingKey === plan.key ? (<><Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> Saving…</>) : savedKey === plan.key ? "Saved!" : (<><Save style={{ width: 14, height: 14 }} /> Save Plan</>)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
