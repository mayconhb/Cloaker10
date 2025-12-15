import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearCookieHeader } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  res.setHeader('Set-Cookie', clearCookieHeader());
  return res.status(200).json({ message: 'Logged out successfully' });
}
