'use client'

import { useState, useEffect } from 'react'
import { createLiveStream } from '@/lib/mux' // FIXED: Updated import name
import { createStreamSession, getStreamSessions } from '@/lib/cosmic'
import StatsCard from '@/components/StatsCard'
import StreamCard from '@/components/StreamCard'
import type { StreamSession, CreateStreamFormData } from '@/types'
import { 
  Play, 
  Plus, 
  Calendar, 
  Users, 
  Video,
  Settings,
  X,
  Loader2
} from 'lucide-react'

export default function AdminStreamsPage() {
  const [streams, setStreams] = useState<StreamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
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

  useEffect(() => {
    loadStreams()
  }, [])

  async function loadStreams() {
    try {
      setLoading(true)
      const streamSessions = await getStreamSessions()
      setStreams(streamSessions)
    } catch (error) {
      console.error('Error loading streams:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateStream(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    try {
      // Create MUX live stream
      const muxStream = await createLiveStream({
        playback_policy: ['public'],
        test: process.env.NODE_ENV !== 'production'
      })

      // Create stream session in Cosmic CMS
      const streamData = {
        stream_title: formData.stream_title,
        description: formData.description,
        status: formData.status,
        start_time: formData.start_time,
        end_time: formData.end_time,
        chat_enabled: formData.chat_enabled,
        stream_quality: formData.stream_quality,
        tags: formData.tags
      }

      const newStream = await createStreamSession(streamData)

      // Update the stream with MUX details
      // Note: We would need an update function here
      console.log('Created stream:', newStream)
      console.log('MUX stream details:', muxStream)

      // Reload streams
      await loadStreams()

      // Reset form
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
    } catch (error) {
      console.error('Error creating stream:', error)
      alert('Failed to create stream. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const stats = {
    total: streams.length,
    live: streams.filter(s => s.metadata?.status?.key === 'live').length,
    scheduled: streams.filter(s => s.metadata?.status?.key === 'scheduled').length,
    ended: streams.filter(s => s.metadata?.status?.key === 'ended').length
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stream Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your live streams, scheduled sessions, and recordings
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Streams"
          value={stats.total.toString()}
          icon={Video}
          color="blue"
        />
        <StatsCard
          title="Live Now"
          value={stats.live.toString()}
          icon={Play}
          color="red"
        />
        <StatsCard
          title="Scheduled"
          value={stats.scheduled.toString()}
          icon={Calendar}
          color="yellow"
        />
        <StatsCard
          title="Completed"
          value={stats.ended.toString()}
          icon={Users}
          color="green"
        />
      </div>

      {/* Create Stream Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Create New Stream</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStream} className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="form-label">Stream Title *</label>
                  <input
                    type="text"
                    value={formData.stream_title}
                    onChange={(e) => setFormData({ ...formData, stream_title: e.target.value })}
                    className="form-input"
                    required
                    placeholder="Enter stream title"
                  />
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-input h-24"
                    placeholder="Describe your stream..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="form-input"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Quality</label>
                    <select
                      value={formData.stream_quality}
                      onChange={(e) => setFormData({ ...formData, stream_quality: e.target.value as any })}
                      className="form-input"
                    >
                      <option value="720p">720p HD</option>
                      <option value="1080p">1080p Full HD</option>
                      <option value="4k">4K Ultra HD</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Start Time</label>
                    <input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">End Time</label>
                    <input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="form-input"
                    placeholder="tech, coding, tutorial (comma separated)"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chat_enabled"
                    checked={formData.chat_enabled}
                    onChange={(e) => setFormData({ ...formData, chat_enabled: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="chat_enabled" className="text-sm font-medium">
                    Enable chat for this stream
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary flex-1"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Stream'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Streams List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Streams</h2>
          <div className="flex items-center gap-4">
            <button className="btn-secondary text-sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : streams.length === 0 ? (
          <div className="text-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No streams yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first stream to get started with live broadcasting
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Stream
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                showActions={true}
                onEdit={(stream) => {
                  console.log('Edit stream:', stream)
                  // Implement edit functionality
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}