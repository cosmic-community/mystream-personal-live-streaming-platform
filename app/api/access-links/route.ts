import { NextRequest, NextResponse } from 'next/server'
import { getAccessLinks, createAccessLink, generateAccessToken } from '@/lib/cosmic'
import { checkRateLimit, getUserIdentifier } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const streamId = searchParams.get('streamId')
    
    const accessLinks = await getAccessLinks(streamId || undefined)
    return NextResponse.json({ accessLinks })
  } catch (error) {
    console.error('Error fetching access links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch access links' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const userIdentifier = getUserIdentifier(request)
    if (!checkRateLimit(userIdentifier, 10, 60000)) { // 10 requests per minute
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      stream_session_id,
      permissions = 'view-only',
      expiration_date
    } = body

    // Validate required fields
    if (!stream_session_id) {
      return NextResponse.json(
        { error: 'Stream session ID is required' },
        { status: 400 }
      )
    }

    // Validate permissions
    const validPermissions = ['view-only', 'chat', 'moderator']
    if (!validPermissions.includes(permissions)) {
      return NextResponse.json(
        { error: 'Invalid permissions value' },
        { status: 400 }
      )
    }

    // Generate unique access token
    const accessToken = generateAccessToken()

    // Validate expiration date if provided
    let validExpirationDate = expiration_date
    if (expiration_date) {
      const expirationDate = new Date(expiration_date)
      if (isNaN(expirationDate.getTime()) || expirationDate <= new Date()) {
        return NextResponse.json(
          { error: 'Invalid expiration date - must be in the future' },
          { status: 400 }
        )
      }
      validExpirationDate = expirationDate.toISOString()
    }

    const accessLinkData = {
      access_token: accessToken,
      stream_session_id,
      permissions,
      expiration_date: validExpirationDate
    }

    const accessLink = await createAccessLink(accessLinkData)

    return NextResponse.json({
      accessLink,
      message: 'Access link created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating access link:', error)
    return NextResponse.json(
      { error: 'Failed to create access link' },
      { status: 500 }
    )
  }
}