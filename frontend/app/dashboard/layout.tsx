"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Camera, LayoutDashboard, Calendar, Users, Package, FileText,
  Image, Wrench, Box, Quote, Menu, X, LogOut, ChevronRight,
  Frame, Bell, UserCog, Globe, MessageSquare, CreditCard
} from "lucide-react";
import { logout } from "@/lib/api";

const NAV = [
  { href: "/dashboard",            label: "Dashboard",   icon: LayoutDashboard },
  { href: "/dashboard/bookings",   label: "Bookings",    icon: Calendar },
  { href: "/dashboard/clients",    label: "Clients",     icon: Users },
  { href: "/dashboard/staff",      label: "Staff",       icon: UserCog },
  { href: "/dashboard/website",    label: "Website",     icon: Globe },
  { href: "/dashboard/inquiries",  label: "Contact Us",  icon: MessageSquare },
  { href: "/dashboard/packages",   label: "Packages",    icon: Package },
  { href: "/dashboard/quotations", label: "Quotations",  icon: Quote },
  { href: "/dashboard/invoices",   label: "Invoices",    icon: FileText },
  { href: "/dashboard/galleries",  label: "Galleries",   icon: Image },
  { href: "/dashboard/equipment",  label: "Equipment",   icon: Wrench },
  { href: "/dashboard/frames",     label: "Frames",      icon: Frame },
  { href: "/dashboard/inventory",  label: "Inventory",   icon: Box },
  { href: "/dashboard/subscription",label:"Subscription",icon: CreditCard },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen]   = useState(false);
  const [user,  setUser]  = useState<{ firstName?: string; lastName?: string; email?: string; role?: string; permissions?: string[] } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!token) { router.push("/auth/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    } catch { router.push("/auth/login"); }
  }, [router]);

  const sidebarBase: React.CSSProperties = {
    width: 240, minHeight: "100vh",
    background: "rgba(0,0,0,0.6)",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    backdropFilter: "blur(20px)",
    display: "flex", flexDirection: "column",
    position: "sticky", top: 0, height: "100vh",
    overflowY: "auto",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg,#09090b,#0f0e0b,#0d0a05)", color: "#fafafa", fontFamily: "var(--font-inter,system-ui,sans-serif)" }}>
      
      {/* Sidebar */}
      <aside style={sidebarBase}>
        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg,#e29d42,#bf6820)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(245,158,11,0.3)", flexShrink: 0 }}>
              <Camera style={{ width: 18, height: 18, color: "#09090b" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1 }}>JH Studio</div>
              <div style={{ fontSize: 9, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 2 }}>Management</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px 12px", flex: 1 }}>
          {NAV.filter(({ href }) =>
            (href !== "/dashboard/staff" || (user?.permissions || []).includes("staff:view")) &&
            (href !== "/dashboard/website" || (user?.permissions || []).includes("website:manage")) &&
            (href !== "/dashboard/inquiries" || (user?.permissions || []).includes("inquiries:view"))
          ).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", marginBottom: 2, borderRadius: 10,
                  textDecoration: "none",
                  background: active ? "rgba(245,158,11,0.12)" : "transparent",
                  border: `1px solid ${active ? "rgba(245,158,11,0.2)" : "transparent"}`,
                  color: active ? "#f59e0b" : "#a1a1aa",
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                }}>
                <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                {label}
                {active && <ChevronRight style={{ width: 12, height: 12, marginLeft: "auto" }} />}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {user && (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fafafa" }}>{user.firstName} {user.lastName}</div>
              <div style={{ fontSize: 10, color: "#71717a", marginTop: 2 }}>{user.email}</div>
              <div style={{ marginTop: 4 }}>
                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(245,158,11,0.15)", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                  {user.role?.replace("_", " ")}
                </span>
              </div>
            </div>
          )}
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171", fontSize: 13, cursor: "pointer" }}>
            <LogOut style={{ width: 14, height: 14 }} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
