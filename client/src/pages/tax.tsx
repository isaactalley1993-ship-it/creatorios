import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Calculator, Calendar, Lightbulb, Lock, ArrowRight, PiggyBank } from "lucide-react";
import type { IncomeStream } from "@shared/schema";

const QUARTERS_2026 = [
  { q: "Q1 2026", date: "Apr 15, 2026", iso: "2026-04-15" },
  { q: "Q2 2026", date: "Jun 16, 2026", iso: "2026-06-16" },
  { q: "Q3 2026", date: "Sep 15, 2026", iso: "2026-09-15" },
  { q: "Q4 2026", date: "Jan 15, 2027", iso: "2027-01-15" },
];

const DEDUCTION_CATS = [
  { name: "Equipment", emoji: "🎥", examples: "Camera, lens, mic, lighting" },
  { name: "Software", emoji: "💻", examples: "Editing apps, plugins, hosting" },
  { name: "Home Office", emoji: "🏠", examples: "Portion of rent + utilities" },
  { name: "Travel", emoji: "✈️", examples: "Flights, hotels, gas for shoots" },
  { name: "Marketing", emoji: "📣", examples: "Ads, branding, web design" },
];

const TIPS = [
  { title: "Consider an S-Corp election", desc: "Once you clear ~$60K profit, an S-Corp can save thousands in self-employment tax." },
  { title: "Track every coffee-shop coworking session", desc: "Internet, software, even a portion of your phone bill is deductible." },
  { title: "Deduct your home office", desc: "If you have a dedicated workspace, a percentage of your rent and utilities is deductible." },
  { title: "Equipment depreciation (Section 179)", desc: "You can usually write off the full cost of cameras, computers, and lights the year you buy them." },
];

export default function TaxPage() {
  const { user } = useAuth();
  const isLocked = user?.tier === "free";

  const income = useQuery<IncomeStream[]>({ queryKey: ["/api/income"] });
  const [rate, setRate] = useState(25);
  const [manualIncome, setManualIncome] = useState("");
  const [deductions, setDeductions] = useState<Record<string, string>>({});

  const ytdIncome = (income.data || []).filter(i => i.year === 2026).reduce((s, i) => s + i.amount, 0);
  const calcInput = manualIncome ? parseFloat(manualIncome) : ytdIncome;
  const totalDeductions = Object.values(deductions).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const taxable = Math.max(0, calcInput - totalDeductions);
  const setAside = taxable * (rate / 100);
  const perQuarter = setAside / 4;

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-10 max-w-7xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tax Center</h1>
        <p className="text-muted-foreground text-sm mt-1">Know what to set aside. Avoid April surprises.</p>
      </div>

      {isLocked && (
        <Card className="p-7 mb-6 bg-gradient-to-br from-primary/10 to-coral/5 border-primary/30 border-2">
          <Lock className="w-7 h-7 text-primary mb-3" />
          <h3 className="text-xl font-bold tracking-tight">Pro feature — upgrade to see your exact number</h3>
          <p className="mt-2 text-muted-foreground max-w-xl">The tax estimator and deduction tracker are available on Pro. Below is a blurred preview.</p>
          <Link href="/pricing"><Button className="mt-4 bg-primary hover:bg-primary/90">Upgrade to Pro <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
        </Card>
      )}

      <div className={isLocked ? "relative" : ""}>
        {isLocked && <div className="absolute inset-0 backdrop-blur-md z-10 bg-background/40 rounded-xl" />}

        {/* Calculator */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-primary" />
              <div className="font-semibold">Tax set-aside calculator</div>
            </div>
            <div className="space-y-5">
              <div>
                <Label className="text-xs">YTD income (auto-populated from your ledger)</Label>
                <Input
                  type="number" step="0.01"
                  placeholder={`$${ytdIncome.toLocaleString()}`}
                  value={manualIncome}
                  onChange={(e) => setManualIncome(e.target.value)}
                  className="mt-1"
                  data-testid="input-manual-income"
                />
                <div className="text-xs text-muted-foreground mt-1">Leave blank to use ${ytdIncome.toLocaleString()} from your tracked income.</div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <Label>Set-aside rate</Label>
                  <span className="font-semibold text-primary">{rate}%</span>
                </div>
                <Slider value={[rate]} onValueChange={(v) => setRate(v[0])} min={10} max={40} step={1} className="mt-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  25% is the safe default for self-employed creators (covers federal income tax + 15.3% SE tax).
                </div>
              </div>
              <div className="pt-2 grid grid-cols-2 gap-3">
                <Stat label="Taxable income" value={`$${taxable.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                <Stat label="Per quarter" value={`$${perQuarter.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
              </div>
              <Card className="bg-primary/5 border-primary/30 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <PiggyBank className="w-4 h-4 text-primary" />
                  <div className="text-xs text-muted-foreground">Total to set aside this year</div>
                </div>
                <div className="text-3xl font-bold text-primary" data-testid="text-setaside">
                  ${setAside.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </Card>
            </div>
          </Card>

          {/* Quarters */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-coral" />
              <div className="font-semibold">2026 quarterly due dates</div>
            </div>
            <div className="space-y-3">
              {QUARTERS_2026.map((q) => {
                const days = Math.ceil((new Date(q.iso).getTime() - Date.now()) / (24 * 3600 * 1000));
                const past = days < 0;
                return (
                  <div key={q.q} className={`flex items-center justify-between p-3 rounded-lg border ${past ? "bg-muted/40 border-muted opacity-60" : "border-border"}`}>
                    <div>
                      <div className="font-medium text-sm">{q.q}</div>
                      <div className="text-xs text-muted-foreground">{q.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${perQuarter.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <Badge variant="outline" className={past ? "bg-muted text-muted-foreground" : "bg-coral/10 text-coral border-coral/30"}>
                        {past ? "Passed" : `${days} days`}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Deductions */}
        <Card className="p-6 mb-6">
          <div className="mb-4">
            <div className="font-semibold">Deductible expenses (YTD)</div>
            <div className="text-sm text-muted-foreground">Track these to lower your taxable income.</div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {DEDUCTION_CATS.map((c) => (
              <div key={c.name} className="p-3 rounded-lg border border-border">
                <div className="text-xl mb-1">{c.emoji}</div>
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground mb-2">{c.examples}</div>
                <Input
                  type="number" step="0.01" placeholder="$0"
                  value={deductions[c.name] || ""}
                  onChange={(e) => setDeductions({ ...deductions, [c.name]: e.target.value })}
                  className="h-9"
                  data-testid={`input-deduction-${c.name.toLowerCase()}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Total deductions</div>
            <div className="text-xl font-bold">${totalDeductions.toLocaleString()}</div>
          </div>
        </Card>

        {/* Tips */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-coral" />
            <div className="font-semibold">Tax tips for creators</div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {TIPS.map((t) => (
              <div key={t.title} className="p-4 rounded-lg bg-muted/40">
                <div className="font-medium text-sm">{t.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{t.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Educational guidance only — not tax advice. Talk to a CPA for your specific situation.
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/40">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold mt-0.5">{value}</div>
    </div>
  );
}
