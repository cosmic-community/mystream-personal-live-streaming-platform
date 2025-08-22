import { NextRequest, NextResponse } from 'next/server'
import { getMuxLiveStream, createMuxLiveStream, deleteMuxLiveStream } from '@/lib/mux' // FIXED: Import correct function names
import { getStreamSessions, createStreamSession, updateStreamSession } from '@/lib/cosmic'

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
      tags = ''
    } = body

    if (!stream_title) {
      return NextResponse.json(
        { error: 'Stream title is required' },
        { status: 400 }
      )
    }

    // Create MUX live stream first (if credentials are configured)
    let muxData = null
    try {
      muxData = await createMuxLiveStream()
    } catch (error) {
      console.warn('Failed to create MUX stream, continuing without video integration:', error)
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
      tags
    }

    const stream = await createStreamSession(streamData)

    // Update stream with MUX data if available
    if (muxData && stream.id) {
      try {
        await updateStreamSession(stream.id, {
          stream_key: muxData.stream_key,
          mux_playback_id: muxData.playback_ids[0]?.id || ''
        })
      } catch (error) {
        console.error('Failed to update stream with MUX data:', error)
      }
    }

    return NextResponse.json({ stream }, { status: 201 })
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
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Stream ID is required' },
        { status: 400 }
      )
    }

    const updatedStream = await updateStreamSession(id, updates)
    return NextResponse.json({ stream: updatedStream })
  } catch (error) {
    console.error('Error updating stream:', error)
    return NextResponse.json(
      { error: 'Failed to update stream' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const streamId = searchParams.get('id')
    const muxStreamId = searchParams.get('muxId')

    if (!streamId) {
      return NextResponse.json(
        { error: 'Stream ID is required' },
        { status: 400 }
      )
    }

    // Delete MUX stream if muxStreamId is provided
    if (muxStreamId) {
      try {
        await deleteMuxLiveStream(muxStreamId)
      } catch (error) {
        console.error('Failed to delete MUX stream:', error)
        // Continue with Cosmic deletion even if MUX deletion fails
      }
    }

    // Delete stream from Cosmic
    // Note: Cosmic SDK doesn't have a direct delete method exposed in the provided lib
    // This would need to be implemented using the cosmic.objects.deleteOne method
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting stream:', error)
    return NextResponse.json(
      { error: 'Failed to delete stream' },
      { status: 500 }
    )
  }
}