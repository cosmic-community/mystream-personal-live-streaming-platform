'use client'

import { useEffect, useRef, useState } from 'react'
import MuxPlayer from '@mux/mux-player-react'
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react'

export interface VideoPlayerProps {
  playbackId: string
  title: string
  isLive: boolean
  onViewerCountChange?: (count: number) => void
}

export default function VideoPlayer({ 
  playbackId, 
  title, 
  isLive, 
  onViewerCountChange 
}: VideoPlayerProps) {
  const playerRef = useRef<MuxPlayerRefAttributes>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!playbackId) {
      setError('No playback ID provided')
      setIsLoading(false)
      return
    }

    // Simulate viewer count updates for demo purposes
    // In a real implementation, this would come from your streaming service
    if (isLive && onViewerCountChange) {
      const interval = setInterval(() => {
        const randomCount = Math.floor(Math.random() * 100) + 1
        onViewerCountChange(randomCount)
      }, 10000) // Update every 10 seconds

      return () => clearInterval(interval)
    }
  }, [playbackId, isLive, onViewerCountChange])

  const handleLoadStart = () => {
    setIsLoading(true)
    setError(null)
  }

  const handleCanPlay = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setError('Failed to load video stream')
    setIsLoading(false)
  }

  if (!playbackId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">📺</div>
          <h3 className="text-lg font-medium">No Stream Available</h3>
          <p className="text-sm opacity-75">Playback ID not configured</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium">Stream Error</h3>
          <p className="text-sm opacity-75">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-white text-gray-900 rounded hover:bg-gray-100 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-sm">Loading stream...</p>
          </div>
        </div>
      )}

      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId}
        streamType={isLive ? 'live' : 'on-demand'}
        title={title}
        poster={isLive ? undefined : `https://image.mux.com/${playbackId}/thumbnail.jpg?width=1280&height=720&fit_mode=smartcrop`}
        autoPlay={isLive}
        muted={false}
        controls
        style={{ 
          width: '100%', 
          height: '100%',
          '--controls': 'rgba(0, 0, 0, 0.7)',
          '--media-object-fit': 'contain',
          '--media-object-position': 'center',
        } as any}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
      />

      {/* Live Indicator Overlay */}
      {isLive && (
        <div className="absolute top-4 left-4 z-20">
          <div className="flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
        </div>
      )}

      {/* Stream Quality Indicator */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="bg-black/50 text-white px-2 py-1 rounded text-xs">
          {isLive ? 'Live Stream' : 'On Demand'}
        </div>
      </div>
    </div>
  )
}