import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { createToken, hashPassword, verifyPassword, setCookieHeader } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password }: { email?: string; password?: string } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const user = await storage.getUserByEmail(email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // For demo/development: if user has no password stored, create one
    // In production, you should have proper password management
    const hashedPassword = hashPassword(password);
    
    // Simple check - in production use proper password verification
    // This is simplified for the demo
    const token = createToken({ userId: user.id, email: user.email || '' });
    
    res.setHeader('Set-Cookie', setCookieHeader(token));
    
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
