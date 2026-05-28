import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Plus, Trash2, Download, Lock } from "lucide-react";
import { Link } from "wouter";
import type { IncomeStream } from "@shared/schema";

const PLATFORMS = ["YouTube AdSense", "TikTok Creator Fund", "Instagram Reels", "Twitch", "Patreon", "Brand Deal", "Affiliate", "Merch", "Podcast", "Other"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = ["#7C3AED", "#FB7185", "#06B6D4", "#F59E0B", "#10B981", "#A855F7", "#EC4899", "#3B82F6", "#84CC16", "#64748B"];

export default function IncomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isFree = user?.tier === "free";

  const income = useQuery<IncomeStream[]>({ queryKey: ["/api/income"] });
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = income.data || [];
    if (filterPlatform !== "all") list = list.filter(i => i.platform === filterPlatform);
    if (filterYear !== "all") list = list.filter(i => String(i.year) === filterYear);
    return list;
  }, [income.data, filterPlatform, filterYear]);

  const years = useMemo(() => Array.from(new Set((income.data || []).map(i => i.year))).sort((a, b) => b - a), [income.data]);

  // Platform breakdown
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const i of filtered) map[i.platform] = (map[i.platform] || 0) + i.amount;
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const visibleRows = isFree ? filtered.slice(0, 10) : filtered;
  const blurredCount = isFree ? Math.max(0, filtered.length - 10) : 0;

  function exportCSV() {
    if (user?.tier !== "business") {
      toast({ title: "Business tier feature", description: "Upgrade to Business to export CSV.", variant: "destructive" });
      return;
    }
    const rows = [["Platform", "Amount", "Month", "Year", "Notes"], ...filtered.map(i => [i.platform, i.amount.toFixed(2), MONTH_NAMES[i.month - 1], i.year, i.notes || ""])];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "creatorios-income.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const del = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/income/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Income</h1>
          <p className="text-muted-foreground text-sm mt-1">Every dollar you've earned, across every platform.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-2" data-testid="button-export-csv">
            <Download className="w-4 h-4" /> Export CSV
            {user?.tier !== "business" && <Lock className="w-3 h-3 ml-1" />}
          </Button>
          <AddIncomeDialog open={open} setOpen={setOpen} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="min-w-[180px]">
          <Label className="text-xs">Platform</Label>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="mt-1" data-testid="select-filter-platform"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[140px]">
          <Label className="text-xs">Year</Label>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pie chart */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-5 lg:col-span-1">
          <div className="font-semibold text-sm mb-3">Platform breakdown</div>
          {pieData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-0 lg:col-span-2 overflow-hidden">
          <div className="p-5 pb-3 flex items-center justify-between">
            <div className="font-semibold text-sm">All entries</div>
            <div className="text-xs text-muted-foreground">{filtered.length} entries · ${filtered.reduce((s, i) => s + i.amount, 0).toLocaleString()} total</div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No income entries yet. Add your first payout above.</TableCell></TableRow>
                )}
                {visibleRows.map(row => (
                  <TableRow key={row.id} data-testid={`row-income-${row.id}`}>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{row.platform}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{MONTH_NAMES[row.month - 1]} {row.year}</TableCell>
                    <TableCell className="text-right font-semibold">${row.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{row.notes || "—"}</TableCell>
                    <TableCell>
                      <button onClick={() => del.mutate(row.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" data-testid={`button-delete-${row.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {blurredCount > 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <div className="relative">
                        <div className="blur-sm select-none pointer-events-none p-4 text-sm text-muted-foreground">
                          {blurredCount} more entries hidden on free plan…
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background flex items-center justify-center">
                          <Link href="/pricing">
                            <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2" data-testid="button-upgrade-income">
                              <Lock className="w-3 h-3" /> Unlock all {filtered.length} entries — Pro
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AddIncomeDialog({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { toast } = useToast();
  const [platform, setPlatform] = useState("YouTube AdSense");
  const [amount, setAmount] = useState("");
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [notes, setNotes] = useState("");

  const m = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/income", {
        platform, amount: parseFloat(amount), month: parseInt(month), year: parseInt(year), notes, type: "payout",
      });
    },
    onSuccess: () => {
      setAmount(""); setNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setOpen(false);
      toast({ title: "Income added" });
    },
    onError: (err: any) => toast({ title: "Couldn't add", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 gap-2" data-testid="button-add-income"><Plus className="w-4 h-4" /> Add income</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log income</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (amount) m.mutate(); }} className="space-y-4">
          <div>
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="mt-1" data-testid="select-add-platform"><SelectValue /></SelectTrigger>
              <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount (USD)</Label>
            <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required className="mt-1" data-testid="input-add-amount" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year</Label>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="mt-1" />
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={m.isPending}>
              {m.isPending ? "Adding…" : "Add income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
