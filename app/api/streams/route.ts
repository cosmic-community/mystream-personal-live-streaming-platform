import { NextRequest, NextResponse } from 'next/server'
import { getStreamSessions, createStreamSession, updateStreamSession } from '@/lib/cosmic'
import { checkRateLimit, getUserIdentifier } from '@/lib/auth'
import { createLiveStream } from '@/lib/mux'
import type { StreamSession } from '@/types'

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
    // Rate limiting
    const userIdentifier = getUserIdentifier(request)
    if (!checkRateLimit(userIdentifier, 5, 60000)) { // 5 streams per minute
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before creating another stream.' },
        { status: 429 }
      )
    }

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
    if (!stream_title) {
      return NextResponse.json(
        { error: 'Stream title is required' },
        { status: 400 }
      )
    }

    // Create MUX live stream if going live immediately
    let muxData: { streamKey?: string; playbackId?: string } = {}
    
    if (status === 'live') {
      try {
        // Create live stream with correct policy parameter
        const muxStream = await createLiveStream({
          playback_policy: ['public'],
          new_asset_settings: {
            playback_policy: ['public']
          }
        })

        muxData = {
          streamKey: muxStream.stream_key,
          playbackId: muxStream.playback_ids?.[0]?.id
        }
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
      description,
      status,
      start_time,
      end_time,
      chat_enabled,
      stream_quality,
      tags,
      ...muxData
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