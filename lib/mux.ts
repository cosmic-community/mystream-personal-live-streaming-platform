import Mux from '@mux/mux-node'

// Initialize Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!
})

export interface MuxLiveStream {
  id: string
  stream_key: string
  playback_ids: Array<{
    id: string
    policy: 'public' | 'signed'
  }>
  status: 'idle' | 'active' | 'disabled'
  created_at: string
  reconnect_window: number
  max_continuous_duration: number
}

export interface CreateLiveStreamOptions {
  playback_policy?: 'public' | 'signed'
  new_asset_settings?: {
    playback_policy: 'public' | 'signed'
  }
  reconnect_window?: number
  max_continuous_duration?: number
}

export async function createLiveStream(options: CreateLiveStreamOptions = {}): Promise<MuxLiveStream> {
  try {
    const liveStream = await mux.video.liveStreams.create({
      playback_policy: options.playback_policy || 'public',
      new_asset_settings: options.new_asset_settings || {
        playbook_policy: 'public'
      },
      reconnect_window: options.reconnect_window || 60,
      max_continuous_duration: options.max_continuous_duration || 43200 // 12 hours
    })

    return {
      id: liveStream.id || '',
      stream_key: liveStream.stream_key || '',
      playback_ids: liveStream.playback_ids || [],
      status: liveStream.status || 'idle',
      created_at: liveStream.created_at || '',
      reconnect_window: liveStream.reconnect_window || 60,
      max_continuous_duration: liveStream.max_continuous_duration || 43200
    }
  } catch (error) {
    console.error('Error creating Mux live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

export async function getLiveStream(streamId: string): Promise<MuxLiveStream | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId)
    
    if (!liveStream) {
      return null
    }

    return {
      id: liveStream.id || '',
      stream_key: liveStream.stream_key || '',
      playback_ids: liveStream.playback_ids || [],
      status: liveStream.status || 'idle',
      created_at: liveStream.created_at || '',
      reconnect_window: liveStream.reconnect_window || 60,
      max_continuous_duration: liveStream.max_continuous_duration || 43200
    }
  } catch (error) {
    console.error('Error fetching Mux live stream:', error)
    return null
  }
}

export async function deleteLiveStream(streamId: string): Promise<boolean> {
  try {
    await mux.video.liveStreams.del(streamId)
    return true
  } catch (error) {
    console.error('Error deleting Mux live stream:', error)
    return false
  }
}

export async function getPlaybackUrl(playbackId: string): Promise<string> {
  return `https://stream.mux.com/${playbackId}.m3u8`
}

export async function createSignedPlaybackUrl(playbackId: string, expiresIn: number = 3600): Promise<string> {
  try {
    const signedUrl = await mux.video.signingKeys.signPlaybackId(playbackId, {
      expires_in: expiresIn
    })
    return signedUrl
  } catch (error) {
    console.error('Error creating signed playback URL:', error)
    return getPlaybackUrl(playbackId) // Fallback to regular URL
  }
}

// Helper function to get the primary playback ID
export function getPrimaryPlaybackId(liveStream: MuxLiveStream): string | null {
  const playbackIds = liveStream.playback_ids
  if (!playbackIds || playbackIds.length === 0) {
    return null
  }
  
  // Return the first playback ID
  return playbackIds[0]?.id || null
}

// Helper function to check if stream is active
export function isStreamActive(liveStream: MuxLiveStream): boolean {
  return liveStream.status === 'active'
}

// Helper function to get stream status display text
export function getStreamStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'idle': 'Ready to Stream',
    'active': 'Live',
    'disabled': 'Disabled'
  }
  return statusMap[status] || status
}

// Helper function to get stream status color
export function getStreamStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'idle': 'text-yellow-500',
    'active': 'text-red-500',
    'disabled': 'text-gray-500'
  }
  return colorMap[status] || 'text-gray-500'
}