import { users, incomeStreams, brandDeals, invoices, waitlist } from "@shared/schema";
import type {
  User, InsertUser,
  IncomeStream, InsertIncome,
  BrandDeal, InsertDeal,
  Invoice, InsertInvoice,
  Waitlist, InsertWaitlist,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// Initialize schema (idempotent)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    creates TEXT NOT NULL DEFAULT 'Other',
    tier TEXT NOT NULL DEFAULT 'free',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS income_streams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    platform TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'payout',
    amount REAL NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    notes TEXT DEFAULT '',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS brand_deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    brand TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'outreach',
    due_date TEXT DEFAULT '',
    deliverables TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    brand_deal_id INTEGER,
    invoice_number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL DEFAULT '',
    items TEXT NOT NULL DEFAULT '[]',
    total REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    due_date TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  );
`);

export interface IStorage {
  // users
  getUser(id: number): User | undefined;
  getUserByEmail(email: string): User | undefined;
  createUser(data: { email: string; password: string; name: string; creates: string }): Promise<User>;
  updateUserTier(id: number, tier: string): User | undefined;

  // income
  listIncome(userId: number): IncomeStream[];
  createIncome(userId: number, data: InsertIncome): IncomeStream;
  deleteIncome(userId: number, id: number): boolean;

  // deals
  listDeals(userId: number): BrandDeal[];
  createDeal(userId: number, data: InsertDeal): BrandDeal;
  updateDeal(userId: number, id: number, data: Partial<InsertDeal>): BrandDeal | undefined;
  deleteDeal(userId: number, id: number): boolean;

  // invoices
  listInvoices(userId: number): Invoice[];
  createInvoice(userId: number, data: InsertInvoice): Invoice;
  updateInvoice(userId: number, id: number, data: Partial<InsertInvoice>): Invoice | undefined;

  // waitlist
  addToWaitlist(email: string): Waitlist;
}

export class DatabaseStorage implements IStorage {
  getUser(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }
  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email)).get();
  }
  async createUser(data: { email: string; password: string; name: string; creates: string }): Promise<User> {
    const hash = await bcrypt.hash(data.password, 10);
    return db.insert(users).values({
      email: data.email,
      password: hash,
      name: data.name,
      creates: data.creates,
      tier: "free",
      createdAt: Date.now(),
    }).returning().get();
  }
  updateUserTier(id: number, tier: string): User | undefined {
    return db.update(users).set({ tier }).where(eq(users.id, id)).returning().get();
  }

  listIncome(userId: number): IncomeStream[] {
    return db.select().from(incomeStreams)
      .where(eq(incomeStreams.userId, userId))
      .orderBy(desc(incomeStreams.year), desc(incomeStreams.month), desc(incomeStreams.id))
      .all();
  }
  createIncome(userId: number, data: InsertIncome): IncomeStream {
    return db.insert(incomeStreams).values({
      ...data,
      userId,
      createdAt: Date.now(),
    }).returning().get();
  }
  deleteIncome(userId: number, id: number): boolean {
    const res = db.delete(incomeStreams)
      .where(and(eq(incomeStreams.userId, userId), eq(incomeStreams.id, id)))
      .run();
    return res.changes > 0;
  }

  listDeals(userId: number): BrandDeal[] {
    return db.select().from(brandDeals)
      .where(eq(brandDeals.userId, userId))
      .orderBy(desc(brandDeals.createdAt))
      .all();
  }
  createDeal(userId: number, data: InsertDeal): BrandDeal {
    return db.insert(brandDeals).values({
      ...data,
      userId,
      createdAt: Date.now(),
    }).returning().get();
  }
  updateDeal(userId: number, id: number, data: Partial<InsertDeal>): BrandDeal | undefined {
    return db.update(brandDeals).set(data)
      .where(and(eq(brandDeals.userId, userId), eq(brandDeals.id, id)))
      .returning().get();
  }
  deleteDeal(userId: number, id: number): boolean {
    const res = db.delete(brandDeals)
      .where(and(eq(brandDeals.userId, userId), eq(brandDeals.id, id)))
      .run();
    return res.changes > 0;
  }

  listInvoices(userId: number): Invoice[] {
    return db.select().from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt))
      .all();
  }
  createInvoice(userId: number, data: InsertInvoice): Invoice {
    const existing = db.select().from(invoices).where(eq(invoices.userId, userId)).all();
    const next = existing.length + 1;
    const invoiceNumber = `INV-${String(next).padStart(3, "0")}`;
    return db.insert(invoices).values({
      ...data,
      userId,
      invoiceNumber,
      createdAt: Date.now(),
    }).returning().get();
  }
  updateInvoice(userId: number, id: number, data: Partial<InsertInvoice>): Invoice | undefined {
    return db.update(invoices).set(data)
      .where(and(eq(invoices.userId, userId), eq(invoices.id, id)))
      .returning().get();
  }

  addToWaitlist(email: string): Waitlist {
    const existing = db.select().from(waitlist).where(eq(waitlist.email, email)).get();
    if (existing) return existing;
    return db.insert(waitlist).values({ email, createdAt: Date.now() }).returning().get();
  }
}

export const storage = new DatabaseStorage();

// Seed demo data
async function seed() {
  const existing = storage.getUserByEmail("demo@creatorios.io");
  if (existing) return;
  const user = await storage.createUser({
    email: "demo@creatorios.io",
    password: "Demo1234!",
    name: "Demo Creator",
    creates: "YouTube",
  });

  // May 2026 income
  const may = [
    { platform: "YouTube AdSense", amount: 1240, notes: "May AdSense payout" },
    { platform: "TikTok Creator Fund", amount: 380, notes: "" },
    { platform: "Brand Deal", amount: 2500, notes: "Nike sponsorship" },
    { platform: "Affiliate", amount: 180, notes: "Amazon Associates" },
  ];
  for (const e of may) {
    storage.createIncome(user.id, { platform: e.platform, type: "payout", amount: e.amount, month: 5, year: 2026, notes: e.notes });
  }
  // April 2026 income
  const apr = [
    { platform: "YouTube AdSense", amount: 980, notes: "" },
    { platform: "TikTok Creator Fund", amount: 290, notes: "" },
    { platform: "Patreon", amount: 450, notes: "42 patrons" },
  ];
  for (const e of apr) {
    storage.createIncome(user.id, { platform: e.platform, type: "payout", amount: e.amount, month: 4, year: 2026, notes: e.notes });
  }
  // March 2026 + a couple older
  const mar = [
    { platform: "YouTube AdSense", amount: 820, month: 3 },
    { platform: "TikTok Creator Fund", amount: 240, month: 3 },
    { platform: "Patreon", amount: 410, month: 3 },
    { platform: "YouTube AdSense", amount: 760, month: 2 },
    { platform: "Patreon", amount: 380, month: 2 },
    { platform: "YouTube AdSense", amount: 680, month: 1 },
    { platform: "YouTube AdSense", amount: 720, month: 12 },
  ];
  for (const e of mar) {
    storage.createIncome(user.id, { platform: e.platform, type: "payout", amount: e.amount, month: e.month, year: e.month === 12 ? 2025 : 2026, notes: "" });
  }

  // Brand deals
  const nike = storage.createDeal(user.id, { brand: "Nike", amount: 3500, status: "paid", dueDate: "2026-05-01", deliverables: "1 IG Reel + 3 stories", notes: "Sneaker drop campaign" });
  storage.createDeal(user.id, { brand: "Gymshark", amount: 2000, status: "negotiating", dueDate: "2026-06-15", deliverables: "1 YouTube integration", notes: "Waiting on contract" });
  storage.createDeal(user.id, { brand: "HelloFresh", amount: 1800, status: "outreach", dueDate: "2026-07-01", deliverables: "TBD", notes: "Sent intro email" });

  // Invoices
  storage.createInvoice(user.id, {
    brandDealId: nike.id,
    clientName: "Nike Inc.",
    clientEmail: "marketing@nike.com",
    items: JSON.stringify([{ description: "Instagram Reel + 3 stories", amount: 3500 }]),
    total: 3500,
    status: "paid",
    dueDate: "2026-05-15",
    notes: "Net 30",
  });
  storage.createInvoice(user.id, {
    brandDealId: null,
    clientName: "Gymshark",
    clientEmail: "partners@gymshark.com",
    items: JSON.stringify([{ description: "YouTube integration (60s)", amount: 2000 }]),
    total: 2000,
    status: "sent",
    dueDate: "2026-07-01",
    notes: "",
  });
}
seed().catch((e) => console.error("seed error:", e));
