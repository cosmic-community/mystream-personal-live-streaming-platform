import jwt from 'jsonwebtoken';
import type { AccessPermission } from '@/types';

export interface StreamAccessToken {
  streamId: string;
  permissions: AccessPermission;
  exp: number;
  iat: number;
}

export function generateStreamToken(streamId: string, permissions: AccessPermission, expirationHours: number = 24): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const payload: StreamAccessToken = {
    streamId,
    permissions,
    exp: Math.floor(Date.now() / 1000) + (expirationHours * 60 * 60),
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, secret);
}

export function verifyStreamToken(token: string): StreamAccessToken | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  try {
    const decoded = jwt.verify(token, secret) as StreamAccessToken;
    
    // Check if token has expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Error verifying stream token:', error);
    return null;
  }
}

export function hasPermission(userPermissions: AccessPermission, requiredPermission: AccessPermission): boolean {
  const permissionLevels: Record<AccessPermission, number> = {
    'view-only': 1,
    'chat': 2,
    'moderator': 3
  };

  return permissionLevels[userPermissions] >= permissionLevels[requiredPermission];
}

export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function isTokenExpired(timestamp: string): boolean {
  const expirationDate = new Date(timestamp);
  return expirationDate < new Date();
}

// Rate limiting helpers
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);

  if (!userLimit || now - userLimit.lastReset > windowMs) {
    rateLimitMap.set(identifier, { count: 1, lastReset: now });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

export function getUserIdentifier(req: Request): string {
  // Get user identifier from IP or user agent
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(/, /)[0] || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  return `${ip}-${userAgent}`;
}