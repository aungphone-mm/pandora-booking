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
    <div className="p-8 bg-gray-50 border-t border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">5</span>
        Booking Summary
      </h2>

      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        {/* Services */}
        {selectedServices.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Services ({selectedServices.length})
            </div>
            {selectedServices.map((service) => (
              <div
                key={service.id}
                className="flex justify-between items-center mb-2.5 p-2 bg-pink-50 rounded-md"
              >
                <div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {service.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {service.duration} minutes
                  </div>
                </div>
                <div className="font-semibold text-gray-900 text-base">
                  ${service.price}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products */}
        {selectedProductsList.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Add-on Products
            </div>
            {selectedProductsList.map(product => (
              <div
                key={product.id}
                className="flex justify-between items-center mb-2"
              >
                <div className="text-sm text-gray-700">
                  {product.name}
                </div>
                <div className="font-semibold text-gray-700 text-sm">
                  ${product.price}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center pt-4">
          <div className="text-xl font-bold text-gray-900">
            Total
          </div>
          <div className="text-2xl font-bold text-pink-600">
            ${totalPrice.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full mt-6 px-4 py-4 text-white border-0 rounded-lg text-lg font-semibold transition-all shadow-pink-200 ${
          loading
            ? 'bg-gray-400 cursor-not-allowed shadow-none'
            : 'bg-pink-600 cursor-pointer hover:bg-pink-700 shadow-lg'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
            Processing...
          </span>
        ) : (
          'Confirm Booking'
        )}
      </button>

      <p className="text-center mt-4 text-sm text-gray-500">
        By booking, you agree to our terms and conditions
      </p>
    </div>
  )
}
