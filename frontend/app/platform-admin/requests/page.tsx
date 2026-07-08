"use client";

import React from "react";
import { platformApi } from "@/lib/platformApi";
import { CheckCircle2, XCircle, Clock, Building2, AlertCircle } from "lucide-react";

type PlanRequest = {
  id: number;
  studioId: number;
  requestedPlanKey: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  studio?: {
    id: number;
    studioName: string;
    email: string;
  };
};

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  overflow: "hidden",
};

const STATUS_META: Record<string, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  pending:  { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",   label: "Pending",  icon: Clock },
  approved: { color: "#4ade80", bg: "rgba(74,222,128,0.1)",   label: "Approved", icon: CheckCircle2 },
  rejected: { color: "#f87171", bg: "rgba(248,113,113,0.1)",  label: "Rejected", icon: XCircle },
};

export default function PlanRequestsPage() {
  const [requests, setRequests] = React.useState<PlanRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [actionId, setActionId] = React.useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<PlanRequest | null>(null);
  const [adminNotes, setAdminNotes] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "pending" | "approved" | "rejected">("pending");

  const load = React.useCallback(async () => {
    try {
      const data = await platformApi.get<PlanRequest[]>("/plan-requests");
      setRequests(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load plan requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  async function handleApprove(req: PlanRequest) {
    setActionId(req.id);
    setError("");
    try {
      await platformApi.post(`/plan-requests/${req.id}/approve`, {});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve request.");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setActionId(rejectTarget.id);
    setError("");
    try {
      await platformApi.post(`/plan-requests/${rejectTarget.id}/reject`, { adminNotes });
      setRejectTarget(null);
      setAdminNotes("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject request.");
    } finally {
      setActionId(null);
    }
  }

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4, fontFamily: "'Playfair Display',Georgia,serif", display: "flex", alignItems: "center", gap: 12 }}>
            Plan Requests
            {pendingCount > 0 && (
              <span style={{ fontSize: 13, padding: "3px 10px", borderRadius: 999, background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontFamily: "system-ui", fontWeight: 700 }}>
                {pendingCount} pending
              </span>
            )}
          </h1>
          <p style={{ fontSize: 13, color: "#a1a1aa" }}>
            Studios requesting a plan activation or change. Approve or reject each request below.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
          <AlertCircle style={{ width: 16, height: 16 }} />
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["pending", "all", "approved", "rejected"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: filter === tab ? "rgba(99,102,241,0.15)" : "transparent",
              border: filter === tab ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.08)",
              color: filter === tab ? "#fff" : "#a1a1aa",
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div style={CARD}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#71717a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", background: "rgba(255,255,255,0.02)" }}>
              <th style={{ padding: "12px 16px" }}>Studio</th>
              <th style={{ padding: "12px 16px" }}>Requested Plan</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Requested At</th>
              <th style={{ padding: "12px 16px" }}>Admin Notes</th>
              <th style={{ padding: "12px 16px" }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ padding: 20, color: "#71717a" }}>Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 40, color: "#71717a", textAlign: "center" }}>
                  {filter === "pending" ? "No pending requests. 🎉" : "No requests found."}
                </td>
              </tr>
            )}
            {!loading && filtered.map((req) => {
              const meta = STATUS_META[req.status] || STATUS_META.pending;
              const StatusIcon = meta.icon;
              return (
                <tr key={req.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  {/* Studio */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Building2 style={{ width: 15, height: 15, color: "#818cf8" }} />
                      </div>
                      <div>
                        <div style={{ color: "#fafafa", fontWeight: 600 }}>
                          {req.studio?.studioName || `Studio #${req.studioId}`}
                        </div>
                        <div style={{ color: "#71717a", fontSize: 11 }}>{req.studio?.email || ""}</div>
                      </div>
                    </div>
                  </td>

                  {/* Requested Plan */}
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(99,102,241,0.12)", color: "#a5b4fc", fontSize: 12, fontWeight: 600 }}>
                      {req.requestedPlanKey}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 600, width: "fit-content" }}>
                      <StatusIcon style={{ width: 13, height: 13 }} />
                      {meta.label}
                    </div>
                  </td>

                  {/* Date */}
                  <td style={{ padding: "14px 16px", color: "#a1a1aa" }}>
                    {new Date(req.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </td>

                  {/* Admin Notes */}
                  <td style={{ padding: "14px 16px", color: "#71717a", fontSize: 12, maxWidth: 200 }}>
                    {req.adminNotes || <span style={{ color: "#3f3f46" }}>—</span>}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {req.status === "pending" && (
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={actionId === req.id}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                            background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80",
                            opacity: actionId === req.id ? 0.6 : 1,
                          }}
                        >
                          <CheckCircle2 style={{ width: 13, height: 13 }} />
                          {actionId === req.id ? "Approving..." : "Approve"}
                        </button>
                        <button
                          onClick={() => { setRejectTarget(req); setAdminNotes(""); }}
                          disabled={actionId === req.id}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                            background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171",
                            opacity: actionId === req.id ? 0.6 : 1,
                          }}
                        >
                          <XCircle style={{ width: 13, height: 13 }} />
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: 440, boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <XCircle style={{ width: 20, height: 20, color: "#f87171" }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Reject Plan Request</div>
                <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 2 }}>
                  {rejectTarget.studio?.studioName || `Studio #${rejectTarget.studioId}`} — <span style={{ color: "#a5b4fc" }}>{rejectTarget.requestedPlanKey}</span>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "20px 0" }} />

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1aa", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Reason / Notes (optional)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Please contact support to complete the plan upgrade."
              rows={4}
              style={{
                width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, color: "#fafafa", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setRejectTarget(null)}
                style={{ flex: 1, padding: "11px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#a1a1aa", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!!actionId}
                style={{
                  flex: 1, padding: "11px", borderRadius: 10,
                  background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: actionId ? 0.6 : 1,
                }}
              >
                {actionId ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
