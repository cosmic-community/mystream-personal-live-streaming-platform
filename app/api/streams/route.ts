import { NextRequest, NextResponse } from 'next/server'
import { createStreamSession, getStreamSessions, updateStreamSession } from '@/lib/cosmic'
import { createLiveStream, type CreateLiveStreamParams } from '@/lib/mux'
import type { MuxLiveStream } from '@/types'

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

    if (!stream_title) {
      return NextResponse.json(
        { error: 'Stream title is required' },
        { status: 400 }
      )
    }

    // Create stream session in Cosmic CMS
    const streamSession = await createStreamSession({
      stream_title,
      description,
      status,
      start_time,
      end_time,
      chat_enabled,
      stream_quality,
      tags
    })

    let muxStream: MuxLiveStream | null = null
    
    // Optionally create MUX live stream
    if (create_mux_stream) {
      try {
        // FIXED: Removed invalid playback_policy property
        const muxParams: CreateLiveStreamParams = {
          reducedLatency: false,
          test: false,
          reconnectWindow: 60
        }

        muxStream = await createLiveStream(muxParams)

        // FIXED: Use proper MuxLiveStream type with all required properties
        const muxStreamData: MuxLiveStream = {
          id: muxStream.id,
          stream_key: muxStream.stream_key,
          playback_ids: muxStream.playback_ids,
          status: muxStream.status,
          created_at: muxStream.created_at
        }

        // Update stream session with MUX details
        await updateStreamSession(streamSession.id, {
          stream_key: muxStreamData.stream_key,
          mux_playback_id: muxStreamData.playback_ids[0]?.id || ''
        })
      } catch (muxError) {
        console.error('Error creating MUX stream:', muxError)
        // Continue without MUX integration if it fails
      }
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