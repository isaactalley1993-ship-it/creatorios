import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Sparkles } from "lucide-react";

const TIERS = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    period: "/forever",
    tagline: "Start tracking today",
    features: ["10 income entries", "3 brand deals", "Basic dashboard", "Single platform breakdown"],
    cta: "Current plan (Free)",
  },
  {
    key: "pro",
    name: "Pro",
    price: "$29",
    period: "/month",
    tagline: "For growing creators",
    featured: true,
    features: [
      "Unlimited income entries",
      "Unlimited brand deals",
      "Tax center + estimator",
      "Quarterly tax reminders",
      "Full platform breakdown",
      "Deduction tracker",
    ],
    cta: "Upgrade to Pro",
  },
  {
    key: "business",
    name: "Business",
    price: "$79",
    period: "/month",
    tagline: "For established creators",
    features: [
      "Everything in Pro",
      "Invoice generator + PDF",
      "CSV export",
      "Priority support",
      "Multi-channel tracking",
    ],
    cta: "Upgrade to Business",
  },
] as const;

export default function PricingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const checkout = useMutation({
    mutationFn: async (tier: "pro" | "business") => {
      const res = await apiRequest("POST", "/api/create-checkout-session", { tier });
      const data = await res.json();
      window.location.href = data.url;
    },
    onError: (err: any) => toast({ title: "Couldn't start checkout", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="px-5 sm:px-8 py-10 sm:py-16 max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="text-xs uppercase tracking-widest text-coral font-semibold mb-3">Pricing</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Pick the plan that fits your stage</h1>
        <p className="mt-4 text-muted-foreground">Cancel anytime. Test mode — use Stripe test card 4242 4242 4242 4242.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {TIERS.map((t) => {
          const isCurrent = user?.tier === t.key;
          return (
            <Card key={t.key} className={`p-7 relative ${t.featured ? "border-primary border-2 shadow-xl shadow-primary/10" : "border-card-border"}`}>
              {t.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-coral text-coral-foreground text-xs font-semibold">
                  MOST POPULAR
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-muted-foreground">{t.name}</div>
                {isCurrent && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Current</Badge>}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{t.price}</span>
                <span className="text-muted-foreground text-sm">{t.period}</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{t.tagline}</div>
              <ul className="mt-6 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {t.key === "free" ? (
                <Button disabled className="w-full mt-6" variant="outline" data-testid={`button-tier-${t.key}`}>
                  {isCurrent ? "Current plan" : "Free tier"}
                </Button>
              ) : isCurrent ? (
                <Button disabled className="w-full mt-6" variant="outline" data-testid={`button-tier-${t.key}`}>
                  Current plan
                </Button>
              ) : (
                <Button
                  className={`w-full mt-6 ${t.featured ? "bg-primary hover:bg-primary/90" : "bg-foreground/90 text-background hover:bg-foreground"}`}
                  onClick={() => checkout.mutate(t.key as any)}
                  disabled={checkout.isPending}
                  data-testid={`button-tier-${t.key}`}
                >
                  {checkout.isPending ? "Loading…" : t.cta}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-10 text-center text-xs text-muted-foreground">
        <Sparkles className="w-3.5 h-3.5 inline mr-1" />
        Secured by Stripe · Test mode card: 4242 4242 4242 4242 · Any future date · Any CVC
      </div>
    </div>
  );
}
