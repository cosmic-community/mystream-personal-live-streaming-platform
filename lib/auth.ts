// Simple rate limiting and authentication utilities

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  
  for (const [key, entry] of entries) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const key = identifier;
  
  let entry = rateLimitStore.get(key);
  
  // If no entry or window has expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitStore.set(key, entry);
    return true;
  }
  
  // Check if within rate limit
  if (entry.count < maxRequests) {
    entry.count++;
    return true;
  }
  
  // Rate limit exceeded
  return false;
}

export function getUserIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  // Extract IP from forwarded header (first IP in the chain)
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }
  
  if (realIp) return realIp;
  if (cfConnectingIp) return cfConnectingIp;
  
  // Fallback to a default identifier
  return 'unknown';
}

export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto if available (browser/Node.js), fallback to Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

export function validateAccessToken(token: string): boolean {
  // Basic token format validation
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Check if token starts with expected prefix and has reasonable length
  if (!token.startsWith('tkn_') || token.length < 20) {
    return false;
  }
  
  // Check for valid characters (alphanumeric + underscore)
  if (!/^tkn_[A-Za-z0-9_]+$/.test(token)) {
    return false;
  }
  
  return true;
}

export function hashPassword(password: string): Promise<string> {
  // This would typically use bcrypt or similar
  // For this example, we'll use a simple approach
  // In production, use proper password hashing
  return Promise.resolve(
    Buffer.from(password).toString('base64')
  );
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  // This would typically use bcrypt.compare or similar
  // For this example, we'll use a simple approach
  // In production, use proper password verification
  const computed = Buffer.from(password).toString('base64');
  return Promise.resolve(computed === hash);
}

// Session management helpers
export function generateSessionId(): string {
  return generateSecureToken(48);
}

export function isValidSessionId(sessionId: string): boolean {
  return typeof sessionId === 'string' && sessionId.length >= 20;
}

// IP address utilities
export function isValidIPAddress(ip: string): boolean {
  // Basic IP validation regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export function sanitizeIPAddress(ip: string): string {
  if (!ip || typeof ip !== 'string') {
    return 'unknown';
  }
  
  // Remove any surrounding whitespace
  const cleaned = ip.trim();
  
  // Basic validation and return
  if (isValidIPAddress(cleaned)) {
    return cleaned;
  }
  
  return 'unknown';
}

// Error handling
export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}