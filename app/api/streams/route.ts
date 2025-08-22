import { NextRequest, NextResponse } from 'next/server'
import { createMuxLiveStream, getAllMuxLiveStreams } from '@/lib/mux'
import { createStreamSession } from '@/lib/cosmic'

export async function GET() {
  try {
    const streams = await getAllMuxLiveStreams()
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
    const body = await request.json()
    const { stream_title, description, status, start_time, end_time, chat_enabled, stream_quality, tags } = body

    // Validate required fields
    if (!stream_title) {
      return NextResponse.json(
        { error: 'Stream title is required' },
        { status: 400 }
      )
    }

    // Create MUX live stream
    const muxStream = await createMuxLiveStream({
      playback_policy: ['public'],
      reconnect_window: 60,
      test: false
    })

    if (!muxStream || !muxStream.stream_key) {
      throw new Error('Failed to create MUX live stream')
    }

    // Create stream session in Cosmic CMS
    const streamSession = await createStreamSession({
      stream_title,
      description,
      status: status || 'scheduled',
      start_time,
      end_time,
      chat_enabled: chat_enabled ?? true,
      stream_quality: stream_quality || '1080p',
      tags
    })

    // Update stream session with MUX details
    if (streamSession.id) {
      // Import the function properly
      const { updateStreamSession } = await import('@/lib/cosmic')
      
      await updateStreamSession(streamSession.id, {
        stream_key: muxStream.stream_key,
        mux_playback_id: muxStream.playback_ids?.[0]?.id || ''
      })
    }

    return NextResponse.json({
      stream: streamSession,
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