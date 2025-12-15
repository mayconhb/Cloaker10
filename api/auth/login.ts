import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { createToken, setCookieHeader } from '../_lib/auth';

// Admin credentials - same as server/simpleAuth.ts
const ADMIN_USER = {
  id: "admin-user-id",
  email: "admin@123.com",
  password: "admin123",
  firstName: "Admin",
  lastName: "User",
  profileImageUrl: null,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password }: { email?: string; password?: string } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    // Check for admin credentials
    if (email.toLowerCase() === ADMIN_USER.email && password === ADMIN_USER.password) {
      // Ensure admin user exists in database
      let user = await storage.getUserByEmail(ADMIN_USER.email);
      if (!user) {
        user = await storage.upsertUser({
          id: ADMIN_USER.id,
          email: ADMIN_USER.email,
          firstName: ADMIN_USER.firstName,
          lastName: ADMIN_USER.lastName,
          profileImageUrl: ADMIN_USER.profileImageUrl,
        });
      }
      
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
    }

    return res.status(401).json({ message: 'Credenciais inválidas' });
  } catch (error: any) {
    console.error('Login error:', error);
    const errorMessage = error?.message || 'Erro desconhecido';
    const errorCode = error?.code || 'UNKNOWN';
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      debug: process.env.NODE_ENV !== 'production' ? { errorMessage, errorCode } : undefined
    });
  }
}
