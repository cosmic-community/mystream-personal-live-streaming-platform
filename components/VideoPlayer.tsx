'use client'

import { useEffect, useRef, useState } from 'react'
import MuxPlayer from '@mux/mux-player-react'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react'

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
  const playerRef = useRef<HTMLMediaElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleError = () => {
      setError('Failed to load video stream')
      setIsLoading(false)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => {
      setVolume(player.volume)
      setIsMuted(player.muted)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(player.currentTime)
    }

    const handleDurationChange = () => {
      setDuration(player.duration || 0)
    }

    player.addEventListener('loadstart', handleLoadStart)
    player.addEventListener('canplay', handleCanPlay)
    player.addEventListener('error', handleError)
    player.addEventListener('play', handlePlay)
    player.addEventListener('pause', handlePause)
    player.addEventListener('volumechange', handleVolumeChange)
    player.addEventListener('timeupdate', handleTimeUpdate)
    player.addEventListener('durationchange', handleDurationChange)

    return () => {
      player.removeEventListener('loadstart', handleLoadStart)
      player.removeEventListener('canplay', handleCanPlay)
      player.removeEventListener('error', handleError)
      player.removeEventListener('play', handlePlay)
      player.removeEventListener('pause', handlePause)
      player.removeEventListener('volumechange', handleVolumeChange)
      player.removeEventListener('timeupdate', handleTimeUpdate)
      player.removeEventListener('durationchange', handleDurationChange)
    }
  }, [])

  const togglePlayPause = () => {
    const player = playerRef.current
    if (!player) return

    if (isPlaying) {
      player.pause()
    } else {
      player.play()
    }
  }

  const toggleMute = () => {
    const player = playerRef.current
    if (!player) return

    player.muted = !player.muted
  }

  const handleVolumeChange = (newVolume: number) => {
    const player = playerRef.current
    if (!player) return

    player.volume = newVolume
    setVolume(newVolume)
  }

  const handleSeek = (newTime: number) => {
    const player = playerRef.current
    if (!player || isLive) return

    player.currentTime = newTime
  }

  const toggleFullscreen = () => {
    const player = playerRef.current
    if (!player) return

    if (!isFullscreen) {
      if (player.requestFullscreen) {
        player.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Stream Error</h3>
          <p className="text-sm opacity-75">{error}</p>
        </div>
      </div>
    )
  }

  if (!playbackId) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">📺</div>
          <h3 className="text-lg font-medium mb-2">No Stream Available</h3>
          <p className="text-sm opacity-75">Stream is not configured</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-black group">
      {/* Mux Player */}
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId}
        streamType={isLive ? 'live' : 'on-demand'}
        title={title}
        autoPlay={isLive}
        muted={false}
        controls={false}
        className="w-full h-full"
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={() => setError('Failed to load stream')}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="flex flex-col items-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-sm">Loading stream...</p>
          </div>
        </div>
      )}

      {/* Live Indicator */}
      {isLive && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>LIVE</span>
        </div>
      )}

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center space-x-4">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="text-white hover:text-gray-300 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>

          {/* Progress Bar (only for VOD) */}
          {!isLive && duration > 0 && (
            <div className="flex-1 flex items-center space-x-2">
              <span className="text-white text-sm">{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-gray-600 rounded cursor-pointer">
                <div 
                  className="h-full bg-white rounded"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const clickX = e.clientX - rect.left
                    const newTime = (clickX / rect.width) * duration
                    handleSeek(newTime)
                  }}
                ></div>
              </div>
              <span className="text-white text-sm">{formatTime(duration)}</span>
            </div>
          )}

          {/* Volume Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <div className="w-20 h-1 bg-gray-600 rounded cursor-pointer">
              <div 
                className="h-full bg-white rounded"
                style={{ width: `${volume * 100}%` }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const clickX = e.clientX - rect.left
                  const newVolume = clickX / rect.width
                  handleVolumeChange(Math.max(0, Math.min(1, newVolume)))
                }}
              ></div>
            </div>
          </div>

          {/* Settings Button */}
          <button className="text-white hover:text-gray-300 transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stream Title Overlay */}
      <div className="absolute top-4 right-4 max-w-md">
        <h2 className="text-white text-lg font-medium bg-black/50 px-3 py-2 rounded backdrop-blur-sm">
          {title}
        </h2>
      </div>
    </div>
  )
}