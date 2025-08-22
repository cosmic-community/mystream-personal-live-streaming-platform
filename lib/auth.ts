import { NextRequest } from 'next/server'

// Simple rate limiting implementation
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const windowStart = now - windowMs

  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < windowStart) {
      rateLimitMap.delete(key)
    }
  }

  const current = rateLimitMap.get(identifier)
  
  if (!current) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.resetTime < now) {
    // Window has expired, reset
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= maxRequests) {
    return false
  }

  current.count++
  return true
}

export function getUserIdentifier(request: NextRequest): string {
  // Get IP address from various possible headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = request.headers.get('x-client-ip')
  
  const ip = forwarded?.split(',')[0]?.trim() || 
            realIp || 
            clientIp || 
            'unknown'

  return ip
}

export function validateAccessToken(token: string): boolean {
  // Basic token validation
  if (!token || typeof token !== 'string') {
    return false
  }

  // Check if token starts with expected prefix
  if (!token.startsWith('tkn_')) {
    return false
  }

  // Check token length (should be prefix + 32 characters)
  if (token.length !== 36) {
    return false
  }

  return true
}

export function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'tkn_'
  
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

export function isValidStreamId(streamId: string): boolean {
  if (!streamId || typeof streamId !== 'string') {
    return false
  }

  // Basic validation for Cosmic object IDs (24 character hex string)
  return /^[a-f0-9]{24}$/i.test(streamId)
}

export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, maxLength)
}

export function isValidViewerName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false
  }

  const trimmed = name.trim()
  
  // Check length
  if (trimmed.length < 2 || trimmed.length > 50) {
    return false
  }

  // Check for valid characters (alphanumeric, spaces, hyphens, underscores)
  if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmed)) {
    return false
  }

  return true
}