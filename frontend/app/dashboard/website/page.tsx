"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { THEME_PRESETS, getTheme } from "@/lib/themes";
import { Sparkles, Loader2, ExternalLink, Globe, CheckCircle2, MessageCircle, LayoutTemplate, Palette, Link2 } from "lucide-react";
import { InstagramIcon, FacebookIcon } from "@/components/ui/SocialIcons";
import ImageUploader from "@/components/ui/ImageUploader";
import PageBuilder from "@/components/ui/PageBuilder";
import DomainSettings from "@/components/ui/DomainSettings";
import { Block } from "@/lib/blocks";

type Website = {
  slug: string; theme: string;
  heroTitle: string | null; heroSubtitle: string | null; aboutText: string | null;
  servicesIntro: string | null; contactMessage: string | null; seoDescription: string | null;
  heroImageUrl?: string | null; logoUrl?: string | null;
  isPublished: boolean;
  bookingEnabled?: boolean;
  socialLinks?: string | null;
  customDomain: string | null;
  domainStatus: "none" | "pending" | "verified";
  domainVerificationToken: string | null;
};

const SITE_BASE = typeof window !== "undefined" ? window.location.origin : "";

function currentStudioId(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  if (!token) return null;
  try { return String(JSON.parse(atob(token.split(".")[1])).studioId); } catch { return null; }
}

const TABS = [
  { id: "content", label: "Content & Theme", icon: Palette },
  { id: "builder", label: "Page Builder", icon: LayoutTemplate },
  { id: "domain", label: "Domain", icon: Link2 },
] as const;
type TabId = typeof TABS[number]["id"];

