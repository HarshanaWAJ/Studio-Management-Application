"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  MessageSquare, Loader2, Mail, Phone, Trash2, TrendingUp, Users, Clock, Percent,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";

type Submission = {
  id: number; name: string; email: string; phone: string | null; message: string;
  source: "website" | "booking_widget" | "manual";
  status: "new" | "contacted" | "converted" | "archived";
  createdAt: string; respondedAt: string | null; bookingId: number | null;
};

type Analytics = {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  conversionRate: number;
  avgResponseHours: number | null;
  bookingsFromWidget: number;
  dailySeries: { date: string; count: number }[];
};

const STATUS_COLORS: Record<string, string> = { new: "#f59e0b", contacted: "#38bdf8", converted: "#4ade80", archived: "#71717a" };
const STATUS_OPTIONS = ["new", "contacted", "converted", "archived"];

export default function InquiriesPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<Submission[]>(`/contact-submissions${filter ? `?status=${filter}` : ""}`),
      api.get<Analytics>("/contact-submissions/analytics"),
    ]).then(([subs, stats]) => { setItems(subs); setAnalytics(stats); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (id: number, status: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: status as Submission["status"] } : i)));
    await api.put(`/contact-submissions/${id}`, { status });
    load();
  };

  const remove = async (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await api.delete(`/contact-submissions/${id}`);
  };

  const pieData = analytics ? Object.entries(analytics.bySource).map(([name, value]) => ({ name, value })) : [];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <MessageSquare style={{ width: 20, height: 20, color: "#f59e0b" }} />
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Contact Us</h1>
      </div>
      <p style={{ fontSize: 12, color: "#71717a", marginBottom: 24 }}>
        Every website inquiry and booking-widget request lands here — kept separate from your Clients list so you can analyze how your site is actually performing.
      </p>

      {analytics && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
            <StatCard icon={<Users style={{ width: 16, height: 16 }} />} label="Total Inquiries" value={analytics.total} />
            <StatCard icon={<Percent style={{ width: 16, height: 16 }} />} label="Conversion Rate" value={`${analytics.conversionRate}%`} />
            <StatCard icon={<Clock style={{ width: 16, height: 16 }} />} label="Avg Response Time" value={analytics.avgResponseHours != null ? `${analytics.avgResponseHours}h` : "—"} />
            <StatCard icon={<TrendingUp style={{ width: 16, height: 16 }} />} label="Bookings via Widget" value={analytics.bookingsFromWidget} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 28 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 12 }}>Inquiries — Last 30 Days</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={analytics.dailySeries}>
                  <defs>
                    <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} tickFormatter={(d) => d.slice(5)} interval={4} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#71717a" }} allowDecimals={false} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} fill="url(#fillCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 12 }}>By Source</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={38} outerRadius={60} paddingAngle={3}>
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={["#f59e0b", "#38bdf8", "#a1a1aa"][i % 3]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                {pieData.map((d, i) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#a1a1aa" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: ["#f59e0b", "#38bdf8", "#a1a1aa"][i % 3] }} />
                    {d.name.replace("_", " ")} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["", ...STATUS_OPTIONS].map((s) => (
          <button key={s || "all"} onClick={() => setFilter(s)}
            style={{
              padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: filter === s ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${filter === s ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: filter === s ? "#f59e0b" : "#a1a1aa",
            }}>
            {s ? s[0].toUpperCase() + s.slice(1) : "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}><Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite", color: "#71717a" }} /></div>
      ) : items.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#71717a", fontSize: 13 }}>No inquiries yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((it) => (
            <div key={it.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{it.name}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: `${STATUS_COLORS[it.status]}20`, color: STATUS_COLORS[it.status], fontWeight: 700, textTransform: "uppercase" }}>{it.status}</span>
                  <span style={{ fontSize: 10, color: "#52525b" }}>{it.source.replace("_", " ")}</span>
                  {it.bookingId && <span style={{ fontSize: 10, color: "#4ade80" }}>→ Booking #{it.bookingId}</span>}
                </div>
                <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#71717a", marginBottom: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail style={{ width: 11, height: 11 }} /> {it.email}</span>
                  {it.phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone style={{ width: 11, height: 11 }} /> {it.phone}</span>}
                  <span>{new Date(it.createdAt).toLocaleString()}</span>
                </div>
                <p style={{ fontSize: 12, color: "#d4d4d8", lineHeight: 1.6 }}>{it.message}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                <select value={it.status} onChange={(e) => updateStatus(it.id, e.target.value)}
                  style={{ fontSize: 11, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fafafa" }}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => remove(it.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: 4 }}>
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f59e0b", marginBottom: 8 }}>{icon}<span style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span></div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
