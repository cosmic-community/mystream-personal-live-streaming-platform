import type { LucideIcon } from 'lucide-react'

export interface StatsCardProps {
  title: string
  value: string
  icon: LucideIcon
  color: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color,
  trend = 'neutral',
  className = '' 
}: StatsCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗'
      case 'down':
        return '↘'
      default:
        return '→'
    }
  }

  return (
    <div className={`bg-card rounded-lg border shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {trend !== 'neutral' && (
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {getTrendIcon()}
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}