export default function WebsiteBuilderPage() {
  const [tab, setTab] = useState<TabId>("content");
  const [site, setSite] = useState<Website | null>(null);
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [context, setContext] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [social, setSocial] = useState({ instagram: "", facebook: "", whatsapp: "" });
  const [studioMeta, setStudioMeta] = useState({ category: "", description: "" });

  const load = () => {
    setLoading(true); setError("");
    const studioId = currentStudioId();
    Promise.all([
      api.get<Website>("/website"),
      api.get<Block[]>("/website/blocks"),
      studioId ? api.get<{ category?: string; description?: string }>(`/studios/${studioId}`) : Promise.resolve(null),
    ]).then(([s, b, studio]) => {
      setSite(s);
      setBlocks(b);
      try { setSocial({ instagram: "", facebook: "", whatsapp: "", ...(s.socialLinks ? JSON.parse(s.socialLinks) : {}) }); } catch {}
      if (studio) setStudioMeta({ category: studio.category || "", description: studio.description || "" });
    }).catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load website. Is the server running?"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true); setError("");
    try {
      const s = await api.post<Website>("/website/generate", { extraContext: context });
      setSite(s);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Generation failed"); }
    finally { setGenerating(false); }
  };

  const save = async () => {
    if (!site) return;
    setSaving(true); setSaved(false); setError("");
    try {
      const studioId = currentStudioId();
      const [s] = await Promise.all([
        api.put<Website>("/website", { ...site, socialLinks: social }),
        studioId ? api.put(`/studios/${studioId}`, studioMeta) : Promise.resolve(),
      ]);
      setSite(s);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const field = (key: keyof Website) => ({
    value: (site?.[key] as string) || "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setSite((p) => (p ? { ...p, [key]: e.target.value } : p)),
  });

  if (loading) return <div style={{ padding: 32, color: "#71717a" }}><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /></div>;
  if (!site) return null;

  const theme = getTheme(site.theme);

  return (
    <div style={{ padding: "32px" }}>
      <p style={{ fontSize: 12, color: "#71717a", marginBottom: 16 }}>
        Your studio&apos;s public website — attractive by default, fully yours to customize: AI-drafted copy, a drag-and-drop
        page builder, a linked booking widget, and your own domain.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
              background: "none", border: "none", borderBottom: active ? "2px solid #f59e0b" : "2px solid transparent",
              color: active ? "#f59e0b" : "#a1a1aa", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              <Icon style={{ width: 14, height: 14 }} /> {t.label}
            </button>
          );
        })}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {site.isPublished && (
            <a href={`/site/${site.slug}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#f59e0b", textDecoration: "none", fontWeight: 600 }}>
              <ExternalLink style={{ width: 14, height: 14 }} /> View Live Site
            </a>
          )}
        </div>
      </div>

      {error && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 16 }}>{error}</p>}

      {tab === "builder" && blocks && site && (
        <div style={{ maxWidth: "100%" }}>
          <PageBuilder initialBlocks={blocks} site={site as any} />
        </div>
      )}

      {tab === "domain" && (
        <DomainSettings site={site} onUpdated={(s) => setSite((p) => p ? { ...p, ...s } : p)} />
      )}

      {tab === "content" && (
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 420px", gap: 24, alignItems: "start" }}>
        {/* ── Left: editor ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* AI generate box */}
          <div style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(255,255,255,0.02))", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles style={{ width: 16, height: 16, color: "#09090b" }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>AI Website Generator</div>
            </div>
            <textarea
              value={context} onChange={(e) => setContext(e.target.value)}
              placeholder="Optional: tell the AI anything specific — your vibe, specialty, target clients…"
              rows={2}
              style={{ width: "100%", padding: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fafafa", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 12 }}
            />
            <button onClick={generate} disabled={generating} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 10, color: "#09090b", fontWeight: 700, fontSize: 12, cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.7 : 1 }}>
              {generating ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Sparkles style={{ width: 14, height: 14 }} />}
              {site.heroTitle ? "Regenerate with AI" : "Generate My Website"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
            <Field label="Category"><input style={INPUT} value={studioMeta.category} onChange={(e) => setStudioMeta((p) => ({ ...p, category: e.target.value }))} placeholder="Wedding & Portrait Photography" /></Field>
            <Field label="Studio Description (for AI context)"><input style={INPUT} value={studioMeta.description} onChange={(e) => setStudioMeta((p) => ({ ...p, description: e.target.value }))} placeholder="15 years photographing weddings across Sri Lanka…" /></Field>
          </div>

          {/* Theme picker */}
          <div>
            <label style={LABEL}>Theme</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 8 }}>
              {THEME_PRESETS.map((t) => (
                <button key={t.id} onClick={() => setSite((p) => p ? { ...p, theme: t.id } : p)}
                  style={{
                    padding: 10, borderRadius: 12, cursor: "pointer", textAlign: "left",
                    border: site.theme === t.id ? "2px solid #f59e0b" : "1px solid rgba(255,255,255,0.1)",
                    background: t.bg,
                  }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: t.primary }} />
                    <span style={{ width: 14, height: 14, borderRadius: "50%", background: t.accent }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: t.text }}>{t.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <ImageUploader label="Logo" value={site.logoUrl} onChange={(url) => setSite((p) => p ? { ...p, logoUrl: url } : p)} aspect="1/1" />
            <ImageUploader label="Hero Background Image" value={site.heroImageUrl} onChange={(url) => setSite((p) => p ? { ...p, heroImageUrl: url } : p)} aspect="16/9" />
          </div>

          {/* Content fields */}
          <Field label="Hero Title"><input style={INPUT} {...field("heroTitle")} placeholder="Timeless Stories, Beautifully Told" /></Field>
          <Field label="Hero Subtitle"><input style={INPUT} {...field("heroSubtitle")} placeholder="Wedding & portrait photography in Colombo" /></Field>
          <Field label="About"><textarea style={{ ...INPUT, minHeight: 80 }} {...field("aboutText")} /></Field>
          <Field label="Services Intro"><input style={INPUT} {...field("servicesIntro")} /></Field>
          <Field label="Contact Message"><input style={INPUT} {...field("contactMessage")} /></Field>
          <Field label="SEO Description"><input style={INPUT} {...field("seoDescription")} maxLength={160} /></Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Instagram"><input style={INPUT} value={social.instagram} onChange={(e) => setSocial((p) => ({ ...p, instagram: e.target.value }))} placeholder="@yourstudio" /></Field>
            <Field label="Facebook"><input style={INPUT} value={social.facebook} onChange={(e) => setSocial((p) => ({ ...p, facebook: e.target.value }))} placeholder="facebook.com/…" /></Field>
            <Field label="WhatsApp"><input style={INPUT} value={social.whatsapp} onChange={(e) => setSocial((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="+94771234567" /></Field>
          </div>

          <Field label="Website URL slug">
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#71717a" }}>
              <span>{SITE_BASE}/site/</span>
              <input style={{ ...INPUT, flex: 1 }} value={site.slug} onChange={(e) => setSite((p) => p ? { ...p, slug: e.target.value } : p)} />
            </div>
          </Field>

          <ToggleRow
            title="Online booking widget"
            subtitle="Let visitors request a session directly — it creates a real (pending) booking for you to confirm"
            checked={!!site.bookingEnabled}
            onChange={(v) => setSite((p) => p ? { ...p, bookingEnabled: v } : p)}
          />

          <ToggleRow
            title="Publish website"
            subtitle="Make this site publicly visible at your URL"
            checked={site.isPublished}
            onChange={(v) => setSite((p) => p ? { ...p, isPublished: v } : p)}
          />

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 10, color: "#09090b", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {saving ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : saved ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : null}
              {saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* ── Right: live preview ── */}
        <div style={{ position: "sticky", top: 24 }}>
          <div style={LABEL}>Preview</div>
          <div style={{ marginTop: 8, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", background: theme.bg }}>
            <div style={{ padding: "10px 16px", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: 8 }}>
              <Globe style={{ width: 12, height: 12, color: theme.textMuted }} />
              <span style={{ fontSize: 10, color: theme.textMuted }}>{SITE_BASE}/site/{site.slug}</span>
            </div>
            <div style={{
              padding: 28, textAlign: "center",
              backgroundImage: site.heroImageUrl ? `linear-gradient(${theme.bg}cc, ${theme.bg}cc), url(${site.heroImageUrl})` : undefined,
              backgroundSize: "cover", backgroundPosition: "center",
            }}>
              {site.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.logoUrl} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px" }} />
              )}
              <div style={{ fontFamily: theme.fontHeading, fontSize: 22, fontWeight: 700, color: theme.text, marginBottom: 8, lineHeight: 1.2 }}>
                {site.heroTitle || "Your Hero Title Goes Here"}
              </div>
              <div style={{ fontFamily: theme.fontBody, fontSize: 12, color: theme.textMuted, marginBottom: 16 }}>
                {site.heroSubtitle || "A short, compelling subtitle about your studio."}
              </div>
              <div style={{ display: "inline-block", padding: "8px 20px", borderRadius: 999, background: theme.primary, color: theme.bg, fontSize: 11, fontWeight: 700, marginBottom: 24 }}>
                Book a Session
              </div>
              <div style={{ height: 1, background: `${theme.textMuted}30`, margin: "16px 0" }} />
              <div style={{ fontFamily: theme.fontBody, fontSize: 11, color: theme.textMuted, lineHeight: 1.6 }}>
                {site.aboutText || "Your about section will appear here once generated."}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20 }}>
                {social.instagram && <InstagramIcon style={{ width: 14, height: 14, color: theme.primary }} />}
                {social.facebook && <FacebookIcon style={{ width: 14, height: 14, color: theme.primary }} />}
                {social.whatsapp && <MessageCircle style={{ width: 14, height: 14, color: theme.primary }} />}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

const LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a1a1aa" };
const INPUT: React.CSSProperties = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fafafa", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={LABEL}>{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({ title, subtitle, checked, onChange }: { title: string; subtitle: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{title}</div>
        <div style={{ fontSize: 11, color: "#71717a" }}>{subtitle}</div>
      </div>
      <label style={{ position: "relative", display: "inline-block", width: 42, height: 24, cursor: "pointer" }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{ position: "absolute", inset: 0, borderRadius: 24, background: checked ? "#f59e0b" : "rgba(255,255,255,0.15)", transition: "background 0.2s" }} />
        <span style={{ position: "absolute", top: 3, left: checked ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
      </label>
    </div>
  );
}
