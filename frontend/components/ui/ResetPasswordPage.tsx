"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  API_URL, AuthBackground, authCardStyle, AuthLogo,
  AuthInputField, AuthGeneralError, authSubmitButtonStyle,
} from "./AuthShared";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const isInvite = params.get("invite") === "1";

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { setError("Missing or invalid reset link."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.message || "Unable to reset password."); setLoading(false); return; }
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 1800);
    } catch {
      setError("Unable to reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 16px", overflow: "hidden" }}>
      <AuthBackground />
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 448 }}>
        <AuthLogo subtitle={isInvite ? "Activate Your Account" : "Reset Password"} />

        <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={authCardStyle}>
          <div style={{ position: "absolute", inset: -1, borderRadius: 24, background: "linear-gradient(135deg, rgba(226,157,66,0.1), transparent)", zIndex: -1, filter: "blur(20px)" }} />

          {!success ? (
            <>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
                  {isInvite ? "Set Your Password" : "Choose a New Password"}
                </h1>
                <p style={{ fontSize: 14, color: "#a1a1aa" }}>
                  {isInvite ? "Welcome! Set a password to activate your staff account." : "Enter a new password for your account"}
                </p>
              </div>

              {!token && (
                <p style={{ fontSize: 13, color: "#f87171", textAlign: "center", marginBottom: 20 }}>
                  This link is missing its token. Please use the link from your email.
                </p>
              )}

              <AuthGeneralError message={error} />

              <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <AuthInputField
                  id="password" label="New Password" type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} icon={Lock}
                  placeholder="At least 6 characters" autoComplete="new-password"
                  suffix={
                    <button type="button" onClick={() => setShowPassword((s) => !s)} style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", display: "flex" }}>
                      {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>
                  }
                />
                <AuthInputField
                  id="confirm" label="Confirm Password" type={showPassword ? "text" : "password"} value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} icon={Lock}
                  placeholder="Re-enter password" autoComplete="new-password"
                />
                <button type="submit" disabled={loading || !token} style={authSubmitButtonStyle(loading)}>
                  {loading ? (<><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Saving…</>) : (isInvite ? "Activate Account" : "Reset Password")}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle2 style={{ width: 30, height: 30, color: "#4ade80" }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fafafa", marginBottom: 8, fontFamily: "'Playfair Display',Georgia,serif" }}>Password updated!</h2>
              <p style={{ fontSize: 13, color: "#a1a1aa" }}>Redirecting to sign in…</p>
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
