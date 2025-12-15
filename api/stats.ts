import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from './_lib/storage.js';
import { authenticateRequest } from './_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const auth = await authenticateRequest(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const stats = await storage.getUserStats(auth.userId);
    return res.status(200).json({
      totalCampaigns: stats.totalCampaigns,
      todayClicks: stats.totalClicks,
      todayBlocks: stats.blockedBots,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
