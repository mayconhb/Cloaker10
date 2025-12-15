import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage.js';
import { authenticateRequest } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const auth = await authenticateRequest(req);
    
    if (!auth) {
      return res.status(200).json(null);
    }

    const user = await storage.getUser(auth.userId);
    
    if (!user) {
      return res.status(200).json(null);
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
