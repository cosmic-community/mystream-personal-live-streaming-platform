import { NextRequest, NextResponse } from 'next/server'
import { getStreamSessions, createStreamSession } from '@/lib/cosmic'
import { createMuxLiveStream } from '@/lib/mux'
import { checkRateLimit, getUserIdentifier } from '@/lib/auth'

export async function GET() {
  try {
    const streams = await getStreamSessions()
    return NextResponse.json({ streams })
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
    if (!checkRateLimit(userIdentifier, 5, 60000)) { // 5 requests per minute
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      stream_title,
      description,
      status = 'scheduled',
      start_time,
      end_time,
      chat_enabled = true,
      stream_quality = '1080p',
      tags
    } = body

    // Validate required fields
    if (!stream_title || stream_title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Stream title is required' },
        { status: 400 }
      )
    }

    // Create MUX live stream
    let muxData
    try {
      muxData = await createMuxLiveStream()
    } catch (muxError) {
      console.error('Error creating MUX stream:', muxError)
      // Continue without MUX data - can be added later
    }

    // Create stream session in Cosmic
    const streamData = {
      stream_title: stream_title.trim(),
      description: description?.trim() || '',
      status,
      start_time: start_time || '',
      end_time: end_time || '',
      chat_enabled,
      stream_quality,
      tags: tags?.trim() || '',
      stream_key: muxData?.streamKey,
      mux_playback_id: muxData?.playbackId
    }

    const stream = await createStreamSession(streamData)

    return NextResponse.json({ 
      stream,
      message: 'Stream created successfully' 
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating stream:', error)
    return NextResponse.json(
      { error: 'Failed to create stream' },
      { status: 500 }
    )
  }
}