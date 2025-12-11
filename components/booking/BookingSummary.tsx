/**
 * Booking Summary Component
 * Displays the booking summary and total price
 */

import type { Service, Product } from './types'

interface BookingSummaryProps {
  selectedServices: Service[]
  selectedProducts: Set<string>
  products: Product[]
  totalPrice: number
  loading: boolean
}

export default function BookingSummary({
  selectedServices,
  selectedProducts,
  products,
  totalPrice,
  loading
}: BookingSummaryProps) {
  const selectedProductsList = Array.from(selectedProducts)
    .map(id => products.find(p => p.id === id))
    .filter((p): p is Product => p !== undefined)

  return (
    <div style={{
      padding: '32px',
      backgroundColor: '#f9fafb',
      borderTop: '1px solid #e5e7eb'
    }}>
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
          backgroundColor: '#6366f1',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}>5</span>
        Booking Summary
      </h2>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '2px solid #e5e7eb'
      }}>
        {/* Services */}
        {selectedServices.length > 0 && (
          <div style={{
            marginBottom: '16px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px'
            }}>
              Services ({selectedServices.length})
            </div>
            {selectedServices.map((service) => (
              <div
                key={service.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                  padding: '8px',
                  backgroundColor: '#fdf2f8',
                  borderRadius: '6px'
                }}
              >
                <div>
                  <div style={{
                    fontWeight: '600',
                    color: '#111827',
                    fontSize: '0.9rem'
                  }}>
                    {service.name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    {service.duration} minutes
                  </div>
                </div>
                <div style={{
                  fontWeight: '600',
                  color: '#111827',
                  fontSize: '1rem'
                }}>
                  ${service.price}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products */}
        {selectedProductsList.length > 0 && (
          <div style={{
            marginBottom: '16px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px'
            }}>
              Add-on Products
            </div>
            {selectedProductsList.map(product => (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}
              >
                <div style={{
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  {product.name}
                </div>
                <div style={{
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '0.875rem'
                }}>
                  ${product.price}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px'
        }}>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#111827'
          }}>
            Total
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#ec4899'
          }}>
            ${totalPrice.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          marginTop: '24px',
          padding: '16px',
          backgroundColor: loading ? '#9ca3af' : '#ec4899',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1.125rem',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: loading ? 'none' : '0 4px 6px rgba(236, 72, 153, 0.2)'
        }}
      >
        {loading ? (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <span style={{
              width: '20px',
              height: '20px',
              border: '2px solid #ffffff',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              display: 'inline-block'
            }}></span>
            Processing...
          </span>
        ) : (
          'Confirm Booking'
        )}
      </button>

      <p style={{
        textAlign: 'center',
        marginTop: '16px',
        fontSize: '0.875rem',
        color: '#6b7280'
      }}>
        By booking, you agree to our terms and conditions
      </p>
    </div>
  )
}
