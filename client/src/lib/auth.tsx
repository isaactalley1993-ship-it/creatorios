import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiRequest, setAuthToken, queryClient } from "./queryClient";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  creates: string;
  tier: "free" | "pro" | "business";
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; name: string; creates: string }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(email: string, password: string) {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/login", { email, password });
      const data = await res.json();
      setAuthToken(data.token);
      setUser(data.user);
      queryClient.invalidateQueries();
    } finally {
      setLoading(false);
    }
  }

  async function signup(input: { email: string; password: string; name: string; creates: string }) {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/signup", input);
      const data = await res.json();
      setAuthToken(data.token);
      setUser(data.user);
      queryClient.invalidateQueries();
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setAuthToken(null);
    setUser(null);
    queryClient.clear();
  }

  async function refresh() {
    try {
      const res = await apiRequest("GET", "/api/me");
      const data = await res.json();
      setUser(data);
    } catch {
      setUser(null);
    }
  }

  return (
    <Ctx.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
