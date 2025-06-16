import React from 'react'

interface StatusCardGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

const StatusCardGrid: React.FC<StatusCardGridProps> = ({ 
  children, 
  columns = 4,
  className = '' 
}) => {
  const getGridClass = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-1 md:grid-cols-2'
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    }
  }

  return (
    <div className={`grid ${getGridClass()} gap-4 mb-6 ${className}`}>
      {children}
    </div>
  )
}

export default StatusCardGrid
