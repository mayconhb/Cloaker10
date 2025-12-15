import { db } from "./db";
import { users, campaigns, accessLogs, domains } from "../../shared/schema";
import type { User, UpsertUser, Campaign, InsertCampaign, AccessLog, InsertAccessLog, Domain, InsertDomain } from "../../shared/schema";
import { eq, desc, and, sql, count, inArray } from "drizzle-orm";
import crypto from "crypto";

export class DatabaseStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async getDomains(userId: string): Promise<Domain[]> {
    return await db
      .select()
      .from(domains)
      .where(eq(domains.userId, userId))
      .orderBy(desc(domains.createdAt));
  }

  async getDomain(id: string): Promise<Domain | undefined> {
    const [domain] = await db.select().from(domains).where(eq(domains.id, id)).limit(1);
    return domain;
  }

  async getDomainByEntryDomain(entryDomain: string): Promise<Domain | undefined> {
    const normalizedDomain = entryDomain.toLowerCase().replace(/^www\./, '');
    const [domain] = await db.select().from(domains).where(eq(domains.entryDomain, normalizedDomain)).limit(1);
    return domain;
  }

  async createDomain(domainData: InsertDomain): Promise<Domain> {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const normalizedEntryDomain = domainData.entryDomain.toLowerCase().replace(/^www\./, '');
    const [domain] = await db
      .insert(domains)
      .values({
        ...domainData,
        entryDomain: normalizedEntryDomain,
        verificationToken,
      })
      .returning();
    return domain;
  }

  async updateDomain(id: string, data: Partial<Domain>): Promise<Domain | undefined> {
    const [domain] = await db
      .update(domains)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(domains.id, id))
      .returning();
    return domain;
  }

  async deleteDomain(id: string): Promise<void> {
    await db.update(campaigns).set({ domainId: null }).where(eq(campaigns.domainId, id));
    await db.delete(domains).where(eq(domains.id, id));
  }

  async getCampaigns(userId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return campaign;
  }

  async getCampaignBySlug(slug: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.slug, slug)).limit(1);
    return campaign;
  }

  async getCampaignBySlugAndDomain(slug: string, entryDomain: string): Promise<Campaign | undefined> {
    const domain = await this.getDomainByEntryDomain(entryDomain);
    if (!domain) {
      return undefined;
    }
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.slug, slug), eq(campaigns.domainId, domain.id)))
      .limit(1);
    return campaign;
  }

  async createCampaign(campaignData: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(campaignData).returning();
    return campaign;
  }

  async updateCampaign(id: string, data: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [campaign] = await db
      .update(campaigns)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  async deleteCampaign(id: string): Promise<void> {
    await db.delete(accessLogs).where(eq(accessLogs.campaignId, id));
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }

  async createAccessLog(logData: InsertAccessLog): Promise<AccessLog> {
    const [log] = await db.insert(accessLogs).values(logData).returning();
    return log;
  }

  async getAccessLogs(campaignId: string, limit: number = 100): Promise<AccessLog[]> {
    return await db
      .select()
      .from(accessLogs)
      .where(eq(accessLogs.campaignId, campaignId))
      .orderBy(desc(accessLogs.createdAt))
      .limit(limit);
  }

  async getCampaignStats(campaignId: string): Promise<{ total: number; blocked: number; humans: number }> {
    const [stats] = await db
      .select({
        total: count(),
        blocked: sql<number>`count(*) filter (where ${accessLogs.wasBlocked} = true)`,
        humans: sql<number>`count(*) filter (where ${accessLogs.isBot} = false)`,
      })
      .from(accessLogs)
      .where(eq(accessLogs.campaignId, campaignId));

    return {
      total: Number(stats?.total) || 0,
      blocked: Number(stats?.blocked) || 0,
      humans: Number(stats?.humans) || 0,
    };
  }

  async getUserStats(userId: string): Promise<{ totalCampaigns: number; totalClicks: number; blockedBots: number; humanVisitors: number }> {
    const userCampaigns = await this.getCampaigns(userId);
    const campaignIds = userCampaigns.map(c => c.id);

    if (campaignIds.length === 0) {
      return { totalCampaigns: 0, totalClicks: 0, blockedBots: 0, humanVisitors: 0 };
    }

    const [stats] = await db
      .select({
        totalClicks: count(),
        blockedBots: sql<number>`count(*) filter (where ${accessLogs.wasBlocked} = true)`,
        humanVisitors: sql<number>`count(*) filter (where ${accessLogs.isBot} = false)`,
      })
      .from(accessLogs)
      .where(inArray(accessLogs.campaignId, campaignIds));

    return {
      totalCampaigns: userCampaigns.length,
      totalClicks: Number(stats?.totalClicks) || 0,
      blockedBots: Number(stats?.blockedBots) || 0,
      humanVisitors: Number(stats?.humanVisitors) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
