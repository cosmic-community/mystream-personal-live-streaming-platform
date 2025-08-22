import { NextRequest, NextResponse } from 'next/server'
import { getAccessLinkByToken, updateAccessLinkUsage } from '@/lib/cosmic'
import { checkRateLimit, getUserIdentifier } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const userIdentifier = getUserIdentifier(request)
    if (!checkRateLimit(userIdentifier, 20, 60000)) { // 20 requests per minute
      return NextResponse.json(
        { error: 'Too many token validation requests' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    // Validate token format (should start with 'tkn_')
    if (!token.startsWith('tkn_')) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      )
    }

    const accessLink = await getAccessLinkByToken(token)

    if (!accessLink) {
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 401 }
      )
    }

    // Check if link is active
    if (!accessLink.metadata?.active) {
      return NextResponse.json(
        { error: 'Access link has been deactivated' },
        { status: 401 }
      )
    }

    // Check if link has expired
    if (accessLink.metadata?.expiration_date) {
      const expirationDate = new Date(accessLink.metadata.expiration_date)
      if (expirationDate < new Date()) {
        return NextResponse.json(
          { error: 'Access link has expired' },
          { status: 401 }
        )
      }
    }

    // Update usage count
    await updateAccessLinkUsage(accessLink.id)

    // Return access link and stream session data
    return NextResponse.json({
      valid: true,
      accessLink: {
        id: accessLink.id,
        permissions: accessLink.metadata?.permissions,
        expiration_date: accessLink.metadata?.expiration_date,
        usage_count: (accessLink.metadata?.usage_count || 0) + 1
      },
      streamSession: accessLink.metadata?.stream_session,
      message: 'Token validated successfully'
    })

  } catch (error) {
    console.error('Error validating token:', error)
    return NextResponse.json(
      { error: 'Failed to validate access token' },
      { status: 500 }
    )
  }
}