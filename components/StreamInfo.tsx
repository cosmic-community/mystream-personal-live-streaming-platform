'use client'

import { Calendar, Clock, Eye, Tag, Settings, Share2, Link as LinkIcon } from 'lucide-react'
import type { StreamSession, AccessPermission } from '@/types'
import { useState } from 'react'

interface StreamInfoProps {
  stream: StreamSession
  viewerName: string
  permissions: AccessPermission
}

export default function StreamInfo({ stream, viewerName, permissions }: StreamInfoProps) {
  const [showShareMenu, setShowShareMenu] = useState(false)

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'text-red-500 bg-red-50 border-red-200'
      case 'scheduled':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200'
      case 'ended':
        return 'text-gray-500 bg-gray-50 border-gray-200'
      case 'private':
        return 'text-purple-500 bg-purple-50 border-purple-200'
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  const getPermissionColor = (permission: AccessPermission) => {
    switch (permission) {
      case 'moderator':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'chat':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'view-only':
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getPermissionLabel = (permission: AccessPermission) => {
    switch (permission) {
      case 'moderator':
        return 'Moderator'
      case 'chat':
        return 'Viewer + Chat'
      case 'view-only':
      default:
        return 'View Only'
    }
  }

  const shareUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      alert('Stream link copied to clipboard!')
    }
  }

  const tags = stream.metadata?.tags ? stream.metadata.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="p-6">
        {/* Stream Title and Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {stream.metadata?.stream_title || stream.title}
            </h1>
            
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(stream.metadata?.status?.key || 'scheduled')}`}>
                {stream.metadata?.status?.value || 'Scheduled'}
              </span>
              
              <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium border ${getPermissionColor(permissions)}`}>
                {getPermissionLabel(permissions)}
              </span>
              
              {stream.metadata?.viewer_count !== undefined && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Eye className="h-4 w-4 mr-1" />
                  <span>{stream.metadata.viewer_count} viewers</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-4">
            <div className="relative">
              <button 
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="btn-secondary p-2"
                title="Share stream"
              >
                <Share2 className="h-4 w-4" />
              </button>
              
              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-popover border rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button 
                      onClick={shareUrl}
                      className="flex items-center w-full px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Copy link
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {permissions === 'moderator' && (
              <button className="btn-secondary p-2" title="Stream settings">
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stream Description */}
        {stream.metadata?.description && (
          <div className="mb-6">
            <div 
              className="text-muted-foreground prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: stream.metadata.description }}
            />
          </div>
        )}

        {/* Stream Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Timing Information */}
          <div className="space-y-3">
            {stream.metadata?.start_time && (
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Start time:</span>
                  <span className="ml-2 font-medium">{formatDate(stream.metadata.start_time)}</span>
                </div>
              </div>
            )}
            
            {stream.metadata?.end_time && (
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">End time:</span>
                  <span className="ml-2 font-medium">{formatDate(stream.metadata.end_time)}</span>
                </div>
              </div>
            )}
            
            {stream.metadata?.stream_quality?.value && (
              <div className="flex items-center text-sm">
                <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Quality:</span>
                  <span className="ml-2 font-medium">{stream.metadata.stream_quality.value}</span>
                </div>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Your access:</span>
                <span className="ml-2 font-medium">{viewerName}</span>
              </div>
            </div>
            
            {stream.metadata?.chat_enabled !== undefined && (
              <div className="flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${stream.metadata.chat_enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <div>
                  <span className="text-muted-foreground">Chat:</span>
                  <span className="ml-2 font-medium">
                    {stream.metadata.chat_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-start space-x-2">
              <Tag className="h-4 w-4 mt-1 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recording Notice */}
        {stream.metadata?.recording_url && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              This stream was recorded.{' '}
              <a 
                href={stream.metadata.recording_url} 
                className="font-medium underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Watch recording
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}