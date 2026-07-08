"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, AlertCircle } from "lucide-react";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Background ───────────────────────────────────────────────
export function AuthBackground() {
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
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.025)" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 800, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.015)" }} />
    </div>
  );
}

export const authCardStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  borderRadius: 24,
  padding: 32,
  boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
  position: "relative",
};

export function AuthLogo({ subtitle }: { subtitle: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
        <div style={{ width: 40, height: 40, borderRadius: 16, background: "linear-gradient(135deg, #e29d42, #bf6820)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px rgba(245,158,11,0.3)" }}>
          <Camera style={{ width: 20, height: 20, color: "#09090b" }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1 }}>JH Studio</div>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "#71717a", marginTop: 3 }}>{subtitle}</div>
        </div>
      </Link>
    </motion.div>
  );
}

interface InputFieldProps {
  id: string; label: string; type: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ElementType; placeholder?: string;
  autoComplete?: string; error?: string; suffix?: React.ReactNode;
}

export function AuthInputField({ id, label, type, value, onChange, icon: Icon, placeholder, autoComplete, error, suffix }: InputFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#a1a1aa" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#71717a", display: "flex", alignItems: "center", pointerEvents: "none" }}>
          <Icon style={{ width: 16, height: 16 }} />
        </div>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: "100%",
            paddingTop: 14, paddingBottom: 14, paddingLeft: 44,
            paddingRight: suffix ? 48 : 16,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 12, color: "#fafafa", fontSize: 14, outline: "none",
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

export function AuthGeneralError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
          <AlertCircle style={{ width: 16, height: 16, color: "#f87171", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#f87171" }}>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const authSubmitButtonStyle = (loading?: boolean): React.CSSProperties => ({
  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "14px 24px",
  background: "linear-gradient(135deg,#f59e0b,#d97706)",
  border: "none", borderRadius: 12, color: "#09090b",
  fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
  opacity: loading ? 0.7 : 1,
});

// ─── 6-digit OTP entry (used by verify-email & forgot-password flows) ─────────
export function OtpCodeInput({
  value, onChange, autoFocus = true, error,
}: { value: string; onChange: (v: string) => void; autoFocus?: boolean; error?: string }) {
  const length = 6;
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, " ").split("").slice(0, length);

  function setDigit(idx: number, char: string) {
    const clean = char.replace(/\D/g, "").slice(-1);
    const next = digits.slice();
    next[idx] = clean || " ";
    const joined = next.join("").replace(/\s+$/, "");
    onChange(joined);
    if (clean && idx < length - 1) inputsRef.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx].trim() && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }} onPaste={handlePaste}>
        {digits.map((d, idx) => (
          <input
            key={idx}
            ref={(el) => { inputsRef.current[idx] = el; }}
            autoFocus={autoFocus && idx === 0}
            inputMode="numeric"
            maxLength={1}
            value={d.trim()}
            onChange={(e) => setDigit(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            style={{
              width: 44, height: 52, textAlign: "center", fontSize: 22, fontWeight: 700,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 12, color: "#fafafa", outline: "none",
              boxSizing: "border-box",
            }}
          />
        ))}
      </div>
      {error && (
        <p style={{ marginTop: 10, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "#f87171" }}>
          <AlertCircle style={{ width: 12, height: 12 }} />
          {error}
        </p>
      )}
    </div>
  );
}
