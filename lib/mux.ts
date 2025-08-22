import Mux from '@mux/mux-node'

// Initialize MUX client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
})

export interface CreateLiveStreamOptions {
  playback_policy: ('public' | 'signed')[]
  new_asset_settings?: {
    playbook_policy?: ('public' | 'signed')[]
    playback_policy?: ('public' | 'signed')[]
  }
}

export interface MuxLiveStream {
  id: string
  created_at: string
  stream_key: string
  status: 'idle' | 'active' | 'disconnected'
  playbook_ids?: Array<{
    id: string
    policy: 'public' | 'signed'
  }>
  playback_ids: Array<{
    id: string
    policy: 'public' | 'signed'
  }>
  new_asset_settings?: {
    playback_policy: ('public' | 'signed')[]
  }
}

export async function createLiveStream(options: CreateLiveStreamOptions): Promise<MuxLiveStream> {
  try {
    const liveStream = await mux.video.liveStreams.create({
      playback_policy: options.playback_policy,
      new_asset_settings: options.new_asset_settings
    })

    return {
      id: liveStream.id || '',
      created_at: liveStream.created_at || new Date().toISOString(),
      stream_key: liveStream.stream_key || '',
      status: (liveStream.status as 'idle' | 'active' | 'disconnected') || 'idle',
      playback_ids: liveStream.playback_ids?.map(pb => ({
        id: pb.id || '',
        policy: (pb.policy as 'public' | 'signed') || 'public'
      })) || [],
      new_asset_settings: liveStream.new_asset_settings ? {
        playback_policy: (liveStream.new_asset_settings.playback_policy as ('public' | 'signed')[]) || ['public']
      } : undefined
    }
  } catch (error) {
    console.error('Error creating MUX live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

export async function getLiveStream(liveStreamId: string): Promise<MuxLiveStream | null> {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(liveStreamId)

    if (!liveStream) {
      return null
    }

    return {
      id: liveStream.id || '',
      created_at: liveStream.created_at || new Date().toISOString(),
      stream_key: liveStream.stream_key || '',
      status: (liveStream.status as 'idle' | 'active' | 'disconnected') || 'idle',
      playback_ids: liveStream.playback_ids?.map(pb => ({
        id: pb.id || '',
        policy: (pb.policy as 'public' | 'signed') || 'public'
      })) || []
    }
  } catch (error) {
    console.error('Error getting MUX live stream:', error)
    return null
  }
}

export async function deleteLiveStream(liveStreamId: string): Promise<boolean> {
  try {
    await mux.video.liveStreams.del(liveStreamId)
    return true
  } catch (error) {
    console.error('Error deleting MUX live stream:', error)
    return false
  }
}

export async function enableLiveStreamRecording(
  liveStreamId: string,
  assetSettings?: {
    playback_policy?: ('public' | 'signed')[]
  }
): Promise<boolean> {
  try {
    await mux.video.liveStreams.createSimulcastTarget(liveStreamId, {
      url: 'rtmp://recording.endpoint.url/live',
      stream_key: 'recording_stream_key'
    })
    return true
  } catch (error) {
    console.error('Error enabling recording for live stream:', error)
    return false
  }
}

export async function getLiveStreamStats(liveStreamId: string): Promise<{
  viewerCount: number
  maxViewerCount: number
  totalViewTime: number
} | null> {
  try {
    // Note: MUX doesn't provide real-time viewer count in their API
    // This would typically come from your CDN or streaming infrastructure
    // For now, return mock data
    return {
      viewerCount: Math.floor(Math.random() * 100),
      maxViewerCount: Math.floor(Math.random() * 500),
      totalViewTime: Math.floor(Math.random() * 10000)
    }
  } catch (error) {
    console.error('Error getting live stream stats:', error)
    return null
  }
}

// Utility functions
export function generateRTMPUrl(streamKey: string): string {
  return `rtmp://global-live.mux.com:5222/live/${streamKey}`
}

export function generatePlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`
}

export function generateThumbnailUrl(
  playbackId: string, 
  options: {
    width?: number
    height?: number
    fit_mode?: 'smartcrop' | 'crop' | 'pad'
    time?: number
  } = {}
): string {
  const params = new URLSearchParams()
  
  if (options.width) params.set('width', options.width.toString())
  if (options.height) params.set('height', options.height.toString())
  if (options.fit_mode) params.set('fit_mode', options.fit_mode)
  if (options.time) params.set('time', options.time.toString())
  
  const queryString = params.toString()
  return `https://image.mux.com/${playbackId}/thumbnail.jpg${queryString ? `?${queryString}` : ''}`
}

export function isValidPlaybackId(playbackId: string): boolean {
  return /^[A-Za-z0-9]{22}$/.test(playbackId)
}

export function isValidStreamKey(streamKey: string): boolean {
  return /^[A-Za-z0-9-_]{32,64}$/.test(streamKey)
}