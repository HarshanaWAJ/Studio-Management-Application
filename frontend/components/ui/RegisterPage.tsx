"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft,
  Mail, Lock, User, Phone, MapPin, Building2, AlertCircle,
  CheckCircle2, CheckCheck, Sparkles, Star,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const STEPS = [
  { num: 1, label: "Studio Info",    icon: Building2  },
  { num: 2, label: "Admin Account",  icon: User       },
  { num: 3, label: "Review",         icon: CheckCheck },
];

// ─── Background ───────────────────────────────────────────────
function Background() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #09090b, #10100d, #1a1208)" }} />
      <div style={{
        position: "absolute", top: "5%", right: "5%", width: 384, height: 384,
        borderRadius: "50%", opacity: 0.15,
        background: "radial-gradient(circle, rgba(245,158,11,0.35) 0%, transparent 70%)",
        animation: "float 4s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "10%", left: "8%", width: 288, height: 288,
        borderRadius: "50%", opacity: 0.10,
        background: "radial-gradient(circle, rgba(217,119,6,0.3) 0%, transparent 70%)",
        animation: "float 4s ease-in-out infinite", animationDelay: "2s",
      }} />
      <div style={{
        position: "absolute", inset: 0, opacity: 0.025,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32 }}>
      {STEPS.map((step, i) => {
        const done   = step.num < current;
        const active = step.num === current;
        return (
          <React.Fragment key={step.num}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <motion.div
                animate={{
                  scale: active ? 1.1 : 1,
                  backgroundColor: done || active ? "rgb(245,158,11)" : "rgba(255,255,255,0.06)",
                }}
                transition={{ duration: 0.3 }}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${done || active ? "rgba(245,158,11,0.6)" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                {done
                  ? <CheckCircle2 style={{ width: 16, height: 16, color: "#09090b" }} />
                  : <step.icon   style={{ width: 16, height: 16, color: active ? "#09090b" : "#71717a" }} />
                }
              </motion.div>
              <span style={{
                fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600,
                color: active ? "#f59e0b" : done ? "#a1a1aa" : "#52525b",
              }}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, maxWidth: 60, height: 1, marginBottom: 16, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.1)", borderRadius: 999 }} />
                <motion.div
                  animate={{ width: done ? "100%" : "0%" }}
                  transition={{ duration: 0.4 }}
                  style={{ position: "absolute", top: 0, bottom: 0, left: 0, background: "#f59e0b", borderRadius: 999 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Reusable Field ───────────────────────────────────────────
interface FieldProps {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; icon: React.ElementType;
  placeholder?: string; autoComplete?: string; error?: string;
  suffix?: React.ReactNode;
}

function Field({ id, label, type = "text", value, onChange, icon: Icon, placeholder, autoComplete, error, suffix }: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#a1a1aa" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {/* Icon */}
        <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#71717a", display: "flex", alignItems: "center" }}>
          <Icon style={{ width: 16, height: 16 }} />
        </div>
        {/* Input */}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: "100%",
            paddingTop: 14,
            paddingBottom: 14,
            paddingLeft: 44,
            paddingRight: suffix ? 48 : 16,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${error ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
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
            e.target.style.borderColor = error ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)";
            e.target.style.background  = "rgba(255,255,255,0.04)";
            e.target.style.boxShadow   = "none";
          }}
        />
        {/* Suffix (eye toggle etc.) */}
        {suffix && (
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
            {suffix}
          </div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#f87171" }}
          >
            <AlertCircle style={{ width: 12, height: 12 }} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Password Strength ────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const strength = !password ? 0 : password.length < 6 ? 1 : password.length < 10 || !/[A-Z]/.test(password) ? 2 : password.length >= 10 && /[A-Z]/.test(password) && /\d/.test(password) ? 4 : 3;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f59e0b", "#60a5fa", "#22c55e"];
  if (!password) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ height: 4, flex: 1, borderRadius: 999, background: i <= strength ? colors[strength] : "rgba(39,39,42,1)", transition: "background 0.3s" }} />
        ))}
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: colors[strength] }}>{labels[strength]}</span>
    </div>
  );
}

// ─── Review Row ───────────────────────────────────────────────
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#fafafa", fontWeight: 500, maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

