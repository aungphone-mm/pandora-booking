/**
 * Staff Selection Component
 * Handles staff member selection
 */

import type { Staff } from './types'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

interface StaffSelectorProps {
  staff: Staff[]
  selectedStaffId?: string
  errors: FieldErrors
  register: UseFormRegister<any>
}

export default function StaffSelector({
  staff,
  selectedStaffId,
  errors,
  register
}: StaffSelectorProps) {
  return (
    <div style={{ padding: '32px' }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}>3</span>
        Select Your Specialist
      </h2>
      <p style={{
        color: '#6b7280',
        marginBottom: '24px',
        fontSize: '0.875rem'
      }}>
        Choose from our expert beauty professionals
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {staff.map(member => (
          <label
            key={member.id}
            htmlFor={`staff-${member.id}`}
            style={{
              display: 'block',
              cursor: 'pointer'
            }}
          >
            <input
              type="radio"
              id={`staff-${member.id}`}
              value={member.id}
              {...register('staffId', { required: 'Please select a staff member' })}
              style={{ display: 'none' }}
            />
            <div style={{
              padding: '20px',
              border: `2px solid ${selectedStaffId === member.id ? '#10b981' : '#e5e7eb'}`,
              borderRadius: '12px',
              backgroundColor: selectedStaffId === member.id ? '#f0fdf4' : 'white',
              boxShadow: selectedStaffId === member.id
                ? '0 8px 25px rgba(16, 185, 129, 0.15)'
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#6b7280'
                }}>
                  {member.full_name.charAt(0)}
                </div>
                <div>
                  <div style={{
                    fontWeight: '600',
                    color: '#111827',
                    fontSize: '1rem'
                  }}>
                    {member.full_name}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    {member.position}
                  </div>
                </div>
              </div>

              {member.specializations && member.specializations.length > 0 && (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginTop: '8px'
                }}>
                  <strong>Specializations:</strong> {member.specializations.join(', ')}
                </div>
              )}

              {selectedStaffId === member.id && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#059669',
                  fontWeight: '500',
                  textAlign: 'center'
                }}>
                  ✓ Selected
                </div>
              )}
            </div>
          </label>
        ))}
      </div>

      {errors.staffId && (
        <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '8px' }}>
          {errors.staffId.message as string}
        </p>
      )}
    </div>
  )
}
