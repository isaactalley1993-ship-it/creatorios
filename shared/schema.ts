import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  creates: text("creates").notNull().default("Other"),
  tier: text("tier").notNull().default("free"),
  createdAt: integer("created_at").notNull(),
});

export const incomeStreams = sqliteTable("income_streams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  platform: text("platform").notNull(),
  type: text("type").notNull().default("payout"),
  amount: real("amount").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  notes: text("notes").default(""),
  createdAt: integer("created_at").notNull(),
});

export const brandDeals = sqliteTable("brand_deals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  brand: text("brand").notNull(),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("outreach"),
  dueDate: text("due_date").default(""),
  deliverables: text("deliverables").default(""),
  notes: text("notes").default(""),
  createdAt: integer("created_at").notNull(),
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  brandDealId: integer("brand_deal_id"),
  invoiceNumber: text("invoice_number").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull().default(""),
  items: text("items").notNull().default("[]"),
  total: real("total").notNull().default(0),
  status: text("status").notNull().default("draft"),
  dueDate: text("due_date").default(""),
  notes: text("notes").default(""),
  createdAt: integer("created_at").notNull(),
});

export const collabListings = sqliteTable("collab_listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  platform: text("platform").notNull(),
  niche: text("niche").notNull(),
  audienceSize: text("audience_size").notNull(),
  collabType: text("collab_type").notNull(),
  lookingFor: text("looking_for").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: integer("created_at").notNull(),
});

export const collabRequests = sqliteTable("collab_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromUserId: integer("from_user_id").notNull(),
  toUserId: integer("to_user_id").notNull(),
  listingId: integer("listing_id").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at").notNull(),
});

export const waitlist = sqliteTable("waitlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at").notNull(),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  tier: true,
});
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  creates: z.string().min(1).default("Other"),
});
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertIncomeSchema = createInsertSchema(incomeStreams).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type IncomeStream = typeof incomeStreams.$inferSelect;

export const insertDealSchema = createInsertSchema(brandDeals).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type BrandDeal = typeof brandDeals.$inferSelect;

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  userId: true,
  createdAt: true,
  invoiceNumber: true,
});
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export const insertWaitlistSchema = createInsertSchema(waitlist).omit({
  id: true,
  createdAt: true,
});
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type Waitlist = typeof waitlist.$inferSelect;

export type InvoiceItem = { description: string; amount: number };

export const insertCollabListingSchema = createInsertSchema(collabListings).omit({
  id: true,
  userId: true,
  createdAt: true,
  status: true,
});
export type InsertCollabListing = z.infer<typeof insertCollabListingSchema>;
export type CollabListing = typeof collabListings.$inferSelect;

export const insertCollabRequestSchema = z.object({
  message: z.string().min(1).max(2000),
});
export type InsertCollabRequest = z.infer<typeof insertCollabRequestSchema>;
export type CollabRequest = typeof collabRequests.$inferSelect;

export type CollabListingWithAuthor = CollabListing & {
  authorName: string;
  authorCreates: string;
};

export type CollabRequestWithMeta = CollabRequest & {
  listingTitle: string;
  fromName: string;
  toName: string;
};
