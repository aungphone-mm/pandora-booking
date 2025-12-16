/**
 * Service Selection Component
 * Handles service category display and multiple service selection
 */

import type { Service } from './types'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

interface ServiceSelectorProps {
  services: Service[]
  selectedServiceIds: string[]
  errors: FieldErrors
  register: UseFormRegister<any>
  onServiceToggle: (serviceId: string) => void
}

export default function ServiceSelector({
  services,
  selectedServiceIds,
  errors,
  register,
  onServiceToggle
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
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center text-sm font-bold">1</span>
        Choose Your Services
      </h2>
      <p className="text-gray-500 mb-4 text-sm">
        Select one or more services for your appointment
      </p>

      <div className="mb-6">
        {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b-2 border-gray-200 pb-2">
              {category}
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {categoryServices.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id)
                return (
                  <div
                    key={service.id}
                    onClick={() => onServiceToggle(service.id)}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-pink-600 bg-pink-50'
                        : 'border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-25'
                    }`}
                  >
                    {/* Checkbox indicator */}
                    <div className={`absolute top-3 right-3 w-6 h-6 rounded border-2 flex items-center justify-center text-xs text-white font-bold ${
                      isSelected
                        ? 'border-pink-600 bg-pink-600'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected ? '✓' : ''}
                    </div>

                    <div className="font-semibold text-gray-900 mb-2 text-base pr-8">
                      {service.name}
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>${service.price}</span>
                      <span>{service.duration} min</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {errors.serviceIds && (
        <p className="text-red-500 text-sm mt-2">
          {errors.serviceIds.message as string}
        </p>
      )}

      {selectedServiceIds.length > 0 && (
        <div className="mt-4 p-3 bg-green-100 rounded-lg text-sm text-green-800 font-medium">
          ✓ {selectedServiceIds.length} service{selectedServiceIds.length > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}
