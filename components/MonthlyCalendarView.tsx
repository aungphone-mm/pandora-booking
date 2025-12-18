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
  appointment_services: {
    id: string
    quantity: number
    price: number
    service: {
      name: string
      price: number
      duration: number
    }
  }[]
  appointment_products?: {
    id: string
    quantity: number
    product: {
      id: string
      name: string
      price: number
    }
  }[]
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
          appointment_services(
            id,
            quantity,
            price,
            service:services(name, price, duration)
          ),
          appointment_products(
            id,
            quantity,
            product:products(id, name, price)
          )
        `)
        .gte('appointment_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('appointment_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('appointment_time', { ascending: true })

      if (fetchError) throw fetchError

      // Transform data: Supabase returns nested relations as arrays, unwrap them
      const transformedData = (data || []).map((apt: any) => ({
        ...apt,
        appointment_services: apt.appointment_services?.map((as: any) => ({
          ...as,
          service: Array.isArray(as.service) ? as.service[0] : as.service
        })) || [],
        appointment_products: apt.appointment_products?.map((ap: any) => ({
          ...ap,
          product: Array.isArray(ap.product) ? ap.product[0] : ap.product
        })) || []
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

  const getServiceInfo = (appointment: Appointment) => {
    if (appointment.appointment_services.length === 0) return null

    const firstService = appointment.appointment_services[0]
    return {
      name: firstService.service.name,
      price: firstService.price,
      hasMultiple: appointment.appointment_services.length > 1
    }
  }

  const calculateTotal = (appointment: Appointment) => {
    const servicesTotal = appointment.appointment_services.reduce(
      (sum, as) => sum + (as.price * as.quantity), 0
    )
    const productsTotal = appointment.appointment_products?.reduce(
      (sum, ap) => sum + (ap.product.price * ap.quantity), 0
    ) || 0
    return servicesTotal + productsTotal
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500'
      case 'pending':
        return 'bg-amber-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
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
      <div className="bg-white rounded-[20px] p-8 text-center shadow-[0_15px_35px_rgba(0,0,0,0.08)] border border-slate-100">
        <div className="inline-block w-12 h-12 border-4 border-slate-100 border-t-pink-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 text-base font-medium">
          Loading calendar...
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-8 border border-slate-100 calendar-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-700 rounded-xl flex items-center justify-center text-xl">📅</div>
        <h3 className="text-2xl font-bold m-0 text-slate-800">Monthly Calendar</h3>
      </div>

      {error && (
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-300 rounded-xl p-4 mb-5">
          <p className="text-red-600 m-0 font-medium">⚠️ {error}</p>
        </div>
      )}

      {/* Calendar Navigation */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <button
          onClick={goToPreviousMonth}
          className="bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 rounded-xl px-5 py-3 cursor-pointer font-semibold text-sm text-slate-800 transition-all duration-200 hover:-translate-x-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
        >
          ← Previous
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold m-0 text-slate-800">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={goToToday}
            className="bg-gradient-to-br from-blue-500 to-blue-800 border-none rounded-lg px-4 py-2 cursor-pointer font-semibold text-sm text-white transition-all duration-200 hover:scale-105"
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 rounded-xl px-5 py-3 cursor-pointer font-semibold text-sm text-slate-800 transition-all duration-200 hover:translate-x-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
        >
          Next →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-bold text-sm text-slate-500 py-3 uppercase tracking-wide">
            {day}
          </div>
        ))}

        {/* Empty cells before month starts */}
        {emptyDays.map(i => (
          <div key={`empty-${i}`} className="p-2"></div>
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
              className={`rounded-xl p-3 min-h-[90px] cursor-pointer transition-all duration-200 relative flex flex-col gap-1 ${
                isSelected
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : isTodayDate
                    ? 'bg-yellow-100 border-2 border-amber-500'
                    : 'bg-white border border-slate-200'
              } ${!isSelected && 'hover:bg-slate-50 hover:scale-[1.02] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]'}`}
            >
              <div className={`font-semibold text-lg mb-1 ${isTodayDate ? 'text-amber-900' : 'text-slate-800'}`}>
                {format(date, 'd')}
              </div>

              {dayAppointments.length > 0 && (
                <div className="flex flex-col gap-0.5 text-[0.65rem]">
                  {dayAppointments.slice(0, 2).map(apt => (
                    <div
                      key={apt.id}
                      className={`${getStatusColor(apt.status)} text-white px-1.5 py-0.5 rounded text-[0.7rem] font-semibold overflow-hidden text-ellipsis whitespace-nowrap`}
                      title={`${apt.appointment_time} - ${apt.customer_name}`}
                    >
                      {apt.appointment_time}
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-[0.7rem] text-slate-500 font-semibold text-center">
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
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-2xl p-6 border border-sky-500">
          <h4 className="text-xl font-bold m-0 mb-4 text-sky-800 flex items-center gap-2">
            📅 {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h4>

          {selectedDateAppointments.length === 0 ? (
            <p className="text-sky-800 m-0 text-base italic">
              No appointments scheduled for this day
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedDateAppointments.map(apt => {
                return (
                  <div
                    key={apt.id}
                    className="bg-white rounded-xl p-5 border border-sky-200 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-bold text-lg text-slate-800 m-0 mb-2">
                          {apt.customer_name}
                        </p>

                        {/* Services List */}
                        <div className="mb-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Services:</p>
                          {apt.appointment_services.map((as, idx) => (
                            <div key={as.id} className="text-sm text-slate-700 mb-1">
                              💅 <span className="font-medium">{as.service.name}</span>
                              {as.quantity > 1 && <span className="text-xs"> ×{as.quantity}</span>}
                              <span className="text-slate-500 ml-2">
                                {as.price.toLocaleString()}Ks • {as.service.duration} min
                              </span>
                            </div>
                          ))}
                          {apt.appointment_services.length === 0 && (
                            <p className="text-sm text-slate-400 italic">No services</p>
                          )}
                        </div>

                        {/* Products List */}
                        {apt.appointment_products && apt.appointment_products.length > 0 && (
                          <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Add-ons:</p>
                            {apt.appointment_products.map(ap => (
                              <div key={ap.id} className="text-sm text-slate-600">
                                🛍️ {ap.product.name} ×{ap.quantity}
                                <span className="text-slate-500 ml-1">
                                  ({(ap.product.price * ap.quantity).toLocaleString()}Ks)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase border block mb-2 ${
                          apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-500' :
                          apt.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-500' :
                          'bg-red-50 text-red-800 border-red-500'
                        }`}>
                          {apt.status}
                        </span>
                        <p className="text-lg font-bold text-emerald-600 m-0">
                          💰 {calculateTotal(apt).toLocaleString()}Ks
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 text-sm text-slate-500 pt-2 border-t border-slate-200">
                      <span>🕐 {apt.appointment_time}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-slate-50 rounded-xl flex gap-6 flex-wrap justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500"></div>
          <span className="text-sm text-slate-500 font-medium">
            Confirmed
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500"></div>
          <span className="text-sm text-slate-500 font-medium">
            Pending
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-sm text-slate-500 font-medium">
            Cancelled
          </span>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-5 text-center">
        <button
          onClick={loadMonthAppointments}
          className="bg-gradient-to-br from-pink-500 to-pink-700 text-white px-8 py-3 rounded-xl border-none cursor-pointer font-semibold text-base shadow-[0_6px_20px_rgba(236,72,153,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(236,72,153,0.4)]"
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
