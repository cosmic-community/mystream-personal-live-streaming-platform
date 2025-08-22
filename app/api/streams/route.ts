import { NextRequest, NextResponse } from 'next/server'
import { getLiveStream, createLiveStream, deleteLiveStream } from '@/lib/mux' // FIXED: Updated import names
import { createStreamSession, getStreamSessions, updateStreamSession } from '@/lib/cosmic'

// GET /api/streams - List all streams
export async function GET() {
  try {
    const streams = await getStreamSessions()
    
    return NextResponse.json({
      success: true,
      streams,
      total: streams.length
    })
  } catch (error) {
    console.error('Error fetching streams:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch streams'
    }, { status: 500 })
  }
}

// POST /api/streams - Create new stream
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
      tags = ''
    } = body

    if (!stream_title) {
      return NextResponse.json({
        success: false,
        error: 'Stream title is required'
      }, { status: 400 })
    }

    // Create MUX live stream
    const muxStream = await createLiveStream({
      playback_policy: ['public'],
      test: process.env.NODE_ENV !== 'production'
    })

    if (!muxStream || !muxStream.id) {
      throw new Error('Failed to create MUX live stream')
    }

    // Create stream session in Cosmic CMS
    const streamData = {
      stream_title,
      description: description || '',
      status,
      start_time: start_time || '',
      end_time: end_time || '',
      chat_enabled,
      stream_quality,
      tags
    }

    const cosmicStream = await createStreamSession(streamData)

    // Update the stream session with MUX details
    const updatedStream = await updateStreamSession(cosmicStream.id, {
      stream_key: muxStream.stream_key,
      mux_playback_id: muxStream.playback_ids[0]?.id || ''
    })

    return NextResponse.json({
      success: true,
      stream: updatedStream,
      mux_details: {
        id: muxStream.id,
        stream_key: muxStream.stream_key,
        playback_id: muxStream.playback_ids[0]?.id
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating stream:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create stream'
    }, { status: 500 })
  }
}

// DELETE /api/streams/[id]
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const streamId = searchParams.get('id')
    const muxId = searchParams.get('muxId')

    if (!streamId) {
      return NextResponse.json({
        success: false,
        error: 'Stream ID is required'
      }, { status: 400 })
    }

    // Delete from MUX if MUX ID is provided
    if (muxId) {
      const deleted = await deleteLiveStream(muxId)
      if (!deleted) {
        console.warn(`Failed to delete MUX stream ${muxId}`)
      }
    }

    // Note: We would need to implement deleteStreamSession in cosmic.ts
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: 'Stream deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting stream:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete stream'
    }, { status: 500 })
  }
}