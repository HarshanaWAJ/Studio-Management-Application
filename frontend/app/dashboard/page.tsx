"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  TrendingUp, Calendar, Users, FileText, DollarSign,
  Package, Camera, Activity, AlertCircle, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

const CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16, padding: 20,
  backdropFilter: "blur(10px)",
};

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div style={{ ...CARD_STYLE, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon style={{ width: 22, height: 22, color }} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#fafafa" }}>{value}</div>
        <div style={{ fontSize: 11, color: "#71717a", fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: color, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState({
    bookings: [] as Record<string, unknown>[],
    clients: [] as Record<string, unknown>[],
    invoices: [] as Record<string, unknown>[],
    packages: [] as Record<string, unknown>[],
    equipment: [] as Record<string, unknown>[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<Record<string, unknown>[]>("/bookings").catch(() => []),
      api.get<Record<string, unknown>[]>("/clients").catch(() => []),
      api.get<Record<string, unknown>[]>("/invoices").catch(() => []),
      api.get<Record<string, unknown>[]>("/packages").catch(() => []),
      api.get<Record<string, unknown>[]>("/equipment").catch(() => []),
    ]).then(([bookings, clients, invoices, packages, equipment]) => {
      setData({ bookings, clients, invoices, packages, equipment });
    }).catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = data.invoices
    .filter(i => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
  const pendingBookings   = data.bookings.filter(b => b.status === "pending").length;
  const confirmedBookings = data.bookings.filter(b => b.status === "confirmed").length;
  const overdueInvoices   = data.invoices.filter(i => i.status === "overdue").length;

  const recentBookings = [...data.bookings]
    .sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime())
    .slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div style={{ padding: "32px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fafafa", fontFamily: "'Playfair Display',Georgia,serif" }}>Studio Dashboard</h1>
            <p style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>Welcome back. Here's what's happening in your studio.</p>
          </div>
          <Link href="/dashboard/bookings" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 10, color: "#09090b", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            <Calendar style={{ width: 14, height: 14 }} /> New Booking
          </Link>
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginTop: 24 }} />
      </div>

      <div style={{ padding: "24px 32px" }}>
        {error && (
          <div style={{ padding: 16, borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", gap: 10, marginBottom: 24 }}>
            <AlertCircle style={{ width: 16, height: 16, color: "#f87171" }} />
            <span style={{ fontSize: 13, color: "#f87171" }}>{error}</span>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
          <StatCard label="Total Clients"   value={loading ? "…" : data.clients.length}   icon={Users}      color="#60a5fa" />
          <StatCard label="Active Bookings" value={loading ? "…" : confirmedBookings}      icon={Calendar}   color="#f59e0b" sub={`${pendingBookings} pending`} />
          <StatCard label="Revenue (Paid)"  value={loading ? "…" : `Rs. ${totalRevenue.toLocaleString()}`} icon={DollarSign} color="#4ade80" />
          <StatCard label="Equipment Items" value={loading ? "…" : data.equipment.length}  icon={Camera}     color="#c084fc" />
          {overdueInvoices > 0 && <StatCard label="Overdue Invoices" value={loading ? "…" : overdueInvoices} icon={AlertCircle} color="#f87171" sub="Needs attention" />}
        </div>

        {/* Quick Links */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12, marginBottom: 28 }}>
          {[
            { href: "/dashboard/quotations", label: "New Quotation",  icon: FileText,  color: "#60a5fa" },
            { href: "/dashboard/clients",    label: "Add Client",     icon: Users,     color: "#4ade80" },
            { href: "/dashboard/invoices",   label: "Create Invoice", icon: DollarSign,color: "#f59e0b" },
            { href: "/dashboard/galleries",  label: "Upload Gallery", icon: Camera,    color: "#c084fc" },
            { href: "/dashboard/frames",     label: "Frame Orders",   icon: Package,   color: "#fb923c" },
            { href: "/dashboard/inventory",  label: "Check Stock",    icon: Activity,  color: "#34d399" },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href} style={{ ...CARD_STYLE, display: "flex", flexDirection: "column", gap: 10, textDecoration: "none", padding: "16px", cursor: "pointer" }}>
              <Icon style={{ width: 20, height: 20, color }} />
              <span style={{ fontSize: 12, color: "#a1a1aa", fontWeight: 500 }}>{label}</span>
              <ArrowUpRight style={{ width: 12, height: 12, color: "#52525b", marginTop: "auto" }} />
            </Link>
          ))}
        </div>

        {/* Recent Bookings */}
        <div style={{ ...CARD_STYLE }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#fafafa" }}>Recent Bookings</h2>
            <Link href="/dashboard/bookings" style={{ fontSize: 12, color: "#f59e0b", textDecoration: "none" }}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ color: "#71717a", fontSize: 13, padding: "20px 0" }}>Loading…</div>
          ) : recentBookings.length === 0 ? (
            <div style={{ color: "#52525b", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
              No bookings yet. <Link href="/dashboard/bookings" style={{ color: "#f59e0b" }}>Create your first booking →</Link>
            </div>
          ) : (
            <div>
              {recentBookings.map((b, i) => {
                const statusColor: Record<string, string> = { pending: "#f59e0b", confirmed: "#4ade80", completed: "#60a5fa", cancelled: "#f87171" };
                const col = statusColor[b.status as string] || "#71717a";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < recentBookings.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${col}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Calendar style={{ width: 14, height: 14, color: col }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: "#fafafa", fontWeight: 500 }}>{b.title as string}</div>
                        <div style={{ fontSize: 11, color: "#71717a" }}>{b.startTime ? new Date(b.startTime as string).toLocaleDateString() : ""}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: `${col}18`, color: col, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{b.status as string}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
