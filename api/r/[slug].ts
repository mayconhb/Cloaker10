import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage.js';
import { 
  detectBot, 
  detectDevice, 
  shouldBlockDevice, 
  detectCountryFromHeaders, 
  shouldBlockByCountry,
  detectOriginLock,
  shouldBlockByOrigin,
  getClientIP 
} from '../_lib/detectors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { slug } = req.query;
    if (typeof slug !== 'string') {
      return res.status(400).json({ message: 'Invalid slug' });
    }

    const hostHeader = req.headers.host || "";
    const entryDomain = hostHeader.split(":")[0].toLowerCase();
    
    let campaign = await storage.getCampaignBySlugAndDomain(slug, entryDomain);
    
    if (!campaign) {
      const globalCampaign = await storage.getCampaignBySlug(slug);
      if (globalCampaign && !globalCampaign.domainId) {
        campaign = globalCampaign;
      }
    }

    if (!campaign || !campaign.isActive) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = getClientIP(req);
    const referer = req.headers["referer"] || null;

    const botDetection = detectBot(userAgent);
    const shouldBlockBot = campaign.blockBots && botDetection.isBot;

    const deviceDetection = detectDevice(userAgent);
    const deviceBlock = shouldBlockDevice(deviceDetection, campaign.blockDesktop ?? false);
    const shouldBlockByDevice = deviceBlock.shouldBlock;

    const headers: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headers[key] = value;
    }
    const geoResult = detectCountryFromHeaders(headers);
    const geoBlock = shouldBlockByCountry(geoResult.country, campaign.blockedCountries);
    const shouldBlockByGeo = geoBlock.shouldBlock;

    const fullUrl = `https://${req.headers.host}${req.url}`;
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
      referer: referer as string | null,
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

    return res.redirect(302, campaign.destinationUrl);
  } catch (error) {
    console.error("Error processing redirect:", error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
