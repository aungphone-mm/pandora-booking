import React from 'react'

export interface StatusCardProps {
  title: string
  value: string | number
  type?: 'default' | 'pending' | 'confirmed' | 'cancelled' | 'primary' | 'success' | 'danger' | 'warning'
  icon?: string
  className?: string
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  type = 'default',
  icon,
  className = ''
}) => {
  const getCardClasses = () => {
    switch (type) {
      case 'pending':
      case 'warning':
        return 'bg-yellow-100 text-amber-900'
      case 'confirmed':
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
      case 'danger':
        return 'bg-red-100 text-red-800'
      case 'primary':
        return 'bg-blue-100 text-blue-900'
      default:
        return 'bg-gray-50 text-gray-800'
    }
  }

  return (
    <div className={`rounded-lg p-4 ${getCardClasses()} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium">
            {title}
          </h3>
          <p className="text-2xl font-bold mt-1">
            {value}
          </p>
        </div>
        {icon && (
          <span className="text-2xl ml-2">{icon}</span>
        )}
      </div>
    </div>
  )
}

export default StatusCard
