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
    <div style={{ padding: '32px', backgroundColor: '#fafafa' }}>
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
          backgroundColor: '#8b5cf6',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}>2</span>
        Add Products (Optional)
      </h2>
      <p style={{
        color: '#6b7280',
        marginBottom: '24px',
        fontSize: '0.875rem'
      }}>
        Enhance your experience with premium products
      </p>

      {productCategories.map(category => {
        const categoryProducts = productsByCategory[category.id] || []
        if (categoryProducts.length === 0) return null

        return (
          <div key={category.id} style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px'
            }}>
              {category.name}
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {categoryProducts.map(product => (
                <label
                  key={product.id}
                  htmlFor={`product-${product.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    border: `2px solid ${selectedProducts.has(product.id) ? '#8b5cf6' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedProducts.has(product.id) ? '#f5f3ff' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    id={`product-${product.id}`}
                    checked={selectedProducts.has(product.id)}
                    onChange={() => onProductToggle(product.id)}
                    style={{
                      marginRight: '12px',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      color: '#111827',
                      fontSize: '0.875rem',
                      marginBottom: '4px'
                    }}>
                      {product.name}
                    </div>
                    <div style={{
                      color: '#8b5cf6',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}>
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
