"use client";
import React, { useState } from "react";
import { api } from "@/lib/api";
import { Sparkles, Send, Loader2, AlertTriangle, CheckCircle2, Clock, X } from "lucide-react";

type ParseResult = {
  draft: {
    title: string; clientHint: string | null; newClientName: string | null;
    packageHint: string | null; staffHint: string | null; date: string | null;
    startTime: string | null; durationMinutes: number | null; notes: string | null;
    confidence: string; missingInfo: string[];
  };
  resolved: {
    client: { id: number; name: string } | null;
    newClientName: string | null;
    package: { id: number; name: string; price: number; duration: number } | null;
    staff: { id: string; name: string } | null;
    startTime: string | null;
    endTime: string | null;
  };
  conflicts: {
    studioConflicts: { id: number; title: string; startTime: string; endTime: string }[];
    staffConflicts: { id: number; title: string; startTime: string; endTime: string }[];
  } | null;
  suggestedSlots: { startTime: string; endTime: string }[];
};

interface Props {
  onUseDraft: (draft: {
    title: string; clientId?: number; packageId?: number;
    startTime: string; endTime: string; notes?: string;
  }) => void;
  onClose: () => void;
}

const EXAMPLES = [
  "Book a wedding shoot for Nimal Perera next Saturday at 2pm, 3 hours, with the Premium package",
  "Schedule a product shoot tomorrow 10am for 90 minutes",
  "Family portrait session for Anusha this Friday afternoon",
];

export default function AiBookingAssistant({ onUseDraft, onClose }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);

  const submit = async (value?: string) => {
    const q = value ?? text;
    if (!q.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await api.post<ParseResult>("/ai/parse-booking", { text: q });
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (dt: string) => new Date(dt).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const applyDraft = (startTime: string, endTime: string) => {
    if (!result) return;
    onUseDraft({
      title: result.draft.title || "New Booking",
      clientId: result.resolved.client?.id,
      packageId: result.resolved.package?.id,
      startTime, endTime,
      notes: result.draft.notes || undefined,
    });
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(255,255,255,0.02))",
      border: "1px solid rgba(245,158,11,0.25)", borderRadius: 16, padding: 20, marginBottom: 24, position: "relative",
    }}>
      <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "#71717a", cursor: "pointer" }}>
        <X style={{ width: 16, height: 16 }} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles style={{ width: 16, height: 16, color: "#09090b" }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>AI Booking Assistant</div>
          <div style={{ fontSize: 11, color: "#a1a1aa" }}>Describe the booking in plain English — I&apos;ll find the client, package and check for conflicts.</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder='e.g. "Wedding shoot for Nimal next Saturday 2pm, 3 hours"'
          style={{ flex: 1, padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fafafa", fontSize: 13, outline: "none" }}
        />
        <button
          onClick={() => submit()}
          disabled={loading || !text.trim()}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 18px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 12, color: "#09090b", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Send style={{ width: 14, height: 14 }} />}
          Parse
        </button>
      </div>

      {!result && !loading && (
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => { setText(ex); submit(ex); }}
              style={{ fontSize: 11, padding: "5px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#a1a1aa", cursor: "pointer" }}>
              {ex}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} /> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <InfoRow label="Title" value={result.draft.title || "—"} />
            <InfoRow label="Client" value={result.resolved.client?.name || result.resolved.newClientName || "Not matched"} warn={!result.resolved.client && !result.resolved.newClientName} />
            <InfoRow label="Package" value={result.resolved.package?.name || "None specified"} />
            <InfoRow label="Staff" value={result.resolved.staff?.name || "Unassigned"} />
            <InfoRow label="When" value={result.resolved.startTime ? fmt(result.resolved.startTime) : "Not determined"} warn={!result.resolved.startTime} />
            <InfoRow label="Duration" value={result.draft.durationMinutes ? `${result.draft.durationMinutes} min` : "—"} />
          </div>

          {result.draft.missingInfo?.length > 0 && (
            <div style={{ fontSize: 11, color: "#fbbf24", marginBottom: 12 }}>
              ⚠ Missing: {result.draft.missingInfo.join(", ")} — you can fill these in manually after applying.
            </div>
          )}

          {result.conflicts && (result.conflicts.studioConflicts.length > 0 || result.conflicts.staffConflicts.length > 0) ? (
            <div style={{ padding: 14, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#f87171", fontWeight: 700, marginBottom: 8 }}>
                <AlertTriangle style={{ width: 14, height: 14 }} /> Scheduling conflict detected
              </div>
              {[...result.conflicts.studioConflicts, ...result.conflicts.staffConflicts].slice(0, 3).map((c) => (
                <div key={c.id} style={{ fontSize: 11, color: "#a1a1aa", marginBottom: 4 }}>
                  "{c.title}" — {fmt(c.startTime)} to {fmt(c.endTime)}
                </div>
              ))}
              {result.suggestedSlots.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: "#d4d4d8", marginTop: 10, marginBottom: 8 }}>Here are the nearest open slots:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {result.suggestedSlots.map((s) => (
                      <button key={s.startTime} onClick={() => applyDraft(s.startTime, s.endTime)}
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, padding: "6px 10px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 8, color: "#4ade80", cursor: "pointer" }}>
                        <Clock style={{ width: 11, height: 11 }} /> {fmt(s.startTime)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : result.resolved.startTime ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#4ade80", marginBottom: 14 }}>
              <CheckCircle2 style={{ width: 14, height: 14 }} /> No conflicts — this slot is free.
            </div>
          ) : null}

          {result.resolved.startTime && result.resolved.endTime && (!result.conflicts || (result.conflicts.studioConflicts.length === 0 && result.conflicts.staffConflicts.length === 0)) && (
            <button
              onClick={() => applyDraft(result.resolved.startTime!, result.resolved.endTime!)}
              style={{ width: "100%", padding: "12px 20px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 10, color: "#09090b", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              Use This Draft — Open Booking Form
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#71717a", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: warn ? "#fbbf24" : "#fafafa", fontWeight: 600 }}>{value}</div>
    </div>
  );
}
