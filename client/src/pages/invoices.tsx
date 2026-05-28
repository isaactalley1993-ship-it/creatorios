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
import { Link } from "wouter";
import { Plus, Printer, Eye, Lock, FileText, ArrowRight, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import type { Invoice, InvoiceItem } from "@shared/schema";

export default function InvoicesPage() {
  const { user } = useAuth();
  const isLocked = user?.tier !== "business";

  if (isLocked) {
    return (
      <div className="px-5 sm:px-8 py-6 sm:py-10 max-w-3xl mx-auto">
        <Card className="p-10 text-center bg-gradient-to-br from-primary/10 via-coral/5 to-background border-primary/30 border-2">
          <Lock className="w-10 h-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Invoices are a Business feature</h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Generate professional, PDF-ready invoices from your brand deals — auto-numbered, branded, and ready to send.
          </p>
          <Link href="/pricing">
            <Button className="mt-6 bg-primary hover:bg-primary/90" data-testid="button-upgrade-invoices">
              Upgrade to Business — $79/mo <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return <InvoicesAuthorized />;
}

function InvoicesAuthorized() {
  const { toast } = useToast();
  const invs = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Invoice | null>(null);

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => apiRequest("PATCH", `/api/invoices/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/invoices"] }),
  });

  return (
    <div className="px-5 sm:px-8 py-6 sm:py-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">Professional, PDF-ready invoices for every brand deal.</p>
        </div>
        <CreateInvoiceDialog open={open} setOpen={setOpen} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Invoice #</th>
                <th className="text-left p-3">Client</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Due</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(invs.data || []).length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No invoices yet.</td></tr>
              )}
              {(invs.data || []).map(inv => (
                <tr key={inv.id} className="border-t border-border" data-testid={`row-invoice-${inv.id}`}>
                  <td className="p-3 font-mono text-xs">{inv.invoiceNumber}</td>
                  <td className="p-3">
                    <div className="font-medium">{inv.clientName}</div>
                    <div className="text-xs text-muted-foreground">{inv.clientEmail}</div>
                  </td>
                  <td className="p-3 text-right font-semibold">${inv.total.toLocaleString()}</td>
                  <td className="p-3">
                    <Select value={inv.status} onValueChange={(v) => update.mutate({ id: inv.id, status: v })}>
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{inv.dueDate || "—"}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setPreview(inv)} data-testid={`button-preview-${inv.id}`}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {preview && <InvoicePreview invoice={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function CreateInvoiceDialog({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { toast } = useToast();
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", amount: 0 }]);

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const m = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/invoices", {
      clientName, clientEmail, dueDate, notes,
      items: JSON.stringify(items.filter(i => i.description && i.amount > 0)),
      total, status: "draft",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setClientName(""); setClientEmail(""); setDueDate(""); setNotes("");
      setItems([{ description: "", amount: 0 }]);
      setOpen(false);
      toast({ title: "Invoice created" });
    },
    onError: (err: any) => toast({ title: "Couldn't create", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 gap-2" data-testid="button-create-invoice"><Plus className="w-4 h-4" /> Create invoice</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>New invoice</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Client name</Label><Input value={clientName} onChange={(e) => setClientName(e.target.value)} required className="mt-1" data-testid="input-client-name" /></div>
            <div><Label>Client email</Label><Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="mt-1" data-testid="input-client-email" /></div>
          </div>
          <div><Label>Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" /></div>

          <div>
            <Label>Line items</Label>
            <div className="space-y-2 mt-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input value={item.description} onChange={(e) => {
                    const c = [...items]; c[idx] = { ...c[idx], description: e.target.value }; setItems(c);
                  }} placeholder="Description" className="flex-1" />
                  <Input type="number" step="0.01" value={item.amount || ""} onChange={(e) => {
                    const c = [...items]; c[idx] = { ...c[idx], amount: parseFloat(e.target.value) || 0 }; setItems(c);
                  }} placeholder="0.00" className="w-28" />
                  {items.length > 1 && (
                    <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-2 text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { description: "", amount: 0 }])}>
                <Plus className="w-3 h-3 mr-1" /> Add line
              </Button>
            </div>
          </div>
          <div><Label>Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" /></div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-bold">${total.toLocaleString()}</span>
          </div>

          <DialogFooter><Button type="submit" disabled={m.isPending} className="bg-primary hover:bg-primary/90">{m.isPending ? "Creating…" : "Create invoice"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InvoicePreview({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const items: InvoiceItem[] = JSON.parse(invoice.items || "[]");
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl print:max-w-none print:shadow-none">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <DialogTitle>Invoice preview</DialogTitle>
          <Button onClick={() => window.print()} className="bg-primary hover:bg-primary/90 gap-2" data-testid="button-print">
            <Printer className="w-4 h-4" /> Download PDF
          </Button>
        </div>
        <div id="invoice-print" className="bg-white text-gray-900 p-8 sm:p-10 rounded-lg border border-border print:border-0">
          <div className="flex justify-between items-start mb-8">
            <Logo size={36} />
            <div className="text-right">
              <div className="text-2xl font-bold tracking-tight" style={{ color: "#7C3AED" }}>INVOICE</div>
              <div className="text-sm text-gray-500 mt-1">{invoice.invoiceNumber}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Billed to</div>
              <div className="font-semibold">{invoice.clientName}</div>
              <div className="text-gray-600">{invoice.clientEmail}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Due date</div>
              <div className="font-semibold">{invoice.dueDate || "On receipt"}</div>
            </div>
          </div>
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3">Description</th>
                <th className="text-right py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3">{item.description}</td>
                  <td className="text-right py-3">${item.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="py-4 text-right font-semibold">Total</td>
                <td className="text-right py-4 text-xl font-bold" style={{ color: "#7C3AED" }}>${invoice.total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
          {invoice.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Notes</div>
              {invoice.notes}
            </div>
          )}
          <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
            Generated with CreatorOS
          </div>
        </div>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #invoice-print, #invoice-print * { visibility: visible; }
            #invoice-print { position: absolute; inset: 0; padding: 24px; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
