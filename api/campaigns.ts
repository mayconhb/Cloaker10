import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from './_lib/storage.js';
import { authenticateRequest } from './_lib/auth.js';
import { insertCampaignSchema } from '../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const campaigns = await storage.getCampaigns(auth.userId);
      const campaignsWithStats = await Promise.all(
        campaigns.map(async (campaign) => {
          const stats = await storage.getCampaignStats(campaign.id);
          return { ...campaign, stats };
        })
      );
      return res.status(200).json(campaignsWithStats);
    }

    if (req.method === 'POST') {
      const parsed = insertCampaignSchema.safeParse({
        ...req.body,
        userId: auth.userId,
      });

      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid campaign data', errors: parsed.error.errors });
      }

      const existingSlug = await storage.getCampaignBySlug(parsed.data.slug);
      if (existingSlug) {
        return res.status(400).json({ message: 'Slug already exists' });
      }

      const campaign = await storage.createCampaign(parsed.data);
      return res.status(201).json(campaign);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Campaigns error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
