'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit, Play, Square, Users, Clock } from 'lucide-react'
import { getStreamSessions, createStreamSession, updateStreamSession } from '@/lib/cosmic'
import { createLiveStream, deleteLiveStream } from '@/lib/mux'
import type { StreamSession, CreateStreamFormData } from '@/types'
import StatsCard from '@/components/StatsCard'
import StreamCard from '@/components/StreamCard'

export default function StreamsAdminPage() {
  const [streams, setStreams] = useState<StreamSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<CreateStreamFormData>({
    stream_title: '',
    description: '',
    status: 'scheduled',
    start_time: '',
    end_time: '',
    chat_enabled: true,
    stream_quality: '1080p',
    tags: ''
  })

  // Load streams on component mount
  useEffect(() => {
    loadStreams()
  }, [])

  const loadStreams = async () => {
    try {
      setIsLoading(true)
      const streamData = await getStreamSessions()
      setStreams(streamData)
    } catch (error) {
      console.error('Error loading streams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.stream_title.trim()) {
      alert('Stream title is required')
      return
    }

    try {
      setIsCreating(true)
      
      // Create MUX live stream
      const muxStream = await createLiveStream({
        playback_policy: ['public'],
        reduced_latency: true,
        test: false
      })

      // Create stream session in Cosmic
      const streamData = {
        stream_title: formData.stream_title.trim(),
        description: formData.description?.trim() || '',
        status: formData.status,
        start_time: formData.start_time || '',
        end_time: formData.end_time || '',
        chat_enabled: formData.chat_enabled || false,
        stream_quality: formData.stream_quality || '1080p',
        tags: formData.tags?.trim() || ''
      }

      const newStream = await createStreamSession(streamData)
      
      // Update with MUX details
      await updateStreamSession(newStream.id, {
        stream_key: muxStream.stream_key,
        mux_playback_id: muxStream.playback_ids[0]?.id || ''
      })

      // Reset form and reload streams
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
      setShowCreateForm(false)
      await loadStreams()
      
    } catch (error) {
      console.error('Error creating stream:', error)
      alert('Failed to create stream. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteStream = async (stream: StreamSession) => {
    if (!confirm(`Are you sure you want to delete "${stream.metadata?.stream_title}"?`)) {
      return
    }

    try {
      // Delete from MUX if we have the stream key
      if (stream.metadata?.mux_playback_id) {
        await deleteLiveStream(stream.id)
      }

      // Remove from streams list optimistically
      setStreams(prev => prev.filter(s => s.id !== stream.id))
      
      alert('Stream deleted successfully')
    } catch (error) {
      console.error('Error deleting stream:', error)
      alert('Failed to delete stream. Please try again.')
      // Reload streams to restore state
      await loadStreams()
    }
  }

  const handleStatusChange = async (stream: StreamSession, newStatus: string) => {
    try {
      await updateStreamSession(stream.id, { status: newStatus })
      
      // Update local state
      setStreams(prev => prev.map(s => 
        s.id === stream.id 
          ? { ...s, metadata: { ...s.metadata, status: { key: newStatus, value: newStatus } } }
          : s
      ))
      
    } catch (error) {
      console.error('Error updating stream status:', error)
      alert('Failed to update stream status')
    }
  }

  // Calculate stats
  const stats = {
    totalStreams: streams.length,
    liveStreams: streams.filter(s => s.metadata?.status?.key === 'live').length,
    scheduledStreams: streams.filter(s => s.metadata?.status?.key === 'scheduled').length,
    totalViews: streams.reduce((sum, s) => sum + (s.metadata?.viewer_count || 0), 0)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stream Management</h1>
          <p className="text-muted-foreground mt-2">
            Create, manage, and monitor your live streams
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Stream
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Streams"
          value={stats.totalStreams.toString()}
          icon={Play}
          color="blue"
        />
        <StatsCard
          title="Live Now"
          value={stats.liveStreams.toString()}
          icon={Square}
          color="red"
        />
        <StatsCard
          title="Scheduled"
          value={stats.scheduledStreams.toString()}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Total Views"
          value={stats.totalViews.toString()}
          icon={Users}
          color="green"
        />
      </div>

      {/* Create Stream Form */}
      {showCreateForm && (
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Create New Stream</h2>
          </div>
          <form onSubmit={handleCreateStream} className="card-content space-y-4">
            <div>
              <label className="form-label">
                Stream Title *
              </label>
              <input
                type="text"
                value={formData.stream_title}
                onChange={(e) => setFormData(prev => ({ ...prev, stream_title: e.target.value }))}
                className="form-input"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="form-label">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="form-textarea"
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">
                  Quality
                </label>
                <select
                  value={formData.stream_quality}
                  onChange={(e) => setFormData(prev => ({ ...prev, stream_quality: e.target.value }))}
                  className="form-select"
                >
                  <option value="720p">720p HD</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="4k">4K Ultra HD</option>
                </select>
              </div>

              <div>
                <label className="form-label">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="form-select"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.chat_enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, chat_enabled: e.target.checked }))}
                    className="form-checkbox"
                  />
                  <span className="text-sm font-medium">Enable Chat</span>
                </label>
              </div>
            </div>

            <div>
              <label className="form-label">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="form-input"
                placeholder="tech, coding, tutorial"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating}
                className="btn-primary disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Stream'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Streams List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Your Streams</h2>
        
        {streams.length === 0 ? (
          <div className="card">
            <div className="card-content text-center py-12">
              <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No streams yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first stream to get started
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                Create Stream
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {streams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                showActions={true}
                onEdit={() => {
                  // TODO: Implement edit functionality
                  console.log('Edit stream:', stream)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}