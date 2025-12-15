import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Domains table - stores client domains for multi-tenant cloaking
export const domains = pgTable("domains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  entryDomain: varchar("entry_domain", { length: 255 }).notNull().unique(),
  offerDomain: varchar("offer_domain", { length: 255 }),
  dnsVerified: boolean("dns_verified").default(false),
  sslActive: boolean("ssl_active").default(false),
  verificationToken: varchar("verification_token", { length: 64 }),
  lastVerifiedAt: timestamp("last_verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaigns table - stores cloaking campaign configurations
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  domainId: varchar("domain_id").references(() => domains.id),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  destinationUrl: text("destination_url").notNull(),
  safePageUrl: text("safe_page_url").notNull(),
  isActive: boolean("is_active").default(true),
  blockBots: boolean("block_bots").default(true),
  blockDesktop: boolean("block_desktop").default(false),
  blockedCountries: text("blocked_countries").array().default([]),
  enableOriginLock: boolean("enable_origin_lock").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Access logs table - stores all access attempts
export const accessLogs = pgTable("access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  country: varchar("country", { length: 2 }),
  referer: text("referer"),
  deviceType: varchar("device_type", { length: 20 }),
  isBot: boolean("is_bot").default(false),
  botReason: varchar("bot_reason", { length: 255 }),
  wasBlocked: boolean("was_blocked").default(false),
  blockReason: varchar("block_reason", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_access_logs_campaign").on(table.campaignId),
  index("IDX_access_logs_created").on(table.createdAt),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  campaigns: many(campaigns),
  domains: many(domains),
}));

export const domainsRelations = relations(domains, ({ one, many }) => ({
  user: one(users, {
    fields: [domains.userId],
    references: [users.id],
  }),
  campaigns: many(campaigns),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
  domain: one(domains, {
    fields: [campaigns.domainId],
    references: [domains.id],
  }),
  accessLogs: many(accessLogs),
}));

export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [accessLogs.campaignId],
    references: [campaigns.id],
  }),
}));

// Schemas for validation
export const insertDomainSchema = createInsertSchema(domains).omit({
  id: true,
  dnsVerified: true,
  sslActive: true,
  verificationToken: true,
  lastVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccessLogSchema = createInsertSchema(accessLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertDomain = z.infer<typeof insertDomainSchema>;
export type Domain = typeof domains.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertAccessLog = z.infer<typeof insertAccessLogSchema>;
export type AccessLog = typeof accessLogs.$inferSelect;
