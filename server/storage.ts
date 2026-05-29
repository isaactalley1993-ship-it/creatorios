import { users, incomeStreams, brandDeals, invoices, waitlist, collabListings, collabRequests } from "@shared/schema";
import type {
  User, InsertUser,
  IncomeStream, InsertIncome,
  BrandDeal, InsertDeal,
  Invoice, InsertInvoice,
  Waitlist, InsertWaitlist,
  CollabListing, InsertCollabListing, CollabListingWithAuthor,
  CollabRequest, CollabRequestWithMeta,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, or, desc } from "drizzle-orm";
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
  CREATE TABLE IF NOT EXISTS collab_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    platform TEXT NOT NULL,
    niche TEXT NOT NULL,
    audience_size TEXT NOT NULL,
    collab_type TEXT NOT NULL,
    looking_for TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS collab_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    listing_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
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

  // collab
  getCollabListings(filters?: { platform?: string; niche?: string; audienceSize?: string; collabType?: string }): CollabListingWithAuthor[];
  createCollabListing(userId: number, data: InsertCollabListing): CollabListing;
  getCollabListing(id: number): CollabListingWithAuthor | undefined;
  getMyListings(userId: number): CollabListing[];
  updateCollabListing(userId: number, id: number, data: Partial<InsertCollabListing> & { status?: string }): CollabListing | undefined;
  sendCollabRequest(fromUserId: number, listingId: number, message: string): CollabRequest;
  getMyRequests(userId: number): { sent: CollabRequestWithMeta[]; received: CollabRequestWithMeta[] };
  updateRequestStatus(userId: number, id: number, status: string): CollabRequest | undefined;
  getPendingReceivedCount(userId: number): number;
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

  // ============ COLLAB ============
  getCollabListings(filters?: { platform?: string; niche?: string; audienceSize?: string; collabType?: string }): CollabListingWithAuthor[] {
    const rows = db.select({
      id: collabListings.id,
      userId: collabListings.userId,
      title: collabListings.title,
      description: collabListings.description,
      platform: collabListings.platform,
      niche: collabListings.niche,
      audienceSize: collabListings.audienceSize,
      collabType: collabListings.collabType,
      lookingFor: collabListings.lookingFor,
      status: collabListings.status,
      createdAt: collabListings.createdAt,
      authorName: users.name,
      authorCreates: users.creates,
    })
      .from(collabListings)
      .leftJoin(users, eq(users.id, collabListings.userId))
      .where(eq(collabListings.status, "open"))
      .orderBy(desc(collabListings.createdAt))
      .all() as any[];
    let result = rows.map(r => ({ ...r, authorName: r.authorName || "Unknown", authorCreates: r.authorCreates || "" }));
    if (filters?.platform) result = result.filter(r => r.platform === filters.platform);
    if (filters?.niche) result = result.filter(r => r.niche === filters.niche);
    if (filters?.audienceSize) result = result.filter(r => r.audienceSize === filters.audienceSize);
    if (filters?.collabType) result = result.filter(r => r.collabType === filters.collabType);
    return result as CollabListingWithAuthor[];
  }

  createCollabListing(userId: number, data: InsertCollabListing): CollabListing {
    return db.insert(collabListings).values({
      ...data,
      userId,
      status: "open",
      createdAt: Date.now(),
    }).returning().get();
  }

  getCollabListing(id: number): CollabListingWithAuthor | undefined {
    const row = db.select({
      id: collabListings.id,
      userId: collabListings.userId,
      title: collabListings.title,
      description: collabListings.description,
      platform: collabListings.platform,
      niche: collabListings.niche,
      audienceSize: collabListings.audienceSize,
      collabType: collabListings.collabType,
      lookingFor: collabListings.lookingFor,
      status: collabListings.status,
      createdAt: collabListings.createdAt,
      authorName: users.name,
      authorCreates: users.creates,
    })
      .from(collabListings)
      .leftJoin(users, eq(users.id, collabListings.userId))
      .where(eq(collabListings.id, id))
      .get() as any;
    if (!row) return undefined;
    return { ...row, authorName: row.authorName || "Unknown", authorCreates: row.authorCreates || "" };
  }

  getMyListings(userId: number): CollabListing[] {
    return db.select().from(collabListings)
      .where(eq(collabListings.userId, userId))
      .orderBy(desc(collabListings.createdAt))
      .all();
  }

  updateCollabListing(userId: number, id: number, data: Partial<InsertCollabListing> & { status?: string }): CollabListing | undefined {
    return db.update(collabListings).set(data)
      .where(and(eq(collabListings.userId, userId), eq(collabListings.id, id)))
      .returning().get();
  }

  sendCollabRequest(fromUserId: number, listingId: number, message: string): CollabRequest {
    const listing = db.select().from(collabListings).where(eq(collabListings.id, listingId)).get();
    if (!listing) throw new Error("Listing not found");
    return db.insert(collabRequests).values({
      fromUserId,
      toUserId: listing.userId,
      listingId,
      message,
      status: "pending",
      createdAt: Date.now(),
    }).returning().get();
  }

  getMyRequests(userId: number): { sent: CollabRequestWithMeta[]; received: CollabRequestWithMeta[] } {
    const all = db.select().from(collabRequests)
      .where(or(eq(collabRequests.fromUserId, userId), eq(collabRequests.toUserId, userId)))
      .orderBy(desc(collabRequests.createdAt))
      .all();

    const enrich = (r: CollabRequest): CollabRequestWithMeta => {
      const listing = db.select().from(collabListings).where(eq(collabListings.id, r.listingId)).get();
      const fromUser = db.select().from(users).where(eq(users.id, r.fromUserId)).get();
      const toUser = db.select().from(users).where(eq(users.id, r.toUserId)).get();
      return {
        ...r,
        listingTitle: listing?.title || "(deleted)",
        fromName: fromUser?.name || "Unknown",
        toName: toUser?.name || "Unknown",
      };
    };

    return {
      sent: all.filter(r => r.fromUserId === userId).map(enrich),
      received: all.filter(r => r.toUserId === userId).map(enrich),
    };
  }

  updateRequestStatus(userId: number, id: number, status: string): CollabRequest | undefined {
    return db.update(collabRequests).set({ status })
      .where(and(eq(collabRequests.id, id), eq(collabRequests.toUserId, userId)))
      .returning().get();
  }

  getPendingReceivedCount(userId: number): number {
    const rows = db.select().from(collabRequests)
      .where(and(eq(collabRequests.toUserId, userId), eq(collabRequests.status, "pending")))
      .all();
    return rows.length;
  }
}

