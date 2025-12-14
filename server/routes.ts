import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, setupAuth } from "./simpleAuth";
import { detectBot, getClientIP } from "./botDetector";
import { detectDevice, shouldBlockDevice } from "./deviceDetector";
import { insertCampaignSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  app.get("/api/auth/user", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.json(null);
      }
      const dbUser = await storage.getUser(userId);
      res.json(dbUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/campaigns", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const campaigns = await storage.getCampaigns(user.claims.sub);
      
      const campaignsWithStats = await Promise.all(
        campaigns.map(async (campaign) => {
          const stats = await storage.getCampaignStats(campaign.id);
          return { ...campaign, stats };
        })
      );
      
      res.json(campaignsWithStats);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const parsed = insertCampaignSchema.safeParse({
        ...req.body,
        userId: user.claims.sub,
      });

      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid campaign data", errors: parsed.error.errors });
      }

      const existingSlug = await storage.getCampaignBySlug(parsed.data.slug);
      if (existingSlug) {
        return res.status(400).json({ message: "Slug already exists" });
      }

      const campaign = await storage.createCampaign(parsed.data);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.get("/api/campaigns/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const campaign = await storage.getCampaign(req.params.id);

      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (campaign.userId !== user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getCampaignStats(campaign.id);
      res.json({ ...campaign, stats });
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.patch("/api/campaigns/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const campaign = await storage.getCampaign(req.params.id);

      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (campaign.userId !== user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.updateCampaign(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const campaign = await storage.getCampaign(req.params.id);

      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (campaign.userId !== user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteCampaign(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  app.get("/api/campaigns/:id/logs", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const campaign = await storage.getCampaign(req.params.id);

      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (campaign.userId !== user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAccessLogs(req.params.id, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const stats = await storage.getUserStats(user.claims.sub);
      res.json({
        totalCampaigns: stats.totalCampaigns,
        todayClicks: stats.totalClicks,
        todayBlocks: stats.blockedBots,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/go/:slug", async (req, res) => {
    try {
      const campaign = await storage.getCampaignBySlug(req.params.slug);

      if (!campaign || !campaign.isActive) {
        return res.status(404).send("Not Found");
      }

      const userAgent = req.headers["user-agent"] || "";
      const ipAddress = getClientIP(req);
      const referer = req.headers["referer"] || null;

      // Camada 1: Detecção de Bots
      const botDetection = detectBot(userAgent);
      const shouldBlockBot = campaign.blockBots && botDetection.isBot;

      // Camada 2: Detecção de Dispositivo
      const deviceDetection = detectDevice(userAgent);
      const deviceBlock = shouldBlockDevice(deviceDetection, campaign.blockDesktop ?? false);
      const shouldBlockByDevice = deviceBlock.shouldBlock;

      // Determinar se deve bloquear e o motivo
      const shouldBlock = shouldBlockBot || shouldBlockByDevice;
      let blockReason: string | null = null;
      
      if (shouldBlockBot) {
        blockReason = `Camada 1 (Bot): ${botDetection.reason}`;
      } else if (shouldBlockByDevice) {
        blockReason = `Camada 2 (Dispositivo): ${deviceBlock.reason}`;
      }

      await storage.createAccessLog({
        campaignId: campaign.id,
        userAgent,
        ipAddress,
        referer,
        deviceType: deviceDetection.deviceType,
        isBot: botDetection.isBot,
        botReason: botDetection.reason,
        wasBlocked: shouldBlock,
        blockReason,
      });

      if (shouldBlock) {
        return res.redirect(302, campaign.safePageUrl);
      }

      res.redirect(302, campaign.destinationUrl);
    } catch (error) {
      console.error("Error processing redirect:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  return httpServer;
}
