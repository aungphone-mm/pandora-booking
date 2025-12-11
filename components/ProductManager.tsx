'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type Product = {
  id: string
  name: string
  description: string
  category_id: string
  price: number
  is_active: boolean
  created_at: string
  category?: {
    name: string
  }
}

type Category = {
  id: string
  name: string
  description?: string
}

export default function ProductManager() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'category'>('name')
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category_id: '',
    price: 0,
    is_active: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            category:product_categories(name)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('product_categories')
          .select('*')
          .order('display_order')
      ])

      if (productsResult.error) throw productsResult.error
      if (categoriesResult.error) throw categoriesResult.error

      setProducts(productsResult.data || [])
      setCategories(categoriesResult.data || [])
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async () => {
    try {
      setError(null)
      const { error } = await supabase
        .from('products')
        .insert([newProduct])

      if (error) throw error

      setNewProduct({
        name: '',
        description: '',
        category_id: '',
        price: 0,
        is_active: true
      })
      setShowAddForm(false)
      loadData()
    } catch (error: any) {
      console.error('Error adding product:', error)
      setError(error.message || 'Failed to add product')
    }
  }

  const handleUpdateProduct = async (product: Product) => {
    try {
      setError(null)
      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          description: product.description,
          category_id: product.category_id,
          price: product.price,
          is_active: product.is_active
        })
        .eq('id', product.id)

      if (error) throw error

      setEditingProduct(null)
      loadData()
    } catch (error: any) {
      console.error('Error updating product:', error)
      setError(error.message || 'Failed to update product')
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      setError(null)
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadData()
    } catch (error: any) {
      console.error('Error deleting product:', error)
      setError(error.message || 'Failed to delete product')
    }
  }

  const toggleProductStatus = async (id: string, currentStatus: boolean) => {
    try {
      setError(null)
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      loadData()
    } catch (error: any) {
      console.error('Error updating product status:', error)
      setError(error.message || 'Failed to update product status')
    }
  }

  // Filter and sort products
  const filteredAndSortedProducts = products
    .filter(product => {
      if (filterCategory !== 'all' && product.category_id !== filterCategory) return false
      if (filterStatus === 'active' && !product.is_active) return false
      if (filterStatus === 'inactive' && product.is_active) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price':
          return b.price - a.price
        case 'category':
          return (a.category?.name || '').localeCompare(b.category?.name || '')
        default:
          return 0
      }
    })

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? { backgroundColor: '#dcfce7', color: '#166534' }
      : { backgroundColor: '#fee2e2', color: '#991b1b' }
  }

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '300px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid #ec4899',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '24px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>Product Management</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => window.open('/admin/product-categories', '_blank')}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Manage Categories
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              backgroundColor: '#ec4899',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {showAddForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px'
        }}>
          <p style={{ color: '#b91c1c', fontWeight: '500' }}>{error}</p>
        </div>
      )}

      {/* Filters and Sorting */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center'
      }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>Filter by Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none'
            }}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none'
            }}
          >
            <option value="all">All Products</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'category')}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none'
            }}
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#6b7280'
          }}>Total Products</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>{products.length}</p>
        </div>
        <div style={{
          backgroundColor: '#dcfce7',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#166534'
          }}>Active</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#166534'
          }}>
            {products.filter(p => p.is_active).length}
          </p>
        </div>
        <div style={{
          backgroundColor: '#fee2e2',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#991b1b'
          }}>Inactive</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#991b1b'
          }}>
            {products.filter(p => !p.is_active).length}
          </p>
        </div>
        <div style={{
          backgroundColor: '#dbeafe',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#1e40af'
          }}>Categories</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1e40af'
          }}>
            {categories.length}
          </p>
        </div>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div style={{
          marginBottom: '24px',
          padding: '24px',
          border: '2px solid #ec4899',
          borderRadius: '8px',
          backgroundColor: '#fef7ff'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: '#a21caf'
          }}>Add New Product</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <input
              type="text"
              placeholder="Product name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
            <select
              value={newProduct.category_id}
              onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none'
              }}
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Price"
              step="0.01"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px'
            }}>
              <input
                type="checkbox"
                id="active-new"
                checked={newProduct.is_active}
                onChange={(e) => setNewProduct({ ...newProduct, is_active: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="active-new" style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                Active
              </label>
            </div>
          </div>
          
          <textarea
            placeholder="Product description"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none',
              marginBottom: '16px',
              minHeight: '80px'
            }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddProduct}
              style={{
                backgroundColor: '#ec4899',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Add Product
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Products List */}
      {filteredAndSortedProducts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 0'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛍️</div>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
            {filterCategory !== 'all' || filterStatus !== 'all'
              ? `No products found with current filters.`
              : 'No products found. Add your first product to get started.'
            }
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAndSortedProducts.map(product => (
            <div key={product.id} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: product.is_active ? 'white' : '#f9fafb'
            }}>
              {editingProduct?.id === product.id ? (
                // Edit Mode
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px'
                  }}>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      style={{
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                      placeholder="Product name"
                    />
                    <select
                      value={editingProduct.category_id}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                      style={{
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                      style={{
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                      placeholder="Price"
                    />
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px'
                    }}>
                      <input
                        type="checkbox"
                        id={`active-${editingProduct.id}`}
                        checked={editingProduct.is_active}
                        onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                        style={{ marginRight: '8px' }}
                      />
                      <label htmlFor={`active-${editingProduct.id}`} style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        Active
                      </label>
                    </div>
                  </div>

                  <textarea
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      outline: 'none',
                      minHeight: '80px'
                    }}
                    placeholder="Product description"
                  />

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleUpdateProduct(editingProduct)}
                      style={{
                        backgroundColor: '#16a34a',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingProduct(null)}
                      style={{
                        backgroundColor: '#6b7280',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px'
                    }}>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: product.is_active ? '#111827' : '#6b7280'
                      }}>
                        {product.name}
                      </h3>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontWeight: '500',
                        ...getStatusColor(product.is_active)
                      }}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: '#059669'
                      }}>
                        {product.price}Ks
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px',
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <p><strong>Category:</strong> {product.category?.name || 'No category'}</p>
                        <p><strong>Created:</strong> {format(new Date(product.created_at), 'MMM d, yyyy')}</p>
                      </div>
                    </div>

                    {product.description && (
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        fontStyle: 'italic'
                      }}>{product.description}</p>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginLeft: '16px'
                  }}>
                    <button
                      onClick={() => setEditingProduct(product)}
                      style={{
                        color: '#3b82f6',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        textDecoration: 'underline'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleProductStatus(product.id, product.is_active)}
                      style={{
                        color: product.is_active ? '#dc2626' : '#16a34a',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        textDecoration: 'underline'
                      }}
                    >
                      {product.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      style={{
                        color: '#dc2626',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        textDecoration: 'underline'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
