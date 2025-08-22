'use client'

import { useEffect, useRef, useState } from 'react'
import { getMuxPlayerUrl, isValidPlaybackId, getMuxThumbnailUrl } from '@/lib/mux'
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !playbackId || !isValidPlaybackId(playbackId)) {
      setError('Invalid playback ID')
      setIsLoading(false)
      return
    }

    // Set up video source
    const videoUrl = getMuxPlayerUrl(playbackId, {
      autoplay: isLive,
      muted: isLive, // Auto-mute live streams to allow autoplay
      controls: false // We're using custom controls
    })

    video.src = videoUrl

    // Event listeners
    const handleLoadStart = () => setIsLoading(true)
    const handleLoadedData = () => {
      setIsLoading(false)
      setError(null)
    }
    const handleError = () => {
      setIsLoading(false)
      setError('Failed to load video')
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration || 0)
    const handleVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }

    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('error', handleError)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('volumechange', handleVolumeChange)

    // Auto-play live streams if supported
    if (isLive && video.autoplay) {
      video.play().catch(() => {
        // Autoplay failed, user interaction required
        console.log('Autoplay failed - user interaction required')
      })
    }

    return () => {
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleError)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('volumechange', handleVolumeChange)
    }
  }, [playbackId, isLive])

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
  }

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current
    if (!video) return

    video.volume = newVolume
    if (newVolume > 0 && video.muted) {
      video.muted = false
    }
  }

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement
    if (!container) return

    if (isFullscreen) {
      document.exitFullscreen()
    } else {
      container.requestFullscreen()
    }
  }

  const handleSeek = (newTime: number) => {
    const video = videoRef.current
    if (!video || isLive) return // No seeking in live streams

    video.currentTime = newTime
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Video Error</h3>
          <p className="text-sm opacity-75">{error}</p>
        </div>
      </div>
    )
  }

  if (!playbackId || !isValidPlaybackId(playbackId)) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">📺</div>
          <h3 className="text-lg font-medium mb-2">No Video Available</h3>
          <p className="text-sm opacity-75">Stream not configured</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-black group">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay={isLive}
        muted={isLive}
        poster={getMuxThumbnailUrl(playbackId, { width: 1280, height: 720 })}
        aria-label={title}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="flex flex-col items-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Custom Controls Overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Click to Play/Pause Overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          {!isPlaying && !isLoading && (
            <div className="w-20 h-20 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <Play className="h-8 w-8 text-white ml-1" />
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-gray-300 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>

            {/* Progress Bar (only for non-live videos) */}
            {!isLive && duration > 0 && (
              <div className="flex-1 flex items-center gap-2">
                <span className="text-white text-sm min-w-max">
                  {formatTime(currentTime)}
                </span>
                <div
                  className="flex-1 h-1 bg-gray-600 rounded cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const percentage = x / rect.width
                    handleSeek(percentage * duration)
                  }}
                >
                  <div
                    className="h-full bg-red-500 rounded"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                <span className="text-white text-sm min-w-max">
                  {formatTime(duration)}
                </span>
              </div>
            )}

            {/* Live Indicator */}
            {isLive && (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">LIVE</span>
                </div>
              </div>
            )}

            {/* Volume Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-gray-300 transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? 
                  <VolumeX className="h-5 w-5" /> : 
                  <Volume2 className="h-5 w-5" />
                }
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 accent-red-500"
              />
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-300 transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? 
                <Minimize className="h-5 w-5" /> : 
                <Maximize className="h-5 w-5" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Stream Info Overlay */}
      {isLive && (
        <div className="absolute top-4 left-4 right-4">
          <div className="flex justify-between items-start">
            <div className="bg-black bg-opacity-50 rounded px-3 py-2">
              <h2 className="text-white font-medium text-lg">{title}</h2>
            </div>
            <div className="bg-black bg-opacity-50 rounded px-3 py-2">
              <div className="text-white text-sm">
                👁️ {onViewerCountChange ? 'Live viewers' : ''}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}