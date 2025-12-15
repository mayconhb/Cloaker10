import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage.js';
import { authenticateRequest } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid campaign ID' });
  }

  try {
    const campaign = await storage.getCampaign(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    if (campaign.userId !== auth.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.method === 'GET') {
      const stats = await storage.getCampaignStats(campaign.id);
      return res.status(200).json({ ...campaign, stats });
    }

    if (req.method === 'PATCH') {
      const updated = await storage.updateCampaign(id, req.body);
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      await storage.deleteCampaign(id);
      return res.status(204).end();
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Campaign error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
