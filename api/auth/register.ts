import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { createToken, hashPassword, setCookieHeader } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, firstName, lastName }: { 
      email?: string; 
      password?: string; 
      firstName?: string; 
      lastName?: string;
    } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres' });
    }

    const existingUser = await storage.getUserByEmail(email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ message: 'Este email já está cadastrado' });
    }

    const user = await storage.createUser({
      email: email.toLowerCase(),
      firstName: firstName || null,
      lastName: lastName || null,
      profileImageUrl: null,
    });

    const token = createToken({ userId: user.id, email: user.email || '' });
    
    res.setHeader('Set-Cookie', setCookieHeader(token));
    
    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}
