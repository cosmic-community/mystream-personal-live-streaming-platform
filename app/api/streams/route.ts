import { NextRequest, NextResponse } from 'next/server'
import { createLiveStream, getAllLiveStreams } from '@/lib/mux'
import { createStreamSession, updateStreamSession } from '@/lib/cosmic'
import { checkRateLimit, getUserIdentifier } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Get all live streams from MUX
    const muxStreams = await getAllLiveStreams()
    
    // Filter by status if provided
    const filteredStreams = status 
      ? muxStreams.filter(stream => stream.status === status)
      : muxStreams

    return NextResponse.json({ streams: filteredStreams })
  } catch (error) {
    console.error('Error fetching streams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch streams' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const userIdentifier = getUserIdentifier(request)
    if (!checkRateLimit(userIdentifier, 5, 300000)) { // 5 streams per 5 minutes
      return NextResponse.json(
        { error: 'Too many stream creation requests. Please wait before creating another stream.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      stream_title,
      description = '',
      status = 'scheduled',
      start_time = '',
      end_time = '',
      chat_enabled = true,
      stream_quality = '1080p',
      tags = ''
    } = body

    // Validate required fields
    if (!stream_title || stream_title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Stream title is required' },
        { status: 400 }
      )
    }

    if (stream_title.length > 100) {
      return NextResponse.json(
        { error: 'Stream title must be less than 100 characters' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['scheduled', 'live', 'ended', 'private']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid stream status' },
        { status: 400 }
      )
    }

    // Validate stream quality
    const validQualities = ['720p', '1080p', '4k']
    if (!validQualities.includes(stream_quality)) {
      return NextResponse.json(
        { error: 'Invalid stream quality' },
        { status: 400 }
      )
    }

    // Create MUX live stream
    const muxStream = await createLiveStream({
      playback_policy: ['public'],
      reconnect_window: 60,
      test: process.env.NODE_ENV !== 'production'
    })

    if (!muxStream || !muxStream.stream_key || !muxStream.playback_ids?.[0]?.id) {
      throw new Error('Invalid response from MUX API')
    }

    // Create stream session in Cosmic
    const streamSession = await createStreamSession({
      stream_title: stream_title.trim(),
      description: description.trim(),
      status,
      start_time,
      end_time,
      chat_enabled,
      stream_quality,
      tags: tags.trim()
    })

    // Update stream session with MUX details
    const updatedSession = await updateStreamSession(streamSession.id, {
      stream_key: muxStream.stream_key,
      mux_playback_id: muxStream.playback_ids[0].id
    })

    return NextResponse.json({
      stream: updatedSession,
      mux_stream: muxStream,
      success: 'Stream created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating stream:', error)
    return NextResponse.json(
      { error: 'Failed to create stream' },
      { status: 500 }
    )
  }
}