"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, Aperture, Menu, X } from "lucide-react";

const navLinks = [
  { href: "#features",      label: "Features"      },
  { href: "#workflow",      label: "How It Works"  },
  { href: "#testimonials",  label: "Testimonials"  },
];

export default function Navbar() {
  const [scrolled,    setScrolled]    = React.useState(false);
  const [mobileOpen,  setMobileOpen]  = React.useState(false);

  React.useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        transition: "background 0.4s, border-color 0.4s, backdrop-filter 0.4s",
        background:      scrolled ? "rgba(9,9,11,0.85)"              : "transparent",
        borderBottom:    scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        backdropFilter:  scrolled ? "blur(20px)"                     : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)"                : "none",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <div style={{ position: "relative", width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg, #e29d42, #bf6820)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(245,158,11,0.25)", flexShrink: 0 }}>
              <Camera style={{ width: 18, height: 18, color: "#09090b" }} />
              <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "#fbbf24", animation: "glow-pulse 3s ease-in-out infinite" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff", lineHeight: 1 }}>JH Studio</span>
              <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "#71717a", lineHeight: 1, marginTop: 3 }}>Management</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: 36 }}>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{ fontSize: 14, fontWeight: 500, color: "#a1a1aa", textDecoration: "none", position: "relative", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "#a1a1aa")}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/auth/login"
              style={{ padding: "8px 18px", fontSize: 14, fontWeight: 500, color: "#d4d4d8", textDecoration: "none", borderRadius: 10, transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#d4d4d8")}
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "9px 20px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                borderRadius: 10, color: "#09090b", fontSize: 14, fontWeight: 700,
                textDecoration: "none", boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(245,158,11,0.45)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(245,158,11,0.3)"; }}
            >
              <Aperture style={{ width: 15, height: 15 }} />
              Get Started
            </Link>

            {/* Mobile toggle */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
              style={{ display: "none", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, width: 36, height: 36, alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
            >
              {mobileOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
          style={{ background: "rgba(9,9,11,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                style={{ fontSize: 14, fontWeight: 500, color: "#d4d4d8", textDecoration: "none", padding: "8px 0" }}>
                {link.label}
              </Link>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <Link href="/auth/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "11px 20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fafafa", fontSize: 14, textDecoration: "none" }}>
                Sign In
              </Link>
              <Link href="/auth/register" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "11px 20px", background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: 10, color: "#09090b", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                Get Started Free
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
