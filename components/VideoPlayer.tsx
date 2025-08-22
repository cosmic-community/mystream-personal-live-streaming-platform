'use client'

import { useEffect, useRef, useState } from 'react'
import MuxPlayer from '@mux/mux-player-react'
import type { MuxPlayerRefAttributes } from '@mux/mux-player-react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'

interface VideoPlayerProps {
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Auto-hide controls timer
  const controlsTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (showControls) {
      clearTimeout(controlsTimerRef.current)
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
    
    return () => clearTimeout(controlsTimerRef.current)
  }, [showControls])

  const handleMouseMove = () => {
    setShowControls(true)
  }

  const togglePlay = () => {
    if (!playerRef.current) return
    
    if (isPlaying) {
      playerRef.current.pause()
    } else {
      playerRef.current.play()
    }
  }

  const toggleMute = () => {
    if (!playerRef.current) return
    
    playerRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    if (!playerRef.current) return

    if (!isFullscreen) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleVolumeChange = () => {
    if (playerRef.current) {
      setIsMuted(playerRef.current.muted || false)
    }
  }

  const handleError = () => {
    setError('Failed to load video stream')
  }

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement)
  }

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Simulate viewer count updates for live streams
  useEffect(() => {
    if (isLive && onViewerCountChange) {
      const interval = setInterval(() => {
        const count = Math.floor(Math.random() * 100) + 10
        onViewerCountChange(count)
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [isLive, onViewerCountChange])

  if (error) {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Stream Error</h3>
          <p className="text-sm opacity-75">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-4 px-4 py-2 bg-white text-gray-900 rounded-md text-sm hover:bg-gray-100 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!playbackId) {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">📺</div>
          <h3 className="text-lg font-medium mb-2">No Stream Available</h3>
          <p className="text-sm opacity-75">This stream is not ready yet</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="relative w-full h-full bg-black group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId}
        streamType={isLive ? 'live' : 'on-demand'}
        title={title}
        autoPlay={false}
        muted={false}
        className="w-full h-full"
        onPlay={handlePlay}
        onPause={handlePause}
        onVolumeChange={handleVolumeChange}
        onError={handleError}
        style={{
          '--controls': 'none',
          '--media-object-fit': 'contain',
          '--media-object-position': 'center'
        } as any}
      />

      {/* Live Indicator */}
      {isLive && (
        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            LIVE
          </div>
        </div>
      )}

      {/* Custom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between text-white">
          {/* Left Controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlay}
              className="hover:text-blue-400 transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>

            <button
              onClick={toggleMute}
              className="hover:text-blue-400 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            <div className="text-sm">
              <span className="font-medium">{title}</span>
              {isLive && <span className="ml-2 opacity-75">• Live Stream</span>}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleFullscreen}
              className="hover:text-blue-400 transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {!isPlaying && !error && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="bg-white/20 hover:bg-white/30 transition-colors rounded-full p-4"
            title="Play"
          >
            <Play className="h-12 w-12 text-white" fill="currentColor" />
          </button>
        </div>
      )}
    </div>
  )
}