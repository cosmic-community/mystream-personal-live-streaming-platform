import { NextRequest } from 'next/server'

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)
  
  if (!record || now - record.timestamp > windowMs) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

export function getUserIdentifier(request: NextRequest): string {
  // Extract IP from headers with fallback
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  // Get IP from various possible headers
  let ip = 'unknown'
  
  if (forwarded) {
    ip = forwarded.split(',')[0]?.trim() || 'unknown'
  } else if (realIp) {
    ip = realIp
  }
  
  return ip
}

export function validateToken(token: string): boolean {
  // Basic token validation
  return token.startsWith('tkn_') && token.length >= 20
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  const fiveMinutesAgo = now - (5 * 60 * 1000)
  
  for (const [key, record] of rateLimitMap.entries()) {
    if (record.timestamp < fiveMinutesAgo) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes