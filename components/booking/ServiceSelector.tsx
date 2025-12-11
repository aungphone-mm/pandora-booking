/**
 * Service Selection Component
 * Handles service category display and service selection
 */

import type { Service } from './types'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

interface ServiceSelectorProps {
  services: Service[]
  selectedServiceId?: string
  errors: FieldErrors
  register: UseFormRegister<any>
}

export default function ServiceSelector({
  services,
  selectedServiceId,
  errors,
  register
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
        Choose Your Service
      </h2>

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
              {categoryServices.map((service) => (
                <label
                  key={service.id}
                  htmlFor={`service-${service.id}`}
                  style={{
                    display: 'block',
                    padding: '16px',
                    border: `2px solid ${selectedServiceId === service.id ? '#ec4899' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedServiceId === service.id ? '#fdf2f8' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="radio"
                    id={`service-${service.id}`}
                    value={service.id}
                    {...register('serviceId', { required: 'Please select a service' })}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '8px',
                    fontSize: '1rem'
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
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {errors.serviceId && (
        <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '8px' }}>
          {errors.serviceId.message as string}
        </p>
      )}
    </div>
  )
}
