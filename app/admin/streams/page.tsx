'use client'

import { useEffect, useState } from 'react'
import { getStreamSessions, createStreamSession, updateStreamSession } from '@/lib/cosmic'
import { createMuxLiveStream, deleteMuxLiveStream } from '@/lib/mux'
import type { StreamSession, CreateStreamFormData } from '@/types'
import { Plus, Edit3, Trash2, Play, Square, Eye, Calendar, Clock } from 'lucide-react'

interface StreamCardProps {
  stream: StreamSession
  onEdit: (stream: StreamSession) => void
  showActions?: boolean
}

function StreamCard({ stream, onEdit, showActions = true }: StreamCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  
  const getStatusColor = (status: string) => {
    const key = stream.metadata?.status?.key || status
    switch (key) {
      case 'live':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ended':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'private':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    const key = stream.metadata?.status?.key || status
    switch (key) {
      case 'live':
        return <Play className="h-3 w-3 fill-current" />
      case 'scheduled':
        return <Calendar className="h-3 w-3" />
      case 'ended':
        return <Square className="h-3 w-3" />
      case 'private':
        return <Eye className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (isUpdating) return
    
    setIsUpdating(true)
    try {
      await updateStreamSession(stream.id, { status: newStatus })
      // Refresh the page or update state
      window.location.reload()
    } catch (error) {
      console.error('Error updating stream status:', error)
      alert('Failed to update stream status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this stream? This action cannot be undone.')) {
      return
    }

    setIsUpdating(true)
    try {
      // Delete MUX live stream if it exists
      if (stream.metadata?.mux_playback_id) {
        await deleteMuxLiveStream(stream.id)
      }
      
      // Note: We would need a delete function in cosmic.ts to actually delete the stream
      // For now, we'll just update the status to 'ended'
      await updateStreamSession(stream.id, { status: 'ended' })
      window.location.reload()
    } catch (error) {
      console.error('Error deleting stream:', error)
      alert('Failed to delete stream')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {stream.metadata?.stream_title || stream.title}
            </h3>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor('')}`}>
              {getStatusIcon('')}
              {stream.metadata?.status?.value || 'Unknown'}
            </span>
          </div>
          
          {stream.metadata?.description && (
            <div 
              className="text-sm text-gray-600 mb-3 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: stream.metadata.description }}
            />
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            {stream.metadata?.start_time && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(stream.metadata.start_time).toLocaleDateString()}</span>
              </div>
            )}
            {stream.metadata?.viewer_count !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{stream.metadata.viewer_count} viewers</span>
              </div>
            )}
            {stream.metadata?.stream_quality?.value && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                {stream.metadata.stream_quality.value}
              </span>
            )}
          </div>

          {stream.metadata?.tags && (
            <div className="mt-2 flex flex-wrap gap-1">
              {stream.metadata.tags.split(',').map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {stream.metadata?.thumbnail?.imgix_url && (
          <img
            src={`${stream.metadata.thumbnail.imgix_url}?w=120&h=68&fit=crop&auto=format,compress`}
            alt={stream.metadata?.stream_title || stream.title}
            className="w-20 h-12 rounded object-cover ml-4 flex-shrink-0"
          />
        )}
      </div>

      {showActions && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {stream.metadata?.status?.key === 'scheduled' && (
              <button
                onClick={() => handleStatusUpdate('live')}
                disabled={isUpdating}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
              >
                <Play className="h-3 w-3 fill-current" />
                Go Live
              </button>
            )}
            
            {stream.metadata?.status?.key === 'live' && (
              <button
                onClick={() => handleStatusUpdate('ended')}
                disabled={isUpdating}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
              >
                <Square className="h-3 w-3" />
                End Stream
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(stream)}
              className="inline-flex items-center gap-1 px-3 py-1 text-gray-700 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              <Edit3 className="h-3 w-3" />
              Edit
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isUpdating}
              className="inline-flex items-center gap-1 px-3 py-1 text-red-700 text-sm border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StreamsPage() {
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

  const loadStreams = async () => {
    try {
      setIsLoading(true)
      const streamSessions = await getStreamSessions()
      setStreams(streamSessions)
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
      // Create MUX live stream first
      const muxStream = await createMuxLiveStream({
        playback_policy: ['public'],
        reduced_latency: true
      })

      // Create stream session in Cosmic
      const streamData = {
        ...formData,
        stream_key: muxStream.stream_key,
        mux_playback_id: muxStream.playback_ids[0]?.id || ''
      }

      await createStreamSession(streamData)
      
      // Reset form and reload
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
      loadStreams()
    } catch (error) {
      console.error('Error creating stream:', error)
      alert('Failed to create stream. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditStream = (stream: StreamSession) => {
    setEditingStream(stream)
    setFormData({
      stream_title: stream.metadata?.stream_title || '',
      description: stream.metadata?.description || '',
      status: stream.metadata?.status?.key as any || 'scheduled',
      start_time: stream.metadata?.start_time || '',
      end_time: stream.metadata?.end_time || '',
      chat_enabled: stream.metadata?.chat_enabled || false,
      stream_quality: stream.metadata?.stream_quality?.key as any || '1080p',
      tags: stream.metadata?.tags || ''
    })
    setShowCreateForm(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stream Management</h1>
            <p className="text-gray-600 mt-2">Create and manage your live streaming sessions</p>
          </div>
          
          <button
            onClick={() => {
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
              setShowCreateForm(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Stream
          </button>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingStream ? 'Edit Stream' : 'Create New Stream'}
            </h2>
            
            <form onSubmit={handleCreateStream} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stream Title *
                  </label>
                  <input
                    type="text"
                    value={formData.stream_title}
                    onChange={(e) => setFormData({ ...formData, stream_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="private">Private</option>
                    <option value="live">Live</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what this stream will be about..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality
                  </label>
                  <select
                    value={formData.stream_quality}
                    onChange={(e) => setFormData({ ...formData, stream_quality: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="720p">720p HD</option>
                    <option value="1080p">1080p Full HD</option>
                    <option value="4k">4K Ultra HD</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.chat_enabled}
                      onChange={(e) => setFormData({ ...formData, chat_enabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable Chat</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="gaming, tutorial, coding (comma separated)"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : (editingStream ? 'Update Stream' : 'Create Stream')}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Streams Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : streams.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Play className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No streams yet</h3>
            <p className="text-gray-600 mb-6">Create your first live stream to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Your First Stream
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {streams.map((stream) => (
              <StreamCard
                key={stream.id}
                stream={stream}
                onEdit={handleEditStream}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}