import { NextRequest, NextResponse } from 'next/server'
import { getStreamSessions, createStreamSession, updateStreamSession } from '@/lib/cosmic'
import { createLiveStream, type MuxLiveStream, getPrimaryPlaybackId } from '@/lib/mux'

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
      tags
    } = body

    // Validate required fields
    if (!stream_title || stream_title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Stream title is required' },
        { status: 400 }
      )
    }

    // Validate stream title length
    if (stream_title.trim().length > 100) {
      return NextResponse.json(
        { error: 'Stream title must be 100 characters or less' },
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

    // Create Mux live stream
    let muxStream: MuxLiveStream | null = null
    try {
      muxStream = await createLiveStream({
        playback_policy: 'public',
        new_asset_settings: {
          playback_policy: 'public'
        }
      })
    } catch (muxError) {
      console.error('Error creating Mux stream:', muxError)
      return NextResponse.json(
        { error: 'Failed to create streaming infrastructure' },
        { status: 500 }
      )
    }

    if (!muxStream) {
      return NextResponse.json(
        { error: 'Failed to create streaming infrastructure' },
        { status: 500 }
      )
    }

    // Get primary playback ID
    const primaryPlaybackId = getPrimaryPlaybackId(muxStream)

    // Create stream session in Cosmic CMS
    const streamSession = await createStreamSession({
      stream_title: stream_title.trim(),
      description: description?.trim() || '',
      status,
      start_time: start_time || '',
      end_time: end_time || '',
      chat_enabled: Boolean(chat_enabled),
      stream_quality: stream_quality || '1080p',
      tags: tags?.trim() || ''
    })

    // Update with Mux data
    const updatedSession = await updateStreamSession(streamSession.id, {
      stream_key: muxStream.stream_key,
      mux_playback_id: primaryPlaybackId || undefined
    })

    return NextResponse.json({
      stream: updatedSession,
      mux_data: {
        stream_key: muxStream.stream_key,
        playback_id: primaryPlaybackId
      },
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { stream_id, status, viewer_count } = body

    if (!stream_id) {
      return NextResponse.json(
        { error: 'Stream ID is required' },
        { status: 400 }
      )
    }

    const updates: Record<string, any> = {}

    if (status) {
      const validStatuses = ['scheduled', 'live', 'ended', 'private']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid stream status' },
          { status: 400 }
        )
      }
      updates.status = status
    }

    if (typeof viewer_count === 'number' && viewer_count >= 0) {
      updates.viewer_count = viewer_count
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      )
    }

    const updatedStream = await updateStreamSession(stream_id, updates)

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