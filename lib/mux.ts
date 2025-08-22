import Mux from '@mux/mux-node'
import type { MuxPlaybackId, MuxLiveStreamCreateParams, MuxAssetInput } from '@/types'

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID as string,
  tokenSecret: process.env.MUX_TOKEN_SECRET as string,
})

// Live Streaming
export async function createLiveStream(options: {
  reducedLatency?: boolean
  test?: boolean
  reconnectWindow?: number
}) {
  try {
    const createParams: MuxLiveStreamCreateParams = {
      reduced_latency: options.reducedLatency,
      test: options.test,
      reconnect_window: options.reconnectWindow
    }

    const liveStream = await mux.video.liveStreams.create(createParams)

    return {
      id: liveStream.id as string,
      stream_key: liveStream.stream_key as string,
      playback_ids: (liveStream.playback_ids || []).map(p => ({
        id: p.id,
        policy: p.policy as 'public' | 'signed' | 'drm'
      })) as MuxPlaybackId[],
      status: liveStream.status as string
    }
  } catch (error) {
    console.error('Error creating live stream:', error)
    throw new Error('Failed to create live stream')
  }
}

export async function getLiveStream(streamId: string) {
  try {
    const liveStream = await mux.video.liveStreams.retrieve(streamId)

    return {
      id: liveStream.id as string,
      stream_key: liveStream.stream_key as string,
      playback_ids: (liveStream.playbook_ids || []).map(p => ({
        id: p.id,
        policy: p.policy as 'public' | 'signed' | 'drm'
      })) as MuxPlaybackId[],
      status: liveStream.status as string,
      created_at: liveStream.created_at as string
    }
  } catch (error) {
    console.error('Error fetching live stream:', error)
    throw new Error('Failed to fetch live stream')
  }
}

export async function deleteLiveStream(streamId: string) {
  try {
    await mux.video.liveStreams.delete(streamId)
    return { success: true }
  } catch (error) {
    console.error('Error deleting live stream:', error)
    throw new Error('Failed to delete live stream')
  }
}

// Video Assets
export async function createAsset(inputUrl: string) {
  try {
    const asset = await mux.video.assets.create({
      input: [{ url: inputUrl }] as MuxAssetInput[]
    })

    return {
      id: asset.id as string,
      status: asset.status as string,
      playback_ids: (asset.playback_ids || []).map(p => ({
        id: p.id,
        policy: p.policy as 'public' | 'signed' | 'drm'
      })) as MuxPlaybackId[],
      duration: asset.duration as number | undefined,
      created_at: asset.created_at as string
    }
  } catch (error) {
    console.error('Error creating asset:', error)
    throw new Error('Failed to create asset')
  }
}

export async function getAsset(assetId: string) {
  try {
    const asset = await mux.video.assets.retrieve(assetId)

    return {
      id: asset.id as string,
      status: asset.status as string,
      playback_ids: (asset.playback_ids || []).map(p => ({
        id: p.id,
        policy: p.policy as 'public' | 'signed' | 'drm'
      })) as MuxPlaybackId[],
      duration: asset.duration as number | undefined,
      created_at: asset.created_at as string
    }
  } catch (error) {
    console.error('Error fetching asset:', error)
    throw new Error('Failed to fetch asset')
  }
}

export async function deleteAsset(assetId: string) {
  try {
    await mux.video.assets.delete(assetId)
    return { success: true }
  } catch (error) {
    console.error('Error deleting asset:', error)
    throw new Error('Failed to delete asset')
  }
}

// Metrics and Analytics
export async function getMetrics(metricId: string, params?: any) {
  try {
    const metrics = await mux.data.metrics.get(metricId, params)
    
    return {
      data: metrics.data,
      total_row_count: metrics.total_row_count,
      timeframe: metrics.timeframe
    }
  } catch (error) {
    console.error('Error fetching metrics:', error)
    throw new Error('Failed to fetch metrics')
  }
}

// Helper functions
export function getPlaybackUrl(playbackId: string, token?: string): string {
  const baseUrl = 'https://stream.mux.com'
  if (token) {
    return `${baseUrl}/${playbackId}.m3u8?token=${token}`
  }
  return `${baseUrl}/${playbackId}.m3u8`
}

export function getThumbnailUrl(playbackId: string, options: {
  time?: number
  width?: number
  height?: number
  fit_mode?: 'preserve' | 'crop' | 'pad'
} = {}): string {
  const { time = 1, width = 1280, height = 720, fit_mode = 'crop' } = options
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=${width}&height=${height}&fit_mode=${fit_mode}`
}

export function isValidPlaybackId(playbackId: string): boolean {
  return typeof playbackId === 'string' && playbackId.length > 0
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}