"use client";
import React, { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadFile } from "@/lib/api";

export default function ImageUploader({
  value,
  onChange,
  label,
  aspect = "16/9",
}: {
  value: string | null | undefined;
  onChange: (url: string) => void;
  label?: string;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await uploadFile<{ url: string }>("/media/upload", file);
      onChange(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a1a1aa" }}>
          {label}
        </label>
      )}
      <div
        onClick={pick}
        style={{
          position: "relative",
          aspectRatio: aspect,
          borderRadius: 12,
          border: "1px dashed rgba(255,255,255,0.2)",
          background: value ? `#111 url(${value}) center/cover no-repeat` : "rgba(255,255,255,0.03)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", overflow: "hidden", minHeight: 90,
        }}
      >
        {!value && !uploading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: "#71717a" }}>
            <ImagePlus style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 11 }}>Click to upload</span>
          </div>
        )}
        {uploading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 style={{ width: 18, height: 18, color: "#f59e0b", animation: "spin 1s linear infinite" }} />
          </div>
        )}
        {value && !uploading && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            style={{
              position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%",
              background: "rgba(0,0,0,0.6)", border: "none", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <X style={{ width: 12, height: 12 }} />
          </button>
        )}
      </div>
      {error && <span style={{ fontSize: 11, color: "#f87171" }}>{error}</span>}
      <input ref={inputRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
    </div>
  );
}
