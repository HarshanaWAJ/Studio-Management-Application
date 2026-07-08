"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, ArrowLeft, Mail } from "lucide-react";
import {
  API_URL, AuthBackground, authCardStyle, AuthLogo,
  AuthGeneralError, authSubmitButtonStyle, OtpCodeInput,
} from "./AuthShared";

const RESEND_COOLDOWN = 60;

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = React.useState(params.get("email") || "");
  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);
  const [resendMsg, setResendMsg] = React.useState("");

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address"); return; }
    if (otp.length !== 6) { setError("Enter the 6-digit code from your email"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, purpose: "email_verification" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.message || "Verification failed."); setLoading(false); return; }
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 1500);
    } catch {
      setError("Unable to reach the server. Please try again.");
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address"); return; }
    setResendMsg("");
    setError("");
    try {
      await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "email_verification" }),
      });
    } catch {
      // swallow — API deliberately doesn't reveal account existence
    } finally {
      setResendMsg("If that account needs verification, a new code is on its way.");
      setCooldown(RESEND_COOLDOWN);
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 16px", overflow: "hidden" }}>
      <AuthBackground />
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 448 }}>
        <AuthLogo subtitle="Email Verification" />

        <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={authCardStyle}>
          <div style={{ position: "absolute", inset: -1, borderRadius: 24, background: "linear-gradient(135deg, rgba(226,157,66,0.1), transparent)", zIndex: -1, filter: "blur(20px)" }} />

          {!success ? (
            <>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
                  Verify your email
                </h1>
                <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6 }}>
                  Enter the 6-digit code we sent to your email address. It expires in 10 minutes.
                </p>
              </div>

              <AuthGeneralError message={error} />

              <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#a1a1aa" }}>Email Address</label>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#71717a" }}>
                      <Mail style={{ width: 16, height: 16 }} />
                    </div>
                    <input
                      type="email" required value={email} placeholder="you@studio.com"
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: "100%", padding: "12px 14px 12px 44px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fafafa", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#a1a1aa", textAlign: "center" }}>
                    Verification Code
                  </label>
                  <OtpCodeInput value={otp} onChange={setOtp} />
                </div>

                <button type="submit" disabled={loading} style={authSubmitButtonStyle(loading)}>
                  {loading ? (<><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Verifying…</>) : "Verify Email"}
                </button>
              </form>

              <div style={{ marginTop: 20, textAlign: "center" }}>
                {resendMsg ? (
                  <p style={{ fontSize: 12, color: "#4ade80" }}>{resendMsg}</p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    style={{ background: "none", border: "none", fontSize: 12, color: cooldown > 0 ? "#71717a" : "#f59e0b", cursor: cooldown > 0 ? "default" : "pointer", fontWeight: 600 }}
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't get a code? Resend"}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle2 style={{ width: 30, height: 30, color: "#4ade80" }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fafafa", marginBottom: 8, fontFamily: "'Playfair Display',Georgia,serif" }}>Email Verified!</h2>
              <p style={{ fontSize: 13, color: "#a1a1aa" }}>Redirecting you to sign in…</p>
            </div>
          )}

          <div style={{ marginTop: 28, textAlign: "center" }}>
            <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#f59e0b", textDecoration: "none", fontWeight: 600 }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
