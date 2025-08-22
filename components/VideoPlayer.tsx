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
    const interval = setInterval(() => {
      const viewerCount = Math.floor(Math.random() * 100) + 1
      onViewerCountChange?.(viewerCount)
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [playbackId, onViewerCountChange])

  const handleLoadStart = () => {
    setIsLoading(true)
    setError(null)
  }

  const handleLoadedData = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setError('Failed to load video stream')
    setIsLoading(false)
  }

  if (!playbackId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">📺</div>
          <h3 className="text-lg font-medium">No stream available</h3>
          <p className="text-sm opacity-75">Playback ID not configured</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4 mx-auto"></div>
            <p className="text-sm">Loading stream...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white z-10">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium mb-2">Stream Error</h3>
            <p className="text-sm opacity-75">{error}</p>
          </div>
        </div>
      )}

      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId}
        streamType={isLive ? 'live' : 'on-demand'}
        title={title}
        autoPlay={isLive}
        muted={false}
        style={{ width: '100%', height: '100%' }}
        onLoadStart={handleLoadStart}
        onLoadedData={handleLoadedData}
        onError={handleError}
      />

      {/* Live Indicator */}
      {isLive && !error && (
        <div className="absolute top-4 left-4 z-20">
          <div className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
        </div>
      )}
    </div>
  )
}