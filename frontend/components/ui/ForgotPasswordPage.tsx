"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  API_URL, AuthBackground, authCardStyle, AuthLogo,
  AuthInputField, AuthGeneralError, authSubmitButtonStyle, OtpCodeInput,
} from "./AuthShared";

type Step = "email" | "otp" | "password" | "done";

const RESEND_COOLDOWN = 60;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("email");
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [resetToken, setResetToken] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Step 1: request a code
  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address"); return; }
    setError("");
    setLoading(true);
    try {
      await fetch(`${API_URL}/auth/forgot-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always proceed — the API deliberately doesn't reveal account existence
      setStep("otp");
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    try {
      await fetch(`${API_URL}/auth/forgot-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch { /* swallow */ }
    setCooldown(RESEND_COOLDOWN);
  }

  // Step 2: verify the code -> get a short-lived reset proof token
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError("Enter the 6-digit code from your email"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, purpose: "password_reset" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.message || "Invalid or expired code."); setLoading(false); return; }
      setResetToken(data.resetToken);
      setStep("password");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 3: set the new password
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.message || "Could not reset password."); setLoading(false); return; }
      setStep("done");
      setTimeout(() => router.push("/auth/login"), 1800);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 16px", overflow: "hidden" }}>
      <AuthBackground />
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 448 }}>
        <AuthLogo subtitle="Password Recovery" />

        <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={authCardStyle}>
          <div style={{ position: "absolute", inset: -1, borderRadius: 24, background: "linear-gradient(135deg, rgba(226,157,66,0.1), transparent)", zIndex: -1, filter: "blur(20px)" }} />

          {step === "email" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
                  Forgot Password?
                </h1>
                <p style={{ fontSize: 14, color: "#a1a1aa" }}>Enter your email and we&apos;ll send you a 6-digit code</p>
              </div>

              <AuthGeneralError message={error} />

              <form onSubmit={handleRequestCode} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <AuthInputField
                  id="email" label="Email Address" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} icon={Mail}
                  placeholder="you@studio.com" autoComplete="email" error={error}
                />
                <button type="submit" disabled={loading} style={authSubmitButtonStyle(loading)}>
                  {loading ? (<><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Sending…</>) : "Send Code"}
                </button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
                  Enter your code
                </h1>
                <p style={{ fontSize: 13, color: "#a1a1aa" }}>
                  If an account exists for <strong style={{ color: "#fafafa" }}>{email}</strong>, a 6-digit code was sent to it.
                </p>
              </div>

              <AuthGeneralError message={error} />

              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <OtpCodeInput value={otp} onChange={setOtp} />
                <button type="submit" disabled={loading} style={authSubmitButtonStyle(loading)}>
                  {loading ? (<><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Verifying…</>) : "Verify Code"}
                </button>
              </form>

              <div style={{ marginTop: 20, textAlign: "center" }}>
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  style={{ background: "none", border: "none", fontSize: 12, color: cooldown > 0 ? "#71717a" : "#f59e0b", cursor: cooldown > 0 ? "default" : "pointer", fontWeight: 600 }}
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't get a code? Resend"}
                </button>
              </div>
            </>
          )}

          {step === "password" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
                  Choose a new password
                </h1>
                <p style={{ fontSize: 13, color: "#a1a1aa" }}>Code verified — set a new password for your account.</p>
              </div>

              <AuthGeneralError message={error} />

              <form onSubmit={handleSetPassword} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <AuthInputField
                  id="password" label="New Password" type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)} icon={Lock}
                  placeholder="••••••••" autoComplete="new-password"
                />
                <AuthInputField
                  id="confirmPassword" label="Confirm Password" type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} icon={Lock}
                  placeholder="••••••••" autoComplete="new-password"
                />
                <button type="submit" disabled={loading} style={authSubmitButtonStyle(loading)}>
                  {loading ? (<><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Saving…</>) : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle2 style={{ width: 30, height: 30, color: "#4ade80" }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fafafa", marginBottom: 8, fontFamily: "'Playfair Display',Georgia,serif" }}>Password Updated!</h2>
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
