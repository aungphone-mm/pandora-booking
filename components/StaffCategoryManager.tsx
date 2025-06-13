'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type StaffCategory = {
  id: string
  name: string
  display_order: number
  created_at: string
}

export default function StaffCategoryManager() {
  const supabase = createClient()
  const [categories, setCategories] = useState<StaffCategory[]>([])
  const [editingCategory, setEditingCategory] = useState<StaffCategory | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: '',
    display_order: 0
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('staff_categories')
        .select('*')
        .order('display_order')

      if (error) {
        console.error('Error loading staff categories:', error)
        return
      }

      setCategories(data || [])
    } catch (err) {
      console.error('Unexpected error loading categories:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('staff_categories')
        .insert([{
          name: newCategory.name.trim(),
          display_order: newCategory.display_order
        }])

      if (error) {
        console.error('Error adding category:', error)
        alert('Error adding category: ' + error.message)
        return
      }

      setNewCategory({ name: '', display_order: 0 })
      loadCategories()
    } catch (err) {
      console.error('Unexpected error adding category:', err)
      alert('Unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCategory = async (category: StaffCategory) => {
    if (!category.name.trim()) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('staff_categories')
        .update({
          name: category.name.trim(),
          display_order: category.display_order
        })
        .eq('id', category.id)

      if (error) {
        console.error('Error updating category:', error)
        alert('Error updating category: ' + error.message)
        return
      }

      setEditingCategory(null)
      loadCategories()
    } catch (err) {
      console.error('Unexpected error updating category:', err)
      alert('Unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff category? This may affect existing staff members.')) {
      return
    }

    try {
      setSaving(true)
      const { error } = await supabase
        .from('staff_categories')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting category:', error)
        alert('Error deleting category: ' + error.message)
        return
      }

      loadCategories()
    } catch (err) {
      console.error('Unexpected error deleting category:', err)
      alert('Unexpected error occurred')
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
      
      // Swap display orders
      const category1 = categories[categoryIndex]
      const category2 = categories[newIndex]
      
      await supabase
        .from('staff_categories')
        .update({ display_order: category2.display_order })
        .eq('id', category1.id)
      
      await supabase
        .from('staff_categories')
        .update({ display_order: category1.display_order })
        .eq('id', category2.id)

      loadCategories()
    } catch (err) {
      console.error('Error reordering categories:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Staff Category Management</h2>
      
      {/* Add new category form */}
      <div className="mb-8 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-4">Add New Staff Category</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="px-3 py-2 border rounded w-full"
              placeholder="Enter category name"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Order
            </label>
            <input
              type="number"
              value={newCategory.display_order}
              onChange={(e) => setNewCategory({ ...newCategory, display_order: parseInt(e.target.value) || 0 })}
              className="px-3 py-2 border rounded w-full"
              min="0"
            />
          </div>
          <button
            onClick={handleAddCategory}
            disabled={saving || !newCategory.name.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Adding...' : 'Add Category'}
          </button>
        </div>
      </div>

      {/* Categories list */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Category Name</th>
              <th className="text-left py-2">Display Order</th>
              <th className="text-left py-2">Created</th>
              <th className="text-left py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) => (
              <tr key={category.id} className="border-b">
                <td className="py-2">
                  {editingCategory?.id === category.id ? (
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="px-2 py-1 border rounded w-full"
                    />
                  ) : (
                    <span className="font-medium">{category.name}</span>
                  )}
                </td>
                <td className="py-2">
                  {editingCategory?.id === category.id ? (
                    <input
                      type="number"
                      value={editingCategory.display_order}
                      onChange={(e) => setEditingCategory({ ...editingCategory, display_order: parseInt(e.target.value) || 0 })}
                      className="px-2 py-1 border rounded w-20"
                      min="0"
                    />
                  ) : (
                    <span>{category.display_order}</span>
                  )}
                </td>
                <td className="py-2">
                  <span className="text-sm text-gray-600">
                    {new Date(category.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex gap-2">
                    {editingCategory?.id === category.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateCategory(editingCategory)}
                          disabled={saving}
                          className="text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          disabled={saving}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => moveCategory(category.id, 'up')}
                          disabled={index === 0 || saving}
                          className="text-purple-600 hover:text-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveCategory(category.id, 'down')}
                          disabled={index === categories.length - 1 || saving}
                          className="text-purple-600 hover:text-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={saving}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {categories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No staff categories found. Add one to get started.
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
            <div className="text-sm text-gray-600">Total Categories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {Math.max(...categories.map(c => c.display_order), 0)}
            </div>
            <div className="text-sm text-gray-600">Max Order</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {categories.filter(c => new Date(c.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length}
            </div>
            <div className="text-sm text-gray-600">Added This Week</div>
          </div>
        </div>
      </div>
    </div>
  )
}
