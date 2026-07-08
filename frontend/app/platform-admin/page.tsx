"use client";

import React from "react";
import { Cpu, MemoryStick, Activity, Building2, AlertTriangle } from "lucide-react";
import { platformApi } from "@/lib/platformApi";

type SystemMetrics = {
  cpu: { cores: number; usagePercent: number | null; loadAverage1m: number };
  memory: { totalMB: number; usedMB: number; freeMB: number; usagePercent: number };
  process: { uptimeSeconds: number };
  node: string;
  platform: string;
};

type Studio = {
  id: number; studioName: string; isActive: boolean; staffCount: number;
  subscription: { planName?: string; status?: string; suspendedByAdmin?: boolean } | null;
  usage30d: { requests: number; errors: number };
};

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16, padding: 22,
};

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function PlatformOverviewPage() {
  const [metrics, setMetrics] = React.useState<SystemMetrics | null>(null);
  const [studios, setStudios] = React.useState<Studio[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const [m, s] = await Promise.all([
        platformApi.get<SystemMetrics>("/system-metrics"),
        platformApi.get<Studio[]>("/studios"),
      ]);
      setMetrics(m);
      setStudios(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // live-ish refresh
    return () => clearInterval(interval);
  }, [load]);

  const totalRequests = studios.reduce((sum, s) => sum + (s.usage30d?.requests || 0), 0);
  const activeStudios = studios.filter((s) => s.isActive).length;
  const suspended = studios.filter((s) => s.subscription?.suspendedByAdmin).length;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4, fontFamily: "'Playfair Display',Georgia,serif" }}>
        Platform Overview
      </h1>
      <p style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 28 }}>
        Server resource usage and studio account health at a glance.
      </p>

      {error && (
        <div style={{ marginBottom: 20, padding: 14, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <div style={CARD}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#818cf8", marginBottom: 10 }}>
            <Building2 style={{ width: 16, height: 16 }} /> <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Studios</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>{loading ? "—" : studios.length}</div>
          <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>{activeStudios} active · {suspended} suspended</div>
        </div>

        <div style={CARD}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#4ade80", marginBottom: 10 }}>
            <Activity style={{ width: 16, height: 16 }} /> <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>API Requests (30d)</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>{loading ? "—" : totalRequests.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>across all studios</div>
        </div>

        <div style={CARD}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f59e0b", marginBottom: 10 }}>
            <Cpu style={{ width: 16, height: 16 }} /> <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Server CPU</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>
            {metrics?.cpu.usagePercent != null ? `${metrics.cpu.usagePercent}%` : "—"}
          </div>
          <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>{metrics?.cpu.cores ?? "—"} cores · load {metrics?.cpu.loadAverage1m?.toFixed(2) ?? "—"}</div>
        </div>

        <div style={CARD}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f472b6", marginBottom: 10 }}>
            <MemoryStick style={{ width: 16, height: 16 }} /> <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Server RAM</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>{metrics ? `${metrics.memory.usagePercent}%` : "—"}</div>
          <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>
            {metrics ? `${(metrics.memory.usedMB / 1024).toFixed(1)}GB / ${(metrics.memory.totalMB / 1024).toFixed(1)}GB` : "—"}
          </div>
        </div>
      </div>

      <div style={{ ...CARD, marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: "#71717a", display: "flex", gap: 24, flexWrap: "wrap" }}>
          <span>Node: <strong style={{ color: "#e4e4e7" }}>{metrics?.node ?? "—"}</strong></span>
          <span>Platform: <strong style={{ color: "#e4e4e7" }}>{metrics?.platform ?? "—"}</strong></span>
          <span>Process uptime: <strong style={{ color: "#e4e4e7" }}>{metrics ? formatUptime(metrics.process.uptimeSeconds) : "—"}</strong></span>
        </div>
        <p style={{ fontSize: 11, color: "#52525b", marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <AlertTriangle style={{ width: 12, height: 12 }} />
          All studios share this single backend process, so CPU/RAM is reported at the server level. Per-studio load is shown via API request volume below.
        </p>
      </div>

      {/* Top studios by request volume */}
      <div style={CARD}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fafafa", marginBottom: 16 }}>Studio API Usage (Last 30 Days)</h2>
        {loading ? (
          <p style={{ fontSize: 13, color: "#71717a" }}>Loading…</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#71717a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th style={{ paddingBottom: 10 }}>Studio</th>
                <th style={{ paddingBottom: 10 }}>Plan</th>
                <th style={{ paddingBottom: 10 }}>Staff</th>
                <th style={{ paddingBottom: 10 }}>Requests</th>
                <th style={{ paddingBottom: 10 }}>Errors</th>
              </tr>
            </thead>
            <tbody>
              {[...studios].sort((a, b) => (b.usage30d?.requests || 0) - (a.usage30d?.requests || 0)).map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "10px 0", color: "#fafafa" }}>{s.studioName}</td>
                  <td style={{ color: "#a1a1aa" }}>{s.subscription?.planName || "—"}</td>
                  <td style={{ color: "#a1a1aa" }}>{s.staffCount}</td>
                  <td style={{ color: "#a1a1aa" }}>{s.usage30d?.requests ?? 0}</td>
                  <td style={{ color: s.usage30d?.errors ? "#f87171" : "#a1a1aa" }}>{s.usage30d?.errors ?? 0}</td>
                </tr>
              ))}
              {studios.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "16px 0", color: "#71717a" }}>No studios yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
