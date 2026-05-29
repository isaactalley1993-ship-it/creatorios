import { useState } from "react";
import { Link } from "wouter";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SiYoutube, SiTiktok, SiInstagram, SiTwitch, SiPatreon, SiSpotify, SiOnlyfans } from "react-icons/si";
import {
  DollarSign, Briefcase, Calculator, ArrowRight, Check, Sparkles, TrendingUp,
} from "lucide-react";

const platforms = [
  { Icon: SiYoutube, name: "YouTube", color: "#FF0000" },
  { Icon: SiTiktok, name: "TikTok", color: "#000000" },
  { Icon: SiInstagram, name: "Instagram", color: "#E4405F" },
  { Icon: SiTwitch, name: "Twitch", color: "#9146FF" },
  { Icon: SiPatreon, name: "Patreon", color: "#FF424D" },
  { Icon: SiSpotify, name: "Spotify", color: "#1DB954" },
  { Icon: SiOnlyfans, name: "OnlyFans", color: "#00AFF0" },
];

export default function Landing() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const { toast } = useToast();

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      await apiRequest("POST", "/api/waitlist", { email });
      setJoined(true);
      toast({ title: "You're on the list!", description: "We'll let you know when new features ship." });
      setEmail("");
    } catch (err: any) {
      toast({ title: "Couldn't join", description: err.message, variant: "destructive" });
    }
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Logo size={30} />
          <nav className="hidden md:flex items-center gap-7 text-sm">
            <button onClick={() => scrollTo("features")} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">Features</button>
            <button onClick={() => scrollTo("pricing")} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing">Pricing</button>
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-signin">Sign in</Link>
            <Link href="/signup">
              <Button className="bg-primary hover:bg-primary/90" data-testid="button-getstarted-nav">Get started</Button>
            </Link>
          </nav>
          <Link href="/signup" className="md:hidden">
            <Button size="sm" className="bg-primary hover:bg-primary/90">Get started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-60"
             style={{background: "radial-gradient(60% 50% at 50% 0%, hsl(262 83% 95%) 0%, transparent 70%), radial-gradient(40% 40% at 90% 20%, hsl(14 90% 92%) 0%, transparent 70%)"}} />
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Built for creators, by creators
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Your creator business,<br />
              <span className="bg-gradient-to-r from-primary to-coral bg-clip-text text-transparent">
                finally organized.
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Track every dollar from every platform. Know your taxes before April. Close more brand deals.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Link href="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 h-12 px-6 text-base" data-testid="button-hero-signup">
                  Start free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Button
                size="lg" variant="outline"
                className="h-12 px-6 text-base border-coral/30 text-coral hover:bg-coral/5 hover:text-coral"
                onClick={() => scrollTo("features")}
                data-testid="button-hero-features"
              >
                See features
              </Button>
            </div>
            <div className="mt-7 text-sm text-muted-foreground">
              No credit card required · Free forever plan available
            </div>
          </div>
        </div>

        {/* Animated platform strip */}
        <div className="border-y border-border bg-card/50 py-8 overflow-hidden">
          <div className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-5">
            Tracks income from every platform you create on
          </div>
          <div className="flex gap-12 sm:gap-16 animate-marquee whitespace-nowrap">
            {[...platforms, ...platforms, ...platforms].map((p, i) => (
              <div key={i} className="flex items-center gap-2.5 text-foreground/80">
                <p.Icon style={{ color: p.color }} className="w-7 h-7" />
                <span className="font-medium text-sm">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs uppercase tracking-widest text-coral font-semibold mb-3">Everything you need</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">The creator finance stack</h2>
            <p className="mt-4 text-muted-foreground text-lg">
              No more spreadsheets. No more guessing. Just the numbers you need to grow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <FeatureCard
              icon={DollarSign}
              tint="from-primary/20 to-primary/5"
              iconColor="text-primary"
              title="Income Tracking"
              desc="Log payouts from YouTube, TikTok, Patreon, brand deals — all in one ledger. Charts that actually tell you something."
              bullets={["10+ platform presets", "Monthly + YTD totals", "Export to CSV"]}
            />
            <FeatureCard
              icon={Briefcase}
              tint="from-coral/20 to-coral/5"
              iconColor="text-coral"
              title="Brand Deal CRM"
              desc="A simple kanban to move deals from cold outreach to paid. Never lose track of an invoice again."
              bullets={["Outreach → Paid pipeline", "Deliverable tracking", "Auto invoice generation"]}
            />
            <FeatureCard
              icon={Calculator}
              tint="from-purple-500/20 to-purple-500/5"
              iconColor="text-primary"
              title="Tax Estimator"
              desc="Self-employed tax is brutal. We tell you exactly how much to set aside — quarter by quarter."
              bullets={["25% auto set-aside", "Quarterly due dates", "Deduction tracker"]}
            />
          </div>
        </div>
      </section>

      {/* Creator Hub Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">New ✨</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Meet Your Next Collab Partner</h2>
            <p className="mt-4 text-muted-foreground text-lg">
              The only place where creators find, connect, and grow together. Browse by niche, platform, and audience size.
            </p>
          </div>

          {/* Mock creator cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {[
              { platform: "YouTube", platformColor: "#FF0000", name: "Maya Chen", niche: "Cooking", size: "50K–100K", collab: "Video", title: "Cooking creator seeks fitness collab partner" },
              { platform: "TikTok", platformColor: "#000000", name: "Alex Rivera", niche: "Finance", size: "100K–500K", collab: "Shoutout", title: "Finance TikToker looking for lifestyle crossover" },
              { platform: "Instagram", platformColor: "#E4405F", name: "Jordan Kim", niche: "Fitness", size: "10K–50K", collab: "Campaign", title: "Fitness IG running 30-day challenge collab" },
              { platform: "Twitch", platformColor: "#9146FF", name: "Sam Torres", niche: "Gaming", size: "10K–50K", collab: "Video", title: "Twitch streamer + tech creator gaming setup collab" },
              { platform: "YouTube", platformColor: "#FF0000", name: "Casey Blake", niche: "Beauty", size: "100K–500K", collab: "Video", title: "Beauty YouTuber + fashion creator GRWM series" },
              { platform: "Podcast", platformColor: "#F97316", name: "Morgan Lee", niche: "Finance", size: "10K–50K", collab: "Podcast", title: "Creator economy podcast seeks finance expert guest" },
            ].map((c, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-full text-white text-xs font-semibold" style={{background: c.platformColor}}>{c.platform}</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{c.niche}</span>
                  <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">{c.collab}</span>
                </div>
                <div className="font-semibold text-sm mb-1">{c.title}</div>
                <div className="text-xs text-muted-foreground">{c.name} · {c.size} followers</div>
                <button className="mt-3 w-full py-1.5 rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors">Send Collab Request</button>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/signup">
              <button className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity" data-testid="button-collab-cta">
                Join the Creator Network →
              </button>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">Free to browse. Pro to connect.</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-coral/5 border-y border-border">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {Array.from({length: 7}).map((_, i) => (
              <div key={i} className="w-12 h-12 rounded-full border-2 border-background"
                   style={{background: `linear-gradient(135deg, hsl(${(i*45)%360} 70% 65%), hsl(${(i*45+60)%360} 70% 55%))`}} />
            ))}
          </div>
          <p className="text-xl sm:text-2xl font-semibold tracking-tight">
            Join <span className="text-primary">2,400+ creators</span> already using CreatorOS
          </p>
          <p className="mt-2 text-muted-foreground">
            From 10k-subscriber YouTubers to seven-figure podcasters.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs uppercase tracking-widest text-coral font-semibold mb-3">Pricing</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Start free. Upgrade when you grow.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <PricingCard
              name="Free" price="$0" period="forever"
              tagline="Start tracking today"
              features={["10 income entries", "3 brand deals", "Basic dashboard", "Single platform breakdown"]}
              cta="Start free" href="/signup"
            />
            <PricingCard
              name="Pro" price="$29" period="/month" featured
              tagline="For growing creators"
              features={["Unlimited income tracking", "Unlimited brand deals", "Tax center + estimator", "Platform breakdown charts", "Quarterly tax reminders"]}
              cta="Start Pro" href="/signup"
            />
            <PricingCard
              name="Business" price="$79" period="/month"
              tagline="For established creators"
              features={["Everything in Pro", "Invoice generator + PDF export", "CSV export", "Priority support", "Multi-channel tracking"]}
              cta="Start Business" href="/signup"
            />
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section className="py-16 md:py-20 bg-card border-t border-border">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 text-center">
          <TrendingUp className="w-10 h-10 mx-auto text-coral mb-4" />
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">What's next?</h3>
          <p className="mt-3 text-muted-foreground">
            Join the waitlist to hear about new platforms, AI insights, and creator-only features.
          </p>
          {joined ? (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
              <Check className="w-4 h-4" /> Thanks — we'll be in touch.
            </div>
          ) : (
            <form onSubmit={joinWaitlist} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <Input
                type="email" placeholder="you@creator.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required
                className="h-11"
                data-testid="input-waitlist-email"
              />
              <Button type="submit" className="h-11 bg-coral hover:bg-coral/90 text-coral-foreground" data-testid="button-waitlist-submit">
                Join waitlist
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size={26} />
          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <a href="https://scannerpro.pplx.app" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
              Also check out ScannerPro for stock trading <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div className="text-xs text-muted-foreground">© 2026 CreatorOS</div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

function FeatureCard({
  icon: Icon, tint, iconColor, title, desc, bullets,
}: { icon: any; tint: string; iconColor: string; title: string; desc: string; bullets: string[] }) {
  return (
    <Card className="p-7 border-card-border hover:shadow-lg transition-shadow bg-card">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tint} flex items-center justify-center mb-5`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{desc}</p>
      <ul className="mt-5 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-primary shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PricingCard({
  name, price, period, tagline, features, cta, href, featured,
}: { name: string; price: string; period: string; tagline: string; features: string[]; cta: string; href: string; featured?: boolean; }) {
  return (
    <Card className={`p-7 relative ${featured ? "border-primary border-2 shadow-xl shadow-primary/10" : "border-card-border"}`}>
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-coral text-coral-foreground text-xs font-semibold">
          MOST POPULAR
        </div>
      )}
      <div className="text-sm font-medium text-muted-foreground">{name}</div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight">{price}</span>
        <span className="text-muted-foreground text-sm">{period}</span>
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{tagline}</div>
      <ul className="mt-6 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link href={href}>
        <Button
          className={`w-full mt-6 ${featured ? "bg-primary hover:bg-primary/90" : "bg-foreground/90 text-background hover:bg-foreground"}`}
          data-testid={`button-pricing-${name.toLowerCase()}`}
        >
          {cta}
        </Button>
      </Link>
    </Card>
  );
}
