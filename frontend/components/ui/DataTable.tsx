"use client";
import React, { useState } from "react";
import { Search, Plus, Trash2, Edit3, Loader2 } from "lucide-react";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, unknown>> {
  title: string;
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  addLabel?: string;
  searchKeys?: string[];
}

export function DataTable<T extends Record<string, unknown>>({
  title, data, columns, loading, onAdd, onEdit, onDelete, addLabel = "Add New", searchKeys = [],
}: DataTableProps<T>) {
  const [q, setQ] = useState("");

  const filtered = q
    ? data.filter(row =>
        searchKeys.some(k =>
          String(row[k] ?? "").toLowerCase().includes(q.toLowerCase())
        )
      )
    : data;

  const CARD: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, overflow: "hidden",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fafafa", fontFamily: "'Playfair Display',Georgia,serif" }}>{title}</h2>
        {onAdd && (
          <button onClick={onAdd} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "9px 18px", background: "linear-gradient(135deg,#f59e0b,#d97706)",
            border: "none", borderRadius: 10, color: "#09090b",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            <Plus style={{ width: 14, height: 14 }} /> {addLabel}
          </button>
        )}
      </div>

      {/* Search */}
      {searchKeys.length > 0 && (
        <div style={{ position: "relative", marginBottom: 16 }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#71717a" }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${title.toLowerCase()}…`}
            style={{
              width: "100%", paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, color: "#fafafa", fontSize: 13, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      )}

      <div style={CARD}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, gap: 10, color: "#71717a" }}>
            <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#52525b", fontSize: 13 }}>
            {q ? "No results found." : `No ${title.toLowerCase()} yet.`}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {columns.map(col => (
                    <th key={col.key} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                      {col.label}
                    </th>
                  ))}
                  {(onEdit || onDelete) && <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 10, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    {columns.map(col => (
                      <td key={col.key} style={{ padding: "12px 16px", fontSize: 13, color: "#d4d4d8" }}>
                        {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          {onEdit && (
                            <button onClick={() => onEdit(row)} style={{ padding: "5px 10px", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 7, color: "#60a5fa", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                              <Edit3 style={{ width: 11, height: 11 }} /> Edit
                            </button>
                          )}
                          {onDelete && (
                            <button onClick={() => onDelete(row)} style={{ padding: "5px 10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, color: "#f87171", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                              <Trash2 style={{ width: 11, height: 11 }} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
