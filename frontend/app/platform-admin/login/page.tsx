"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { setPlatformToken } from "@/lib/platformApi";

const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088/api/v1").replace(/\/$/, "");

export default function PlatformAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/platform/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.message || "Invalid credentials."); setLoading(false); return; }
      setPlatformToken(data.token);
      router.push("/platform-admin");
    } catch {
      setError("Unable to reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#09090b,#0d0f13,#09090b)", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,#6366f1,#4338ca)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px rgba(99,102,241,0.35)", marginBottom: 16 }}>
            <ShieldCheck style={{ width: 26, height: 26, color: "#fff" }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>SaaS Control Center</div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#71717a", marginTop: 4 }}>Super Admin Access Only</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32 }}>
          {error && (
            <div style={{ marginBottom: 20, padding: 14, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
              <AlertCircle style={{ width: 15, height: 15, color: "#f87171", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#f87171" }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#a1a1aa" }}>Admin Email</label>
              <div style={{ position: "relative" }}>
                <Mail style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#71717a" }} />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@studiosaas.com"
                  style={{ width: "100%", padding: "12px 14px 12px 44px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fafafa", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#a1a1aa" }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#71717a" }} />
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "12px 14px 12px 44px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fafafa", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "13px 24px", background: "linear-gradient(135deg,#6366f1,#4338ca)",
              border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4,
            }}>
              {loading ? (<><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Signing in…</>) : "Sign In"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#52525b", marginTop: 20 }}>
          This console is for platform operators only — studio accounts sign in at <a href="/auth/login" style={{ color: "#818cf8" }}>/auth/login</a>.
        </p>
      </div>
    </div>
  );
}
