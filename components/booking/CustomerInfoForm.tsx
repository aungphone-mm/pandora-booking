/**
 * Customer Information Form Component
 * Handles customer contact details and notes
 */

import type { FieldErrors, UseFormRegister } from 'react-hook-form'

interface CustomerInfoFormProps {
  isLoggedIn: boolean
  errors: FieldErrors
  register: UseFormRegister<any>
}

export default function CustomerInfoForm({
  isLoggedIn,
  errors,
  register
}: CustomerInfoFormProps) {
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
          backgroundColor: '#3b82f6',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}>4</span>
        Your Information
      </h2>
      <p style={{
        color: '#6b7280',
        marginBottom: '24px',
        fontSize: '0.875rem'
      }}>
        {isLoggedIn
          ? 'Review and update your contact information if needed'
          : 'Please provide your contact information'}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        {/* Customer Name */}
        <div>
          <label style={{
            display: 'block',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px',
            fontSize: '0.875rem'
          }}>
            Full Name *
          </label>
          <input
            type="text"
            {...register('customerName', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' }
            })}
            placeholder="John Doe"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `2px solid ${errors.customerName ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          {errors.customerName && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px' }}>
              {errors.customerName.message as string}
            </p>
          )}
        </div>

        {/* Customer Email */}
        <div>
          <label style={{
            display: 'block',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px',
            fontSize: '0.875rem'
          }}>
            Email Address (Optional)
          </label>
          <input
            type="email"
            {...register('customerEmail', {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            placeholder="john@example.com"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `2px solid ${errors.customerEmail ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          {errors.customerEmail && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px' }}>
              {errors.customerEmail.message as string}
            </p>
          )}
        </div>

        {/* Customer Phone */}
        <div>
          <label style={{
            display: 'block',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px',
            fontSize: '0.875rem'
          }}>
            Phone Number *
          </label>
          <input
            type="tel"
            {...register('customerPhone', {
              required: 'Phone number is required',
              pattern: {
                value: /^[\d\s\-\+\(\)]+$/,
                message: 'Invalid phone number'
              }
            })}
            placeholder="+1 234 567 8900"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `2px solid ${errors.customerPhone ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          {errors.customerPhone && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px' }}>
              {errors.customerPhone.message as string}
            </p>
          )}
        </div>
      </div>

      {/* Special Requests / Notes */}
      <div style={{ marginTop: '20px' }}>
        <label style={{
          display: 'block',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '8px',
          fontSize: '0.875rem'
        }}>
          Special Requests or Notes (Optional)
        </label>
        <textarea
          {...register('notes')}
          placeholder="Any special requests, allergies, or preferences..."
          rows={4}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '1rem',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
      </div>
    </div>
  )
}
