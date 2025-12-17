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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-[300px]">
          <div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => window.open('/admin/product-categories', '_blank')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded font-semibold transition-colors"
          >
            Manage Categories
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded font-semibold transition-colors"
          >
            {showAddForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📂 Filter by Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg outline-none focus:border-pink-500 transition-colors"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📊 Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg outline-none focus:border-pink-500 transition-colors"
          >
            <option value="all">All Products</option>
            <option value="active">✅ Active Only</option>
            <option value="inactive">❌ Inactive Only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">🔄 Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'category')}
            className="w-full p-3 border-2 border-gray-300 rounded-lg outline-none focus:border-pink-500 transition-colors"
          >
            <option value="name">Name (A-Z)</option>
            <option value="price">Price (High to Low)</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-slate-50 to-slate-200 p-6 rounded-xl border border-slate-300 shadow-md text-center">
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Total Products</h3>
          <p className="text-4xl font-extrabold text-slate-800">{products.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-200 p-6 rounded-xl border border-green-500 shadow-md text-center">
          <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide mb-2">Active</h3>
          <p className="text-4xl font-extrabold text-green-800">
            {products.filter(p => p.is_active).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-200 p-6 rounded-xl border border-red-500 shadow-md text-center">
          <h3 className="text-sm font-semibold text-red-800 uppercase tracking-wide mb-2">Inactive</h3>
          <p className="text-4xl font-extrabold text-red-800">
            {products.filter(p => !p.is_active).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-200 p-6 rounded-xl border border-blue-500 shadow-md text-center">
          <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-2">Categories</h3>
          <p className="text-4xl font-extrabold text-blue-800">
            {categories.length}
          </p>
        </div>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-400 rounded-xl p-6 mb-6 shadow-lg">
          <h3 className="text-xl font-bold text-pink-800 mb-4">➕ Add New Product</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="✨ Product name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-pink-300 rounded-lg outline-none focus:border-pink-600 transition-colors font-medium"
            />
            <select
              value={newProduct.category_id}
              onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
              className="w-full px-4 py-3 border-2 border-pink-300 rounded-lg outline-none focus:border-pink-600 transition-colors font-medium"
            >
              <option value="">📂 Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="💰 Price"
              step="0.01"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border-2 border-pink-300 rounded-lg outline-none focus:border-pink-600 transition-colors font-medium"
            />
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-pink-300 rounded-lg">
              <input
                type="checkbox"
                id="active-new"
                checked={newProduct.is_active}
                onChange={(e) => setNewProduct({ ...newProduct, is_active: e.target.checked })}
                className="w-5 h-5 cursor-pointer"
              />
              <label htmlFor="active-new" className="text-sm font-semibold text-gray-700 cursor-pointer">
                {newProduct.is_active ? '✅ Active' : '❌ Inactive'}
              </label>
            </div>
          </div>
          
          <textarea
            placeholder="📝 Product description (optional)"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            className="w-full px-4 py-3 border-2 border-pink-300 rounded-lg outline-none focus:border-pink-600 transition-colors font-medium mb-4 min-h-[100px] resize-y"
          />

          <div className="flex gap-3">
            <button
              onClick={handleAddProduct}
              className="bg-gradient-to-br from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              ✅ Add Product
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Products List */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center">
          <div className="mb-4">🛍️</div>
          <p className="text-gray-600 text-lg">
            {filterCategory !== 'all' || filterStatus !== 'all'
              ? `No products found with current filters.`
              : 'No products found. Add your first product to get started.'
            }
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredAndSortedProducts.map(product => (
            <div key={product.id} className={`border border-gray-200 rounded-lg p-5 ${product.is_active ? 'bg-white' : 'bg-gray-50'}`}>
              {editingProduct?.id === product.id ? (
                // Edit Mode
                <div className="flex flex-col gap-4">
                  <div className="grid gap-4">
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-600"
                      placeholder="Product name"
                    />
                    <select
                      value={editingProduct.category_id}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-600"
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
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-600"
                      placeholder="Price"
                    />
                    <div className="p-3">
                      <input
                        type="checkbox"
                        id={`active-${editingProduct.id}`}
                        checked={editingProduct.is_active}
                        onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor={`active-${editingProduct.id}`} className="text-sm font-medium text-gray-700">
                        Active
                      </label>
                    </div>
                  </div>

                  <textarea
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-600 min-h-[80px]"
                    placeholder="Product description"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateProduct(editingProduct)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-semibold transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingProduct(null)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className={`text-xl font-bold ${product.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                        {product.name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-base font-bold text-emerald-600">
                        {product.price}Ks
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div>
                        <p><strong>Category:</strong> {product.category?.name || 'No category'}</p>
                        <p><strong>Created:</strong> {format(new Date(product.created_at), 'MMM d, yyyy')}</p>
                      </div>
                    </div>

                    {product.description && (
                      <p className="text-sm text-gray-600">{product.description}</p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="text-blue-600 hover:text-blue-700 underline text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleProductStatus(product.id, product.is_active)}
                      className={`hover:opacity-75 underline text-sm transition-opacity ${product.is_active ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {product.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-700 underline text-sm transition-colors"
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
