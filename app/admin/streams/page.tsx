'use client'

import { useEffect, useState } from 'react'
import { Plus, Settings, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react'
import { getStreamSessions, createStreamSession } from '@/lib/cosmic'
import { createMuxLiveStream, validateMuxConfiguration } from '@/lib/mux'
import type { StreamSession, CreateStreamFormData } from '@/types'
import StreamCard from '@/components/StreamCard'

export default function StreamsAdminPage() {
  const [streams, setStreams] = useState<StreamSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [muxStatus, setMuxStatus] = useState<{
    configured: boolean
    missing: string[]
    message: string
  } | null>(null)
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
    checkMuxStatus()
  }, [])

  async function checkMuxStatus() {
    try {
      const response = await fetch('/api/mux/validate')
      const data = await response.json()
      setMuxStatus(data)
    } catch (error) {
      console.error('Error checking MUX status:', error)
      setMuxStatus({
        configured: false,
        missing: ['MUX_TOKEN_ID', 'MUX_TOKEN_SECRET'],
        message: 'Unable to check MUX configuration'
      })
    }
  }

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

  const handleInputChange = (field: keyof CreateStreamFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!muxStatus?.configured) {
      alert('MUX is not properly configured. Please check your environment variables.')
      return
    }
    
    setIsCreating(true)

    try {
      // Create MUX live stream first
      const muxStream = await createMuxLiveStream({
        playback_policy: ['public'],
        reduced_latency: true
      })

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

      // Update stream with MUX details
      await fetch('/api/streams', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: streamSession.id,
          mux_stream_id: muxStream.id,
          stream_key: muxStream.stream_key,
          mux_playback_id: muxStream.playback_ids[0]?.id || ''
        })
      })

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
            <p className="text-muted-foreground mt-2">
              Create and manage your live streams
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary flex items-center space-x-2"
            disabled={!muxStatus?.configured}
          >
            <Plus className="h-4 w-4" />
            <span>New Stream</span>
          </button>
        </div>

        {/* MUX Status Alert */}
        {muxStatus && (
          <div className={`mb-6 p-4 rounded-lg border ${
            muxStatus.configured 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {muxStatus.configured ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              <span className="font-medium">
                {muxStatus.configured ? 'MUX Connected' : 'MUX Configuration Issue'}
              </span>
            </div>
            <p className="mt-1 text-sm">
              {muxStatus.message}
              {!muxStatus.configured && (
                <>
                  <br />
                  Missing environment variables: {muxStatus.missing.join(', ')}
                  <br />
                  <a 
                    href="https://dashboard.mux.com/settings/access-tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:no-underline inline-flex items-center space-x-1 mt-1"
                  >
                    <span>Get your MUX API tokens</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
            </p>
          </div>
        )}

        {/* Create Stream Form */}
        {showCreateForm && (
          <div className="bg-card rounded-lg border shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Stream</h2>
            
            <form onSubmit={handleCreateStream} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Stream Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.stream_title}
                    onChange={(e) => handleInputChange('stream_title', e.target.value)}
                    className="form-input w-full"
                    required
                    placeholder="Enter stream title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="form-select w-full"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="form-input w-full"
                  placeholder="Describe your stream (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                    className="form-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Stream Quality</label>
                  <select
                    value={formData.stream_quality}
                    onChange={(e) => handleInputChange('stream_quality', e.target.value)}
                    className="form-select w-full"
                  >
                    <option value="720p">720p HD</option>
                    <option value="1080p">1080p Full HD</option>
                    <option value="4k">4K Ultra HD</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.chat_enabled}
                      onChange={(e) => handleInputChange('chat_enabled', e.target.checked)}
                      className="form-checkbox"
                    />
                    <span className="text-sm font-medium">Enable Chat</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  className="form-input w-full"
                  placeholder="e.g., tech, coding, tutorial (comma separated)"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isCreating || !muxStatus?.configured}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Streams Grid */}
        {streams.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No streams yet</h3>
            <p className="text-muted-foreground mb-4">
              {muxStatus?.configured 
                ? "Create your first stream to get started"
                : "Configure MUX first, then create your first stream"
              }
            </p>
            {muxStatus?.configured && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                Create Stream
              </button>
            )}
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
  )
}