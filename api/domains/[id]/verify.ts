import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../_lib/storage.js';
import { authenticateRequest } from '../../_lib/auth.js';
import { verifyDomainDns, getDnsInstructions } from '../../_lib/dnsVerifier.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

    const result = await verifyDomainDns(domain.entryDomain, domain.verificationToken || undefined);
    
    if (result.verified) {
      const updated = await storage.updateDomain(id, {
        dnsVerified: true,
        lastVerifiedAt: new Date(),
      });
      
      const dnsInstructions = domain.verificationToken 
        ? getDnsInstructions(domain.entryDomain, domain.verificationToken)
        : null;
      
      return res.status(200).json({
        ...updated,
        dnsInstructions,
        verificationResult: result,
      });
    }

    const dnsInstructions = domain.verificationToken 
      ? getDnsInstructions(domain.entryDomain, domain.verificationToken)
      : null;

    return res.status(200).json({
      ...domain,
      dnsInstructions,
      verificationResult: result,
    });
  } catch (error) {
    console.error('Domain verification error:', error);
    return res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}
