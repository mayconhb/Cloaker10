import { db } from "./db";
import { users, campaigns, accessLogs, type User, type UpsertUser, type Campaign, type InsertCampaign, type AccessLog, type InsertAccessLog } from "@shared/schema";
import { eq, desc, and, sql, count, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getCampaigns(userId: string): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaignBySlug(slug: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, data: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<void>;
  createAccessLog(log: InsertAccessLog): Promise<AccessLog>;
  getAccessLogs(campaignId: string, limit?: number): Promise<AccessLog[]>;
  getCampaignStats(campaignId: string): Promise<{ total: number; blocked: number; humans: number }>;
  getUserStats(userId: string): Promise<{ totalCampaigns: number; totalClicks: number; blockedBots: number; humanVisitors: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
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
