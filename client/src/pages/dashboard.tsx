import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  TrendingUp, Wallet, PiggyBank, Star, Calendar, Lock, Plus, ArrowRight, Sparkles,
} from "lucide-react";
import type { IncomeStream, BrandDeal } from "@shared/schema";

const PLATFORMS = ["OnlyFans",
  "YouTube AdSense", "TikTok Creator Fund", "Instagram Reels", "Twitch",
  "Patreon", "Brand Deal", "Affiliate", "Merch", "Podcast", "Other",
];

const PLATFORM_COLORS: Record<string, string> = {
  "YouTube AdSense": "hsl(0 85% 60%)",
  "TikTok Creator Fund": "hsl(340 80% 55%)",
  "Instagram Reels": "hsl(320 70% 60%)",
  "Twitch": "hsl(265 75% 60%)",
  "Patreon": "hsl(10 75% 55%)",
  "OnlyFans": "hsl(195 85% 42%)",
  "Brand Deal": "hsl(262 83% 58%)",
  "Affiliate": "hsl(173 58% 45%)",
  "Merch": "hsl(43 90% 55%)",
  "Podcast": "hsl(220 70% 55%)",
  "Other": "hsl(0 0% 50%)",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isFree = user?.tier === "free";

  const stats = useQuery<any>({ queryKey: ["/api/stats"] });
  const income = useQuery<IncomeStream[]>({ queryKey: ["/api/income"] });
  const deals = useQuery<BrandDeal[]>({ queryKey: ["/api/deals"] });

  // Quick add form
  const [qPlatform, setQPlatform] = useState("YouTube AdSense");
  const [qAmount, setQAmount] = useState("");
  const now = new Date();
  const [qMonth, setQMonth] = useState(String(now.getMonth() + 1));
  const [qYear, setQYear] = useState(String(now.getFullYear()));

  const addIncome = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/income", {
        platform: qPlatform, amount: parseFloat(qAmount), month: parseInt(qMonth), year: parseInt(qYear), notes: "",
        type: "payout",
      });
    },
    onSuccess: () => {
      setQAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Income logged", description: "Updated your totals." });
    },
    onError: (err: any) => toast({ title: "Couldn't add", description: err.message, variant: "destructive" }),
  });

  // Build last 6 months bar data
  const last6: { label: string; key: string; month: number; year: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(2026, 4, 1);
    d.setMonth(d.getMonth() - i);
    last6.push({
      label: MONTH_NAMES[d.getMonth()],
      key: `${d.getFullYear()}-${d.getMonth() + 1}`,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  }
  const platformsSet = Array.from(new Set((income.data || []).map(i => i.platform)));
  const chartData = last6.map((m) => {
    const row: any = { name: m.label };
    for (const p of platformsSet) {
      row[p] = (income.data || [])
        .filter(i => i.platform === p && i.month === m.month && i.year === m.year)
        .reduce((s, i) => s + i.amount, 0);
    }
    return row;
  });

  // Q2 due date 2026: June 16
  const q2DueDate = new Date("2026-06-16");
  const daysToQ2 = Math.max(0, Math.ceil((q2DueDate.getTime() - Date.now()) / (24 * 3600 * 1000)));

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-greeting">
            Hey {user?.name?.split(" ")[0] || "there"}, here's your month so far <span className="inline-block">👋</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {stats.data?.currentMonthLabel ? `Showing data for ${formatMonth(stats.data.currentMonthLabel)}` : "Loading…"}
          </p>
        </div>
        <Link href="/income">
          <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 hover:text-primary" data-testid="button-view-income">
            View all income <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Tax alert banner */}
      <Card className="p-4 mb-6 bg-gradient-to-r from-coral/10 via-coral/5 to-transparent border-coral/30">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
          <div className="w-10 h-10 rounded-lg bg-coral/15 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-coral" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Q2 estimated tax due June 16</div>
            <div className="text-sm text-muted-foreground">
              {daysToQ2} days away — set aside <span className="font-semibold text-foreground">${formatN(stats.data?.ytdTaxSetAside || 0)}</span> based on YTD income.
            </div>
          </div>
          <Link href="/tax">
            <Button size="sm" className="bg-coral hover:bg-coral/90 text-coral-foreground" data-testid="button-tax-center">
              Open tax center
            </Button>
          </Link>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Wallet} tint="bg-primary/10 text-primary" label="This month" value={`$${formatN(stats.data?.thisMonthTotal || 0)}`} testId="stat-month" />
        <StatCard icon={TrendingUp} tint="bg-coral/10 text-coral" label="YTD total" value={`$${formatN(stats.data?.ytd || 0)}`} testId="stat-ytd" />
        <StatCard icon={PiggyBank} tint="bg-purple-500/10 text-primary" label="Tax set-aside (25%)" value={`$${formatN(stats.data?.ytdTaxSetAside || 0)}`} testId="stat-tax" />
        <StatCard icon={Star} tint="bg-yellow-500/10 text-yellow-600" label="Top platform" value={stats.data?.topPlatform || "—"} small testId="stat-top" />
      </div>

      {/* Chart */}
      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold">Monthly income</div>
            <div className="text-xs text-muted-foreground">Last 6 months, stacked by platform</div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v: any) => `$${formatN(v)}`}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {platformsSet.map((p) => (
                <Bar key={p} dataKey={p} stackId="a" fill={PLATFORM_COLORS[p] || "hsl(262 60% 60%)"} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Free tier upgrade gate */}
      {isFree && (
        <Card className="p-7 mb-6 bg-gradient-to-br from-primary/10 via-coral/5 to-background border-primary/30 border-2 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <Sparkles className="w-7 h-7 text-primary mb-3" />
            <h3 className="text-xl font-bold tracking-tight">Unlock the full picture</h3>
            <p className="mt-2 text-muted-foreground max-w-xl">
              You're on the free plan. Pro unlocks unlimited income tracking, the tax estimator, deduction tracking, and full deal CRM.
            </p>
            <Link href="/pricing">
              <Button className="mt-5 bg-primary hover:bg-primary/90" data-testid="button-upgrade-dash">
                Upgrade to Pro — $29/mo <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick add */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-primary" />
            <div className="font-semibold text-sm">Quick add income</div>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (qAmount) addIncome.mutate(); }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Platform</Label>
                <Select value={qPlatform} onValueChange={setQPlatform}>
                  <SelectTrigger className="mt-1 h-9" data-testid="select-quickadd-platform"><SelectValue /></SelectTrigger>
                  <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Amount</Label>
                <Input type="number" step="0.01" min="0" value={qAmount} onChange={(e) => setQAmount(e.target.value)} placeholder="0.00" className="mt-1 h-9" data-testid="input-quickadd-amount" />
              </div>
              <div>
                <Label className="text-xs">Month</Label>
                <Select value={qMonth} onValueChange={setQMonth}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Year</Label>
                <Input type="number" value={qYear} onChange={(e) => setQYear(e.target.value)} className="mt-1 h-9" />
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={addIncome.isPending || !qAmount} data-testid="button-quickadd">
              {addIncome.isPending ? "Adding…" : "Log income"}
            </Button>
          </form>
        </Card>

        {/* Recent deals */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-sm">Recent brand deals</div>
            <Link href="/deals" className="text-xs text-primary hover:underline" data-testid="link-all-deals">View all →</Link>
          </div>
          <div className="space-y-2.5">
            {(stats.data?.recentDeals || []).length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">No deals yet. <Link href="/deals" className="text-primary hover:underline">Add your first →</Link></div>
            )}
            {(stats.data?.recentDeals || []).slice(0, 3).map((d: BrandDeal) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover-elevate">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{d.brand}</div>
                  <div className="text-xs text-muted-foreground">${formatN(d.amount)} · due {d.dueDate || "TBD"}</div>
                </div>
                <DealStatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, tint, label, value, small, testId }: { icon: any; tint: string; label: string; value: string; small?: boolean; testId?: string }) {
  return (
    <Card className="p-4" data-testid={testId}>
      <div className={`w-9 h-9 rounded-lg ${tint} flex items-center justify-center mb-3`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-bold tracking-tight ${small ? "text-base" : "text-2xl"}`}>{value}</div>
    </Card>
  );
}

export function DealStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    outreach: { label: "Outreach", cls: "bg-muted text-muted-foreground" },
    negotiating: { label: "Negotiating", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
    signed: { label: "Signed", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
    paid: { label: "Paid", cls: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
    done: { label: "Done", cls: "bg-muted/60 text-muted-foreground" },
  };
  const m = map[status] || map.outreach;
  return <Badge variant="outline" className={`${m.cls} border-transparent`}>{m.label}</Badge>;
}

function formatN(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function formatMonth(key: string): string {
  const [m, y] = key.split("/");
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}
