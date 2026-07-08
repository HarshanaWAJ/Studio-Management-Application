"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, Building2, Layers, LogOut, Inbox } from "lucide-react";
import { getPlatformToken, platformLogout, platformApi } from "@/lib/platformApi";

const NAV = [
  { href: "/platform-admin",           label: "Overview",       icon: ShieldCheck, exact: true },
  { href: "/platform-admin/studios",   label: "Studios",        icon: Building2 },
  { href: "/platform-admin/plans",     label: "Plans & Pricing", icon: Layers },
  { href: "/platform-admin/requests",  label: "Plan Requests",  icon: Inbox, badge: true },
];

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const [pendingCount, setPendingCount] = React.useState(0);
  const isLoginPage = pathname === "/platform-admin/login";

  React.useEffect(() => {
    if (isLoginPage) { setReady(true); return; }
    if (!getPlatformToken()) {
      router.replace("/platform-admin/login");
      return;
    }
    setReady(true);
    // fetch pending plan requests count for badge
    platformApi.get<{ status: string }[]>("/plan-requests")
      .then((reqs) => setPendingCount(reqs.filter(r => r.status === "pending").length))
      .catch(() => {});
  }, [isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;
  if (!ready) return null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#09090b" }}>
      <aside style={{ width: 240, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.08)", padding: "24px 16px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, padding: "0 8px" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#4338ca)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ShieldCheck style={{ width: 18, height: 18, color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Control Center</div>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "#71717a", marginTop: 2 }}>Super Admin</div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
                  fontSize: 13, fontWeight: 600, textDecoration: "none",
                  color: active ? "#fff" : "#a1a1aa",
                  background: active ? "rgba(99,102,241,0.15)" : "transparent",
                  border: active ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                }}
              >
                <Icon style={{ width: 16, height: 16 }} />
                {item.label}
                {item.badge && pendingCount > 0 && (
                  <span style={{ marginLeft: "auto", minWidth: 20, height: 20, borderRadius: 999, background: "#f59e0b", color: "#09090b", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={platformLogout}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#f87171", background: "transparent", border: "1px solid transparent", cursor: "pointer" }}
        >
          <LogOut style={{ width: 16, height: 16 }} />
          Sign Out
        </button>
      </aside>

      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto", maxHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
