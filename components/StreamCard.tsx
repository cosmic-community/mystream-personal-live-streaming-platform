import { useState } from 'react'
import type { StreamSession, StreamCardProps } from '@/types'
import { Calendar, Users, Clock, Video, Edit, Play, Square, Eye } from 'lucide-react'

export default function StreamCard({ 
  stream, 
  onEdit,
  showActions = false,
  className = '' 
}: StreamCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500 text-white';
      case 'scheduled':
        return 'bg-yellow-500 text-white';
      case 'ended':
        return 'bg-gray-500 text-white';
      case 'private':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return Play;
      case 'scheduled':
        return Calendar;
      case 'ended':
        return Square;
      case 'private':
        return Eye;
      default:
        return Video;
    }
  };

  const status = stream.metadata?.status?.key || 'scheduled';
  const statusDisplay = stream.metadata?.status?.value || 'Scheduled';
  const StatusIcon = getStatusIcon(status);

  return (
    <div 
      className={`bg-background border border-border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {stream.metadata?.thumbnail?.imgix_url ? (
          <img
            src={`${stream.metadata.thumbnail.imgix_url}?w=600&h=338&fit=crop&auto=format,compress`}
            alt={stream.metadata?.stream_title || stream.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(status)}`}>
          <StatusIcon className="h-3 w-3" />
          {statusDisplay}
        </div>

        {/* Live Indicator */}
        {status === 'live' && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              LIVE
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground text-lg line-clamp-2">
            {stream.metadata?.stream_title || stream.title}
          </h3>
          {stream.metadata?.description && (
            <div 
              className="text-sm text-muted-foreground mt-1 line-clamp-2"
              dangerouslySetInnerHTML={{ 
                __html: stream.metadata.description.replace(/<[^>]*>/g, '') 
              }}
            />
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{stream.metadata?.viewer_count || 0}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              {stream.metadata?.start_time 
                ? new Date(stream.metadata.start_time).toLocaleDateString()
                : new Date(stream.created_at).toLocaleDateString()
              }
            </span>
          </div>

          {stream.metadata?.stream_quality?.value && (
            <div className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              <span>{stream.metadata.stream_quality.value}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {stream.metadata?.tags && (
          <div className="flex flex-wrap gap-1">
            {stream.metadata.tags.split(',').slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="inline-block px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className={`flex gap-2 pt-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            {onEdit && (
              <button
                onClick={() => onEdit(stream)}
                className="btn-outline flex-1 flex items-center justify-center gap-2 text-sm"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}
            
            <button className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
              <Eye className="h-4 w-4" />
              View
            </button>
          </div>
        )}
      </div>
    </div>
  );
}