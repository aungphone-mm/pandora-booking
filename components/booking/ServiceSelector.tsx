/**
 * Service Selection Component
 * Handles service category display and multiple service selection
 */

import type { Service } from './types'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

interface ServiceSelectorProps {
  services: Service[]
  selectedServiceIds: string[]
  errors: FieldErrors
  register: UseFormRegister<any>
  onServiceToggle: (serviceId: string) => void
}

export default function ServiceSelector({
  services,
  selectedServiceIds,
  errors,
  register,
  onServiceToggle
}: ServiceSelectorProps) {
  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    if (!service) return acc
    const category = service.category?.name || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div style={{ padding: '32px' }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#ec4899',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}>1</span>
        Choose Your Services
      </h2>
      <p style={{
        color: '#6b7280',
        marginBottom: '16px',
        fontSize: '0.875rem'
      }}>
        Select one or more services for your appointment
      </p>

      <div style={{ marginBottom: '24px' }}>
        {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
          <div key={category} style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '8px'
            }}>
              {category}
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {categoryServices.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id)
                return (
                  <div
                    key={service.id}
                    onClick={() => onServiceToggle(service.id)}
                    style={{
                      position: 'relative',
                      padding: '16px',
                      border: `2px solid ${isSelected ? '#ec4899' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#fdf2f8' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Checkbox indicator */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      border: `2px solid ${isSelected ? '#ec4899' : '#d1d5db'}`,
                      backgroundColor: isSelected ? '#ec4899' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {isSelected ? '✓' : ''}
                    </div>

                    <div style={{
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '8px',
                      fontSize: '1rem',
                      paddingRight: '32px'
                    }}>
                      {service.name}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      <span>${service.price}</span>
                      <span>{service.duration} min</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {errors.serviceIds && (
        <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '8px' }}>
          {errors.serviceIds.message as string}
        </p>
      )}

      {selectedServiceIds.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#dcfce7',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#166534',
          fontWeight: '500'
        }}>
          ✓ {selectedServiceIds.length} service{selectedServiceIds.length > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}
