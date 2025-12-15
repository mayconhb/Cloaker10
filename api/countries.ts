import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AVAILABLE_COUNTRIES } from './_lib/detectors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  return res.status(200).json(AVAILABLE_COUNTRIES);
}
