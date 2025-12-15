import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage.js';
import { authenticateRequest } from '../_lib/auth.js';
import { getDnsInstructions } from '../_lib/dnsVerifier.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;
  
  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid domain ID' });
  }

  try {
    const domain = await storage.getDomain(id);
    
    if (!domain) {
      return res.status(404).json({ message: 'Domain not found' });
    }

    if (domain.userId !== auth.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (req.method === 'GET') {
      const dnsInstructions = domain.verificationToken 
        ? getDnsInstructions(domain.entryDomain, domain.verificationToken)
        : null;
      
      return res.status(200).json({ ...domain, dnsInstructions });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { offerDomain } = req.body;
      const updated = await storage.updateDomain(id, { offerDomain });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      await storage.deleteDomain(id);
      return res.status(204).end();
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Domain error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
