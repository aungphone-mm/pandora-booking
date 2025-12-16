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
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">3</span>
        Select Your Specialist
      </h2>
      <p className="text-gray-500 mb-6 text-sm">
        Choose from our expert beauty professionals
      </p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {staff.map(member => (
          <label
            key={member.id}
            htmlFor={`staff-${member.id}`}
            className="block cursor-pointer"
          >
            <input
              type="radio"
              id={`staff-${member.id}`}
              value={member.id}
              {...register('staffId', { required: 'Please select a staff member' })}
              className="hidden"
            />
            <div className={`p-5 border-2 rounded-xl transition-all ${
              selectedStaffId === member.id
                ? 'border-green-600 bg-green-50 shadow-lg shadow-green-100'
                : 'border-gray-200 bg-white shadow-sm hover:border-green-300 hover:shadow-md'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500">
                  {member.full_name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-base">
                    {member.full_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {member.position}
                  </div>
                </div>
              </div>

              {member.specializations && member.specializations.length > 0 && (
                <div className="text-xs text-gray-500 mt-2">
                  <strong>Specializations:</strong> {member.specializations.join(', ')}
                </div>
              )}

              {selectedStaffId === member.id && (
                <div className="mt-3 p-2 bg-green-100/50 rounded-md text-sm text-green-700 font-medium text-center">
                  ✓ Selected
                </div>
              )}
            </div>
          </label>
        ))}
      </div>

      {errors.staffId && (
        <p className="text-red-500 text-sm mt-2">
          {errors.staffId.message as string}
        </p>
      )}
    </div>
  )
}
