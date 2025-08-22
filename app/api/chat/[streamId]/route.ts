// app/api/chat/[streamId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getChatMessages, createChatMessage } from '@/lib/cosmic'
import { checkRateLimit, getUserIdentifier } from '@/lib/auth'
import { sanitizeMessage, validateViewerName, isValidMessageType } from '@/lib/websocket'

interface RouteParams {
  params: Promise<{
    streamId: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { streamId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const messages = await getChatMessages(streamId, limit)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { streamId } = await params
    
    // Rate limiting for chat messages
    const userIdentifier = getUserIdentifier(request)
    if (!checkRateLimit(userIdentifier, 30, 60000)) { // 30 messages per minute
      return NextResponse.json(
        { error: 'Too many messages. Please slow down.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      message_content,
      viewer_name,
      message_type = 'regular'
    } = body

    // Validate required fields
    if (!message_content || !viewer_name) {
      return NextResponse.json(
        { error: 'Message content and viewer name are required' },
        { status: 400 }
      )
    }

    // Validate viewer name
    if (!validateViewerName(viewer_name)) {
      return NextResponse.json(
        { error: 'Invalid viewer name. Must be 2-50 characters, alphanumeric only.' },
        { status: 400 }
      )
    }

    // Validate message type
    if (!isValidMessageType(message_type)) {
      return NextResponse.json(
        { error: 'Invalid message type' },
        { status: 400 }
      )
    }

    // Sanitize message content
    const sanitizedMessage = sanitizeMessage(message_content)
    if (!sanitizedMessage) {
      return NextResponse.json(
        { error: 'Message content is invalid or too long' },
        { status: 400 }
      )
    }

    // Get client IP for logging
    const forwarded = request.headers.get('x-forwarded-for')
    const viewerIp = forwarded?.split(/, /)[0] || 'unknown'

    const chatMessageData = {
      message_content: sanitizedMessage,
      viewer_name: viewer_name.trim(),
      stream_session_id: streamId,
      message_type,
      viewer_ip: viewerIp
    }

    const chatMessage = await createChatMessage(chatMessageData)

    return NextResponse.json({
      message: chatMessage,
      success: 'Message sent successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating chat message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}