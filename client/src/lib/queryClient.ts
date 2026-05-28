import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

// In-memory auth token (sandbox blocks localStorage)
let authToken: string | null = null;
const tokenListeners: Set<(token: string | null) => void> = new Set();

export function setAuthToken(t: string | null) {
  authToken = t;
  tokenListeners.forEach((fn) => fn(t));
}
export function getAuthToken() {
  return authToken;
}
export function subscribeAuth(fn: (token: string | null) => void) {
  tokenListeners.add(fn);
  return () => tokenListeners.delete(fn);
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      if (j.message) msg = j.message;
    } catch {
      try { msg = await res.text(); } catch {}
    }
    throw new Error(msg);
  }
}

function authHeaders(extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...extra };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: authHeaders(data ? { "Content-Type": "application/json" } : {}),
    body: data ? JSON.stringify(data) : undefined,
  });
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = (queryKey as any[]).filter((p) => typeof p === "string").join("/");
    const res = await fetch(`${API_BASE}${url}`, { headers: authHeaders() });
    if (unauthorizedBehavior === "returnNull" && res.status === 401) return null;
    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: false,
    },
    mutations: { retry: false },
  },
});
