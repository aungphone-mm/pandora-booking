'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type ProductCategory = {
  id: string
  name: string
  display_order: number
  created_at: string
}

export default function ProductCategoryManager() {
  const supabase = createClient()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    display_order: 0
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('display_order')

      if (error) throw error
      setCategories(data || [])
    } catch (err: any) {
      console.error('Error loading product categories:', err)
      setError(err.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('product_categories')
        .insert([{
          name: newCategory.name.trim(),
          display_order: newCategory.display_order
        }])

      if (error) throw error

      setNewCategory({ name: '', display_order: 0 })
      setShowAddForm(false)
      loadCategories()
    } catch (err: any) {
      console.error('Error adding category:', err)
      setError(err.message || 'Failed to add category')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCategory = async (category: ProductCategory) => {
    if (!category.name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('product_categories')
        .update({
          name: category.name.trim(),
          display_order: category.display_order
        })
        .eq('id', category.id)

      if (error) throw error

      setEditingCategory(null)
      loadCategories()
    } catch (err: any) {
      console.error('Error updating category:', err)
      setError(err.message || 'Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product category? This may affect existing products.')) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadCategories()
    } catch (err: any) {
      console.error('Error deleting category:', err)
      setError(err.message || 'Failed to delete category')
    } finally {
      setSaving(false)
    }
  }

  const moveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const categoryIndex = categories.findIndex(c => c.id === categoryId)
    if (categoryIndex === -1) return

    const newIndex = direction === 'up' ? categoryIndex - 1 : categoryIndex + 1
    if (newIndex < 0 || newIndex >= categories.length) return

    try {
      setSaving(true)
      setError(null)
      
      // Swap display orders
      const category1 = categories[categoryIndex]
      const category2 = categories[newIndex]
      
      await supabase
        .from('product_categories')
        .update({ display_order: category2.display_order })
        .eq('id', category1.id)
      
      await supabase
        .from('product_categories')
        .update({ display_order: category1.display_order })
        .eq('id', category2.id)

      loadCategories()
    } catch (err: any) {
      console.error('Error reordering categories:', err)
      setError(err.message || 'Failed to reorder categories')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-[300px]">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Product Category Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-purple-600 text-white px-4 py-3 rounded hover:bg-purple-700 font-semibold transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Category'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600">Total Categories</h3>
          <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-900">Max Order</h3>
          <p className="text-2xl font-bold text-purple-900">
            {Math.max(...categories.map(c => c.display_order), 0)}
          </p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">Added This Week</h3>
          <p className="text-2xl font-bold text-green-800">
            {categories.filter(c => new Date(c.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length}
          </p>
        </div>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div className="mb-6 p-6 border-2 border-purple-600 rounded-lg bg-purple-50">
          <h3 className="text-xl font-bold mb-4 text-purple-900">Add New Product Category</h3>
          
          <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                placeholder="Enter category name"
              />
            </div>
            <div className="min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={newCategory.display_order}
                onChange={(e) => setNewCategory({ ...newCategory, display_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddCategory}
              disabled={saving || !newCategory.name.trim()}
              className="bg-purple-600 text-white px-6 py-3 rounded hover:bg-purple-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Adding...' : 'Add Category'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-600 text-white px-6 py-3 rounded hover:bg-gray-700 font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🏷️</div>
          <p className="text-gray-600 text-lg">
            No product categories found. Add your first category to get started.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map((category, index) => (
            <div key={category.id} className="border border-gray-200 rounded-lg p-5 bg-white">
              {editingCategory?.id === category.id ? (
                // Edit Mode
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Name
                      </label>
                      <input
                        type="text"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                      />
                    </div>
                    <div className="min-w-[120px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={editingCategory.display_order}
                        onChange={(e) => setEditingCategory({ ...editingCategory, display_order: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateCategory(editingCategory)}
                      disabled={saving}
                      className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      disabled={saving}
                      className="bg-gray-600 text-white px-6 py-3 rounded hover:bg-gray-700 font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {category.name}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-900">
                        Order: {category.display_order}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600">
                      Created: {format(new Date(category.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>

                  <div className="flex gap-2 items-center ml-4">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="text-blue-600 hover:text-blue-700 underline text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => moveCategory(category.id, 'up')}
                      disabled={index === 0 || saving}
                      className="text-purple-600 hover:text-purple-700 disabled:text-gray-400 disabled:cursor-not-allowed text-xl font-bold transition-colors"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveCategory(category.id, 'down')}
                      disabled={index === categories.length - 1 || saving}
                      className="text-purple-600 hover:text-purple-700 disabled:text-gray-400 disabled:cursor-not-allowed text-xl font-bold transition-colors"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed underline text-sm transition-colors"
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
