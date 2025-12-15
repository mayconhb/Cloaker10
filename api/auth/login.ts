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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password }: { email?: string; password?: string } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    // Check for admin credentials (case insensitive email)
    if (email.toLowerCase() === ADMIN_USER.email.toLowerCase() && password === ADMIN_USER.password) {
      // For admin, just create token without database check to avoid connection issues
      const token = createToken({ userId: ADMIN_USER.id, email: ADMIN_USER.email });
      res.setHeader('Set-Cookie', setCookieHeader(token));
      
      // Try to ensure user exists in database, but don't fail if DB is unavailable
      try {
        let user = await storage.getUserByEmail(ADMIN_USER.email);
        if (!user) {
          await storage.upsertUser({
            id: ADMIN_USER.id,
            email: ADMIN_USER.email,
            firstName: ADMIN_USER.firstName,
            lastName: ADMIN_USER.lastName,
            profileImageUrl: ADMIN_USER.profileImageUrl,
          });
        }
      } catch (dbError) {
        console.error('DB sync error (non-fatal):', dbError);
        // Continue anyway - admin can still login
      }
      
      return res.status(200).json({
        user: {
          id: ADMIN_USER.id,
          email: ADMIN_USER.email,
          firstName: ADMIN_USER.firstName,
          lastName: ADMIN_USER.lastName,
        },
        token,
      });
    }

    return res.status(401).json({ message: 'Credenciais inválidas' });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error?.message || 'Erro desconhecido'
    });
  }
}
