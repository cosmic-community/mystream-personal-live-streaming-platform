import { NextRequest } from 'next/server'

// Simple rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function getUserIdentifier(request: NextRequest): string {
  // Get IP address from various possible headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(', ')[0] || realIp || 'unknown'
  
  return ip
}

export function checkRateLimit(
  identifier: string, 
  maxRequests: number, 
  windowMs: number
): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(identifier)

  if (!userLimit) {
    // First request from this identifier
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }

  if (now > userLimit.resetTime) {
    // Window has expired, reset
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }

  if (userLimit.count >= maxRequests) {
    // Rate limit exceeded
    return false
  }

  // Increment count
  userLimit.count++
  return true
}

export function cleanupRateLimit(): void {
  const now = Date.now()
  
  for (const [identifier, limit] of rateLimitStore.entries()) {
    if (now > limit.resetTime) {
      rateLimitStore.delete(identifier)
    }
  }
}

// Clean up expired entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(cleanupRateLimit, 5 * 60 * 1000)
}

// Simple token validation
export function validateAccessToken(token: string): boolean {
  if (!token || token.length < 10) {
    return false
  }

  // Basic token format validation
  return /^tkn_[a-zA-Z0-9]+$/.test(token)
}

// Generate a secure random token
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'tkn_'
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

// Simple session management
export interface Session {
  id: string
  createdAt: Date
  expiresAt: Date
  data: Record<string, any>
}

const sessions = new Map<string, Session>()

export function createSession(data: Record<string, any>, expirationMs: number = 24 * 60 * 60 * 1000): string {
  const sessionId = generateSecureToken(32)
  const now = new Date()
  
  sessions.set(sessionId, {
    id: sessionId,
    createdAt: now,
    expiresAt: new Date(now.getTime() + expirationMs),
    data
  })
  
  return sessionId
}

export function getSession(sessionId: string): Session | null {
  const session = sessions.get(sessionId)
  
  if (!session) {
    return null
  }
  
  if (new Date() > session.expiresAt) {
    sessions.delete(sessionId)
    return null
  }
  
  return session
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId)
}

export function updateSession(sessionId: string, data: Record<string, any>): boolean {
  const session = sessions.get(sessionId)
  
  if (!session || new Date() > session.expiresAt) {
    return false
  }
  
  session.data = { ...session.data, ...data }
  return true
}

// Clean up expired sessions every hour
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = new Date()
    for (const [sessionId, session] of sessions.entries()) {
      if (now > session.expiresAt) {
        sessions.delete(sessionId)
      }
    }
  }, 60 * 60 * 1000)
}

// Viewer name validation
export function validateViewerName(name: string): boolean {
  if (!name || name.trim().length < 2 || name.trim().length > 50) {
    return false
  }
  
  // Allow alphanumeric characters, spaces, hyphens, and underscores
  return /^[a-zA-Z0-9_\-\s]+$/.test(name.trim())
}

// Permission checking helpers
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('moderator')
}

export function canViewStream(permissions: string): boolean {
  return ['view-only', 'chat', 'moderator'].includes(permissions)
}

export function canChatInStream(permissions: string): boolean {
  return ['chat', 'moderator'].includes(permissions)
}

export function canModerateStream(permissions: string): boolean {
  return permissions === 'moderator'
}

// IP address utilities
export function isValidIpAddress(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

export function hashIpAddress(ip: string): string {
  // Simple hash function for IP anonymization
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

// Security headers helper
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }
}