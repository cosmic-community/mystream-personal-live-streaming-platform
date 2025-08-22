'use client'

import { useState, useEffect } from 'react'
import { getStreamSessions, createStreamSession, updateStreamSession, getStreamSettings } from '@/lib/cosmic'
import { createLiveStream } from '@/lib/mux'
import type { StreamSession, StreamSettings } from '@/types'
import { Plus, Calendar, Users, Clock, Video, Edit, Trash2, Settings, Play, Square, TrendingUp } from 'lucide-react'
import StreamCard from '@/components/StreamCard'
import StatsCard from '@/components/StatsCard'

interface StatsCardData {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function AdminStreamsPage() {
  const [streams, setStreams] = useState<StreamSession[]>([])
  const [settings, setSettings] = useState<StreamSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    stream_title: '',
    description: '',
    status: 'scheduled' as const,
    start_time: '',
    end_time: '',
    chat_enabled: true,
    stream_quality: '1080p' as const,
    tags: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [sessionsData, settingsData] = await Promise.all([
        getStreamSessions(),
        getStreamSettings()
      ])
      setStreams(sessionsData)
      setSettings(settingsData)
    } catch (error) {
      console.error('Error loading admin data:', error)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isCreating) return

    try {
      setIsCreating(true)
      setError(null)

      // Create MUX live stream
      const muxStream = await createLiveStream({
        reduced_latency: true,
        reconnect_window: 60
      })

      // Create stream session in Cosmic
      const streamData = {
        ...formData,
        status: formData.status,
        stream_quality: formData.stream_quality
      }

      const newStream = await createStreamSession(streamData)

      // Update with MUX data
      await updateStreamSession(newStream.id, {
        stream_key: muxStream.stream_key,
        mux_playback_id: muxStream.playback_ids[0]?.id || ''
      })

      // Reload data
      await loadData()
      setShowCreateModal(false)
      resetForm()
    } catch (error) {
      console.error('Error creating stream:', error)
      setError('Failed to create stream')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateStreamStatus = async (streamId: string, newStatus: string) => {
    try {
      await updateStreamSession(streamId, { status: newStatus })
      await loadData()
    } catch (error) {
      console.error('Error updating stream status:', error)
      setError('Failed to update stream status')
    }
  }

  const resetForm = () => {
    setFormData({
      stream_title: '',
      description: '',
      status: 'scheduled',
      start_time: '',
      end_time: '',
      chat_enabled: true,
      stream_quality: '1080p',
      tags: ''
    })
  }

  const getStreamStatusCounts = () => {
    const counts = streams.reduce((acc, stream) => {
      const status = stream.metadata?.status?.key || 'scheduled'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      scheduled: counts.scheduled || 0,
      live: counts.live || 0,
      ended: counts.ended || 0,
      private: counts.private || 0
    }
  }

  const getTotalViewers = () => {
    return streams.reduce((total, stream) => {
      return total + (stream.metadata?.viewer_count || 0)
    }, 0)
  }

  const statusCounts = getStreamStatusCounts()
  const totalViewers = getTotalViewers()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Stats cards data with proper typing
  const statsCards: StatsCardData[] = [
    {
      title: 'Total Streams',
      value: streams.length.toString(),
      icon: Video,
      trend: 'up' as const,
      trendValue: '+12%'
    },
    {
      title: 'Live Streams',
      value: statusCounts.live.toString(),
      icon: Play,
      trend: statusCounts.live > 0 ? 'up' as const : 'neutral' as const
    },
    {
      title: 'Scheduled',
      value: statusCounts.scheduled.toString(),
      icon: Calendar,
      trend: 'neutral' as const
    },
    {
      title: 'Total Viewers',
      value: totalViewers.toString(),
      icon: Users,
      trend: 'up' as const,
      trendValue: '+8%'
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stream Management</h1>
          <p className="text-muted-foreground mt-1">Manage your live streams and settings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Stream
          </button>
          <button className="btn-outline flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <StatsCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            trend={card.trend}
            trendValue={card.trendValue}
          />
        ))}
      </div>

      {/* Streams List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">All Streams</h2>
          <div className="text-sm text-muted-foreground">
            {streams.length} streams total
          </div>
        </div>

        {streams.length === 0 ? (
          <div className="text-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No streams yet</h3>
            <p className="text-muted-foreground mb-4">Create your first stream to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Stream
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                onEdit={(stream) => {
                  console.log('Edit stream:', stream)
                }}
                className="h-full"
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Stream Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create New Stream</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
                disabled={isCreating}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateStream} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Stream Title</label>
                <input
                  type="text"
                  value={formData.stream_title}
                  onChange={(e) => setFormData({...formData, stream_title: e.target.value})}
                  className="form-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-input w-full h-20 resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'scheduled'})}
                    className="form-input w-full"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Quality</label>
                  <select
                    value={formData.stream_quality}
                    onChange={(e) => setFormData({...formData, stream_quality: e.target.value as '1080p'})}
                    className="form-input w-full"
                  >
                    <option value="720p">720p HD</option>
                    <option value="1080p">1080p Full HD</option>
                    <option value="4k">4K Ultra HD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="form-input w-full"
                  placeholder="gaming, tutorial, live coding"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chat_enabled"
                  checked={formData.chat_enabled}
                  onChange={(e) => setFormData({...formData, chat_enabled: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="chat_enabled" className="text-sm">Enable chat</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-outline flex-1"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isCreating || !formData.stream_title.trim()}
                >
                  {isCreating ? 'Creating...' : 'Create Stream'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}