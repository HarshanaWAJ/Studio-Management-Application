"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Check, Clock, AlertCircle } from "lucide-react";

type Plan = {
  key: string;
  name: string;
  tagline?: string;
  priceMonthly: number;
  currency: string;
  isTrial: boolean;
  features: Record<string, boolean>;
};

type Subscription = {
  planId: number;
  planName?: string;
  planKey?: string;
  status: string;
  effectivePriceMonthly: number;
  plan: Plan;
};

type PlanRequest = {
  id: number;
  requestedPlanKey: string;
  status: string;
  createdAt: string;
  adminNotes?: string;
};

const CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: 24,
  backdropFilter: "blur(10px)",
};

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [requests, setRequests] = useState<PlanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    // Fetch each independently so a failure in one doesn't block the others
    const [subResult, plansResult, reqResult] = await Promise.allSettled([
      api.get<Subscription>("/subscription/me"),
      api.get<Plan[] | { plans: Plan[] }>("/subscription/plans"),
      api.get<PlanRequest[]>("/subscription/requests"),
    ]);

    if (subResult.status === "fulfilled") {
      setSubscription(subResult.value);
    }

    if (plansResult.status === "fulfilled") {
      // Handle both plain array and wrapped { plans: [...] } shapes
      const raw = plansResult.value;
      const arr = Array.isArray(raw) ? raw : (raw as { plans: Plan[] }).plans ?? [];
      setPlans(arr);
    } else {
      setError("Failed to load available plans: " + (plansResult.reason?.message || "Unknown error"));
    }

    if (reqResult.status === "fulfilled") {
      setRequests(reqResult.value);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRequestUpgrade = async (planKey: string) => {
    setRequesting(planKey);
    setError("");
    setSuccessMsg("");
    try {
      await api.post("/subscription/request-upgrade", { plan: planKey });
      setSuccessMsg(`Your request to change to the ${planKey} plan has been submitted for approval.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to submit plan request");
    } finally {
      setRequesting(null);
    }
  };

  if (loading) return <div style={{ padding: 32, color: "#a1a1aa" }}>Loading subscription data...</div>;

  const pendingRequest = requests.find(r => r.status === "pending");

  return (
    <div style={{ padding: "32px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fafafa", marginBottom: 8, fontFamily: "'Playfair Display',Georgia,serif" }}>
        Subscription & Billing
      </h1>
      <p style={{ fontSize: 14, color: "#a1a1aa", marginBottom: 32 }}>
        Manage your studio's subscription plan. Plan changes require admin approval.
      </p>

      {error && (
        <div style={{ padding: 16, borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", gap: 10, marginBottom: 24 }}>
          <AlertCircle style={{ width: 16, height: 16, color: "#f87171" }} />
          <span style={{ fontSize: 13, color: "#f87171" }}>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: 16, borderRadius: 12, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", display: "flex", gap: 10, marginBottom: 24 }}>
          <Check style={{ width: 16, height: 16, color: "#4ade80" }} />
          <span style={{ fontSize: 13, color: "#4ade80" }}>{successMsg}</span>
        </div>
      )}

      {/* Current Subscription */}
      <div style={{ ...CARD_STYLE, marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 16 }}>Current Plan</h2>
        {subscription ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b" }}>{subscription.plan?.name}</div>
              <div style={{ padding: "4px 8px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", borderRadius: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>
                {subscription.status}
              </div>
            </div>
            <div style={{ fontSize: 14, color: "#a1a1aa", marginBottom: 16 }}>
              {subscription.plan?.tagline}
            </div>
            <div style={{ fontSize: 18, color: "#fff" }}>
              ${subscription.effectivePriceMonthly} / month
            </div>
          </div>
        ) : (
          <div style={{ color: "#a1a1aa" }}>No active subscription found.</div>
        )}
      </div>

      {/* Pending Request Banner */}
      {pendingRequest && (
        <div style={{ padding: 16, borderRadius: 12, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", gap: 12, alignItems: "center", marginBottom: 32 }}>
          <Clock style={{ width: 20, height: 20, color: "#f59e0b" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#f59e0b" }}>Pending Request: {pendingRequest.requestedPlanKey}</div>
            <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 2 }}>
              Requested on {new Date(pendingRequest.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Available Plans</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        {plans.map((p) => {
          const isCurrent = subscription?.plan?.key === p.key;
          const isPending = pendingRequest?.requestedPlanKey === p.key;

          return (
            <div key={p.key} style={{ ...CARD_STYLE, border: isCurrent ? "2px solid #f59e0b" : CARD_STYLE.border, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{p.name}</div>
              <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4, minHeight: 36 }}>{p.tagline}</div>
              <div style={{ margin: "20px 0", fontSize: 28, fontWeight: 700, color: "#fff" }}>
                ${p.priceMonthly} <span style={{ fontSize: 14, color: "#71717a", fontWeight: 400 }}>/ mo</span>
              </div>

              <div style={{ flex: 1 }}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {Object.entries(p.features).slice(0, 5).map(([key, enabled]) => (
                    <li key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: enabled ? "#d4d4d8" : "#52525b" }}>
                      <Check style={{ width: 16, height: 16, color: enabled ? "#4ade80" : "#52525b" }} />
                      <span style={{ fontSize: 13, textDecoration: enabled ? "none" : "line-through" }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: 24 }}>
                {isCurrent ? (
                  <button disabled style={{ width: "100%", padding: "12px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                    Current Plan
                  </button>
                ) : isPending ? (
                  <button disabled style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", color: "#a1a1aa", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                    Request Pending...
                  </button>
                ) : (
                  <button 
                    onClick={() => handleRequestUpgrade(p.key)}
                    disabled={!!pendingRequest || requesting === p.key}
                    style={{ 
                      width: "100%", padding: "12px", 
                      background: !!pendingRequest ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#f59e0b,#d97706)", 
                      color: !!pendingRequest ? "#a1a1aa" : "#09090b", 
                      border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: !!pendingRequest ? "not-allowed" : "pointer" 
                    }}>
                    {requesting === p.key ? "Requesting..." : `Request ${p.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
