import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from './_lib/storage';
import { authenticateRequest } from './_lib/auth';
import { insertDomainSchema } from '../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const domains = await storage.getDomains(auth.userId);
      return res.status(200).json(domains);
    }

    if (req.method === 'POST') {
      const parsed = insertDomainSchema.safeParse({
        ...req.body,
        userId: auth.userId,
      });

      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid domain data', errors: parsed.error.errors });
      }

      const existingDomain = await storage.getDomainByEntryDomain(parsed.data.entryDomain);
      if (existingDomain) {
        return res.status(400).json({ message: 'This domain is already registered' });
      }

      const domain = await storage.createDomain(parsed.data);
      return res.status(201).json(domain);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Domains error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
