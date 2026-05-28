import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowRight, ArrowLeft, Calendar as CalIcon } from "lucide-react";
import type { BrandDeal } from "@shared/schema";

const STATUSES: { key: BrandDeal["status"]; label: string; color: string }[] = [
  { key: "outreach", label: "Outreach", color: "bg-muted/50 border-muted" },
  { key: "negotiating", label: "Negotiating", color: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900" },
  { key: "signed", label: "Signed", color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900" },
  { key: "paid", label: "Paid", color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900" },
  { key: "done", label: "Done", color: "bg-muted/30 border-muted" },
];

export default function DealsPage() {
  const { toast } = useToast();
  const deals = useQuery<BrandDeal[]>({ queryKey: ["/api/deals"] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BrandDeal | null>(null);

  const move = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/deals/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/deals"] }),
  });

  const del = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/deals/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/deals"] }),
  });

  function nextStatus(s: string) {
    const i = STATUSES.findIndex(x => x.key === s);
    return STATUSES[Math.min(STATUSES.length - 1, i + 1)].key;
  }
  function prevStatus(s: string) {
    const i = STATUSES.findIndex(x => x.key === s);
    return STATUSES[Math.max(0, i - 1)].key;
  }

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-10 max-w-[1500px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Brand Deals</h1>
          <p className="text-muted-foreground text-sm mt-1">Pipeline from cold outreach to paid invoice.</p>
        </div>
        <DealDialog open={open} setOpen={setOpen} />
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
        {STATUSES.map((col) => {
          const colDeals = (deals.data || []).filter(d => d.status === col.key);
          const total = colDeals.reduce((s, d) => s + d.amount, 0);
          return (
            <div key={col.key} className={`rounded-xl p-3 border-2 ${col.color} min-w-[260px]`}>
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <div className="font-semibold text-sm">{col.label}</div>
                  <div className="text-xs text-muted-foreground">{colDeals.length} · ${total.toLocaleString()}</div>
                </div>
              </div>
              <div className="space-y-2">
                {colDeals.map((d) => (
                  <Card
                    key={d.id}
                    className="p-3 cursor-pointer hover-elevate"
                    onClick={() => setEditing(d)}
                    data-testid={`card-deal-${d.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{d.brand}</div>
                        <div className="text-base font-bold text-primary mt-0.5">${d.amount.toLocaleString()}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); del.mutate(d.id); }}
                        className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-delete-deal-${d.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {d.deliverables && (
                      <div className="text-xs text-muted-foreground mt-2 line-clamp-2">{d.deliverables}</div>
                    )}
                    {d.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <CalIcon className="w-3 h-3" /> {d.dueDate}
                      </div>
                    )}
                    <div className="flex gap-1 mt-3" onClick={(e) => e.stopPropagation()}>
                      {STATUSES[0].key !== d.status && (
                        <button onClick={() => move.mutate({ id: d.id, status: prevStatus(d.status) })} className="p-1 rounded hover:bg-muted text-muted-foreground" aria-label="Move left">
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {STATUSES[STATUSES.length - 1].key !== d.status && (
                        <button onClick={() => move.mutate({ id: d.id, status: nextStatus(d.status) })} className="p-1 rounded hover:bg-muted text-muted-foreground ml-auto" aria-label="Move right">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
                {colDeals.length === 0 && (
                  <div className="text-xs text-muted-foreground italic px-1 py-2">No deals here.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editing && <DealEditDialog deal={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function DealDialog({ open, setOpen, initial, onSaved }: { open: boolean; setOpen: (v: boolean) => void; initial?: BrandDeal; onSaved?: () => void }) {
  const { toast } = useToast();
  const [brand, setBrand] = useState(initial?.brand || "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [status, setStatus] = useState(initial?.status || "outreach");
  const [dueDate, setDueDate] = useState(initial?.dueDate || "");
  const [deliverables, setDeliverables] = useState(initial?.deliverables || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  const m = useMutation({
    mutationFn: async () => {
      const body = { brand, amount: parseFloat(amount), status, dueDate, deliverables, notes };
      return apiRequest("POST", "/api/deals", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setBrand(""); setAmount(""); setDeliverables(""); setNotes(""); setDueDate("");
      setOpen(false);
      toast({ title: "Deal added" });
    },
    onError: (err: any) => toast({ title: "Couldn't save", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 gap-2" data-testid="button-new-deal"><Plus className="w-4 h-4" /> New deal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New brand deal</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (brand && amount) m.mutate(); }} className="space-y-4">
          <div><Label>Brand</Label><Input value={brand} onChange={(e) => setBrand(e.target.value)} required className="mt-1" data-testid="input-brand" /></div>
          <div><Label>Amount (USD)</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="mt-1" data-testid="input-amount" /></div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" /></div>
          <div><Label>Deliverables</Label><Textarea rows={2} value={deliverables} onChange={(e) => setDeliverables(e.target.value)} placeholder="e.g. 1 IG Reel + 3 stories" className="mt-1" /></div>
          <div><Label>Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" /></div>
          <DialogFooter><Button type="submit" className="bg-primary hover:bg-primary/90" disabled={m.isPending}>{m.isPending ? "Saving…" : "Save deal"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DealEditDialog({ deal, onClose }: { deal: BrandDeal; onClose: () => void }) {
  const { toast } = useToast();
  const [brand, setBrand] = useState(deal.brand);
  const [amount, setAmount] = useState(String(deal.amount));
  const [status, setStatus] = useState(deal.status);
  const [dueDate, setDueDate] = useState(deal.dueDate || "");
  const [deliverables, setDeliverables] = useState(deal.deliverables || "");
  const [notes, setNotes] = useState(deal.notes || "");

  const m = useMutation({
    mutationFn: async () => apiRequest("PATCH", `/api/deals/${deal.id}`, { brand, amount: parseFloat(amount), status, dueDate, deliverables, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      onClose();
      toast({ title: "Deal updated" });
    },
    onError: (err: any) => toast({ title: "Couldn't update", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit deal — {deal.brand}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-4">
          <div><Label>Brand</Label><Input value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1" /></div>
          <div><Label>Amount</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" /></div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" /></div>
          <div><Label>Deliverables</Label><Textarea rows={2} value={deliverables} onChange={(e) => setDeliverables(e.target.value)} className="mt-1" /></div>
          <div><Label>Notes</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={m.isPending}>{m.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
