import { Calendar, Users, Clock, Play, Settings, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type { StreamSession } from '@/types'

export interface StreamCardProps {
  stream: StreamSession
  onEdit?: (stream: StreamSession) => void
  className?: string
  showActions?: boolean
}

export default function StreamCard({ 
  stream, 
  onEdit, 
  className = '',
  showActions = true
}: StreamCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set'
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    } catch (error) {
      return 'Invalid date'
    }
  }

  const streamStatus = stream.metadata?.status?.key || 'scheduled'
  const streamStatusDisplay = stream.metadata?.status?.value || 'Scheduled'

  return (
    <div className={`bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {/* Thumbnail */}
      <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative">
        {stream.metadata?.thumbnail?.imgix_url ? (
          <img
            src={`${stream.metadata.thumbnail.imgix_url}?w=600&h=338&fit=crop&auto=format,compress`}
            alt={stream.metadata?.stream_title || stream.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(streamStatus)}`}>
            {streamStatusDisplay}
          </span>
        </div>

        {/* Live Indicator */}
        {streamStatus === 'live' && (
          <div className="absolute top-3 right-3 flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-medium bg-red-500 px-2 py-1 rounded">
              LIVE
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
          {stream.metadata?.stream_title || stream.title}
        </h3>

        {/* Description */}
        {stream.metadata?.description && (
          <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
            <div 
              dangerouslySetInnerHTML={{ 
                __html: stream.metadata.description.replace(/<[^>]*>/g, '').substring(0, 100) + '...' 
              }} 
            />
          </div>
        )}

        {/* Stream Details */}
        <div className="space-y-2 mb-4">
          {stream.metadata?.start_time && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formatDate(stream.metadata.start_time)}</span>
            </div>
          )}
          
          {stream.metadata?.viewer_count !== undefined && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-2" />
              <span>{stream.metadata.viewer_count} viewers</span>
            </div>
          )}

          {stream.metadata?.stream_quality?.value && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Settings className="h-4 w-4 mr-2" />
              <span>{stream.metadata.stream_quality.value}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {stream.metadata?.tags && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {stream.metadata.tags.split(',').slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit?.(stream)}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                <Settings className="h-3 w-3 mr-1" />
                Edit
              </button>
            </div>
            
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {format(new Date(stream.created_at), 'MMM d')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}