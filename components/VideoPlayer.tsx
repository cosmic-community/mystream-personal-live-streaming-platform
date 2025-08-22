'use client'

import { useEffect, useRef, useState } from 'react'
import MuxPlayer from '@mux/mux-player-react'
import type { MuxPlayerElement } from '@mux/mux-player-react'
import { Play, Pause, Volume2, VolumeX, Maximize2, Settings } from 'lucide-react'

interface VideoPlayerProps {
  playbackId: string
  title: string
  isLive: boolean
  onViewerCountChange?: (count: number) => void
  className?: string
}

export default function VideoPlayer({ 
  playbackId, 
  title, 
  isLive, 
  onViewerCountChange,
  className = "" 
}: VideoPlayerProps) {
  const playerRef = useRef<MuxPlayerElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [quality, setQuality] = useState('auto')
  const [isBuffering, setIsBuffering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-hide controls timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => {
      setVolume(player.volume)
      setIsMuted(player.muted)
    }
    const handleTimeUpdate = () => setCurrentTime(player.currentTime || 0)
    const handleDurationChange = () => setDuration(player.duration || 0)
    const handleWaiting = () => setIsBuffering(true)
    const handleCanPlay = () => setIsBuffering(false)
    const handleError = (e: any) => {
      console.error('Video player error:', e)
      setError('Failed to load video stream')
      setIsBuffering(false)
    }

    // Add event listeners
    player.addEventListener('play', handlePlay)
    player.addEventListener('pause', handlePause)
    player.addEventListener('volumechange', handleVolumeChange)
    player.addEventListener('timeupdate', handleTimeUpdate)
    player.addEventListener('durationchange', handleDurationChange)
    player.addEventListener('waiting', handleWaiting)
    player.addEventListener('canplay', handleCanPlay)
    player.addEventListener('error', handleError)

    return () => {
      player.removeEventListener('play', handlePlay)
      player.removeEventListener('pause', handlePause)
      player.removeEventListener('volumechange', handleVolumeChange)
      player.removeEventListener('timeupdate', handleTimeUpdate)
      player.removeEventListener('durationchange', handleDurationChange)
      player.removeEventListener('waiting', handleWaiting)
      player.removeEventListener('canplay', handleCanPlay)
      player.removeEventListener('error', handleError)
    }
  }, [])

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Auto-hide controls
  const resetControlsTimer = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }

  const togglePlayPause = () => {
    const player = playerRef.current
    if (!player) return

    if (isPlaying) {
      player.pause()
    } else {
      player.play()
    }
    resetControlsTimer()
  }

  const toggleMute = () => {
    const player = playerRef.current
    if (!player) return

    player.muted = !player.muted
    resetControlsTimer()
  }

  const handleVolumeChange = (newVolume: number) => {
    const player = playerRef.current
    if (!player) return

    player.volume = newVolume
    if (newVolume === 0) {
      player.muted = true
    } else if (player.muted) {
      player.muted = false
    }
  }

  const handleSeek = (newTime: number) => {
    const player = playerRef.current
    if (!player || isLive) return

    player.currentTime = newTime
    resetControlsTimer()
  }

  const toggleFullscreen = async () => {
    const player = playerRef.current
    if (!player) return

    try {
      if (!isFullscreen) {
        await player.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
    resetControlsTimer()
  }

  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-2">⚠️</div>
            <p className="text-white text-sm">{error}</p>
            <button 
              onClick={() => {
                setError(null)
                window.location.reload()
              }}
              className="mt-2 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Mux Player */}
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId}
        title={title}
        streamType={isLive ? 'live' : 'on-demand'}
        autoPlay={isLive}
        muted={false}
        loop={!isLive}
        className="w-full h-full"
        style={{ aspectRatio: '16/9' }}
      />

      {/* Loading indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-4 left-4 z-20">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            LIVE
          </div>
        </div>
      )}

      {/* Custom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-gradient-to-t from-black via-black/80 to-transparent p-4">
          {/* Progress bar (not shown for live streams) */}
          {!isLive && duration > 0 && (
            <div className="mb-4">
              <div 
                className="w-full h-1 bg-white/30 rounded-full cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const pos = (e.clientX - rect.left) / rect.width
                  handleSeek(pos * duration)
                }}
              >
                <div 
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlayPause}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
                <div className="w-20 h-1 bg-white/30 rounded-full cursor-pointer">
                  <div 
                    className="h-full bg-white rounded-full"
                    style={{ width: `${volume * 100}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Time display */}
              {!isLive && (
                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Quality selector placeholder */}
              <button className="text-white hover:text-gray-300 transition-colors">
                <Settings className="h-5 w-5" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}