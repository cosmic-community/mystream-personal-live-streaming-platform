import { NextRequest, NextResponse } from 'next/server'
import { createStreamSession, getStreamSessions, updateStreamSession } from '@/lib/cosmic'
import { createLiveStream } from '@/lib/mux'
import { checkRateLimit, getUserIdentifier } from '@/lib/auth'
import type { StreamSession } from '@/types'

// Helper interface for Mux live stream response
interface MuxLiveStream {
  id: string
  status: string
  stream_key: string
  playback_ids: Array<{ id: string; policy: 'public' | 'signed' }>
  created_at: string
}

// Helper function to convert Mux stream to our StreamSession format
function convertMuxStreamToStreamSession(muxStream: MuxLiveStream, streamData: any): Partial<StreamSession> {
  const playbackId = muxStream.playback_ids?.[0]?.id || ''
  
  return {
    id: muxStream.id,
    title: streamData.stream_title,
    slug: streamData.stream_title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    type: 'stream-sessions' as const,
    created_at: muxStream.created_at,
    modified_at: muxStream.created_at,
    metadata: {
      stream_title: streamData.stream_title,
      description: streamData.description || '',
      status: { key: 'scheduled', value: 'Scheduled' },
      stream_key: muxStream.stream_key,
      mux_playback_id: playbackId,
      start_time: streamData.start_time || '',
      end_time: streamData.end_time || '',
      viewer_count: 0,
      chat_enabled: streamData.chat_enabled || false,
      stream_quality: streamData.stream_quality ? 
        { key: streamData.stream_quality, value: `${streamData.stream_quality} HD` } : 
        { key: '1080p', value: '1080p Full HD' },
      tags: streamData.tags || ''
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const streams = await getStreamSessions()
    return NextResponse.json({ streams, total: streams.length })
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
    if (!checkRateLimit(userIdentifier, 5, 300000)) { // 5 streams per 5 minutes
      return NextResponse.json(
        { error: 'Too many stream creation attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      stream_title,
      description,
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

    if (stream_title.length > 100) {
      return NextResponse.json(
        { error: 'Stream title must be less than 100 characters' },
        { status: 400 }
      )
    }

    try {
      // Create live stream in MUX
      const muxStream = await createLiveStream({
        playback_policy: ['public'] as ('public' | 'signed')[],
        new_asset_settings: {
          playback_policy: ['public'] as ('public' | 'signed')[]
        }
      })

      if (!muxStream || !muxStream.id) {
        throw new Error('Invalid response from MUX API')
      }

      // Convert MUX stream data to our format
      const streamSessionData = convertMuxStreamToStreamSession(muxStream, {
        stream_title,
        description,
        start_time,
        end_time,
        chat_enabled,
        stream_quality,
        tags
      })

      // Create stream session in Cosmic CMS
      const streamSession = await createStreamSession({
        stream_title,
        description: description || '',
        status: 'scheduled',
        start_time: start_time || '',
        end_time: end_time || '',
        chat_enabled: chat_enabled,
        stream_quality: stream_quality,
        tags: tags || ''
      })

      // Update the stream session with MUX details
      const updatedStream = await updateStreamSession(streamSession.id, {
        stream_key: muxStream.stream_key,
        mux_playback_id: muxStream.playback_ids?.[0]?.id || ''
      })

      return NextResponse.json({
        stream: updatedStream,
        mux_data: {
          stream_key: muxStream.stream_key,
          playback_id: muxStream.playback_ids?.[0]?.id,
          stream_url: `rtmp://global-live.mux.com:5222/live/${muxStream.stream_key}`
        },
        success: 'Stream created successfully'
      }, { status: 201 })

    } catch (muxError) {
      console.error('MUX API Error:', muxError)
      
      // Fallback: Create stream session without MUX integration
      const streamSession = await createStreamSession({
        stream_title,
        description: description || '',
        status: 'scheduled',
        start_time: start_time || '',
        end_time: end_time || '',
        chat_enabled: chat_enabled,
        stream_quality: stream_quality,
        tags: tags || ''
      })

      return NextResponse.json({
        stream: streamSession,
        warning: 'Stream created without live streaming capabilities. MUX integration failed.',
        success: 'Stream created successfully'
      }, { status: 201 })
    }

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
    const { id, status, viewer_count } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Stream ID is required' },
        { status: 400 }
      )
    }

    const updates: any = {}
    if (status) updates.status = status
    if (typeof viewer_count === 'number') updates.viewer_count = viewer_count

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