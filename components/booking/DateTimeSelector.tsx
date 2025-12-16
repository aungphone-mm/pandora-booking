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
    <div className="p-8 bg-gray-50">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">3</span>
        Choose Date & Time
      </h2>
      <p className="text-gray-500 mb-6 text-sm">
        Select your preferred appointment date and time
      </p>

      {/* Date Selection */}
      <div className="mb-6">
        <label className="block font-semibold text-gray-700 mb-2 text-sm">
          Appointment Date *
        </label>
        <input
          type="date"
          {...register('appointmentDate', { required: 'Please select a date' })}
          min={minDate}
          max={maxDateStr}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base bg-white"
        />
        {errors.appointmentDate && (
          <p className="text-red-500 text-sm mt-1">
            {errors.appointmentDate.message as string}
          </p>
        )}
      </div>

      {/* Time Slot Selection */}
      {selectedDate && (
        <div>
          <label className="block font-semibold text-gray-700 mb-3 text-sm">
            Available Time Slots *
          </label>

          {availableSlots.length === 0 ? (
            <div className="p-5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-center">
              <p className="font-semibold mb-1">No available slots</p>
              <p className="text-sm">Please select a different date</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
              {availableSlots.map(slot => (
                <label
                  key={slot}
                  htmlFor={`time-${slot}`}
                  className="block cursor-pointer"
                >
                  <input
                    type="radio"
                    id={`time-${slot}`}
                    value={slot}
                    {...register('appointmentTime', { required: 'Please select a time' })}
                    className="hidden"
                  />
                  <div className={`p-3 border-2 rounded-lg text-center transition-all ${
                    selectedTime === slot
                      ? 'border-amber-500 bg-amber-50 font-semibold text-amber-500'
                      : 'border-gray-200 bg-white font-normal text-gray-700 hover:border-amber-300 hover:bg-amber-25'
                  }`}>
                    {slot}
                  </div>
                </label>
              ))}
            </div>
          )}

          {errors.appointmentTime && (
            <p className="text-red-500 text-sm mt-2">
              {errors.appointmentTime.message as string}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