// ─── MAIN REGISTER PAGE ───────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep]               = React.useState(1);
  const [loading, setLoading]         = React.useState(false);
  const [success, setSuccess]         = React.useState(false);
  const [generalError, setGeneralError] = React.useState("");
  const [showPass, setShowPass]       = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [studioName, setStudioName]     = React.useState("");
  const [studioEmail, setStudioEmail]   = React.useState("");
  const [studioPhone, setStudioPhone]   = React.useState("");
  const [studioAddress, setStudioAddress] = React.useState("");

  const [firstName, setFirstName]         = React.useState("");
  const [lastName, setLastName]           = React.useState("");
  const [adminEmail, setAdminEmail]       = React.useState("");
  const [password, setPassword]           = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errors, setErrors]               = React.useState<Record<string, string>>({});

  function validateStep1() {
    const e: Record<string,string> = {};
    if (!studioName.trim())    e.studioName    = "Studio name is required";
    if (!studioEmail.trim())   e.studioEmail   = "Studio email is required";
    else if (!/\S+@\S+\.\S+/.test(studioEmail)) e.studioEmail = "Invalid email format";
    if (!studioPhone.trim())   e.studioPhone   = "Phone number is required";
    if (!studioAddress.trim()) e.studioAddress = "Address is required";
    return e;
  }

  function validateStep2() {
    const e: Record<string,string> = {};
    if (!firstName.trim())         e.firstName       = "First name is required";
    if (!lastName.trim())          e.lastName        = "Last name is required";
    if (!adminEmail.trim())        e.adminEmail      = "Admin email is required";
    else if (!/\S+@\S+\.\S+/.test(adminEmail)) e.adminEmail = "Invalid email format";
    if (!password)                 e.password        = "Password is required";
    else if (password.length < 8)  e.password        = "Minimum 8 characters";
    if (!confirmPassword)          e.confirmPassword = "Please confirm password";
    else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  }

  const [direction, setDirection] = React.useState(1);

  function goNext() {
    const errs = step === 1 ? validateStep1() : validateStep2();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setDirection(1);
    setStep(s => s + 1);
  }

  function goPrev() {
    setErrors({});
    setDirection(-1);
    setStep(s => s - 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setGeneralError("");
    try {
      const res = await fetch(`${API_URL}/studios/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioName, email: studioEmail, phone: studioPhone, address: studioAddress, adminFirstName: firstName, adminLastName: lastName, adminEmail, adminPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) { setGeneralError(data?.message || "Registration failed."); setLoading(false); return; }
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch {
      setGeneralError("Unable to reach the server. Please try again.");
      setLoading(false);
    }
  }

  const slideVariants = {
    enter:  (d: number) => ({ opacity: 0, x: d > 0 ?  40 : -40 }),
    center:              { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -40 :  40 }),
  };

  // Shared styles
  const cardStyle: React.CSSProperties = {
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderRadius: 24,
    padding: 32,
    boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
  };

  const reviewCardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 20,
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 16px", overflow: "hidden" }}>
      <Background />

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 520 }}>
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: 16, background: "linear-gradient(135deg, #e29d42, #bf6820)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px rgba(245,158,11,0.3)" }}>
              <Camera style={{ width: 20, height: 20, color: "#09090b" }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1 }}>JH Studio</div>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "#71717a", marginTop: 3 }}>Studio Registration</div>
            </div>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }} style={cardStyle}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
              Register Your Studio
            </h1>
            <p style={{ fontSize: 14, color: "#a1a1aa" }}>Set up your studio and admin account in 3 easy steps</p>
          </div>

          <StepIndicator current={step} />

          {/* General error */}
          <AnimatePresence>
            {generalError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
                <AlertCircle style={{ width: 16, height: 16, color: "#f87171", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#f87171" }}>{generalError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success */}
          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ marginBottom: 20, padding: 20, borderRadius: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 style={{ width: 28, height: 28, color: "#4ade80" }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", marginBottom: 4 }}>Studio Registered!</div>
                  <div style={{ fontSize: 12, color: "#a1a1aa" }}>Redirecting to login…</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step content */}
          {!success && (
            <div style={{ position: "relative", overflow: "hidden" }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >

                  {/* ── Step 1 ── */}
                  {step === 1 && (
                    <>
                      <p style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                        Step 1 of 3 — Studio Information
                      </p>
                      <Field id="studio-name"    label="Studio Name"  value={studioName}    onChange={setStudioName}    icon={Building2} placeholder="Lumina Photography Studio" error={errors.studioName} />
                      <Field id="studio-email"   label="Studio Email" type="email" value={studioEmail}   onChange={setStudioEmail}   icon={Mail}      placeholder="studio@email.com" autoComplete="email" error={errors.studioEmail} />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <Field id="studio-phone"   label="Phone"   value={studioPhone}   onChange={setStudioPhone}   icon={Phone}  placeholder="+94 XX XXX XXXX" error={errors.studioPhone} />
                        <Field id="studio-address" label="Address" value={studioAddress} onChange={setStudioAddress} icon={MapPin} placeholder="Colombo, Sri Lanka" error={errors.studioAddress} />
                      </div>
                    </>
                  )}

                  {/* ── Step 2 ── */}
                  {step === 2 && (
                    <>
                      <p style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                        Step 2 of 3 — Admin Account
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <Field id="first-name" label="First Name" value={firstName} onChange={setFirstName} icon={User} placeholder="Janith"   autoComplete="given-name"  error={errors.firstName} />
                        <Field id="last-name"  label="Last Name"  value={lastName}  onChange={setLastName}  icon={User} placeholder="Harshana" autoComplete="family-name" error={errors.lastName} />
                      </div>
                      <Field id="admin-email" label="Admin Email" type="email" value={adminEmail} onChange={setAdminEmail} icon={Mail} placeholder="admin@studio.com" autoComplete="email" error={errors.adminEmail} />
                      <div>
                        <Field
                          id="admin-password" label="Password"
                          type={showPass ? "text" : "password"}
                          value={password} onChange={setPassword}
                          icon={Lock} placeholder="Min. 8 characters" autoComplete="new-password"
                          error={errors.password}
                          suffix={
                            <button type="button" id="toggle-reg-password" onClick={() => setShowPass(v => !v)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#71717a", padding: 4, display: "flex" }}>
                              {showPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                            </button>
                          }
                        />
                        <PasswordStrength password={password} />
                      </div>
                      <Field
                        id="confirm-password" label="Confirm Password"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword} onChange={setConfirmPassword}
                        icon={Lock} placeholder="Repeat password" autoComplete="new-password"
                        error={errors.confirmPassword}
                        suffix={
                          <button type="button" id="toggle-confirm-password" onClick={() => setShowConfirm(v => !v)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#71717a", padding: 4, display: "flex" }}>
                            {showConfirm ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                          </button>
                        }
                      />
                    </>
                  )}

                  {/* ── Step 3 ── */}
                  {step === 3 && (
                    <>
                      <p style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                        Step 3 of 3 — Review & Confirm
                      </p>
                      <div style={reviewCardStyle}>
                        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#71717a", marginBottom: 12, fontWeight: 600 }}>Studio Details</p>
                        <ReviewRow label="Studio Name"  value={studioName} />
                        <ReviewRow label="Studio Email" value={studioEmail} />
                        <ReviewRow label="Phone"        value={studioPhone} />
                        <ReviewRow label="Address"      value={studioAddress} />
                      </div>
                      <div style={reviewCardStyle}>
                        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#71717a", marginBottom: 12, fontWeight: 600 }}>Admin Account</p>
                        <ReviewRow label="Name"     value={`${firstName} ${lastName}`} />
                        <ReviewRow label="Email"    value={adminEmail} />
                        <ReviewRow label="Password" value={"•".repeat(password.length)} />
                      </div>
                      <div style={{ padding: 16, borderRadius: 12, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <Sparkles style={{ width: 16, height: 16, color: "#f59e0b", flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.6 }}>
                          By registering, you agree to our Terms of Service. Your studio will be created as an active account and you can start managing bookings immediately.
                        </p>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Navigation */}
          {!success && (
            <div style={{ display: "flex", gap: 12, marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)", justifyContent: step > 1 ? "space-between" : "flex-end" }}>
              {step > 1 && (
                <button id="reg-prev" type="button" onClick={goPrev} disabled={loading}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#fafafa", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                  <ArrowLeft style={{ width: 16, height: 16 }} /> Back
                </button>
              )}
              {step < 3 ? (
                <button id="reg-next" type="button" onClick={goNext}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 32px", background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", borderRadius: 12, color: "#09090b", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(245,158,11,0.35)" }}>
                  Continue <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              ) : (
                <button id="reg-submit" type="button" onClick={handleSubmit} disabled={loading}
                  style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 32px", background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", borderRadius: 12, color: "#09090b", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, boxShadow: "0 4px 20px rgba(245,158,11,0.35)" }}>
                  {loading
                    ? <><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Registering Studio…</>
                    : <><CheckCircle2 style={{ width: 16, height: 16 }} /> Register Studio</>
                  }
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Login link */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ textAlign: "center", marginTop: 24 }}>
          <span style={{ fontSize: 14, color: "#71717a" }}>
            Already have an account?{" "}
            <Link href="/auth/login" id="goto-login" style={{ color: "#f59e0b", fontWeight: 600, textDecoration: "none" }}>Sign In</Link>
          </span>
        </motion.div>

        {/* Trust badges */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 20 }}>
          {[{ icon: Star, label: "Free Forever Plan" }, { icon: Sparkles, label: "No Setup Fees" }].map(({ icon: Icon, label }) => (
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
