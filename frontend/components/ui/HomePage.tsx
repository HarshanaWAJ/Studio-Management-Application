"use client";

import React from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Camera, CalendarDays, Users, Package, BarChart3, FileImage,
  Sparkles, CheckCircle2, Star, Shield, Zap, Globe, ChevronRight, Play,
  Award, Clock, TrendingUp, Aperture, MessageSquare, CreditCard,
} from "lucide-react";
import HeroSection from "./glassmorphism-trust-hero";

// ─── Shared inline style helpers ────────────────────────────
const S = {
  sectionBadge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "6px 16px", borderRadius: 999,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    marginBottom: 24,
  } as React.CSSProperties,
  badgeText: { fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#d4d4d8" },
  sectionTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 500, letterSpacing: "-0.02em", color: "#fff", marginBottom: 16, lineHeight: 1.15 } as React.CSSProperties,
  sectionDesc:  { fontSize: 17, color: "#a1a1aa", lineHeight: 1.7, maxWidth: 520, marginBottom: 0 } as React.CSSProperties,
  glass: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: 20 } as React.CSSProperties,
  glassDark: { background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: 24 } as React.CSSProperties,
};

// ─── Section wrapper ─────────────────────────────────────────
function Section({ children, id, style }: { children: React.ReactNode; id?: string; style?: React.CSSProperties }) {
  const ref    = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section id={id} ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
      style={{ padding: "80px 0", ...style }}>
      {children}
    </motion.section>
  );
}

