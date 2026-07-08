"use client";
import React, { useState, useEffect } from "react";
import { Camera, MapPin, Mail, Phone, MessageCircle, Loader2, CheckCircle2, Send, Calendar } from "lucide-react";
import { InstagramIcon, FacebookIcon } from "@/components/ui/SocialIcons";
import { getTheme } from "@/lib/themes";
import { Block } from "@/lib/blocks";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type SiteData = {
  slug: string;
  theme: ReturnType<typeof getTheme>;
  heroTitle?: string | null; heroSubtitle?: string | null; heroImageUrl?: string | null; logoUrl?: string | null;
  aboutText?: string | null;
  servicesIntro?: string | null; contactMessage?: string | null;
  socialLinks?: { instagram?: string; facebook?: string; whatsapp?: string } | null;
  blocks?: Block[];
  bookingEnabled?: boolean;
  customDomain?: string | null;
  studio: { name: string; email: string; phone: string; address: string; category: string };
  packages: { id: number; name: string; description: string; price: number; duration: number }[];
  gallery: { id: number; title: string; coverPhoto: string | null; photos: string[] }[];
};

export type LayoutOptions = {
  textAlign?: "left" | "center" | "right";
  containerSize?: "sm" | "md" | "lg" | "full";
};

export function getLayoutStyles(layout?: LayoutOptions, defaultMaxWidth: number | string = 1000, defaultAlign: "left" | "center" | "right" = "left") {
  const maxWidth = layout?.containerSize === "sm" ? 640 : layout?.containerSize === "md" ? 860 : layout?.containerSize === "lg" ? 1200 : layout?.containerSize === "full" ? "100%" : defaultMaxWidth;
  const textAlign = layout?.textAlign || defaultAlign;
  return { maxWidth, textAlign } as const;
}

