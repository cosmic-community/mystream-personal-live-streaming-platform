import { NextRequest } from 'next/server'

// Simple rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export function getUserIdentifier(request: NextRequest): string {
  // Get client IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  // In a real app, you might also include user ID or session ID
  return ip
}

export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const windowStart = now - windowMs
  
  const current = rateLimitStore.get(identifier)
  
  if (!current || current.resetTime < now) {
    // First request or window has reset
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }
  
  if (current.count >= maxRequests) {
    return false // Rate limit exceeded
  }
  
  // Increment counter
  current.count++
  rateLimitStore.set(identifier, current)
  return true
}

export function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  // Use crypto.getRandomValues if available, otherwise fallback to Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    
    for (let i = 0; i < array.length; i++) {
      result += chars[array[i] % chars.length]
    }
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < 32; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
  }
  
  return `tkn_${result}`
}

export function validateAccessToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }
  
  // Token should start with 'tkn_' and be followed by 32 characters
  const tokenRegex = /^tkn_[A-Za-z0-9]{32}$/
  return tokenRegex.test(token)
}

export function sanitizeInput(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .substring(0, maxLength)
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Permission checking utilities
export type Permission = 'view-only' | 'chat' | 'moderator'

export function hasPermission(userPermission: Permission, requiredPermission: Permission): boolean {
  const permissionLevels = {
    'view-only': 0,
    'chat': 1,
    'moderator': 2
  }
  
  const userLevel = permissionLevels[userPermission] ?? 0
  const requiredLevel = permissionLevels[requiredPermission] ?? 0
  
  return userLevel >= requiredLevel
}

export function canModerateChat(permission: Permission): boolean {
  return permission === 'moderator'
}

export function canSendChat(permission: Permission): boolean {
  return permission === 'chat' || permission === 'moderator'
}

// Basic session management (extend this for production use)
export interface SessionData {
  viewerName: string
  permission: Permission
  streamId: string
  lastActivity: number
}

const sessionStore = new Map<string, SessionData>()

export function createViewerSession(data: Omit<SessionData, 'lastActivity'>): string {
  const sessionId = generateSecureToken()
  sessionStore.set(sessionId, {
    ...data,
    lastActivity: Date.now()
  })
  return sessionId
}

export function getViewerSession(sessionId: string): SessionData | null {
  const session = sessionStore.get(sessionId)
  if (!session) {
    return null
  }
  
  // Check if session has expired (24 hours)
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  if (Date.now() - session.lastActivity > maxAge) {
    sessionStore.delete(sessionId)
    return null
  }
  
  // Update last activity
  session.lastActivity = Date.now()
  sessionStore.set(sessionId, session)
  
  return session
}

export function updateViewerSession(sessionId: string, updates: Partial<SessionData>): boolean {
  const session = sessionStore.get(sessionId)
  if (!session) {
    return false
  }
  
  const updatedSession = {
    ...session,
    ...updates,
    lastActivity: Date.now()
  }
  
  sessionStore.set(sessionId, updatedSession)
  return true
}

export function deleteViewerSession(sessionId: string): boolean {
  return sessionStore.delete(sessionId)
}

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours
  
  for (const [sessionId, session] of sessionStore.entries()) {
    if (now - session.lastActivity > maxAge) {
      sessionStore.delete(sessionId)
    }
  }
}, 60 * 60 * 1000) // Clean up every hour