import { NextRequest, NextResponse } from 'next/server'
import { createLiveStream, getLiveStreams } from '@/lib/mux'
import { createStreamSession, getStreamSessions } from '@/lib/cosmic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') // 'mux' or 'cosmic'

    if (source === 'mux') {
      // Get streams from MUX
      const muxStreams = await getLiveStreams()
      return NextResponse.json({ streams: muxStreams })
    } else {
      // Get stream sessions from Cosmic
      const cosmicStreams = await getStreamSessions()
      return NextResponse.json({ streams: cosmicStreams })
    }
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
    const {
      stream_title,
      description,
      status = 'scheduled',
      start_time,
      end_time,
      chat_enabled = true,
      stream_quality = '1080p',
      tags,
      create_mux_stream = false
    } = body

    // Validate required fields
    if (!stream_title) {
      return NextResponse.json(
        { error: 'Stream title is required' },
        { status: 400 }
      )
    }

    let muxStreamData = null

    // Create MUX live stream if requested
    if (create_mux_stream) {
      try {
        const muxStream = await createLiveStream({
          playback_policy: ['public'],
          reconnect_window: 60,
          reduced_latency: false,
          test: process.env.NODE_ENV !== 'production'
        })

        muxStreamData = {
          stream_key: muxStream.stream_key,
          mux_playback_id: muxStream.playback_ids?.[0]?.id || '',
        }
      } catch (muxError) {
        console.error('Error creating MUX stream:', muxError)
        return NextResponse.json(
          { error: 'Failed to create MUX live stream' },
          { status: 500 }
        )
      }
    }

    // Create stream session in Cosmic
    const streamData = {
      stream_title,
      description: description || '',
      status,
      start_time: start_time || '',
      end_time: end_time || '',
      chat_enabled,
      stream_quality,
      tags: tags || '',
      ...muxStreamData
    }

    const streamSession = await createStreamSession(streamData)

    return NextResponse.json({
      stream: streamSession,
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