'use client'

import { formatDistanceToNow } from 'date-fns'
import { Calendar, Clock, Eye, Play, Settings, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { StreamSession } from '@/types'

interface StreamCardProps {
  stream: StreamSession
  onEdit?: (stream: StreamSession) => void
  className?: string
}

export default function StreamCard({ stream, onEdit, className = '' }: StreamCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500 text-white'
      case 'scheduled':
        return 'bg-yellow-500 text-white'
      case 'ended':
        return 'bg-gray-500 text-white'
      case 'private':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getStatusDisplay = (stream: StreamSession) => {
    return stream.metadata?.status?.value || 'Scheduled'
  }

  const getStatusKey = (stream: StreamSession) => {
    return stream.metadata?.status?.key || 'scheduled'
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set'
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const getThumbnailUrl = (stream: StreamSession) => {
    return stream.metadata?.thumbnail?.imgix_url || 
           stream.metadata?.thumbnail?.url || 
           '/placeholder-stream.jpg'
  }

  const isLive = getStatusKey(stream) === 'live'
  const thumbnailUrl = getThumbnailUrl(stream)

  return (
    <div className={`bg-card rounded-lg border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${className}`}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        <img
          src={`${thumbnailUrl}?w=600&h=338&fit=crop&auto=format,compress`}
          alt={stream.metadata?.stream_title || stream.title}
          className="w-full h-full object-cover"
        />
        
        {/* Status Badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getStatusKey(stream))}`}>
          {isLive && <span className="inline-block w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>}
          {getStatusDisplay(stream)}
        </div>

        {/* View Count */}
        {stream.metadata?.viewer_count !== undefined && (
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            {stream.metadata.viewer_count}
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="h-12 w-12 text-white" fill="currentColor" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
          {stream.metadata?.stream_title || stream.title}
        </h3>

        {/* Description */}
        {stream.metadata?.description && (
          <div 
            className="text-sm text-muted-foreground mb-3 line-clamp-2"
            dangerouslySetInnerHTML={{ 
              __html: stream.metadata.description.replace(/<[^>]*>/g, '') 
            }}
          />
        )}

        {/* Stream Details */}
        <div className="space-y-2 mb-4 text-xs text-muted-foreground">
          {stream.metadata?.start_time && (
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-2" />
              <span>Starts {formatDate(stream.metadata.start_time)}</span>
            </div>
          )}

          {stream.metadata?.stream_quality?.value && (
            <div className="flex items-center">
              <Settings className="h-3 w-3 mr-2" />
              <span>{stream.metadata.stream_quality.value}</span>
            </div>
          )}

          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-2" />
            <span>Created {formatDate(stream.created_at)}</span>
          </div>
        </div>

        {/* Tags */}
        {stream.metadata?.tags && (
          <div className="flex flex-wrap gap-1 mb-4">
            {stream.metadata.tags.split(',').slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Link
              href={`/admin/streams/${stream.slug}`}
              className="btn-primary text-xs py-1.5 px-3"
            >
              View Details
            </Link>
            
            <Link
              href={`/admin/streams/${stream.slug}/access-links`}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Links
            </Link>
          </div>

          {onEdit && (
            <button
              onClick={() => onEdit(stream)}
              className="btn-secondary p-1.5"
              title="Edit stream"
            >
              <Settings className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}