"use client";
import React, { useState } from "react";
import { Globe, Loader2, CheckCircle2, AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

type DomainWebsite = {
  customDomain: string | null;
  domainStatus: "none" | "pending" | "verified";
  domainVerificationToken: string | null;
};

const INPUT: React.CSSProperties = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fafafa", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

export default function DomainSettings({ site, onUpdated }: { site: DomainWebsite; onUpdated: (s: DomainWebsite) => void }) {
  const [domain, setDomain] = useState(site.customDomain || "");
  const [busy, setBusy] = useState<"" | "connect" | "verify" | "remove">("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const connect = async () => {
    setBusy("connect"); setError(""); setNotice("");
    try {
      const s = await api.post<DomainWebsite>("/website/domain", { domain });
      onUpdated(s);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to connect domain"); }
    finally { setBusy(""); }
  };

  const verify = async () => {
    setBusy("verify"); setError(""); setNotice("");
    try {
      const s = await api.post<DomainWebsite>("/website/domain/verify", {});
      onUpdated(s);
      if (s.domainStatus === "verified") setNotice("Domain verified! SSL will be issued automatically once your DNS points here.");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Verification failed"); }
    finally { setBusy(""); }
  };

  const remove = async () => {
    setBusy("remove"); setError("");
    try {
      const s = await api.delete<DomainWebsite>("/website/domain");
      onUpdated(s);
      setDomain("");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to remove domain"); }
    finally { setBusy(""); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
      <p style={{ fontSize: 12, color: "#71717a" }}>
        Connect your own domain (e.g. <code>mystudio.com</code>) so your site doesn&apos;t need to live under our shared URL.
        HTTPS is provisioned automatically for verified domains once DNS is pointed at us.
      </p>

      <div style={{ display: "flex", gap: 10 }}>
        <input style={INPUT} placeholder="mystudio.com" value={domain} onChange={(e) => setDomain(e.target.value)} disabled={!!site.customDomain} />
        {!site.customDomain ? (
          <button onClick={connect} disabled={busy === "connect" || !domain}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 10, color: "#09090b", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
            {busy === "connect" ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Globe style={{ width: 14, height: 14 }} />}
            Connect
          </button>
        ) : (
          <button onClick={remove} disabled={busy === "remove"}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, color: "#f87171", fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
            <Trash2 style={{ width: 14, height: 14 }} /> Remove
          </button>
        )}
      </div>

      {error && <p style={{ fontSize: 12, color: "#f87171" }}>{error}</p>}
      {notice && <p style={{ fontSize: 12, color: "#4ade80" }}>{notice}</p>}

      {site.customDomain && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {site.domainStatus === "verified" ? (
              <><CheckCircle2 style={{ width: 16, height: 16, color: "#4ade80" }} /><span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>Verified & secured</span></>
            ) : (
              <><AlertTriangle style={{ width: 16, height: 16, color: "#f59e0b" }} /><span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>Pending verification</span></>
            )}
          </div>

          {site.domainStatus !== "verified" && (
            <>
              <p style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.6 }}>
                Add these two DNS records at your domain registrar, then click Verify. DNS changes can take a few minutes (occasionally longer) to propagate.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <DnsRow type="TXT" name={`_studioverify.${site.customDomain}`} value={site.domainVerificationToken || ""} />
                <DnsRow type="CNAME" name={site.customDomain} value="sites.yourstudioplatform.com" />
              </div>
              <button onClick={verify} disabled={busy === "verify"}
                style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, color: "#f59e0b", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                {busy === "verify" ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <RefreshCw style={{ width: 14, height: 14 }} />}
                Verify Domain
              </button>
            </>
          )}

          {site.domainStatus === "verified" && (
            <p style={{ fontSize: 12, color: "#a1a1aa" }}>
              Your site is live at <strong style={{ color: "#fafafa" }}>https://{site.customDomain}</strong>. Certificate renewal is automatic — nothing else to do.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DnsRow({ type, name, value }: { type: string; name: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr", gap: 8, fontSize: 12, alignItems: "center", background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "8px 10px" }}>
      <span style={{ fontWeight: 700, color: "#a1a1aa" }}>{type}</span>
      <span style={{ color: "#fafafa", wordBreak: "break-all" }}>{name}</span>
      <span style={{ color: "#f59e0b", wordBreak: "break-all", fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}
