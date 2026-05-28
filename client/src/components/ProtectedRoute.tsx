import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { getAuthToken } from "@/lib/queryClient";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const hasToken = !!getAuthToken();
  useEffect(() => {
    if (!user && !hasToken) navigate("/login");
  }, [user, hasToken, navigate]);
  if (!user) {
    // Token exists but user not loaded yet (or no token — effect will redirect)
    return null;
  }
  return <>{children}</>;
}
