'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type ServiceCategory = {
  id: string
  name: string
  display_order: number
  created_at: string
}

export default function ServiceCategoryManager() {
  const supabase = createClient()
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
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
    
    // Add enhanced CSS animations
    const style = document.createElement('style')
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .category-card {
        transition: all 0.3s ease-in-out;
      }
      .category-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
      }
      .filter-select {
        transition: all 0.2s ease-in-out;
      }
      .filter-select:focus {
        box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
        border-color: #9333ea;
      }
      .action-button {
        transition: all 0.2s ease-in-out;
      }
      .action-button:hover {
        transform: translateY(-1px);
      }
      .form-input {
        transition: all 0.2s ease-in-out;
      }
      .form-input:focus {
        box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
        border-color: #9333ea;
      }
      .move-button {
        transition: all 0.2s ease-in-out;
      }
      .move-button:hover {
        animation: bounce 0.6s ease-in-out;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('display_order')

      if (error) throw error
      setCategories(data || [])
    } catch (err: any) {
      console.error('Error loading service categories:', err)
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
        .from('service_categories')
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

  const handleUpdateCategory = async (category: ServiceCategory) => {
    if (!category.name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('service_categories')
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
    if (!confirm('Are you sure you want to delete this service category? This may affect existing services.')) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('service_categories')
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
        .from('service_categories')
        .update({ display_order: category2.display_order })
        .eq('id', category1.id)
      
      await supabase
        .from('service_categories')
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
      <div className="bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-12 text-center border border-slate-100">
        <div className="inline-block w-12 h-12 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin mb-5"></div>
        <h2 className="mb-2">Loading Categories</h2>
        <p className="text-slate-500 text-base">Please wait while we fetch your category data...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.6s_ease-out]">
      {/* Enhanced Header */}
      <div className="category-card bg-gradient-to-br from-purple-600 to-purple-700 rounded-[20px] shadow-[0_15px_35px_rgba(147,51,234,0.3)] p-8 text-white relative overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-4xl font-extrabold m-0 mb-2 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">📂 Service Category Management</h2>
            <p className="text-lg m-0 opacity-90">Organize your services into meaningful categories</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="action-button bg-gradient-to-br from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white px-6 py-4 rounded-xl border-none cursor-pointer font-semibold text-base shadow-[0_6px_20px_rgba(236,72,153,0.3)] flex items-center gap-2 transition-all"
          >
            {showAddForm ? '❌ Cancel' : '➕ Add Category'}
          </button>
        </div>
      </div>

      {error && (
        <div className="slideIn bg-gradient-to-br from-red-50 to-red-100 border border-red-400 rounded-2xl p-6 shadow-[0_8px_25px_rgba(248,113,113,0.2)]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-red-600 font-semibold m-0 text-lg">{error}</p>
          </div>
        </div>
      )}

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
        <div className="category-card bg-gradient-to-br from-slate-50 to-slate-200 p-6 rounded-2xl border border-slate-200 shadow-[0_6px_20px_rgba(0,0,0,0.06)] text-center">
          <div className="mb-2">📂</div>
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider m-0 mb-2">Total Categories</h3>
          <p className="text-5xl font-extrabold text-slate-800 m-0">{categories.length}</p>
        </div>

        <div className="category-card bg-gradient-to-br from-purple-100 to-purple-300 p-6 rounded-2xl border border-purple-600 shadow-[0_6px_20px_rgba(147,51,234,0.15)] text-center">
          <div className="mb-2">📊</div>
          <h3 className="text-sm font-semibold text-purple-800 uppercase tracking-wider m-0 mb-2">Max Order</h3>
          <p className="text-5xl font-extrabold text-purple-800 m-0">
            {Math.max(...categories.map(c => c.display_order), 0)}
          </p>
        </div>

        <div className="category-card bg-gradient-to-br from-green-100 to-green-300 p-6 rounded-2xl border border-green-700 shadow-[0_6px_20px_rgba(34,197,94,0.15)] text-center">
          <div className="mb-2">📅</div>
          <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wider m-0 mb-2">Added This Week</h3>
          <p className="text-5xl font-extrabold text-green-800 m-0">
            {categories.filter(c => new Date(c.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length}
          </p>
        </div>

        <div className="category-card bg-gradient-to-br from-blue-100 to-blue-300 p-6 rounded-2xl border border-blue-600 shadow-[0_6px_20px_rgba(59,130,246,0.15)] text-center">
          <div className="mb-2">🔢</div>
          <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wider m-0 mb-2">Avg Order</h3>
          <p className="text-5xl font-extrabold text-blue-900 m-0">
            {categories.length > 0
              ? Math.round(categories.reduce((sum, c) => sum + c.display_order, 0) / categories.length)
              : 0
            }
          </p>
        </div>
      </div>

      {/* Enhanced Add Category Form */}
      {showAddForm && (
        <div className="category-card bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-yellow-500 rounded-[20px] p-8 shadow-[0_15px_35px_rgba(234,179,8,0.2)]">
          <div className="mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center text-xl">➕</div>
            <h3 className="text-2xl font-bold m-0 text-yellow-700">Add New Service Category</h3>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-5 items-end">
            <div>
              <label className="mb-2">
                📂 Category Name
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="form-input w-full p-4 border-2 border-yellow-300 rounded-xl outline-none text-base font-medium bg-white"
                placeholder="Enter category name"
              />
            </div>
            <div className="min-w-[160px]">
              <label className="mb-2">
                📊 Display Order
              </label>
              <input
                type="number"
                value={newCategory.display_order}
                onChange={(e) => setNewCategory({ ...newCategory, display_order: parseInt(e.target.value) || 0 })}
                className="form-input w-full p-4 border-2 border-yellow-300 rounded-xl outline-none text-base font-medium bg-white"
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleAddCategory}
              disabled={saving || !newCategory.name.trim()}
              className={`action-button text-white px-6 py-4 rounded-xl border-none font-semibold text-base shadow-[0_6px_20px_rgba(22,163,74,0.3)] ${saving || !newCategory.name.trim() ? 'bg-gradient-to-br from-gray-400 to-gray-500 cursor-not-allowed opacity-60' : 'bg-gradient-to-br from-green-600 to-green-700 cursor-pointer'}`}
            >
              {saving ? '⏳ Adding...' : '✅ Add Category'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="action-button bg-gradient-to-br from-gray-500 to-gray-600 text-white px-6 py-4 rounded-xl border-none cursor-pointer font-semibold text-base shadow-[0_6px_20px_rgba(107,114,128,0.3)]"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Categories List */}
      <div className="category-card bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-0 border border-slate-100 overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-16 px-8 text-slate-500">
            <div className="mb-4">📂</div>
            <h3 className="mb-2">
              No service categories found
            </h3>
            <p className="text-base opacity-80">
              Add your first category to organize your services.
            </p>
          </div>
        ) : (
          <div className="p-8">
            <div className="mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center text-xl">📂</div>
              <h3 className="text-2xl font-bold m-0 text-slate-800">Service Categories ({categories.length})</h3>
            </div>

            <div className="flex flex-col gap-5">
              {categories.map((category, index) => (
                <div key={category.id} className="p-6" className="category-card">
                  {editingCategory?.id === category.id ? (
                    // Edit Mode
                    <div className="flex flex-col gap-5">
                      <div className="grid grid-cols-[1fr_auto] gap-5 items-end">
                        <div>
                          <label className="mb-2">
                            📂 Category Name
                          </label>
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="form-input w-full p-4 border-2 border-purple-600 rounded-xl outline-none text-base font-medium"
                          />
                        </div>
                        <div className="min-w-[160px]">
                          <label className="mb-2">
                            📊 Display Order
                          </label>
                          <input
                            type="number"
                            value={editingCategory.display_order}
                            onChange={(e) => setEditingCategory({ ...editingCategory, display_order: parseInt(e.target.value) || 0 })}
                            className="form-input w-full p-4 border-2 border-purple-600 rounded-xl outline-none text-base font-medium"
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleUpdateCategory(editingCategory)}
                          disabled={saving}
                          className={`action-button text-white py-3 px-6 rounded-xl border-none font-semibold text-[0.95rem] shadow-[0_4px_12px_rgba(22,163,74,0.3)] ${saving ? 'bg-gradient-to-br from-gray-400 to-gray-500 cursor-not-allowed opacity-60' : 'bg-gradient-to-br from-green-600 to-green-700 cursor-pointer'}`}
                        >
                          {saving ? '⏳ Saving...' : '✅ Save Changes'}
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          disabled={saving}
                          className={`action-button text-white py-3 px-6 rounded-xl border-none font-semibold text-[0.95rem] shadow-[0_4px_12px_rgba(107,114,128,0.3)] ${saving ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} bg-gradient-to-br from-gray-500 to-gray-600`}
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h3 className="text-[1.4rem] font-bold text-slate-800 m-0">
                            📂 {category.name}
                          </h3>
                          <span className="text-[0.85rem] py-1.5 px-3 rounded-[20px] font-semibold bg-purple-100 text-purple-700 border border-purple-300">
                            📊 Order: {category.display_order}
                          </span>
                        </div>

                        <p className="text-[0.95rem] text-slate-500 m-0">
                          📅 Created: {format(new Date(category.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <div className="flex gap-2 items-center ml-6">
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="action-button bg-gradient-to-br from-blue-500 to-blue-700 text-white border-none rounded-lg py-2 px-4 cursor-pointer text-sm font-semibold shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => moveCategory(category.id, 'up')}
                          disabled={index === 0 || saving}
                          className={`move-button text-white border-none rounded-lg py-2 px-3 text-base font-bold ${saving || index === 0 ? 'bg-gradient-to-br from-gray-300 to-gray-400 cursor-not-allowed opacity-50 shadow-none' : 'bg-gradient-to-br from-purple-500 to-purple-700 cursor-pointer shadow-[0_4px_12px_rgba(139,92,246,0.3)]'}`}
                          title="Move up"
                        >
                          ⬆️
                        </button>
                        <button
                          onClick={() => moveCategory(category.id, 'down')}
                          disabled={index === categories.length - 1 || saving}
                          className={`move-button text-white border-none rounded-lg py-2 px-3 text-base font-bold ${saving || index === categories.length - 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 cursor-not-allowed opacity-50 shadow-none' : 'bg-gradient-to-br from-purple-500 to-purple-700 cursor-pointer shadow-[0_4px_12px_rgba(139,92,246,0.3)]'}`}
                          title="Move down"
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={saving}
                          className={`action-button text-white border-none rounded-lg py-2 px-4 text-sm font-semibold ${saving ? 'bg-gradient-to-br from-gray-300 to-gray-400 cursor-not-allowed opacity-50 shadow-none' : 'bg-gradient-to-br from-red-600 to-red-700 cursor-pointer shadow-[0_4px_12px_rgba(220,38,38,0.3)]'}`}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
