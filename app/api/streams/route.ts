import { NextRequest, NextResponse } from 'next/server'
import { createLiveStream, getLiveStreams } from '@/lib/mux'
import { createStreamSession, getStreamSessions, updateStreamSession } from '@/lib/cosmic'
import { checkRateLimit, getUserIdentifier } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeMux = searchParams.get('includeMux') === 'true'

    // Get streams from Cosmic CMS
    const streams = await getStreamSessions()

    if (!includeMux) {
      return NextResponse.json({ streams })
    }

    // Also get MUX live streams if requested
    try {
      const muxStreams = await getLiveStreams()
      return NextResponse.json({ 
        streams, 
        muxStreams 
      })
    } catch (muxError) {
      console.error('Error fetching MUX streams:', muxError)
      // Return Cosmic streams even if MUX fails
      return NextResponse.json({ 
        streams,
        muxStreams: [],
        warning: 'Could not fetch MUX streams'
      })
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
    // Rate limiting
    const userIdentifier = getUserIdentifier(request)
    if (!checkRateLimit(userIdentifier, 10, 3600000)) { // 10 streams per hour
      return NextResponse.json(
        { error: 'Too many stream creation requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      stream_title,
      description = '',
      status = 'scheduled',
      start_time = '',
      end_time = '',
      chat_enabled = true,
      stream_quality = '1080p',
      tags = '',
      create_mux_stream = true
    } = body

    // Validate required fields
    if (!stream_title || stream_title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Stream title is required' },
        { status: 400 }
      )
    }

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

    // Validate stream quality
    const validQualities = ['720p', '1080p', '4k']
    if (stream_quality && !validQualities.includes(stream_quality)) {
      return NextResponse.json(
        { error: 'Invalid stream quality' },
        { status: 400 }
      )
    }

    let muxStreamData = null

    // Create MUX live stream if requested
    if (create_mux_stream) {
      try {
        muxStreamData = await createLiveStream({
          playbook_policy: ['public'],
          reduced_latency: true,
          test: process.env.NODE_ENV !== 'production'
        })
      } catch (muxError) {
        console.error('Error creating MUX stream:', muxError)
        // Continue without MUX stream - user can add it later
      }
    }

    // Create stream session in Cosmic CMS
    const streamData = {
      stream_title: stream_title.trim(),
      description: description.trim(),
      status,
      start_time,
      end_time,
      chat_enabled: Boolean(chat_enabled),
      stream_quality,
      tags: tags.trim()
    }

    const cosmicStream = await createStreamSession(streamData)

    // Update with MUX details if available
    if (muxStreamData) {
      try {
        await updateStreamSession(cosmicStream.id, {
          stream_key: muxStreamData.stream_key,
          mux_playback_id: muxStreamData.playback_ids[0]?.id || ''
        })
      } catch (updateError) {
        console.error('Error updating stream with MUX data:', updateError)
      }
    }

    // Return the created stream with MUX data
    return NextResponse.json({
      stream: cosmicStream,
      mux_data: muxStreamData,
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
    const { streamId, ...updates } = body

    if (!streamId) {
      return NextResponse.json(
        { error: 'Stream ID is required' },
        { status: 400 }
      )
    }

    // Filter out any invalid update fields
    const allowedFields = [
      'status',
      'viewer_count',
      'stream_key',
      'mux_playback_id',
      'recording_url'
    ]

    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updates[key]
        return obj
      }, {})

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid update fields provided' },
        { status: 400 }
      )
    }

    // Update stream session
    const updatedStream = await updateStreamSession(streamId, filteredUpdates)

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