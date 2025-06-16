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
  const getCardStyles = () => {
    switch (type) {
      case 'pending':
      case 'warning':
        return {
          backgroundColor: '#fef3c7',
          titleColor: '#92400e',
          valueColor: '#92400e'
        }
      case 'confirmed':
      case 'success':
        return {
          backgroundColor: '#dcfce7',
          titleColor: '#166534',
          valueColor: '#166534'
        }
      case 'cancelled':
      case 'danger':
        return {
          backgroundColor: '#fee2e2',
          titleColor: '#991b1b',
          valueColor: '#991b1b'
        }
      case 'primary':
        return {
          backgroundColor: '#dbeafe',
          titleColor: '#1e40af',
          valueColor: '#1e40af'
        }
      default:
        return {
          backgroundColor: '#f9fafb',
          titleColor: '#6b7280',
          valueColor: '#111827'
        }
    }
  }

  const styles = getCardStyles()

  return (
    <div 
      className={`rounded-lg p-4 ${className}`}
      style={{ backgroundColor: styles.backgroundColor }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 
            className="text-sm font-medium"
            style={{ color: styles.titleColor }}
          >
            {title}
          </h3>
          <p 
            className="text-2xl font-bold mt-1"
            style={{ color: styles.valueColor }}
          >
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
