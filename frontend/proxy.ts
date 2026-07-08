import { NextRequest, NextResponse } from "next/server";

// Hostnames that ARE this app itself (not a studio's custom domain).
// Add your production app domain(s) here / via env, comma separated.
const APP_HOSTS = new Set(
    (process.env.NEXT_PUBLIC_APP_HOSTS || "localhost:3000,127.0.0.1:3000")
        .split(",")
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean)
);

export function proxy(req: NextRequest) {
    const host = req.headers.get("host")?.toLowerCase() || "";
    const { pathname } = req.nextUrl;

    // Already-internal paths (dashboard, api, assets, our own domain-site route) pass through
    if (
        APP_HOSTS.has(host) ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/domain-site") ||
        pathname === "/favicon.ico"
    ) {
        return NextResponse.next();
    }

    // Any other Host header is treated as a studio's connected custom domain —
    // rewrite the request to the domain-aware public site renderer.
    const bareHost = host.replace(/^www\./, "").split(":")[0];
    const url = req.nextUrl.clone();
    url.pathname = `/domain-site/${bareHost}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
}

export const config = {
    matcher: ["/((?!_next/static|_next/image).*)"],
};