export function BlockRenderer({ block, site, theme: t }: { block: Block; site: SiteData; theme: ReturnType<typeof getTheme> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = block.data as Record<string, any>;
  switch (block.type) {
    case "hero":
      return <HeroSection theme={t} title={d.title} subtitle={d.subtitle} imageUrl={d.imageUrl || site.heroImageUrl} category={site.studio?.category} buttonText={d.buttonText || "Get In Touch"} buttonTarget={d.buttonTarget || "#contact"} layout={d} />;
    case "about":
      return <TextImageSection theme={t} heading={d.heading} text={d.text} imageUrl={d.imageUrl} imagePosition="right" layout={d} />;
    case "text-image":
      return <TextImageSection theme={t} heading={d.heading} text={d.text} imageUrl={d.imageUrl} imagePosition={d.imagePosition || "right"} layout={d} />;
    case "services":
      return <ServicesSection theme={t} heading={d.heading || "Services"} intro={d.intro} packages={site.packages || []} layout={d} />;
    case "gallery":
      return <GallerySection theme={t} heading={d.heading || "Portfolio"} limit={d.limit || 9} gallery={site.gallery || []} layout={d} />;
    case "testimonials":
      return <TestimonialsSection theme={t} heading={d.heading} items={d.items || []} layout={d} />;
    case "booking":
      return site.bookingEnabled ? <BookingSection theme={t} slug={site.slug} packages={site.packages || []} heading={d.heading || "Book a Session"} subtitle={d.subtitle} layout={d} /> : null;
    case "contact":
      return <ContactSection theme={t} slug={site.slug} heading={d.heading || "Let us Talk"} message={d.message || site.contactMessage || ""} studio={site.studio || {}} socialLinks={site.socialLinks || {}} layout={d} />;
    case "cta":
      return <CtaSection theme={t} heading={d.heading} buttonText={d.buttonText} buttonTarget={d.buttonTarget} layout={d} />;
    case "custom-text":
      return <CustomTextSection theme={t} heading={d.heading} text={d.text} layout={d} />;
    default:
      return null;
  }
}

export function SectionHeading({ theme: t, children, textAlign }: { theme: ReturnType<typeof getTheme>; children: React.ReactNode; textAlign?: "left" | "center" | "right" }) {
  return <h2 style={{ fontFamily: t.fontHeading, fontSize: 28, textAlign: textAlign || "center", marginBottom: 8 }}>{children}</h2>;
}

export function HeroSection({ theme: t, title, subtitle, imageUrl, category, buttonText, buttonTarget, layout }: {
  theme: ReturnType<typeof getTheme>; title?: string | null; subtitle?: string | null; imageUrl?: string | null;
  category?: string | null; buttonText?: string | null; buttonTarget?: string | null; layout?: LayoutOptions;
}) {
  const { maxWidth, textAlign } = getLayoutStyles(layout, 720, "center");
  return (
    <section style={{
      position: "relative", padding: "120px 40px", textAlign, overflow: "hidden",
      backgroundImage: imageUrl ? `linear-gradient(${t.bg}cc, ${t.bg}ee), url(${imageUrl})` : undefined,
      backgroundSize: "cover", backgroundPosition: "center",
    }}>
      {!imageUrl && (
        <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${t.primary}22 0%, transparent 70%)`, pointerEvents: "none" }} />
      )}
      <div style={{ position: "relative", maxWidth, margin: "0 auto" }}>
        {category && (
          <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 999, background: `${t.primary}18`, color: t.primary, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
            {category}
          </div>
        )}
        <h1 style={{ fontFamily: t.fontHeading, fontSize: "clamp(32px,5vw,52px)", fontWeight: 700, lineHeight: 1.15, marginBottom: 20 }}>
          {title}
        </h1>
        <p style={{ fontSize: 16, color: t.textMuted, marginBottom: 32, maxWidth: 520, marginLeft: textAlign === "center" ? "auto" : 0, marginRight: textAlign === "center" ? "auto" : 0 }}>
          {subtitle}
        </p>
        {buttonText && (
          <a href={buttonTarget || "#contact"} style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, background: t.primary, color: t.bg, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            {buttonText}
          </a>
        )}
      </div>
    </section>
  );
}

export function TextImageSection({ theme: t, heading, text, imageUrl, imagePosition, layout }: {
  theme: ReturnType<typeof getTheme>; heading?: string | null; text?: string | null; imageUrl?: string | null; imagePosition: "left" | "right"; layout?: LayoutOptions;
}) {
  if (!heading && !text && !imageUrl) return null;
  const { maxWidth, textAlign } = getLayoutStyles(layout, 1000, "left");

  const textCol = (
    <div style={{ textAlign }}>
      {heading && <h2 style={{ fontFamily: t.fontHeading, fontSize: 26, marginBottom: 16 }}>{heading}</h2>}
      {text && <p style={{ fontSize: 15, lineHeight: 1.8, color: t.textMuted }}>{text}</p>}
    </div>
  );
  const imageCol = imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt="" style={{ width: "100%", borderRadius: 16, aspectRatio: "4/3", objectFit: "cover" }} />
  ) : <div />;

  return (
    <section style={{ padding: "60px 40px", maxWidth, margin: "0 auto", display: "grid", gridTemplateColumns: imageUrl ? "1fr 1fr" : "1fr", gap: 40, alignItems: "center" }}>
      {imagePosition === "left" ? <>{imageCol}{textCol}</> : <>{textCol}{imageCol}</>}
    </section>
  );
}

export function ServicesSection({ theme: t, heading, intro, packages, layout }: {
  theme: ReturnType<typeof getTheme>; heading: string | null; intro?: string | null;
  packages: SiteData["packages"]; layout?: LayoutOptions;
}) {
  if (!packages?.length) return null;
  const { maxWidth, textAlign } = getLayoutStyles(layout, 1000, "center");

  return (
    <section style={{ padding: "60px 40px", maxWidth, margin: "0 auto" }}>
      <SectionHeading theme={t} textAlign={textAlign}>{heading}</SectionHeading>
      {intro && <p style={{ textAlign, color: t.textMuted, fontSize: 13, marginBottom: 40 }}>{intro}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, textAlign: "left" }}>
        {packages.map((p) => (
          <div key={p.id} style={{ background: t.surface, borderRadius: 16, padding: 24, border: `1px solid ${t.textMuted}20` }}>
            <h3 style={{ fontFamily: t.fontHeading, fontSize: 18, marginBottom: 8 }}>{p.name}</h3>
            {p.description && <p style={{ fontSize: 12, color: t.textMuted, marginBottom: 16, lineHeight: 1.6 }}>{p.description}</p>}
            <div style={{ fontSize: 20, fontWeight: 700, color: t.primary }}>Rs. {Number(p.price).toLocaleString()}</div>
            {p.duration && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>{p.duration} minutes</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function GallerySection({ theme: t, heading, limit, gallery, layout }: {
  theme: ReturnType<typeof getTheme>; heading: string | null; limit: number; gallery: SiteData["gallery"]; layout?: LayoutOptions;
}) {
  if (!gallery?.length) return null;
  const { maxWidth, textAlign } = getLayoutStyles(layout, 1100, "center");

  return (
    <section style={{ padding: "60px 40px", maxWidth, margin: "0 auto" }}>
      <SectionHeading theme={t} textAlign={textAlign}>{heading}</SectionHeading>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginTop: 32 }}>
        {gallery.flatMap((g) => (g.coverPhoto ? [g.coverPhoto] : g.photos.slice(0, 1))).slice(0, limit).map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={url} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 12 }} />
        ))}
      </div>
    </section>
  );
}

export function TestimonialsSection({ theme: t, heading, items, layout }: {
  theme: ReturnType<typeof getTheme>; heading?: string | null; items: { quote: string; author: string }[]; layout?: LayoutOptions;
}) {
  const filled = items?.filter((i) => i.quote) || [];
  if (!filled.length) return null;
  const { maxWidth, textAlign } = getLayoutStyles(layout, 900, "center");

  return (
    <section style={{ padding: "60px 40px", maxWidth, margin: "0 auto" }}>
      {heading && <SectionHeading theme={t} textAlign={textAlign}>{heading}</SectionHeading>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginTop: 32, textAlign: "left" }}>
        {filled.map((it, i) => (
          <div key={i} style={{ background: t.surface, borderRadius: 16, padding: 22, border: `1px solid ${t.textMuted}20` }}>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: t.text, fontStyle: "italic", marginBottom: 12 }}>&ldquo;{it.quote}&rdquo;</p>
            {it.author && <p style={{ fontSize: 12, color: t.primary, fontWeight: 700 }}>&#8212; {it.author}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function CtaSection({ theme: t, heading, buttonText, buttonTarget, layout }: {
  theme: ReturnType<typeof getTheme>; heading?: string | null; buttonText?: string | null; buttonTarget?: string | null; layout?: LayoutOptions;
}) {
  if (!heading) return null;
  const { maxWidth, textAlign } = getLayoutStyles(layout, 1000, "center");

  return (
    <section style={{ padding: "60px 40px", background: t.surface }}>
      <div style={{ maxWidth, margin: "0 auto", textAlign }}>
        <h2 style={{ fontFamily: t.fontHeading, fontSize: 24, marginBottom: 20 }}>{heading}</h2>
        {buttonText && (
          <a href={buttonTarget || "#contact"} style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, background: t.primary, color: t.bg, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            {buttonText}
          </a>
        )}
      </div>
    </section>
  );
}

export function CustomTextSection({ theme: t, heading, text, layout }: { theme: ReturnType<typeof getTheme>; heading?: string | null; text?: string | null; layout?: LayoutOptions; }) {
  if (!heading && !text) return null;
  const { maxWidth, textAlign } = getLayoutStyles(layout, 720, "center");

  return (
    <section style={{ padding: "60px 40px", maxWidth, margin: "0 auto", textAlign }}>
      {heading && <h2 style={{ fontFamily: t.fontHeading, fontSize: 24, marginBottom: 16 }}>{heading}</h2>}
      {text && <p style={{ fontSize: 15, lineHeight: 1.8, color: t.textMuted }}>{text}</p>}
    </section>
  );
}

export function ContactSection({ theme: t, slug, heading, message, studio, socialLinks, layout }: {
  theme: ReturnType<typeof getTheme>; slug: string; heading: string | null; message?: string | null;
  studio: SiteData["studio"]; socialLinks?: SiteData["socialLinks"]; layout?: LayoutOptions;
}) {
  const { maxWidth, textAlign } = getLayoutStyles(layout, 900, "left");

  return (
    <section id="contact" style={{ padding: "80px 40px", background: t.surface }}>
      <div style={{ maxWidth, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
        <div style={{ textAlign }}>
          <h2 style={{ fontFamily: t.fontHeading, fontSize: 28, marginBottom: 12 }}>{heading}</h2>
          <p style={{ fontSize: 14, color: t.textMuted, marginBottom: 28, lineHeight: 1.6 }}>{message}</p>
          <ContactRow icon={<MapPin style={{ width: 16, height: 16 }} />} text={studio?.address || ""} theme={t} />
          <ContactRow icon={<Mail style={{ width: 16, height: 16 }} />} text={studio?.email || ""} theme={t} />
          <ContactRow icon={<Phone style={{ width: 16, height: 16 }} />} text={studio?.phone || ""} theme={t} />
          <div style={{ display: "flex", gap: 14, marginTop: 24, justifyContent: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start" }}>
            {socialLinks?.instagram && <a href={`https://instagram.com/${socialLinks.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" style={{ color: t.primary }}><InstagramIcon style={{ width: 18, height: 18 }} /></a>}
            {socialLinks?.facebook && <a href={socialLinks.facebook} target="_blank" rel="noreferrer" style={{ color: t.primary }}><FacebookIcon style={{ width: 18, height: 18 }} /></a>}
            {socialLinks?.whatsapp && <a href={`https://wa.me/${socialLinks.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" style={{ color: t.primary }}><MessageCircle style={{ width: 18, height: 18 }} /></a>}
          </div>
        </div>
        <InquiryForm slug={slug} theme={t} />
      </div>
    </section>
  );
}

export function ContactRow({ icon, text, theme: t }: { icon: React.ReactNode; text?: string | null; theme: ReturnType<typeof getTheme> }) {
  if (!text) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: t.textMuted, marginBottom: 10 }}>
      <span style={{ color: t.primary }}>{icon}</span> {text}
    </div>
  );
}

export function InquiryForm({ slug, theme: t }: { slug: string; theme: ReturnType<typeof getTheme> }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(`${API_URL}/public/website/${slug}/inquiry`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch { setStatus("error"); }
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", background: `${t.textMuted}12`, border: `1px solid ${t.textMuted}30`, borderRadius: 10, color: t.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: t.fontBody };

  if (status === "sent") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32 }}>
        <CheckCircle2 style={{ width: 32, height: 32, color: t.primary, marginBottom: 12 }} />
        <p style={{ fontSize: 14 }}>Thanks! We will be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input required placeholder="Your name" style={inputStyle} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
      <input required type="email" placeholder="Email address" style={inputStyle} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
      <input placeholder="Phone (optional)" style={inputStyle} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
      <textarea required placeholder="Tell us about your shoot..." rows={4} style={{ ...inputStyle, resize: "vertical" }} value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} />
      {status === "error" && <p style={{ fontSize: 12, color: "#f87171" }}>Something went wrong - please try again.</p>}
      <button type="submit" disabled={status === "sending"} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", background: t.primary, border: "none", borderRadius: 10, color: t.bg, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
        {status === "sending" ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Send style={{ width: 14, height: 14 }} />}
        Send Message
      </button>
    </form>
  );
}

export function BookingSection({ theme: t, slug, packages, heading, subtitle, layout }: {
  theme: ReturnType<typeof getTheme>; slug: string; packages: SiteData["packages"]; heading: string | null; subtitle?: string | null; layout?: LayoutOptions;
}) {
  const [packageId, setPackageId] = useState<string>("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const { maxWidth, textAlign } = getLayoutStyles(layout, 640, "center");
  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", background: `${t.textMuted}12`, border: `1px solid ${t.textMuted}30`, borderRadius: 10, color: t.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: t.fontBody };

  const loadSlots = async (forDate: string) => {
    setLoadingSlots(true); setSelectedSlot("");
    try {
      const q = new URLSearchParams();
      if (forDate) q.set("date", forDate);
      if (packageId) q.set("packageId", packageId);
      const res = await fetch(`${API_URL}/public/website/${slug}/availability?${q.toString()}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch { setSlots([]); }
    finally { setLoadingSlots(false); }
  };

  useEffect(() => { loadSlots(date); }, [packageId, date]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) { setErrorMsg("Please choose an available time slot."); return; }
    setStatus("sending"); setErrorMsg("");
    try {
      const res = await fetch(`${API_URL}/public/website/${slug}/book`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, packageId: packageId || undefined, startTime: selectedSlot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Booking failed");
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  if (status === "sent") {
    return (
      <section style={{ padding: "80px 40px", textAlign: "center" }}>
        <CheckCircle2 style={{ width: 32, height: 32, color: t.primary, marginBottom: 12 }} />
        <p style={{ fontSize: 14, color: t.textMuted }}>Your request has been sent - the studio will confirm your booking shortly.</p>
      </section>
    );
  }

  return (
    <section style={{ padding: "80px 40px" }}>
      <div style={{ maxWidth, margin: "0 auto", textAlign }}>
        <SectionHeading theme={t} textAlign={textAlign}>{heading}</SectionHeading>
        {subtitle && <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 32 }}>{subtitle}</p>}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
          {packages?.length > 0 && (
            <select style={inputStyle} value={packageId} onChange={(e) => setPackageId(e.target.value)}>
              <option value="">General session (no package)</option>
              {packages.map((p) => <option key={p.id} value={p.id}>{p.name} - Rs. {Number(p.price).toLocaleString()}</option>)}
            </select>
          )}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Calendar style={{ width: 16, height: 16, color: t.primary }} />
            <input type="date" style={inputStyle} value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => { setDate(e.target.value); loadSlots(e.target.value); }} />
          </div>
          {loadingSlots ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
              <Loader2 style={{ width: 16, height: 16, color: t.primary, animation: "spin 1s linear infinite" }} />
            </div>
          ) : slots.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {slots.map((s) => {
                const dt = new Date(s.start);
                const active = selectedSlot === s.start;
                return (
                  <button type="button" key={s.start} onClick={() => setSelectedSlot(s.start)} style={{ padding: "8px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: active ? t.primary : `${t.textMuted}12`, color: active ? t.bg : t.text, border: `1px solid ${active ? t.primary : `${t.textMuted}30`}` }}>
                    {dt.toLocaleDateString(undefined, { month: "short", day: "numeric" })} {dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </button>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: t.textMuted }}>No open slots found in the next 7 days - try a package change or check back soon.</p>
          )}
          <input required placeholder="Your name" style={inputStyle} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <input required type="email" placeholder="Email address" style={inputStyle} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <input placeholder="Phone (optional)" style={inputStyle} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          <textarea placeholder="Anything we should know? (optional)" rows={3} style={{ ...inputStyle, resize: "vertical" }} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          {errorMsg && <p style={{ fontSize: 12, color: "#f87171" }}>{errorMsg}</p>}
          <button type="submit" disabled={status === "sending"} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", background: t.primary, border: "none", borderRadius: 10, color: t.bg, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {status === "sending" ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Calendar style={{ width: 14, height: 14 }} />}
            Request This Slot
          </button>
        </form>
      </div>
    </section>
  );
}
