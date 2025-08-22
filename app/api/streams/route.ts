import { NextRequest, NextResponse } from 'next/server'
import { createLiveStream, type MuxLiveStreamCreateParams } from '@/lib/mux'
import { createStreamSession, updateStreamSession } from '@/lib/cosmic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      stream_title,
      description = '',
      status = 'scheduled',
      start_time,
      end_time,
      chat_enabled = true,
      stream_quality = '1080p',
      tags = ''
    } = body

    // Validate required fields
    if (!stream_title?.trim()) {
      return NextResponse.json(
        { error: 'Stream title is required' },
        { status: 400 }
      )
    }

    let streamKey = ''
    let muxPlaybackId = ''

    try {
      // Create MUX live stream
      const muxParams: MuxLiveStreamCreateParams = {
        reduced_latency: true,
        test: process.env.NODE_ENV === 'development'
      }

      const muxStream = await createLiveStream(muxParams)

      // Add null safety checks for muxStream
      if (muxStream) {
        if (muxStream.stream_key) {
          streamKey = muxStream.stream_key
        }
        if (muxStream.playback_ids && muxStream.playback_ids.length > 0) {
          const firstPlaybackId = muxStream.playback_ids[0]
          if (firstPlaybackId && firstPlaybackId.id) {
            muxPlaybackId = firstPlaybackId.id
          }
        }
      }
    } catch (muxError) {
      console.error('Error creating MUX stream:', muxError)
      // Continue without MUX integration - not a blocking error
    }

    // Create stream session in Cosmic CMS
    const streamSession = await createStreamSession({
      stream_title: stream_title.trim(),
      description,
      status,
      start_time,
      end_time,
      chat_enabled,
      stream_quality,
      tags
    })

    // Update with MUX details if available
    if (streamKey || muxPlaybackId) {
      try {
        await updateStreamSession(streamSession.id, {
          stream_key: streamKey,
          mux_playback_id: muxPlaybackId
        })
      } catch (updateError) {
        console.error('Error updating stream with MUX details:', updateError)
        // Stream was created successfully, MUX update failed but not critical
      }
    }

    return NextResponse.json({
      success: 'Stream created successfully',
      stream: streamSession,
      mux: {
        stream_key: streamKey || null,
        playback_id: muxPlaybackId || null
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating stream:', error)
    return NextResponse.json(
      { error: 'Failed to create stream' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { streamId, ...updates } = body

    if (!streamId) {
      return NextResponse.json(
        { error: 'Stream ID is required' },
        { status: 400 }
      )
    }

    const updatedStream = await updateStreamSession(streamId, updates)

    return NextResponse.json({
      success: 'Stream updated successfully',
      stream: updatedStream
    })

  } catch (error) {
    console.error('Error updating stream:', error)
    return NextResponse.json(
      { error: 'Failed to update stream' },
      { status: 500 }
    )
  }
}