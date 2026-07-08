"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Eye, EyeOff, Loader2, ArrowRight,
  Mail, Lock, AlertCircle, CheckCircle2,
  Star, Aperture, Shield, Sparkles,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Background ───────────────────────────────────────────────
function Background() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #09090b, #13100a, #09090b)" }} />
      <div style={{
        position: "absolute", top: "10%", left: "5%", width: 320, height: 320,
        borderRadius: "50%", opacity: 0.2,
        background: "radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)",
        animation: "float 4s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "15%", right: "8%", width: 256, height: 256,
        borderRadius: "50%", opacity: 0.15,
        background: "radial-gradient(circle, rgba(217,119,6,0.35) 0%, transparent 70%)",
        animation: "float 4s ease-in-out infinite", animationDelay: "1.5s",
      }} />
      <div style={{
        position: "absolute", inset: 0, opacity: 0.025,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      {/* Aperture rings */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.025)" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 800, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.015)" }} />
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────────
interface InputFieldProps {
  id: string; label: string; type: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ElementType; placeholder?: string;
  autoComplete?: string; error?: string; suffix?: React.ReactNode;
}

function InputField({ id, label, type, value, onChange, icon: Icon, placeholder, autoComplete, error, suffix }: InputFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#a1a1aa" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {/* Icon */}
        <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#71717a", display: "flex", alignItems: "center", pointerEvents: "none" }}>
          <Icon style={{ width: 16, height: 16 }} />
        </div>
        {/* Input */}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: "100%",
            paddingTop: 14,
            paddingBottom: 14,
            paddingLeft: 44,
            paddingRight: suffix ? 48 : 16,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 12,
            color: "#fafafa",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(245,158,11,0.55)";
            e.target.style.background  = "rgba(255,255,255,0.06)";
            e.target.style.boxShadow   = "0 0 0 3px rgba(245,158,11,0.12)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)";
            e.target.style.background  = "rgba(255,255,255,0.04)";
            e.target.style.boxShadow   = "none";
          }}
        />
        {/* Suffix */}
        {suffix && (
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
            {suffix}
          </div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#f87171" }}>
            <AlertCircle style={{ width: 12, height: 12 }} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN LOGIN PAGE ──────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail]               = React.useState("");
  const [password, setPassword]         = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe]     = React.useState(false);
  const [loading, setLoading]           = React.useState(false);
  const [errors, setErrors]             = React.useState<{ email?: string; password?: string; general?: string }>({});
  const [success, setSuccess]           = React.useState(false);

  function validate() {
    const errs: typeof errors = {};
    if (!email)                            errs.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email    = "Enter a valid email address";
    if (!password)                         errs.password = "Password is required";
    else if (password.length < 6)          errs.password = "Password must be at least 6 characters";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors({ general: data?.message || "Invalid email or password." }); setLoading(false); return; }
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("accessToken",  data.accessToken);
      storage.setItem("refreshToken", data.refreshToken);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch {
      setErrors({ general: "Unable to reach the server. Please try again." });
      setLoading(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: 24,
    padding: 32,
    boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
    position: "relative",
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 16px", overflow: "hidden" }}>
      <Background />

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 448 }}>
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: 16, background: "linear-gradient(135deg, #e29d42, #bf6820)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px rgba(245,158,11,0.3)" }}>
              <Camera style={{ width: 20, height: 20, color: "#09090b" }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1 }}>JH Studio</div>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "#71717a", marginTop: 3 }}>Management Platform</div>
            </div>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }} style={cardStyle}>
          {/* Glow */}
          <div style={{ position: "absolute", inset: -1, borderRadius: 24, background: "linear-gradient(135deg, rgba(226,157,66,0.1), transparent)", zIndex: -1, filter: "blur(20px)" }} />

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
              Welcome Back
            </h1>
            <p style={{ fontSize: 14, color: "#a1a1aa" }}>Sign in to your studio management account</p>
          </div>

          {/* Success */}
          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
                <CheckCircle2 style={{ width: 20, height: 20, color: "#4ade80", flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: "#4ade80" }}>Login successful! Redirecting…</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* General error */}
          <AnimatePresence>
            {errors.general && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <AlertCircle style={{ width: 16, height: 16, color: "#f87171", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#f87171" }}>{errors.general}</span>
                </div>
                {errors.general.toLowerCase().includes("verify") && (
                  <Link href="/auth/verify-email" style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, marginLeft: 28 }}>
                    Resend verification email →
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <InputField
              id="login-email" label="Email Address" type="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              icon={Mail} placeholder="you@studio.com" autoComplete="email"
              error={errors.email}
            />
            <InputField
              id="login-password" label="Password"
              type={showPassword ? "text" : "password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              icon={Lock} placeholder="Enter your password" autoComplete="current-password"
              error={errors.password}
              suffix={
                <button type="button" id="toggle-password" onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#71717a", padding: 4, display: "flex", alignItems: "center" }}>
                  {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              }
            />

            {/* Remember + Forgot */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label htmlFor="remember-me" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <div
                  id="remember-me" role="checkbox" aria-checked={rememberMe} tabIndex={0}
                  onClick={() => setRememberMe(v => !v)}
                  onKeyDown={(e) => e.key === " " && setRememberMe(v => !v)}
                  style={{
                    width: 16, height: 16, borderRadius: 4, border: `1px solid ${rememberMe ? "#d88428" : "rgba(255,255,255,0.2)"}`,
                    background: rememberMe ? "#d88428" : "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  {rememberMe && <CheckCircle2 style={{ width: 12, height: 12, color: "#fff" }} />}
                </div>
                <span style={{ fontSize: 12, color: "#a1a1aa" }}>Remember me</span>
              </label>
              <Link href="/auth/forgot-password" style={{ fontSize: 12, color: "#f59e0b", textDecoration: "none", fontWeight: 500 }}>Forgot password?</Link>
            </div>

            {/* Submit */}
            <button
              id="login-submit" type="submit" disabled={loading || success}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "14px 24px", marginTop: 8,
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                border: "none", borderRadius: 12,
                color: "#09090b", fontSize: 14, fontWeight: 700,
                cursor: loading || success ? "not-allowed" : "pointer",
                opacity: loading || success ? 0.6 : 1,
                boxShadow: "0 4px 20px rgba(245,158,11,0.35)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              {loading
                ? <><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Signing in…</>
                : <>Sign In to Studio <ArrowRight style={{ width: 16, height: 16 }} /></>
              }
            </button>
          </form>

          {/* Divider */}
          <div style={{ position: "relative", margin: "28px 0" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
              <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.07)" }} />
            </div>
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              <span style={{ padding: "0 16px", fontSize: 12, color: "#52525b", background: "rgba(0,0,0,0.4)" }}>
                Don&apos;t have an account?
              </span>
            </div>
          </div>

          {/* Register link */}
          <Link href="/auth/register" id="goto-register"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px 24px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12, color: "#fafafa", fontSize: 14, fontWeight: 500, textDecoration: "none",
              transition: "background 0.2s",
            }}
          >
            <Aperture style={{ width: 16, height: 16, color: "#f59e0b" }} />
            Register Your Studio
          </Link>
        </motion.div>

        {/* Trust indicators */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          style={{ marginTop: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
          {[
            { icon: Shield,   label: "256-bit SSL"   },
            { icon: Star,     label: "Rated 4.9/5"   },
            { icon: Sparkles, label: "No Credit Card" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, color: "#52525b" }}>
              <Icon style={{ width: 12, height: 12, color: "#71717a" }} />
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
