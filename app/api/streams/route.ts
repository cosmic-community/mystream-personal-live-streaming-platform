import { NextRequest, NextResponse } from 'next/server'
import { getLiveStream, createLiveStream, deleteLiveStream } from '@/lib/mux'
import { getStreamSessions, createStreamSession, updateStreamSession } from '@/lib/cosmic'
import type { StreamSession, MuxLiveStream, MuxLiveStreamCreateParams } from '@/types'

export async function GET() {
  try {
    const streams = await getStreamSessions()
    
    // Add live status from MUX for each stream
    const streamsWithStatus = await Promise.all(
      streams.map(async (stream: StreamSession) => {
        try {
          if (stream.metadata?.mux_playback_id) {
            const muxStream = await getLiveStream(stream.metadata.mux_playback_id)
            return {
              ...stream,
              mux_status: muxStream?.status || 'idle'
            }
          }
          return stream
        } catch (error) {
          console.error(`Error fetching MUX status for stream ${stream.id}:`, error)
          return stream
        }
      })
    )

    return NextResponse.json({ streams: streamsWithStatus })
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
      tags
    } = body

    if (!stream_title) {
      return NextResponse.json(
        { error: 'Stream title is required' },
        { status: 400 }
      )
    }

    // Create MUX live stream
    const muxParams: MuxLiveStreamCreateParams = {
      playback_policy: ['public'],
      reconnect_window: 60
      // Removed 'test' property as it's not supported in current MUX SDK
    }

    const muxStream: MuxLiveStream = await createLiveStream(muxParams)
    
    if (!muxStream || !muxStream.stream_key || !muxStream.playback_ids?.[0]?.id) {
      throw new Error('Failed to create MUX live stream')
    }

    // Create stream session in Cosmic
    const streamData = {
      stream_title,
      description,
      status,
      start_time,
      end_time,
      chat_enabled,
      stream_quality,
      tags
    }

    const cosmicStream = await createStreamSession(streamData)

    // Update with MUX data
    const updatedStream = await updateStreamSession(cosmicStream.id, {
      stream_key: muxStream.stream_key,
      mux_playback_id: muxStream.playback_ids[0].id
    })

    return NextResponse.json({
      stream: updatedStream,
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const streamId = searchParams.get('streamId')
    const muxStreamId = searchParams.get('muxStreamId')

    if (!streamId) {
      return NextResponse.json(
        { error: 'Stream ID is required' },
        { status: 400 }
      )
    }

    // Delete from MUX if MUX stream ID exists
    if (muxStreamId) {
      try {
        await deleteLiveStream(muxStreamId)
      } catch (error) {
        console.error('Error deleting MUX stream:', error)
        // Continue with Cosmic deletion even if MUX deletion fails
      }
    }

    // Update stream status in Cosmic to 'ended' instead of deleting
    // This preserves chat history and access links
    await updateStreamSession(streamId, {
      status: 'ended'
    })

    return NextResponse.json({
      success: 'Stream ended successfully'
    })

  } catch (error) {
    console.error('Error deleting stream:', error)
    return NextResponse.json(
      { error: 'Failed to delete stream' },
      { status: 500 }
    )
  }
}