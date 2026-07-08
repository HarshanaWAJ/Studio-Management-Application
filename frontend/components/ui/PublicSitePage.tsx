"use client";
import React, { useEffect, useState } from "react";
import { Camera, MapPin, Mail, Phone, MessageCircle, Loader2, CheckCircle2, Send, Calendar } from "lucide-react";
import { InstagramIcon, FacebookIcon } from "@/components/ui/SocialIcons";
import { getTheme } from "@/lib/themes";
import { Block } from "@/lib/blocks";
import { BlockRenderer, HeroSection, ServicesSection, GallerySection, BookingSection, ContactSection, SiteData } from "./SiteBlocks";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PublicSitePage({ slug, domain }: { slug?: string; domain?: string }) {
  const [site, setSite] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const url = domain ? `${API_URL}/public/website/by-domain/${domain}` : `${API_URL}/public/website/${slug}`;
    fetch(url)
      .then(async (res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then(setSite)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, domain]);

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
      <Loader2 style={{ width: 24, height: 24, color: "#f59e0b", animation: "spin 1s linear infinite" }} />
    </div>;
  }

  if (notFound || !site) {
    return <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#a1a1aa", gap: 8 }}>
      <Camera style={{ width: 32, height: 32 }} />
      <p style={{ fontSize: 14 }}>This studio website isn&apos;t available.</p>
    </div>;
  }

  const t = site.theme;
  const hasBlocks = site.blocks && site.blocks.length > 0;

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: t.fontBody, minHeight: "100vh" }}>
      {/* Nav */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", background: `${t.bg}dd`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${t.textMuted}20` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {site.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={site.logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <Camera style={{ width: 20, height: 20, color: t.primary }} />
          )}
          <span style={{ fontFamily: t.fontHeading, fontWeight: 700, fontSize: 16 }}>{site.studio.name}</span>
        </div>
        <a href="#contact" style={{ padding: "8px 18px", borderRadius: 999, background: t.primary, color: t.bg, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
          Book Now
        </a>
      </div>

      {hasBlocks ? (
        site.blocks?.map((b) => <BlockRenderer key={b.id} block={b} site={site} theme={t} />)
      ) : (
        <LegacyLayout site={site} theme={t} />
      )}

      <footer style={{ padding: "24px 40px", textAlign: "center", fontSize: 11, color: t.textMuted }}>
        © {new Date().getFullYear()} {site.studio.name}. All rights reserved.
      </footer>
    </div>
  );
}

// ── Legacy fixed layout (used until a studio builds custom blocks) ────────────
function LegacyLayout({ site, theme: t }: { site: SiteData; theme: ReturnType<typeof getTheme> }) {
  // legacy layout renders these manually, but now we can just import them
  return (
    <>
      <HeroSection theme={t} title={site.heroTitle} subtitle={site.heroSubtitle} imageUrl={site.heroImageUrl} category={site.studio.category} buttonText="Get In Touch" buttonTarget="#contact" />
      {site.aboutText && (
        <section style={{ padding: "60px 40px", maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 16, lineHeight: 1.8, color: t.textMuted }}>{site.aboutText}</p>
        </section>
      )}
      <ServicesSection theme={t} heading="Services" intro={site.servicesIntro} packages={site.packages} />
      <GallerySection theme={t} heading="Portfolio" limit={9} gallery={site.gallery} />
      {site.bookingEnabled && <BookingSection theme={t} slug={site.slug} packages={site.packages} heading="Book a Session" subtitle="Pick a package and request your date." />}
      <ContactSection theme={t} slug={site.slug} heading="Let's Talk" message={site.contactMessage || ""} studio={site.studio} socialLinks={site.socialLinks || {}} />
    </>
  );
}
