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
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">4</span>
        Your Information
      </h2>
      <p className="text-gray-500 mb-6 text-sm">
        {isLoggedIn
          ? 'Review and update your contact information if needed'
          : 'Please provide your contact information'}
      </p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
        {/* Customer Name */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2 text-sm">
            Full Name *
          </label>
          <input
            type="text"
            {...register('customerName', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' }
            })}
            placeholder="John Doe"
            className={`w-full px-4 py-3 border-2 rounded-lg text-base ${
              errors.customerName ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.customerName && (
            <p className="text-red-500 text-sm mt-1">
              {errors.customerName.message as string}
            </p>
          )}
        </div>

        {/* Customer Email */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2 text-sm">
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
            className={`w-full px-4 py-3 border-2 rounded-lg text-base ${
              errors.customerEmail ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.customerEmail && (
            <p className="text-red-500 text-sm mt-1">
              {errors.customerEmail.message as string}
            </p>
          )}
        </div>

        {/* Customer Phone */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2 text-sm">
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
            className={`w-full px-4 py-3 border-2 rounded-lg text-base ${
              errors.customerPhone ? 'border-red-500' : 'border-gray-200'
            }`}
          />
          {errors.customerPhone && (
            <p className="text-red-500 text-sm mt-1">
              {errors.customerPhone.message as string}
            </p>
          )}
        </div>
      </div>

      {/* Special Requests / Notes */}
      <div className="mt-5">
        <label className="block font-semibold text-gray-700 mb-2 text-sm">
          Special Requests or Notes (Optional)
        </label>
        <textarea
          {...register('notes')}
          placeholder="Any special requests, allergies, or preferences..."
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base resize-y font-sans"
        />
      </div>
    </div>
  )
}
