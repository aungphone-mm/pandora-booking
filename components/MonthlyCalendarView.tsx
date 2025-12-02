'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth, addMonths, subMonths } from 'date-fns'

type Appointment = {
  id: string
  customer_name: string
  appointment_date: string
  appointment_time: string
  status: 'pending' | 'confirmed' | 'cancelled'
  service: {
    name: string
    price: number
  } | null
}

export default function MonthlyCalendarView() {
  const supabase = createClient()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMonthAppointments()
  }, [currentMonth])

  const loadMonthAppointments = async () => {
    try {
      setLoading(true)
      setError(null)

      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)

      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          id,
          customer_name,
          appointment_date,
          appointment_time,
          status,
          service:services(name, price)
        `)
        .gte('appointment_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('appointment_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('appointment_time', { ascending: true })

      if (fetchError) throw fetchError

      // Transform data: Supabase returns service as array, unwrap it
      const transformedData = (data || []).map((apt: any) => ({
        ...apt,
        service: Array.isArray(apt.service) ? apt.service[0] : apt.service
      }))

      setAppointments(transformedData)
    } catch (err: any) {
      console.error('Error loading appointments:', err)
      setError(err.message || 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
  }

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt =>
      isSameDay(new Date(apt.appointment_date), date)
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10b981'
      case 'pending':
        return '#f59e0b'
      case 'cancelled':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
    setSelectedDate(new Date())
  }

  const daysInMonth = getDaysInMonth()
  const firstDayOfMonth = startOfMonth(currentMonth).getDay()

  // Create empty cells for days before month starts
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '32px',
        textAlign: 'center',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{
          display: 'inline-block',
          width: '48px',
          height: '48px',
          border: '4px solid #f1f5f9',
          borderTop: '4px solid #ec4899',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}></div>
        <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500' }}>
          Loading calendar...
        </p>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '20px',
      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
      padding: '32px',
      border: '1px solid #f1f5f9'
    }} className="calendar-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem'
        }}>📅</div>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          margin: '0',
          color: '#1e293b'
        }}>Monthly Calendar</h3>
      </div>

      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '1px solid #f87171',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <p style={{ color: '#dc2626', margin: '0', fontWeight: '500' }}>⚠️ {error}</p>
        </div>
      )}

      {/* Calendar Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <button
          onClick={goToPreviousMonth}
          style={{
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '12px 20px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem',
            color: '#1e293b',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          ← Previous
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: '0',
            color: '#1e293b'
          }}>
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={goToToday}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              color: 'white',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          style={{
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '12px 20px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem',
            color: '#1e293b',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          Next →
        </button>
      </div>

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        marginBottom: '24px'
      }}>
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{
            textAlign: 'center',
            fontWeight: '700',
            fontSize: '0.9rem',
            color: '#64748b',
            padding: '12px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {day}
          </div>
        ))}

        {/* Empty cells before month starts */}
        {emptyDays.map(i => (
          <div key={`empty-${i}`} style={{ padding: '8px' }}></div>
        ))}

        {/* Days of the month */}
        {daysInMonth.map(date => {
          const dayAppointments = getAppointmentsForDate(date)
          const isSelected = selectedDate && isSameDay(date, selectedDate)
          const isTodayDate = isToday(date)

          return (
            <div
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              style={{
                backgroundColor: isSelected
                  ? '#dbeafe'
                  : isTodayDate
                    ? '#fef3c7'
                    : 'white',
                border: isTodayDate
                  ? '2px solid #f59e0b'
                  : isSelected
                    ? '2px solid #3b82f6'
                    : '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '12px 8px',
                minHeight: '90px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                  e.currentTarget.style.transform = 'scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = isTodayDate ? '#fef3c7' : 'white'
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              <div style={{
                fontWeight: '600',
                fontSize: '1.1rem',
                color: isTodayDate ? '#92400e' : '#1e293b',
                marginBottom: '4px'
              }}>
                {format(date, 'd')}
              </div>

              {dayAppointments.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  fontSize: '0.65rem'
                }}>
                  {dayAppointments.slice(0, 2).map(apt => (
                    <div
                      key={apt.id}
                      style={{
                        backgroundColor: getStatusColor(apt.status),
                        color: 'white',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}
                      title={`${apt.appointment_time} - ${apt.customer_name}`}
                    >
                      {apt.appointment_time}
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#64748b',
                      fontWeight: '600',
                      textAlign: 'center'
                    }}>
                      +{dayAppointments.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #0ea5e9'
        }}>
          <h4 style={{
            fontSize: '1.2rem',
            fontWeight: '700',
            margin: '0 0 16px 0',
            color: '#0369a1',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📅 {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h4>

          {selectedDateAppointments.length === 0 ? (
            <p style={{
              color: '#0369a1',
              margin: '0',
              fontSize: '1rem',
              fontStyle: 'italic'
            }}>
              No appointments scheduled for this day
            </p>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {selectedDateAppointments.map(apt => (
                <div
                  key={apt.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #bae6fd',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <p style={{
                        fontWeight: '700',
                        fontSize: '1.1rem',
                        color: '#1e293b',
                        margin: '0 0 4px 0'
                      }}>
                        {apt.customer_name}
                      </p>
                      <p style={{
                        fontSize: '0.95rem',
                        color: '#64748b',
                        margin: '0'
                      }}>
                        💅 {apt.service?.name || 'Service N/A'}
                      </p>
                    </div>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      backgroundColor: `${getStatusColor(apt.status)}20`,
                      color: getStatusColor(apt.status),
                      border: `1px solid ${getStatusColor(apt.status)}`
                    }}>
                      {apt.status}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    fontSize: '0.9rem',
                    color: '#475569'
                  }}>
                    <span>🕐 {apt.appointment_time}</span>
                    <span>💰 {apt.service?.price?.toLocaleString() || '0'}Ks</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: '#f8fafc',
        borderRadius: '12px',
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '4px',
            backgroundColor: '#10b981'
          }}></div>
          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
            Confirmed
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '4px',
            backgroundColor: '#f59e0b'
          }}></div>
          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
            Pending
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '4px',
            backgroundColor: '#ef4444'
          }}></div>
          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
            Cancelled
          </span>
        </div>
      </div>

      {/* Refresh Button */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={loadMonthAppointments}
          style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
            color: 'white',
            padding: '12px 32px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            boxShadow: '0 6px 20px rgba(236, 72, 153, 0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(236, 72, 153, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(236, 72, 153, 0.3)'
          }}
        >
          🔄 Refresh Calendar
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .calendar-container {
            padding: 20px !important;
          }
        }
      `}</style>
    </div>
  )
}
