import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function LoginPage() {
  const [, navigate] = useLocation();
  const { login, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Sign in failed", description: err.message, variant: "destructive" });
    }
  }

  return (
    <AuthShell title="Welcome back" sub="Sign in to your creator dashboard.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" id="email">
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="input-email" />
        </Field>
        <Field label="Password" id="password">
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="input-password" />
        </Field>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-11" disabled={loading} data-testid="button-login">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          New to CreatorOS?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline" data-testid="link-signup">
            Create an account
          </Link>
        </div>
        <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
          Demo: demo@creatorios.io / Demo1234!
        </div>
      </form>
    </AuthShell>
  );
}

const CREATES_OPTIONS = ["YouTube", "TikTok", "Instagram", "OnlyFans", "Podcast", "Twitch", "Other"];

export function SignupPage() {
  const [, navigate] = useLocation();
  const { signup, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [creates, setCreates] = useState("YouTube");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signup({ email, password, name, creates });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Couldn't sign up", description: err.message, variant: "destructive" });
    }
  }

  return (
    <AuthShell title="Create your account" sub="Free forever. Upgrade when you grow.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Your name" id="name">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" required data-testid="input-name" />
        </Field>
        <Field label="Email" id="email">
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="input-email" />
        </Field>
        <Field label="Password" id="password">
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} data-testid="input-password" />
          <div className="text-xs text-muted-foreground mt-1">At least 8 characters.</div>
        </Field>
        <Field label="What do you create?" id="creates">
          <Select value={creates} onValueChange={setCreates}>
            <SelectTrigger id="creates" data-testid="select-creates"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CREATES_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-11" disabled={loading} data-testid="button-signup">
          {loading ? "Creating account…" : "Create account"}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline" data-testid="link-login">Sign in</Link>
        </div>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-6">
        <Link href="/"><Logo size={28} /></Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-5 pb-10">
        <div className="w-full max-w-md">
          <Card className="p-7 sm:p-9 border-card-border">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
            <div className="mt-6">{children}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
