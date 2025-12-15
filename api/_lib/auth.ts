import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from './storage.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface TokenPayload {
  userId: string;
  email: string;
  exp: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString();
}

export function createToken(payload: Omit<TokenPayload, 'exp'>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
  const fullPayload = { ...payload, exp };
  
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [headerB64, payloadB64, signature] = token.split('.');
    
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    if (signature !== expectedSig) return null;
    
    const payload: TokenPayload = JSON.parse(base64UrlDecode(payloadB64));
    
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  const cookies = req.headers.cookie;
  if (cookies) {
    const match = cookies.match(/auth_token=([^;]+)/);
    if (match) return match[1];
  }
  
  return null;
}

export async function authenticateRequest(req: VercelRequest): Promise<{ userId: string; email: string } | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  
  const payload = verifyToken(token);
  if (!payload) return null;
  
  const user = await storage.getUser(payload.userId);
  if (!user) return null;
  
  return { userId: payload.userId, email: payload.email };
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + JWT_SECRET).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function setCookieHeader(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return `auth_token=${token}; Path=/; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
}

export function clearCookieHeader(): string {
  return 'auth_token=; Path=/; HttpOnly; Max-Age=0';
}

export function withAuth(handler: (req: VercelRequest, res: VercelResponse, auth: { userId: string; email: string }) => Promise<void>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    return handler(req, res, auth);
  };
}