export const storage = new DatabaseStorage();

// Seed demo data
async function seed() {
  const existing = storage.getUserByEmail("demo@creatorios.io");
  if (existing) {
    // Still seed collab data if not already present
    await seedCollabs(existing.id);
    return;
  }
  const user = await storage.createUser({
    email: "demo@creatorios.io",
    password: "Demo1234!",
    name: "Demo Creator",
    creates: "YouTube",
  });
  // Demo creator gets Pro tier so they can post listings
  storage.updateUserTier(user.id, "pro");

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

  await seedCollabs(user.id);
}
async function seedCollabs(demoUserId: number) {
  // Check if any collab listings already exist; if so, skip
  const existingListings = db.select().from(collabListings).all();
  if (existingListings.length > 0) return;

  // Create fake users
  const fakeUsers = [
    { email: 'fitness@creator.io', name: 'Alex Rodriguez', creates: 'fitness' },
    { email: 'cooking@creator.io', name: 'Maya Chen', creates: 'cooking' },
    { email: 'tech@creator.io', name: 'Jordan Kim', creates: 'tech' },
    { email: 'travel@creator.io', name: 'Sam Rivera', creates: 'travel' },
  ];
  const createdIds: Record<string, number> = {};
  for (const fu of fakeUsers) {
    const found = storage.getUserByEmail(fu.email);
    if (found) {
      createdIds[fu.creates] = found.id;
      continue;
    }
    const u = await storage.createUser({
      email: fu.email,
      password: 'Demo1234!',
      name: fu.name,
      creates: fu.creates,
    });
    storage.updateUserTier(u.id, 'pro');
    createdIds[fu.creates] = u.id;
  }

  const seedListings = [
    { ownerKey: 'cooking', title: "YouTube cooking creator seeks fitness collab", description: "Hey! I run a 75K-subscriber YouTube cooking channel focused on quick weeknight meals. Looking to partner with a fitness creator on a 3-part 'healthy meal prep' series — you cover the workouts and nutrition science, I cover the recipes.", platform: "youtube", niche: "cooking", audienceSize: "50K-100K", collabType: "video", lookingFor: "Fitness creator for 'healthy meal prep' collab series" },
    { ownerKey: 'demo', title: "TikTok finance creator looking for lifestyle collab", description: "Personal finance TikTok with 240K followers. Want to do a fun cross-promotion with a lifestyle/fashion creator — 'how I budget my outfits' style content. Audience skews 22-34.", platform: "tiktok", niche: "finance", audienceSize: "100K-500K", collabType: "shoutout", lookingFor: "Lifestyle/fashion creator to cross-promote" },
    { ownerKey: 'travel', title: "Instagram travel photographer + adventure brand", description: "Travel photographer (32K followers) putting together a Pacific Northwest campaign for a small outdoor gear brand. Looking for 2-3 outdoor creators to come along for a 4-day trip — all expenses covered, you keep all the content.", platform: "instagram", niche: "travel", audienceSize: "10K-50K", collabType: "campaign", lookingFor: "Outdoor/adventure creators for brand campaign" },
    { ownerKey: 'demo', title: "Gaming Twitch streamer seeks tech creator collab", description: "Partnered Twitch streamer (28K followers, ~1.2K avg viewers). Building out a new battlestation and want to do a 'streamer reacts to tech reviewer's gaming setup' video. Mutual benefit + I'll send you my old gear for B-roll.", platform: "twitch", niche: "gaming", audienceSize: "10K-50K", collabType: "video", lookingFor: "Tech reviewer for gaming setup reveal video" },
    { ownerKey: 'demo', title: "Beauty YouTuber looking for fashion collab", description: "Beauty channel (180K subs) wants to launch a 'get ready with me' crossover series. You bring the outfit picks, I bring the makeup look. 4 videos total across both channels.", platform: "youtube", niche: "beauty", audienceSize: "100K-500K", collabType: "video", lookingFor: "Fashion creator for 'get ready with me' series" },
    { ownerKey: 'demo', title: "Podcast host seeks finance expert guest", description: "Hosting a weekly creator-economy podcast (~22K downloads/episode). Looking for a finance expert or creator to do a deep-dive episode on creator taxes, LLCs, and quarterly estimates. 60-min interview, full production handled.", platform: "podcast", niche: "finance", audienceSize: "10K-50K", collabType: "podcast", lookingFor: "Finance expert or creator for interview episode" },
    { ownerKey: 'fitness', title: "Fitness creator wants nutrition/cooking collab", description: "Fitness IG (68K) running a 30-day strength challenge in Q1. Need a nutrition or cooking partner to handle the meal-plan side — we'd co-promote the bundle and split signups 50/50.", platform: "instagram", niche: "fitness", audienceSize: "50K-100K", collabType: "campaign", lookingFor: "Nutrition or cooking creator for 30-day challenge" },
    { ownerKey: 'tech', title: "Tech reviewer collab — smartphone comparison", description: "Tech YouTube channel (~620K subs) doing the annual flagship phone comparison. Want another tech creator to co-host — side-by-side format, we each defend our pick. Filmed in LA in February.", platform: "youtube", niche: "tech", audienceSize: "500K+", collabType: "video", lookingFor: "Another tech creator for side-by-side phone review" },
  ];

  for (const l of seedListings) {
    const ownerId = l.ownerKey === 'demo' ? demoUserId : createdIds[l.ownerKey];
    if (!ownerId) continue;
    storage.createCollabListing(ownerId, {
      title: l.title,
      description: l.description,
      platform: l.platform,
      niche: l.niche,
      audienceSize: l.audienceSize,
      collabType: l.collabType,
      lookingFor: l.lookingFor,
    });
  }

  // Seed a couple of incoming requests for the demo user so the inbox isn't empty
  const demoListings = storage.getMyListings(demoUserId);
  if (demoListings.length > 0) {
    const target = demoListings[0];
    const fromId = createdIds['fitness'];
    if (fromId) {
      storage.sendCollabRequest(fromId, target.id, "Love this idea — I run a fitness IG with 68K and would be perfect for a healthy meal prep series. Open to collab in Jan/Feb?");
    }
    const fromId2 = createdIds['travel'];
    if (fromId2 && demoListings[1]) {
      storage.sendCollabRequest(fromId2, demoListings[1].id, "Hey! Travel creator here (32K on IG). Would love to come on the podcast and talk about how I structure my LLC for travel deductions.");
    }
  }
}

seed().catch((e) => console.error("seed error:", e));
