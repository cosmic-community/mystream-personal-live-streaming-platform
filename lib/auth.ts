import { NextRequest } from 'next/server'
import { createHash } from 'crypto'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// User identifier for rate limiting
export function getUserIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(', ')[0] || request.ip || 'unknown'
  return createHash('sha256').update(ip).digest('hex').substring(0, 16)
}

// Rate limiting check
export function checkRateLimit(
  identifier: string, 
  maxRequests: number, 
  windowMs: number
): boolean {
  const now = Date.now()
  const key = `${identifier}:${Math.floor(now / windowMs)}`
  
  const current = rateLimitStore.get(key)
  
  if (!current) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= maxRequests) {
    return false
  }
  
  current.count++
  return true
}

// Clean up expired rate limit entries
export function cleanupRateLimit(): void {
  const now = Date.now()
  for (const [key, value] of rateLimitStore) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Basic authentication check for admin routes
export function checkAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  
  const token = authHeader.replace('Bearer ', '')
  const adminToken = process.env.ADMIN_TOKEN
  
  if (!adminToken) {
    console.warn('ADMIN_TOKEN not configured')
    return false
  }
  
  return token === adminToken
}

// Generate secure access token
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

// Validate access token format
export function validateTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false
  
  // Check if token starts with expected prefix
  if (token.startsWith('tkn_')) {
    return token.length >= 36 && /^tkn_[A-Za-z0-9]+$/.test(token)
  }
  
  // Allow other token formats for backward compatibility
  return token.length >= 16 && /^[A-Za-z0-9_-]+$/.test(token)
}

// Session management (simplified for demo)
interface UserSession {
  id: string
  viewerName: string
  permissions: string
  streamId?: string
  createdAt: number
  expiresAt: number
}

const sessionStore = new Map<string, UserSession>()

export function createUserSession(
  viewerName: string, 
  permissions: string, 
  streamId?: string
): string {
  const sessionId = generateSecureToken()
  const now = Date.now()
  const session: UserSession = {
    id: sessionId,
    viewerName,
    permissions,
    streamId,
    createdAt: now,
    expiresAt: now + (24 * 60 * 60 * 1000) // 24 hours
  }
  
  sessionStore.set(sessionId, session)
  return sessionId
}

export function getUserSession(sessionId: string): UserSession | null {
  const session = sessionStore.get(sessionId)
  
  // Add null check to fix TS2532 error
  if (!session) {
    return null
  }
  
  // Check if session has expired
  if (Date.now() > session.expiresAt) {
    sessionStore.delete(sessionId)
    return null
  }
  
  return session
}

export function updateUserSession(sessionId: string, updates: Partial<UserSession>): boolean {
  const session = sessionStore.get(sessionId)
  
  if (!session || Date.now() > session.expiresAt) {
    return false
  }
  
  Object.assign(session, updates)
  return true
}

export function deleteUserSession(sessionId: string): void {
  sessionStore.delete(sessionId)
}

// Clean up expired sessions
export function cleanupExpiredSessions(): void {
  const now = Date.now()
  for (const [sessionId, session] of sessionStore) {
    if (now > session.expiresAt) {
      sessionStore.delete(sessionId)
    }
  }
}

// Utility to get session from request
export function getSessionFromRequest(request: NextRequest): UserSession | null {
  const sessionId = request.cookies.get('session_id')?.value
  if (!sessionId) return null
  
  return getUserSession(sessionId)
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000) // Limit length
}

// Validate viewer name
export function validateViewerName(name: string): boolean {
  if (!name || typeof name !== 'string') return false
  
  const trimmed = name.trim()
  return (
    trimmed.length >= 2 && 
    trimmed.length <= 50 && 
    /^[a-zA-Z0-9_\-\s]+$/.test(trimmed)
  )
}

// Access permission helpers
export function hasViewPermission(permissions: string): boolean {
  return ['view-only', 'chat', 'moderator'].includes(permissions)
}

export function hasChatPermission(permissions: string): boolean {
  return ['chat', 'moderator'].includes(permissions)
}

export function hasModeratorPermission(permissions: string): boolean {
  return permissions === 'moderator'
}

// Setup periodic cleanup (run every hour)
if (typeof global !== 'undefined' && !global.authCleanupInterval) {
  global.authCleanupInterval = setInterval(() => {
    cleanupRateLimit()
    cleanupExpiredSessions()
  }, 60 * 60 * 1000) // 1 hour
}

declare global {
  var authCleanupInterval: NodeJS.Timeout | undefined
}