/**
 * Product Selection Component
 * Handles product category display and product selection
 */

import type { Product, ProductCategory } from './types'

interface ProductSelectorProps {
  products: Product[]
  productCategories: ProductCategory[]
  selectedProducts: Set<string>
  onProductToggle: (productId: string) => void
}

export default function ProductSelector({
  products,
  productCategories,
  selectedProducts,
  onProductToggle
}: ProductSelectorProps) {
  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    if (!product) return acc
    const categoryId = product.category_id
    if (!acc[categoryId]) acc[categoryId] = []
    acc[categoryId].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  return (
    <div className="p-8 bg-gray-50">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">2</span>
        Add Products (Optional)
      </h2>
      <p className="text-gray-500 mb-6 text-sm">
        Enhance your experience with premium products
      </p>

      {productCategories.map(category => {
        const categoryProducts = productsByCategory[category.id] || []
        if (categoryProducts.length === 0) return null

        return (
          <div key={category.id} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              {category.name}
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
              {categoryProducts.map(product => (
                <label
                  key={product.id}
                  htmlFor={`product-${product.id}`}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedProducts.has(product.id)
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`product-${product.id}`}
                    checked={selectedProducts.has(product.id)}
                    onChange={() => onProductToggle(product.id)}
                    className="mr-3 w-[18px] h-[18px] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm mb-1">
                      {product.name}
                    </div>
                    <div className="text-purple-600 font-semibold text-sm">
                      ${product.price}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
