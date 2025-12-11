/**
 * Date and Time Selection Component
 * Handles appointment date and time slot selection
 */

import type { FieldErrors, UseFormRegister } from 'react-hook-form'

interface DateTimeSelectorProps {
  selectedDate: string
  availableSlots: string[]
  selectedTime?: string
  onDateChange: (date: string) => void
  errors: FieldErrors
  register: UseFormRegister<any>
}

export default function DateTimeSelector({
  selectedDate,
  availableSlots,
  selectedTime,
  onDateChange,
  errors,
  register
}: DateTimeSelectorProps) {
  // Get tomorrow's date as minimum
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  // Max date (3 months from now)
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  return (
    <div style={{ padding: '32px', backgroundColor: '#fafafa' }}>
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
          backgroundColor: '#f59e0b',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}>3</span>
        Choose Date & Time
      </h2>
      <p style={{
        color: '#6b7280',
        marginBottom: '24px',
        fontSize: '0.875rem'
      }}>
        Select your preferred appointment date and time
      </p>

      {/* Date Selection */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '8px',
          fontSize: '0.875rem'
        }}>
          Appointment Date *
        </label>
        <input
          type="date"
          {...register('appointmentDate', { required: 'Please select a date' })}
          min={minDate}
          max={maxDateStr}
          onChange={(e) => onDateChange(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '1rem',
            backgroundColor: 'white'
          }}
        />
        {errors.appointmentDate && (
          <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px' }}>
            {errors.appointmentDate.message as string}
          </p>
        )}
      </div>

      {/* Time Slot Selection */}
      {selectedDate && (
        <div>
          <label style={{
            display: 'block',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '12px',
            fontSize: '0.875rem'
          }}>
            Available Time Slots *
          </label>

          {availableSlots.length === 0 ? (
            <div style={{
              padding: '20px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              textAlign: 'center'
            }}>
              <p style={{ fontWeight: '600', marginBottom: '4px' }}>No available slots</p>
              <p style={{ fontSize: '0.875rem' }}>Please select a different date</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '12px'
            }}>
              {availableSlots.map(slot => (
                <label
                  key={slot}
                  htmlFor={`time-${slot}`}
                  style={{
                    display: 'block',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    id={`time-${slot}`}
                    value={slot}
                    {...register('appointmentTime', { required: 'Please select a time' })}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    padding: '12px',
                    border: `2px solid ${selectedTime === slot ? '#f59e0b' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    textAlign: 'center',
                    backgroundColor: selectedTime === slot ? '#fffbeb' : 'white',
                    fontWeight: selectedTime === slot ? '600' : '400',
                    color: selectedTime === slot ? '#f59e0b' : '#374151',
                    transition: 'all 0.2s'
                  }}>
                    {slot}
                  </div>
                </label>
              ))}
            </div>
          )}

          {errors.appointmentTime && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '8px' }}>
              {errors.appointmentTime.message as string}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
