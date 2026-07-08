const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088/api/v1").replace(/\/$/, "") + "/platform";

// Deliberately a SEPARATE token key from the studio app's "accessToken" —
// a Super Admin session and a studio user session can coexist in the same
// browser (e.g. two tabs) without clobbering each other, and this client
// never touches the studio api's storage keys at all.
const TOKEN_KEY = "platformAdminToken";

export function getPlatformToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setPlatformToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function platformLogout() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = "/platform-admin/login";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getPlatformToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    platformLogout();
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

export const platformApi = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
