import { Clock, Users, Eye } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import type { StreamSession } from '@/types'

export interface StreamCardProps {
  stream: StreamSession;
  onEdit?: (stream: StreamSession) => void;
  className?: string;
  showActions?: boolean;
}

export default function StreamCard({ stream, onEdit, className = '', showActions = false }: StreamCardProps) {
  if (!stream || !stream.metadata) {
    return null
  }

  const status = stream.metadata.status?.key || 'scheduled'
  const statusDisplay = stream.metadata.status?.value || 'Scheduled'
  const thumbnailUrl = stream.metadata.thumbnail?.imgix_url
  const startTime = stream.metadata.start_time
  const viewerCount = stream.metadata.viewer_count || 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500'
      case 'scheduled': return 'bg-yellow-500'
      case 'ended': return 'bg-gray-500'
      case 'private': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-red-600 dark:text-red-400'
      case 'scheduled': return 'text-yellow-600 dark:text-yellow-400'
      case 'ended': return 'text-gray-600 dark:text-gray-400'
      case 'private': return 'text-purple-600 dark:text-purple-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className={`bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${className}`}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
        {thumbnailUrl ? (
          <img 
            src={`${thumbnailUrl}?w=800&h=450&fit=crop&auto=format,compress`}
            alt={stream.metadata.stream_title || stream.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-4xl">🎥</div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(status)}`}>
            {statusDisplay}
          </div>
        </div>

        {/* Live Indicator */}
        {status === 'live' && (
          <div className="absolute top-3 left-3">
            <div className="flex items-center space-x-1 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
          {stream.metadata.stream_title || stream.title}
        </h3>

        {/* Description */}
        {stream.metadata.description && (
          <div 
            className="text-sm text-muted-foreground mb-3 line-clamp-2"
            dangerouslySetInnerHTML={{ 
              __html: stream.metadata.description.replace(/<[^>]*>/g, '').substring(0, 100) 
            }}
          />
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center space-x-4">
            {/* Viewer Count */}
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{viewerCount}</span>
            </div>

            {/* Quality */}
            {stream.metadata.stream_quality?.value && (
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{stream.metadata.stream_quality.value}</span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className={`font-medium ${getStatusTextColor(status)}`}>
            {statusDisplay}
          </div>
        </div>

        {/* Timing */}
        <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-3">
          <Clock className="h-3 w-3" />
          {status === 'scheduled' && startTime ? (
            <span>Starts {format(new Date(startTime), 'MMM d, yyyy • h:mm a')}</span>
          ) : status === 'live' ? (
            <span>Started {formatDistanceToNow(new Date(stream.created_at))} ago</span>
          ) : status === 'ended' ? (
            <span>Ended {formatDistanceToNow(new Date(stream.modified_at))} ago</span>
          ) : (
            <span>Created {formatDistanceToNow(new Date(stream.created_at))} ago</span>
          )}
        </div>

        {/* Tags */}
        {stream.metadata.tags && (
          <div className="flex flex-wrap gap-1 mb-3">
            {stream.metadata.tags.split(',').slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        {showActions && onEdit && (
          <div className="flex space-x-2 pt-2 border-t">
            <button
              onClick={() => onEdit(stream)}
              className="flex-1 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded transition-colors"
            >
              Edit Stream
            </button>
          </div>
        )}
      </div>
    </div>
  )
}