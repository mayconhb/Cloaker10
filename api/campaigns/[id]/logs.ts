import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../_lib/storage';
import { authenticateRequest } from '../../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await storage.getAccessLogs(id, limit);
    return res.status(200).json(logs);
  } catch (error) {
    console.error('Logs error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
