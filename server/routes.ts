import type { Express, Request, Response } from "express";
import express from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import Stripe from "stripe";
import { storage } from "./storage";
import {
  signupSchema, loginSchema,
  insertIncomeSchema, insertDealSchema, insertInvoiceSchema,
  insertWaitlistSchema,
} from "@shared/schema";
import { requireAuth, signToken, publicUser, type AuthedRequest } from "./auth";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

const PRICE_IDS: Record<string, string> = {
  pro: "price_1TbxKJIylPyKDIeuhvqUp94k",
  business: "price_1TbxKKIylPyKDIeuXkdxZSqv",
};

const stripe = new Stripe(STRIPE_SECRET, { apiVersion: "2024-11-20.acacia" as any });

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Stripe webhook needs raw body — register BEFORE express.json (note: in this template,
  // express.json already runs in index.ts; we use req.rawBody captured by verify hook).
  app.post("/api/webhook", async (req: any, res) => {
    const sig = req.headers["stripe-signature"];
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig as string, WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("Webhook signature error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = Number(session.metadata?.userId);
      const tier = session.metadata?.tier;
      if (userId && tier) {
        storage.updateUserTier(userId, tier);
        console.log(`Upgraded user ${userId} to ${tier}`);
      }
    }
    res.json({ received: true });
  });

  // ============ AUTH ============
  app.post("/api/signup", authLimiter, async (req, res) => {
    try {
      // Strip tier from body — hardcoded to free
      delete (req.body as any).tier;
      const data = signupSchema.parse(req.body);
      const existing = storage.getUserByEmail(data.email);
      if (existing) return res.status(409).json({ message: "Email already registered" });
      const user = await storage.createUser(data);
      const token = signToken(user.id);
      res.status(201).json({ user: publicUser(user), token });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid signup data" });
    }
  });

  app.post("/api/login", authLimiter, async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = storage.getUserByEmail(data.email);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      const ok = await bcrypt.compare(data.password, user.password);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });
      const token = signToken(user.id);
      res.json({ user: publicUser(user), token });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid login" });
    }
  });

  app.get("/api/me", requireAuth, (req: AuthedRequest, res) => {
    res.json(publicUser(req.user!));
  });

  // ============ WAITLIST ============
  app.post("/api/waitlist", (req, res) => {
    try {
      const { email } = insertWaitlistSchema.parse(req.body);
      const entry = storage.addToWaitlist(email);
      res.status(201).json(entry);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Invalid email" });
    }
  });

  // ============ INCOME ============
  app.get("/api/income", requireAuth, (req: AuthedRequest, res) => {
    res.json(storage.listIncome(req.user!.id));
  });

  app.post("/api/income", requireAuth, (req: AuthedRequest, res) => {
    try {
      const data = insertIncomeSchema.parse(req.body);
      // Tier limit: free users limited to 10 entries
      if (req.user!.tier === "free") {
        const count = storage.listIncome(req.user!.id).length;
        if (count >= 10) {
          return res.status(403).json({ message: "Free tier limited to 10 income entries. Upgrade to Pro for unlimited tracking." });
        }
      }
      const entry = storage.createIncome(req.user!.id, data);
      res.status(201).json(entry);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/income/:id", requireAuth, (req: AuthedRequest, res) => {
    const ok = storage.deleteIncome(req.user!.id, parseInt(req.params.id, 10));
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  // ============ DEALS ============
  app.get("/api/deals", requireAuth, (req: AuthedRequest, res) => {
    res.json(storage.listDeals(req.user!.id));
  });

  app.post("/api/deals", requireAuth, (req: AuthedRequest, res) => {
    try {
      const data = insertDealSchema.parse(req.body);
      if (req.user!.tier === "free") {
        const count = storage.listDeals(req.user!.id).length;
        if (count >= 3) {
          return res.status(403).json({ message: "Free tier limited to 3 brand deals. Upgrade to Pro for unlimited." });
        }
      }
      const deal = storage.createDeal(req.user!.id, data);
      res.status(201).json(deal);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/deals/:id", requireAuth, (req: AuthedRequest, res) => {
    try {
      const partial = insertDealSchema.partial().parse(req.body);
      const updated = storage.updateDeal(req.user!.id, parseInt(req.params.id, 10), partial);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/deals/:id", requireAuth, (req: AuthedRequest, res) => {
    const ok = storage.deleteDeal(req.user!.id, parseInt(req.params.id, 10));
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  });

  // ============ INVOICES (Business tier only) ============
  app.get("/api/invoices", requireAuth, (req: AuthedRequest, res) => {
    if (req.user!.tier !== "business") {
      return res.status(403).json({ message: "Invoices are a Business tier feature." });
    }
    res.json(storage.listInvoices(req.user!.id));
  });

  app.post("/api/invoices", requireAuth, (req: AuthedRequest, res) => {
    if (req.user!.tier !== "business") {
      return res.status(403).json({ message: "Invoices are a Business tier feature." });
    }
    try {
      const data = insertInvoiceSchema.parse(req.body);
      const inv = storage.createInvoice(req.user!.id, data);
      res.status(201).json(inv);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/invoices/:id", requireAuth, (req: AuthedRequest, res) => {
    if (req.user!.tier !== "business") {
      return res.status(403).json({ message: "Invoices are a Business tier feature." });
    }
    try {
      const partial = insertInvoiceSchema.partial().parse(req.body);
      const updated = storage.updateInvoice(req.user!.id, parseInt(req.params.id, 10), partial);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // ============ STATS ============
  app.get("/api/stats", requireAuth, (req: AuthedRequest, res) => {
    const income = storage.listIncome(req.user!.id);
    const deals = storage.listDeals(req.user!.id);
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    // Use most recent month-year that has data as "this month" if current has none
    let monthIncome = income.filter(i => i.month === curMonth && i.year === curYear);
    if (monthIncome.length === 0 && income.length > 0) {
      const latest = income[0];
      monthIncome = income.filter(i => i.month === latest.month && i.year === latest.year);
    }
    const thisMonthTotal = monthIncome.reduce((s, i) => s + i.amount, 0);

    const refYear = monthIncome[0]?.year || curYear;
    const ytd = income.filter(i => i.year === refYear).reduce((s, i) => s + i.amount, 0);

    const platformTotals: Record<string, number> = {};
    for (const i of income) {
      platformTotals[i.platform] = (platformTotals[i.platform] || 0) + i.amount;
    }
    const topPlatform = Object.entries(platformTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const taxSetAside = thisMonthTotal * 0.25;
    const ytdTaxSetAside = ytd * 0.25;

    res.json({
      thisMonthTotal,
      ytd,
      taxSetAside,
      ytdTaxSetAside,
      topPlatform,
      platformTotals,
      activeDeals: deals.filter(d => d.status !== "done").length,
      recentDeals: deals.slice(0, 3),
      currentMonthLabel: monthIncome[0] ? `${monthIncome[0].month}/${monthIncome[0].year}` : `${curMonth}/${curYear}`,
    });
  });

  // ============ STRIPE CHECKOUT ============
  app.post("/api/create-checkout-session", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const { tier } = req.body as { tier: "pro" | "business" };
      const priceId = PRICE_IDS[tier];
      if (!priceId) return res.status(400).json({ message: "Invalid tier" });

      const origin = req.headers.origin || `http://${req.headers.host}`;
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/#/dashboard?upgraded=1`,
        cancel_url: `${origin}/#/pricing`,
        customer_email: req.user!.email,
        metadata: { userId: String(req.user!.id), tier },
      });
      res.json({ url: session.url });
    } catch (err: any) {
      console.error("Stripe error:", err);
      res.status(500).json({ message: err.message || "Stripe error" });
    }
  });

  return httpServer;
}
