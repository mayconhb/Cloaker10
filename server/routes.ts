import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, setupAuth } from "./simpleAuth";
import { detectBot, getClientIP } from "./botDetector";
import { detectDevice, shouldBlockDevice } from "./deviceDetector";
import { detectCountryFromIP, shouldBlockByCountry, AVAILABLE_COUNTRIES } from "./geoDetector";
import { detectOriginLock, shouldBlockByOrigin } from "./originLock";
import { insertCampaignSchema, insertDomainSchema } from "@shared/schema";
import { verifyDomainDns, getDnsInstructions } from "./dnsVerifier";

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
          let domain = null;
          if (campaign.domainId) {
            domain = await storage.getDomain(campaign.domainId);
          }
          return { ...campaign, stats, domain };
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
      const userId = user.claims.sub;
      
      // Validar domainId se fornecido
      if (req.body.domainId) {
        const domain = await storage.getDomain(req.body.domainId);
        if (!domain) {
          return res.status(400).json({ message: "Domínio não encontrado" });
        }
        if (domain.userId !== userId) {
          return res.status(403).json({ message: "Você não tem permissão para usar este domínio" });
        }
        if (!domain.dnsVerified) {
          return res.status(400).json({ message: "O domínio precisa ter o DNS verificado antes de ser usado" });
        }
      }

      const parsed = insertCampaignSchema.safeParse({
        ...req.body,
        userId: userId,
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
      let domain = null;
      if (campaign.domainId) {
        domain = await storage.getDomain(campaign.domainId);
      }
      res.json({ ...campaign, stats, domain });
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

  app.get("/api/countries", (req, res) => {
    res.json(AVAILABLE_COUNTRIES);
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

  // Domain routes
  app.get("/api/domains", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const domains = await storage.getDomains(user.claims.sub);
      res.json(domains);
    } catch (error) {
      console.error("Error fetching domains:", error);
      res.status(500).json({ message: "Failed to fetch domains" });
    }
  });

  app.post("/api/domains", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const parsed = insertDomainSchema.safeParse({
        ...req.body,
        userId: user.claims.sub,
      });

      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid domain data", errors: parsed.error.errors });
      }

      const existingDomain = await storage.getDomainByEntryDomain(parsed.data.entryDomain);
      if (existingDomain) {
        return res.status(400).json({ message: "This domain is already registered" });
      }

      const domain = await storage.createDomain(parsed.data);
      res.status(201).json(domain);
    } catch (error) {
      console.error("Error creating domain:", error);
      res.status(500).json({ message: "Failed to create domain" });
    }
  });

  app.get("/api/domains/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const domain = await storage.getDomain(req.params.id);

      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }

      if (domain.userId !== user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const instructions = getDnsInstructions(domain.entryDomain, domain.verificationToken || "");
      res.json({ ...domain, dnsInstructions: instructions });
    } catch (error) {
      console.error("Error fetching domain:", error);
      res.status(500).json({ message: "Failed to fetch domain" });
    }
  });

  app.post("/api/domains/:id/verify", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const domain = await storage.getDomain(req.params.id);

      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }

      if (domain.userId !== user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const result = await verifyDomainDns(domain.entryDomain, domain.verificationToken || undefined);
      
      if (result.verified) {
        await storage.updateDomain(domain.id, {
          dnsVerified: true,
          lastVerifiedAt: new Date(),
        });
      }

      res.json({
        verified: result.verified,
        method: result.method,
        reason: result.reason,
        targetFound: result.targetFound,
      });
    } catch (error) {
      console.error("Error verifying domain:", error);
      res.status(500).json({ message: "Failed to verify domain" });
    }
  });

  app.patch("/api/domains/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const domain = await storage.getDomain(req.params.id);

      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }

      if (domain.userId !== user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.updateDomain(req.params.id, {
        offerDomain: req.body.offerDomain,
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating domain:", error);
      res.status(500).json({ message: "Failed to update domain" });
    }
  });

  app.delete("/api/domains/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const domain = await storage.getDomain(req.params.id);

      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }

      if (domain.userId !== user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteDomain(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting domain:", error);
      res.status(500).json({ message: "Failed to delete domain" });
    }
  });

  app.get("/:slug", async (req, res, next) => {
    try {
      const slug = req.params.slug;
      
      // Ignora rotas conhecidas do frontend/sistema
      const reservedPaths = ['dashboard', 'campaigns', 'analytics', 'domains', 'api', 'assets', 'src', '@', 'node_modules'];
      if (reservedPaths.some(path => slug.startsWith(path)) || slug.includes('.')) {
        return next();
      }
      
      const hostHeader = req.headers.host || "";
      const entryDomain = hostHeader.split(":")[0].toLowerCase();
      
      // Primeiro tenta buscar campanha vinculada a este domínio específico
      let campaign = await storage.getCampaignBySlugAndDomain(slug, entryDomain);
      
      // Se não encontrou por domínio específico, busca campanha sem domínio vinculado
      if (!campaign) {
        const globalCampaign = await storage.getCampaignBySlug(slug);
        // Só usa o fallback se a campanha NÃO tiver domínio vinculado
        // Isso evita que campanhas com domínio específico sejam acessadas de outros domínios
        if (globalCampaign && !globalCampaign.domainId) {
          campaign = globalCampaign;
        }
      }

      // Se não encontrou campanha, deixa o Vite/frontend tratar
      if (!campaign || !campaign.isActive) {
        return next();
      }

      const userAgent = req.headers["user-agent"] || "";
      const ipAddress = getClientIP(req);
      const referer = req.headers["referer"] || null;

      const botDetection = detectBot(userAgent);
      const shouldBlockBot = campaign.blockBots && botDetection.isBot;

      const deviceDetection = detectDevice(userAgent);
      const deviceBlock = shouldBlockDevice(deviceDetection, campaign.blockDesktop ?? false);
      const shouldBlockByDevice = deviceBlock.shouldBlock;

      const geoResult = await detectCountryFromIP(ipAddress, req.headers as Record<string, string | string[] | undefined>);
      const geoBlock = shouldBlockByCountry(geoResult.country, campaign.blockedCountries);
      const shouldBlockByGeo = geoBlock.shouldBlock;

      // Camada 4: Origin Lock (Trava de Origem Híbrida)
      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const originResult = detectOriginLock(fullUrl, userAgent);
      const originBlock = shouldBlockByOrigin(originResult, campaign.enableOriginLock ?? false);
      const shouldBlockByOriginLock = originBlock.shouldBlock;

      const shouldBlock = shouldBlockBot || shouldBlockByDevice || shouldBlockByGeo || shouldBlockByOriginLock;
      let blockReason: string | null = null;
      
      if (shouldBlockBot) {
        blockReason = `Camada 1 (Bot): ${botDetection.reason}`;
      } else if (shouldBlockByDevice) {
        blockReason = `Camada 2 (Dispositivo): ${deviceBlock.reason}`;
      } else if (shouldBlockByGeo) {
        blockReason = `Camada 3 (Geo): ${geoBlock.reason}`;
      } else if (shouldBlockByOriginLock) {
        blockReason = `Camada 4 (Origin Lock): ${originBlock.reason}`;
      }

      await storage.createAccessLog({
        campaignId: campaign.id,
        userAgent,
        ipAddress,
        referer,
        country: geoResult.country,
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
