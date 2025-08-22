import { Calendar, Clock, Users, Video, Eye } from 'lucide-react'
import { format } from 'date-fns'
import type { StreamSession } from '@/types'

interface StreamCardProps {
  stream: StreamSession
  onEdit?: (stream: StreamSession) => void
  className?: string
}

export default function StreamCard({ stream, onEdit, className = "" }: StreamCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500 text-white'
      case 'scheduled':
        return 'bg-yellow-500 text-black'
      case 'ended':
        return 'bg-gray-500 text-white'
      case 'private':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return '🔴'
      case 'scheduled':
        return '📅'
      case 'ended':
        return '⏹️'
      case 'private':
        return '🔒'
      default:
        return '📺'
    }
  }

  const statusKey = stream.metadata?.status?.key || 'scheduled'
  const statusValue = stream.metadata?.status?.value || 'Scheduled'
  const streamQuality = stream.metadata?.stream_quality?.value || '1080p Full HD'
  const viewerCount = stream.metadata?.viewer_count || 0
  const chatEnabled = stream.metadata?.chat_enabled ?? true
  const tags = stream.metadata?.tags ? stream.metadata.tags.split(',').map(tag => tag.trim()) : []

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 ${className}`}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {stream.metadata?.thumbnail?.imgix_url ? (
          <img
            src={`${stream.metadata.thumbnail.imgix_url}?w=640&h=360&fit=crop&auto=format,compress`}
            alt={stream.metadata?.stream_title || stream.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Status overlay */}
        <div className="absolute top-3 left-3">
          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(statusKey)}`}>
            <span>{getStatusIcon(statusKey)}</span>
            {statusValue}
          </div>
        </div>

        {/* Live indicator for live streams */}
        {statusKey === 'live' && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              LIVE
            </div>
          </div>
        )}

        {/* Quality indicator */}
        <div className="absolute bottom-3 right-3">
          <div className="px-2 py-1 bg-black/70 text-white text-xs rounded">
            {streamQuality}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-2">
          {stream.metadata?.stream_title || stream.title}
        </h3>

        {/* Description */}
        {stream.metadata?.description && (
          <div 
            className="text-muted-foreground text-sm mb-3 line-clamp-3"
            dangerouslySetInnerHTML={{ __html: stream.metadata.description }}
          />
        )}

        {/* Stream info */}
        <div className="space-y-2 mb-4">
          {/* Timing info */}
          {stream.metadata?.start_time && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(stream.metadata.start_time), 'PPP')}
              </span>
              {stream.metadata?.end_time && stream.metadata.start_time !== stream.metadata.end_time && (
                <>
                  <Clock className="h-4 w-4 ml-2" />
                  <span>
                    {format(new Date(stream.metadata.start_time), 'p')} - {format(new Date(stream.metadata.end_time), 'p')}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Viewer count and chat status */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{viewerCount} viewer{viewerCount !== 1 ? 's' : ''}</span>
            </div>
            {chatEnabled && (
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>Chat enabled</span>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {statusKey === 'live' && (
            <button className="btn-primary flex-1">
              Watch Live
            </button>
          )}
          
          {statusKey === 'scheduled' && (
            <button className="btn-secondary flex-1">
              Set Reminder
            </button>
          )}
          
          {statusKey === 'ended' && stream.metadata?.recording_url && (
            <button className="btn-secondary flex-1">
              Watch Recording
            </button>
          )}
          
          {statusKey === 'private' && (
            <button className="btn-secondary flex-1">
              Access Required
            </button>
          )}

          {onEdit && (
            <button 
              onClick={() => onEdit(stream)}
              className="btn-outline px-3"
            >
              Edit
            </button>
          )}
        </div>

        {/* Stream key info for admin */}
        {stream.metadata?.stream_key && onEdit && (
          <div className="mt-3 p-2 bg-muted rounded text-xs">
            <div className="font-medium text-foreground mb-1">Stream Key</div>
            <code className="text-muted-foreground break-all">
              {stream.metadata.stream_key.substring(0, 20)}...
            </code>
          </div>
        )}
      </div>
    </div>
  )
}