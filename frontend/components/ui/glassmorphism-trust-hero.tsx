"use client";

import React from "react";
import { 
  ArrowRight, 
  Play, 
  Target, 
  Crown, 
  Star,
  Camera,
  Aperture,
  Image as ImageIcon,
  Video,
  MonitorPlay,
  Film
} from "lucide-react";

// --- STUDIO BRANDS ---
const CLIENTS = [
  { name: "Lumina Studios", icon: Camera },
  { name: "Golden Frame", icon: Aperture },
  { name: "Capture & Co.", icon: ImageIcon },
  { name: "Studio 88", icon: Film },
  { name: "Pixel Perfect", icon: MonitorPlay },
  { name: "Artboard Films", icon: Video },
];

// --- SUB-COMPONENTS ---
const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
    <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>{value}</span>
    <span style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#a1a1aa", marginTop: "4px" }}>{label}</span>
  </div>
);

// --- MAIN COMPONENT ---
export default function HeroSection() {
  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", background: "#09090b", color: "#fff", display: "flex", alignItems: "center", overflow: "hidden", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* 
        SCOPED ANIMATIONS 
      */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-fade-in {
          animation: fadeSlideIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>

      {/* Photography Background Image */}
      <div 
        style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1600&q=80')",
          backgroundSize: "cover", backgroundPosition: "center", opacity: 0.3,
          maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 70%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 70%, transparent 100%)",
        }}
      />
      
      {/* Grid overlay for texture */}
      <div 
        style={{
          position: "absolute", inset: 0, zIndex: 0, opacity: 0.03,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }}
      />

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: "1280px", margin: "0 auto", padding: "140px 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "48px", alignItems: "center" }}>
          
          {/* --- LEFT COLUMN --- */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Badge */}
            <div className="animate-fade-in delay-100">
              <div className="glass" style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "9999px", padding: "8px 16px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#d4d4d8", display: "flex", alignItems: "center", gap: "8px" }}>
                  Professional Studio Management
                  <Star style={{ width: 14, height: 14, color: "#facc15", fill: "#facc15" }} />
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="animate-fade-in delay-200 font-display" style={{ fontSize: "clamp(3rem, 6vw, 4.5rem)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.15, margin: 0 }}>
              Capture Every<br />
              <span className="text-gradient-gold">
                Perfect Moment
              </span><br />
              Effortlessly
            </h1>

            {/* Description */}
            <p className="animate-fade-in delay-300" style={{ maxWidth: "520px", fontSize: "1.125rem", color: "#a1a1aa", lineHeight: 1.7, margin: 0 }}>
              The all-in-one studio management platform built for photographers.
              Bookings, clients, equipment, and analytics — perfectly in frame.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in delay-400" style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "16px" }}>
              <button className="btn-primary" style={{ padding: "14px 32px", fontSize: "15px" }}>
                Start Managing
                <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
              
              <button className="btn-ghost" style={{ padding: "14px 32px", fontSize: "15px" }}>
                <Play style={{ width: 16, height: 16, fill: "currentColor" }} />
                See Features
              </button>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="animate-fade-in delay-500" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Stats Card */}
            <div className="glass" style={{ position: "relative", borderRadius: "24px", padding: "32px", overflow: "hidden" }}>
              {/* Card Glow Effect */}
              <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "256px", height: "256px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.15)", filter: "blur(64px)", pointerEvents: "none" }} />

              <div style={{ position: "relative", zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
                  <div className="glass" style={{ width: "56px", height: "56px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Target style={{ width: "28px", height: "28px", color: "#fff" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#fff", lineHeight: 1 }}>500+</div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "#a1a1aa", marginTop: "4px" }}>Studios Onboarded</div>
                  </div>
                </div>

                {/* Progress Bar Section */}
                <div style={{ marginBottom: "32px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "8px" }}>
                    <span style={{ color: "#a1a1aa", fontWeight: 500 }}>Booking Fill Rate</span>
                    <span style={{ color: "#fff", fontWeight: 700 }}>94%</span>
                  </div>
                  <div style={{ height: "8px", width: "100%", borderRadius: "9999px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "94%", borderRadius: "9999px", background: "linear-gradient(90deg, #fbbf24, #d97706)" }} />
                  </div>
                </div>

                <div style={{ height: "1px", width: "100%", background: "rgba(255,255,255,0.1)", marginBottom: "24px" }} />

                {/* Mini Stats Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: "16px", alignItems: "center" }}>
                  <StatItem value="5yr" label="Track Record" />
                  <div style={{ width: "1px", height: "100%", background: "rgba(255,255,255,0.1)" }} />
                  <StatItem value="24/7" label="Support" />
                  <div style={{ width: "1px", height: "100%", background: "rgba(255,255,255,0.1)" }} />
                  <StatItem value="99%" label="Uptime" />
                </div>

                {/* Tag Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "32px" }}>
                  <div className="glass" style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "9999px", padding: "6px 12px" }}>
                    <span style={{ position: "relative", display: "flex", width: "8px", height: "8px" }}>
                      <span className="animate-ping" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#34d399", opacity: 0.75 }}></span>
                      <span style={{ position: "relative", display: "inline-flex", width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></span>
                    </span>
                    <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#d4d4d8" }}>LIVE NOW</span>
                  </div>
                  <div className="glass" style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "9999px", padding: "6px 12px" }}>
                    <Crown style={{ width: "12px", height: "12px", color: "#fbbf24" }} />
                    <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#d4d4d8" }}>PREMIUM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Marquee Card */}
            <div className="glass" style={{ position: "relative", overflow: "hidden", borderRadius: "24px", padding: "24px 0" }}>
              <h3 style={{ marginBottom: "20px", padding: "0 32px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#a1a1aa" }}>Trusted by top studios</h3>
              
              <div 
                style={{
                  position: "relative", display: "flex", overflow: "hidden",
                  maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
                  WebkitMaskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)"
                }}
              >
                <div className="animate-marquee" style={{ display: "flex", gap: "40px", whiteSpace: "nowrap", padding: "0 16px", alignItems: "center" }}>
                  {[...CLIENTS, ...CLIENTS, ...CLIENTS].map((client, i) => (
                    <div 
                      key={i}
                      style={{ display: "flex", alignItems: "center", gap: "8px", opacity: 0.6, transition: "opacity 0.2s cursor-default" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                    >
                      <client.icon style={{ width: "20px", height: "20px", color: "#fff" }} />
                      <span style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
                        {client.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
