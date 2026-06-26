"use client";
import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, width = 520 }: ModalProps) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "relative", width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto",
        background: "rgba(15,14,12,0.97)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20, padding: 28, boxShadow: "0 25px 70px rgba(0,0,0,0.8)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fafafa", fontFamily: "'Playfair Display',Georgia,serif" }}>{title}</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#71717a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  half?: boolean;
}

export function FormField({ label, children, error }: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#a1a1aa" }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 11, color: "#f87171" }}>{error}</span>}
    </div>
  );
}

const inputBase: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, color: "#fafafa", fontSize: 13, outline: "none",
  boxSizing: "border-box",
};

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputBase, ...props.style }} />;
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Force a dark background on options so they are readable */}
      <style>{`
        select option {
          background-color: #18181b;
          color: #fafafa;
        }
      `}</style>
      <select 
        {...props} 
        style={{ 
          ...inputBase, 
          appearance: "none", 
          cursor: "pointer",
          ...props.style 
        }}
      >
        {children}
      </select>
      <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#a1a1aa" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={props.rows || 3} style={{ ...inputBase, resize: "vertical", ...props.style }} />;
}

export function SubmitButton({ loading, children }: { loading?: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading} style={{
      width: "100%", padding: "12px 24px",
      background: "linear-gradient(135deg,#f59e0b,#d97706)",
      border: "none", borderRadius: 10, color: "#09090b",
      fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
      opacity: loading ? 0.7 : 1, marginTop: 8,
    }}>
      {loading ? "Saving…" : children}
    </button>
  );
}
