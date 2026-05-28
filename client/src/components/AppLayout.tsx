import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, DollarSign, Briefcase, Calculator, FileText, CreditCard, LogOut, Menu, X, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "Income", icon: DollarSign },
  { href: "/deals", label: "Brand Deals", icon: Briefcase },
  { href: "/tax", label: "Tax Center", icon: Calculator },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

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
                {item.label}
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
