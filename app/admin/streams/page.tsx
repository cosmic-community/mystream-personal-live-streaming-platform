'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Play, Square, Settings } from 'lucide-react'
import { getStreamSessions, createStreamSession } from '@/lib/cosmic'
import { createMuxLiveStream } from '@/lib/mux' // FIXED: Import correct function name
import type { StreamSession, CreateStreamFormData, MuxValidationResult } from '@/types'
import StatsCard from '@/components/StatsCard'
import StreamCard from '@/components/StreamCard'

export default function AdminStreamsPage() {
  const [streams, setStreams] = useState<StreamSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // FIXED: Initialize with proper MuxValidationResult object instead of Promise
  const [muxValidation, setMuxValidation] = useState<MuxValidationResult>({
    isValid: false,
    error: 'Not validated yet'
  })
  
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

  // Validate MUX credentials on component mount
  useEffect(() => {
    async function validateMux() {
      try {
        const response = await fetch('/api/mux/validate')
        const result = await response.json()
        setMuxValidation(result) // FIXED: Set the result directly, not the Promise
      } catch (error) {
        console.error('Error validating MUX credentials:', error)
        setMuxValidation({
          isValid: false,
          error: 'Failed to validate MUX credentials'
        })
      }
    }

    validateMux()
    loadStreams()
  }, [])

  const loadStreams = async () => {
    try {
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
    if (isCreating) return

    setIsCreating(true)
    
    try {
      // First create the MUX live stream
      let muxData = null
      if (muxValidation.isValid) {
        try {
          muxData = await createMuxLiveStream()
        } catch (error) {
          console.error('Error creating MUX stream:', error)
          // Continue without MUX integration
        }
      }

      // Create the stream session in Cosmic
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

      // If MUX stream was created successfully, update with MUX data
      if (muxData && newStream.id) {
        try {
          const response = await fetch('/api/streams', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: newStream.id,
              stream_key: muxData.stream_key,
              mux_playback_id: muxData.playback_ids[0]?.id || ''
            })
          })
          
          if (!response.ok) {
            console.error('Failed to update stream with MUX data')
          }
        } catch (error) {
          console.error('Error updating stream with MUX data:', error)
        }
      }

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const getStreamStats = () => {
    const total = streams.length
    const live = streams.filter(s => s.metadata?.status?.key === 'live').length
    const scheduled = streams.filter(s => s.metadata?.status?.key === 'scheduled').length
    const ended = streams.filter(s => s.metadata?.status?.key === 'ended').length

    return { total, live, scheduled, ended }
  }

  const stats = getStreamStats()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Stream Management</h1>
            <p className="text-muted-foreground mt-2">Manage your live streams and broadcasting</p>
          </div>
          
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Stream</span>
          </button>
        </div>

        {/* MUX Status Warning */}
        {!muxValidation.isValid && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-1">MUX Integration Issue</h3>
            <p className="text-sm text-yellow-700">
              {muxValidation.error || 'MUX credentials are not properly configured. Streams will be created without video integration.'}
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Streams"
            value={stats.total.toString()}
            icon={Settings}
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
            icon={Plus}
            color="yellow"
          />
          <StatsCard
            title="Ended"
            value={stats.ended.toString()}
            icon={Square}
            color="gray"
          />
        </div>

        {/* Create Stream Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg border shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Create New Stream</h2>
                
                <form onSubmit={handleCreateStream} className="space-y-4">
                  <div>
                    <label htmlFor="stream_title" className="block text-sm font-medium mb-1">
                      Stream Title *
                    </label>
                    <input
                      type="text"
                      id="stream_title"
                      name="stream_title"
                      value={formData.stream_title}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      required
                      placeholder="Enter stream title"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="form-input w-full h-24 resize-none"
                      placeholder="Describe your stream..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium mb-1">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="form-input w-full"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="private">Private</option>
                        <option value="live">Live</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="stream_quality" className="block text-sm font-medium mb-1">
                        Quality
                      </label>
                      <select
                        id="stream_quality"
                        name="stream_quality"
                        value={formData.stream_quality}
                        onChange={handleInputChange}
                        className="form-input w-full"
                      >
                        <option value="720p">720p HD</option>
                        <option value="1080p">1080p Full HD</option>
                        <option value="4k">4K Ultra HD</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="start_time" className="block text-sm font-medium mb-1">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        id="start_time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleInputChange}
                        className="form-input w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="end_time" className="block text-sm font-medium mb-1">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        id="end_time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleInputChange}
                        className="form-input w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="form-input w-full"
                      placeholder="tech, coding, live (comma-separated)"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="chat_enabled"
                      name="chat_enabled"
                      checked={formData.chat_enabled}
                      onChange={handleInputChange}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="chat_enabled" className="ml-2 text-sm font-medium">
                      Enable chat for this stream
                    </label>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="btn-secondary"
                      disabled={isCreating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isCreating}
                    >
                      {isCreating ? 'Creating...' : 'Create Stream'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Streams Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Your Streams</h2>
          
          {streams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎥</div>
              <h3 className="text-lg font-medium text-foreground mb-2">No streams yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first stream to start broadcasting
              </p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
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
                    console.log('Edit stream:', stream.id)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}