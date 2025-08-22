'use client'

import { useState, useEffect } from 'react'
import { getStreamSessions, createStreamSession, updateStreamSession } from '@/lib/cosmic'
import { createLiveStream } from '@/lib/mux'
import type { StreamSession, CreateStreamFormData } from '@/types'
import StreamCard from '@/components/StreamCard'
import { Plus, Calendar, Settings, Zap } from 'lucide-react'

export default function AdminStreamsPage() {
  const [streams, setStreams] = useState<StreamSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingStream, setEditingStream] = useState<StreamSession | null>(null)

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
      const streamSessions = await getStreamSessions()
      setStreams(streamSessions)
    } catch (error) {
      console.error('Error loading streams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.stream_title.trim()) {
      alert('Stream title is required')
      return
    }

    setIsCreating(true)

    try {
      let streamKey = ''
      let muxPlaybackId = ''

      // Create MUX live stream
      try {
        const muxStream = await createLiveStream({
          reduced_latency: true,
          test: process.env.NODE_ENV === 'development'
        })

        if (muxStream && muxStream.stream_key && muxStream.playback_ids?.[0]) {
          streamKey = muxStream.stream_key
          muxPlaybackId = muxStream.playback_ids[0].id
        }
      } catch (muxError) {
        console.error('Error creating MUX stream:', muxError)
        // Continue without MUX integration
      }

      // Create stream session in Cosmic CMS
      const streamSession = await createStreamSession({
        stream_title: formData.stream_title,
        description: formData.description,
        status: formData.status,
        start_time: formData.start_time,
        end_time: formData.end_time,
        chat_enabled: formData.chat_enabled,
        stream_quality: formData.stream_quality,
        tags: formData.tags
      })

      // Update with MUX details if available
      if (streamKey || muxPlaybackId) {
        await updateStreamSession(streamSession.id, {
          stream_key: streamKey,
          mux_playback_id: muxPlaybackId
        })
      }

      // Refresh streams list
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
      setIsCreating(false)
    }
  }

  const handleEdit = (stream: StreamSession) => {
    setEditingStream(stream)
    setFormData({
      stream_title: stream.metadata?.stream_title || '',
      description: stream.metadata?.description || '',
      status: stream.metadata?.status?.key || 'scheduled',
      start_time: stream.metadata?.start_time || '',
      end_time: stream.metadata?.end_time || '',
      chat_enabled: stream.metadata?.chat_enabled || false,
      stream_quality: stream.metadata?.stream_quality?.key || '1080p',
      tags: stream.metadata?.tags || ''
    })
    setShowCreateForm(true)
  }

  const handleUpdateStatus = async (streamId: string, newStatus: string) => {
    try {
      await updateStreamSession(streamId, { status: newStatus })
      await loadStreams()
    } catch (error) {
      console.error('Error updating stream status:', error)
      alert('Failed to update stream status')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stream Management</h1>
          <p className="text-muted-foreground mt-2">Create and manage your live streams</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Stream
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {editingStream ? 'Edit Stream' : 'Create New Stream'}
            </h2>
          </div>
          <div className="card-content">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Stream Title *</label>
                  <input
                    type="text"
                    value={formData.stream_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, stream_title: e.target.value }))}
                    className="form-input"
                    placeholder="Enter stream title"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="form-select"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="ended">Ended</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Stream Quality</label>
                  <select
                    value={formData.stream_quality}
                    onChange={(e) => setFormData(prev => ({ ...prev, stream_quality: e.target.value as any }))}
                    className="form-select"
                  >
                    <option value="720p">720p HD</option>
                    <option value="1080p">1080p Full HD</option>
                    <option value="4k">4K Ultra HD</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="form-input"
                    placeholder="e.g., tech, coding, tutorial"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="form-textarea"
                  rows={3}
                  placeholder="Describe your stream content"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chat_enabled"
                  checked={formData.chat_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, chat_enabled: e.target.checked }))}
                  className="form-checkbox"
                />
                <label htmlFor="chat_enabled" className="form-label mb-0">Enable Chat</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn-primary disabled:opacity-50"
                >
                  {isCreating ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {editingStream ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    <>
                      {editingStream ? 'Update Stream' : 'Create Stream'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingStream(null)
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
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Streams Grid */}
      {streams.length === 0 ? (
        <div className="card">
          <div className="card-content text-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No streams yet</h3>
            <p className="text-muted-foreground mb-4">Create your first live stream to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              Create Stream
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              onEdit={handleEdit}
              showActions={true}
              className=""
            />
          ))}
        </div>
      )}
    </div>
  )
}