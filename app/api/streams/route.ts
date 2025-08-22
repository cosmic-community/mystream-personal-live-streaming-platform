import { NextRequest, NextResponse } from 'next/server'
import { createMuxLiveStream, getMuxLiveStreams } from '@/lib/mux'
import { createStreamSession, getStreamSessions, updateStreamSession } from '@/lib/cosmic'
import type { MuxLiveStreamCreateParams } from '@/types'

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
      auto_create_mux = true
    } = body

    // Validate required fields
    if (!stream_title) {
      return NextResponse.json(
        { error: 'Stream title is required' },
        { status: 400 }
      )
    }

    let streamKey = ''
    let muxPlaybackId = ''

    // Create MUX live stream if requested
    if (auto_create_mux) {
      try {
        const muxParams: MuxLiveStreamCreateParams = {
          playback_policy: ['public'],
          reduced_latency: true,
          test: process.env.NODE_ENV !== 'production'
        }

        const muxStream = await createMuxLiveStream(muxParams)
        streamKey = muxStream.stream_key
        muxPlaybackId = muxStream.playback_ids[0]?.id || ''
      } catch (muxError) {
        console.error('Error creating MUX stream:', muxError)
        return NextResponse.json(
          { error: 'Failed to create live stream infrastructure' },
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
      ...(streamKey && { stream_key: streamKey }),
      ...(muxPlaybackId && { mux_playback_id: muxPlaybackId })
    }

    const stream = await createStreamSession(streamData)

    return NextResponse.json({
      stream,
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Stream ID is required' },
        { status: 400 }
      )
    }

    const updatedStream = await updateStreamSession(id, updates)

    return NextResponse.json({
      stream: updatedStream,
      success: 'Stream updated successfully'
    })

  } catch (error) {
    console.error('Error updating stream:', error)
    return NextResponse.json(
      { error: 'Failed to update stream' },
      { status: 500 }
    )
  }
}