// ─── CountUp ─────────────────────────────────────────────────
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = React.useState(0);
  const ref    = React.useRef(null);
  const inView = useInView(ref, { once: true });
  React.useEffect(() => {
    if (!inView) return;
    let n = 0;
    const step = Math.ceil(to / 60);
    const id   = setInterval(() => { n += step; if (n >= to) { setCount(to); clearInterval(id); } else setCount(n); }, 20);
    return () => clearInterval(id);
  }, [inView, to]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Data ────────────────────────────────────────────────────
const features = [
  { icon: CalendarDays, title: "Smart Booking System",   desc: "Accept, schedule and manage photography sessions with conflict-free calendar and automated reminders.", gradFrom: "rgba(245,158,11,0.2)", gradTo: "rgba(234,88,12,0.1)",  iconColor: "#fbbf24" },
  { icon: Users,        title: "Client Management",      desc: "Centralized CRM for all your clients — contacts, shoot history, galleries and invoices in one place.",   gradFrom: "rgba(59,130,246,0.2)", gradTo: "rgba(6,182,212,0.1)",  iconColor: "#60a5fa" },
  { icon: FileImage,    title: "Gallery & Deliverables", desc: "Upload, curate and share proofing galleries with clients directly from your studio dashboard.",           gradFrom: "rgba(168,85,247,0.2)", gradTo: "rgba(236,72,153,0.1)", iconColor: "#c084fc" },
  { icon: Package,      title: "Equipment Tracker",      desc: "Track cameras, lenses, lights and studio gear — with availability calendars and maintenance logs.",       gradFrom: "rgba(34,197,94,0.2)", gradTo: "rgba(16,185,129,0.1)",  iconColor: "#4ade80" },
  { icon: BarChart3,    title: "Revenue Analytics",      desc: "Real-time revenue dashboards, booking trends, popular packages and team performance metrics.",             gradFrom: "rgba(239,68,68,0.2)", gradTo: "rgba(236,72,153,0.1)",  iconColor: "#f87171" },
  { icon: CreditCard,   title: "Invoicing & Payments",   desc: "Generate branded invoices, collect deposits, and track outstanding payments effortlessly.",               gradFrom: "rgba(245,158,11,0.2)", gradTo: "rgba(245,158,11,0.1)", iconColor: "#f59e0b" },
];

const stats = [
  { value: 500,   suffix: "+",  label: "Active Studios"      },
  { value: 12000, suffix: "+",  label: "Sessions Booked"     },
  { value: 98,    suffix: "%",  label: "Client Satisfaction" },
  { value: 24,    suffix: "/7", label: "Support Available"   },
];

const steps = [
  { num: "01", icon: Aperture,    title: "Register Your Studio", desc: "Create your studio profile with your team, packages and studio details in under 5 minutes."              },
  { num: "02", icon: CalendarDays,title: "Set Up Bookings",      desc: "Configure your availability, session types, pricing and automated confirmation emails."                    },
  { num: "03", icon: Camera,      title: "Manage Your Shoots",   desc: "Coordinate shoots, assign photographers, track equipment and share deliverables seamlessly."             },
  { num: "04", icon: TrendingUp,  title: "Grow Your Business",   desc: "Analyze trends, optimize pricing, and scale with actionable insights from your dashboard."              },
];

const testimonials = [
  { name: "Amara Silva",     role: "Lead Photographer, Lumina Studios",  avatar: "AS", rating: 5, quote: "JH Studio transformed how we run our studio. Booking conflicts dropped to zero and clients love the professional gallery portal." },
  { name: "Kavindu Perera",  role: "Studio Owner, Golden Frame",          avatar: "KP", rating: 5, quote: "The equipment tracker alone saved us thousands. We always know exactly what gear is available and what needs service."            },
  { name: "Nishadi Fernando",role: "Creative Director, Capture & Co.",   avatar: "NF", rating: 5, quote: "Revenue analytics gave us visibility we never had before. Within 3 months we optimized our packages and increased bookings by 40%." },
];

const clientBrands = ["Lumina Studios","Golden Frame","Capture & Co.","Studio 88","Pixel Perfect","Artboard Films","Lens & Light","Frame Factory"];

// ─── MAIN HOME PAGE ──────────────────────────────────────────
export default function HomePage() {
  return (
    <div style={{ background: "#09090b", overflow: "hidden" }}>
      <style>{`
        @keyframes homeMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .home-marquee { animation: homeMarquee 40s linear infinite; }
        @keyframes progressFill { from { width: 0; } to { width: 78%; } }
      `}</style>

      {/* ── HERO SECTION ───────────────────────────────────── */}
      <HeroSection />

      {/* ── CLIENT MARQUEE ─────────────────────────────────── */}
      <div style={{ position: "relative", padding: "40px 0", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(9,9,11,0.5)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, WebkitMaskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)", maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)" }} />
        <p style={{ textAlign: "center", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#52525b", marginBottom: 24 }}>Trusted by studios across Sri Lanka</p>
        <div className="home-marquee" style={{ display: "flex", whiteSpace: "nowrap" }}>
          {[...clientBrands, ...clientBrands, ...clientBrands].map((brand, i) => (
            <span key={i} style={{ margin: "0 40px", color: "#71717a", fontWeight: 600, fontSize: 14, letterSpacing: "0.03em" }}>
              ✦ {brand}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <Section id="features">
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={S.sectionBadge}>
              <Sparkles style={{ width: 14, height: 14, color: "#fbbf24" }} />
              <span style={S.badgeText}>Features</span>
            </div>
            <h2 style={S.sectionTitle}>Everything Your Studio Needs</h2>
            <p style={{ ...S.sectionDesc, margin: "0 auto" }}>
              From the first inquiry to the final gallery delivery — manage every aspect of your studio operations in one powerful platform.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                style={{ ...S.glass, padding: 24, cursor: "default", transition: "background 0.3s, border-color 0.3s" }}
                whileHover={{ scale: 1.02 }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${f.gradFrom}, ${f.gradTo})`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <f.icon style={{ width: 24, height: 24, color: f.iconColor }} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#a1a1aa", lineHeight: 1.65 }}>{f.desc}</p>
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#f59e0b", fontWeight: 500 }}>
                  Learn more <ChevronRight style={{ width: 14, height: 14 }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── STATS ─────────────────────────────────────────── */}
      <section style={{ padding: "80px 0", background: "linear-gradient(to right, #09090b, #1a1208, #09090b)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.3, background: "radial-gradient(ellipse at 50% 50%, rgba(245,158,11,0.15), transparent 70%)" }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 32 }}>
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                style={{ textAlign: "center" }}
              >
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, background: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 8 }}>
                  <CountUp to={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 13, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW CARD ────────────────────────── */}
      <Section>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 48 }}>
            <div style={{ textAlign: "center" }}>
              <div style={S.sectionBadge}>
                <Zap style={{ width: 14, height: 14, color: "#fbbf24" }} />
                <span style={S.badgeText}>Live Dashboard</span>
              </div>
              <h2 style={S.sectionTitle}>See Every Detail at a Glance</h2>
              <p style={{ ...S.sectionDesc, margin: "0 auto" }}>Manage your entire studio from a single, beautiful dashboard.</p>
            </div>

            {/* Dashboard card */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}
              style={{ ...S.glassDark, padding: 28, width: "100%", maxWidth: 640, boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)" }}
            >
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                  <p style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Today&apos;s Overview</p>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>Studio Dashboard</h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ position: "relative", display: "flex", width: 8, height: 8 }}>
                    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#4ade80", opacity: 0.75, animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
                    <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                  </span>
                  <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 500 }}>Live</span>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Today's Shoots",    value: "8",        icon: Camera,     change: "+2" },
                  { label: "Active Clients",    value: "142",      icon: Users,      change: "+12" },
                  { label: "Pending Invoices",  value: "LKR 84K",  icon: CreditCard, change: ""    },
                  { label: "Equipment Out",     value: "6 / 24",   icon: Package,    change: ""    },
                ].map(item => (
                  <div key={item.label} style={{ ...S.glass, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <item.icon style={{ width: 16, height: 16, color: "#71717a" }} />
                      {item.change && <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 600, background: "rgba(74,222,128,0.1)", padding: "2px 6px", borderRadius: 999 }}>{item.change}</span>}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: "#71717a" }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Upcoming */}
              <p style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Upcoming Today</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {[
                  { time: "10:00 AM", name: "Perera Wedding Shoot",        type: "Wedding"   },
                  { time: "02:00 PM", name: "Corporate Headshots — ABC",  type: "Corporate" },
                  { time: "05:30 PM", name: "Fashion — Savi Designs",      type: "Fashion"   },
                ].map((shoot, i) => (
                  <div key={i} style={{ ...S.glass, padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 12, fontFamily: "monospace", color: "#f59e0b", minWidth: 64, flexShrink: 0 }}>{shoot.time}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shoot.name}</div>
                      <div style={{ fontSize: 11, color: "#71717a" }}>{shoot.type}</div>
                    </div>
                    <div style={{ width: 4, height: 32, borderRadius: 999, background: "rgba(226,157,66,0.6)", flexShrink: 0 }} />
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#a1a1aa" }}>Monthly Target</span>
                  <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>78%</span>
                </div>
                <div style={{ height: 6, width: "100%", borderRadius: 999, background: "#27272a", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "78%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                    style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #e29d42, #f59e0b)" }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <Section id="workflow" style={{ background: "#09090b" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={S.sectionBadge}>
              <Zap style={{ width: 14, height: 14, color: "#fbbf24" }} />
              <span style={S.badgeText}>Workflow</span>
            </div>
            <h2 style={S.sectionTitle}>Up & Running in Minutes</h2>
            <p style={{ ...S.sectionDesc, margin: "0 auto" }}>Our streamlined onboarding gets your studio operational without any technical complexity.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24, position: "relative" }}>
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                style={{ ...S.glass, padding: 24, textAlign: "center" }}
                whileHover={{ scale: 1.02 }}
              >
                <div style={{ position: "relative", width: 56, height: 56, borderRadius: 18, background: "linear-gradient(135deg, rgba(226,157,66,0.2), rgba(191,104,32,0.1))", border: "1px solid rgba(226,157,66,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <step.icon style={{ width: 24, height: 24, color: "#e29d42" }} />
                  <div style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, borderRadius: "50%", background: "#09090b", border: "1px solid rgba(226,157,66,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#e29d42" }}>{step.num}</span>
                  </div>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "#a1a1aa", lineHeight: 1.65 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <Section id="testimonials" style={{ background: "linear-gradient(to bottom, #09090b, #0f0e08)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={S.sectionBadge}>
              <MessageSquare style={{ width: 14, height: 14, color: "#fbbf24" }} />
              <span style={S.badgeText}>Testimonials</span>
            </div>
            <h2 style={S.sectionTitle}>Loved by Studio Owners</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                style={{ ...S.glass, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}
                whileHover={{ scale: 1.01 }}
              >
                <div style={{ display: "flex", gap: 4 }}>
                  {[...Array(t.rating)].map((_, j) => <Star key={j} style={{ width: 16, height: 16, color: "#fbbf24", fill: "#fbbf24" }} />)}
                </div>
                <blockquote style={{ fontSize: 14, color: "#d4d4d8", lineHeight: 1.7, flex: 1 }}>
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #e29d42, #bf6820)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#09090b", flexShrink: 0 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#71717a" }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section style={{ padding: "64px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1a1208, #09090b, #1a1208)" }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.4, background: "radial-gradient(ellipse at 60% 50%, rgba(245,158,11,0.2), transparent 60%)" }} />
        <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <div style={S.sectionBadge}>
              <Clock style={{ width: 14, height: 14, color: "#fbbf24" }} />
              <span style={S.badgeText}>Limited Beta Access</span>
            </div>
            <h2 style={{ ...S.sectionTitle, fontSize: "clamp(2rem, 5vw, 3.75rem)" }}>
              <span style={{ color: "#fff" }}>Ready to Transform</span>
              <br />
              <span style={{ fontStyle: "italic", background: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Your Studio?</span>
            </h2>
            <p style={{ ...S.sectionDesc, margin: "0 auto 40px" }}>
              Join hundreds of photography studios already running their entire operations on JH Studio. Start your free trial today.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/auth/register" id="cta-register-bottom"
                style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 40px", background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: 12, color: "#09090b", fontSize: 15, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 20px rgba(245,158,11,0.35)" }}>
                Register Your Studio <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link href="/auth/login" id="cta-login-bottom"
                style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 40px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#fafafa", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #e29d42, #bf6820)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Camera style={{ width: 16, height: 16, color: "#09090b" }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#d4d4d8" }}>JH Studio</span>
          </div>
          <p style={{ fontSize: 12, color: "#52525b" }}>© {new Date().getFullYear()} JH Studio. Built by Janith Harshana.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {["Privacy","Terms","Contact"].map(item => (
              <a key={item} href="#" style={{ fontSize: 12, color: "#52525b", textDecoration: "none" }}>{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
