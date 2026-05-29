import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, DollarSign, Briefcase, Calculator, FileText, CreditCard, LogOut, Menu, X, Sparkles, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "Income", icon: DollarSign },
  { href: "/deals", label: "Brand Deals", icon: Briefcase },
  { href: "/collabs", label: "Collabs", icon: Users },
  { href: "/tax", label: "Tax Center", icon: Calculator },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pendingQ = useQuery<{ count: number }>({
    queryKey: ["/api/collabs/my/pending-count"],
    refetchInterval: 60_000,
    enabled: !!user,
  });
  const pendingCount = pendingQ.data?.count || 0;

  const Sidebar = (
    <aside className="w-60 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      <div className="p-5">
        <Link href="/dashboard" data-testid="link-logo">
          <Logo size={32} />
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {nav.map((item) => {
          const active = location === item.href || location.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`link-nav-${item.label.toLowerCase().replace(" ", "-")}`}
            >
              <div
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/collabs" && pendingCount > 0 && (
                  <span
                    className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-white text-[10px] font-semibold"
                    data-testid="badge-pending-collab-requests"
                  >
                    {pendingCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border space-y-3">
        {user && (
          <div className="px-2">
            <div className="text-sm font-medium text-sidebar-foreground truncate" data-testid="text-username">
              {user.name}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={
                  user.tier === "business"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : user.tier === "pro"
                    ? "bg-coral/10 text-coral border-coral/30"
                    : "bg-muted text-muted-foreground"
                }
                data-testid="badge-tier"
              >
                {user.tier === "free" && <Sparkles className="w-3 h-3 mr-1" />}
                {user.tier.toUpperCase()}
              </Badge>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={logout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <div className="hidden md:block">{Sidebar}</div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-background border-b border-border flex items-center justify-between px-4">
        <Link href="/dashboard"><Logo size={26} /></Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2"
          data-testid="button-mobile-menu"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile bottom tab bar — always visible on mobile */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background border-t border-border flex items-center justify-around px-2 py-1">
        {[nav[0], nav[1], nav[2], nav[3], nav[4]].map((item) => {
          const active = location === item.href || location.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                active ? "text-primary" : "text-muted-foreground"
              }`}>
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.href === "/collabs" && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-coral" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64" onClick={(e) => e.stopPropagation()}>{Sidebar}</div>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
