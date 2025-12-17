'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type StaffCategory = {
  id: string
  name: string
  description: string
  display_order: number
  created_at: string
}

type StaffPosition = {
  id: string
  category_id: string
  name: string
  description: string
  display_order: number
  created_at: string
}

type StaffSpecialization = {
  id: string
  category_id: string | null
  name: string
  description: string
  display_order: number
  created_at: string
}

export default function StaffCategoryManager() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'categories' | 'positions' | 'specializations'>('categories')
  
  // Categories state
  const [categories, setCategories] = useState<StaffCategory[]>([])
  const [editingCategory, setEditingCategory] = useState<StaffCategory | null>(null)
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    display_order: 0
  })

  // Positions state
  const [positions, setPositions] = useState<StaffPosition[]>([])
  const [editingPosition, setEditingPosition] = useState<StaffPosition | null>(null)
  const [showAddPositionForm, setShowAddPositionForm] = useState(false)
  const [newPosition, setNewPosition] = useState({
    category_id: '',
    name: '',
    description: '',
    display_order: 0
  })

  // Specializations state
  const [specializations, setSpecializations] = useState<StaffSpecialization[]>([])
  const [editingSpecialization, setEditingSpecialization] = useState<StaffSpecialization | null>(null)
  const [showAddSpecializationForm, setShowAddSpecializationForm] = useState(false)
  const [newSpecialization, setNewSpecialization] = useState({
    category_id: '',
    name: '',
    description: '',
    display_order: 0
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      await Promise.all([
        loadCategories(),
        loadPositions(),
        loadSpecializations()
      ])
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('staff_categories')
      .select('*')
      .order('display_order')

    if (error) throw error
    setCategories(data || [])
  }

  const loadPositions = async () => {
    const { data, error } = await supabase
      .from('staff_positions')
      .select('*')
      .order('display_order')

    if (error) throw error
    setPositions(data || [])
  }

  const loadSpecializations = async () => {
    const { data, error } = await supabase
      .from('staff_specializations')
      .select('*')
      .order('display_order')

    if (error) throw error
    setSpecializations(data || [])
  }

  // Category functions
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('staff_categories')
        .insert([{
          name: newCategory.name.trim(),
          description: newCategory.description.trim(),
          display_order: newCategory.display_order
        }])

      if (error) throw error

      setNewCategory({ name: '', description: '', display_order: 0 })
      setShowAddCategoryForm(false)
      loadCategories()
    } catch (err: any) {
      console.error('Error adding category:', err)
      setError(err.message || 'Failed to add category')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCategory = async (category: StaffCategory) => {
    if (!category.name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('staff_categories')
        .update({
          name: category.name.trim(),
          description: category.description.trim(),
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
    if (!confirm('Are you sure? This will also delete all positions and specializations in this category.')) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('staff_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadAllData()
    } catch (err: any) {
      console.error('Error deleting category:', err)
      setError(err.message || 'Failed to delete category')
    } finally {
      setSaving(false)
    }
  }

  // Position functions
  const handleAddPosition = async () => {
    if (!newPosition.name.trim() || !newPosition.category_id) {
      setError('Position name and category are required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('staff_positions')
        .insert([{
          category_id: newPosition.category_id,
          name: newPosition.name.trim(),
          description: newPosition.description.trim(),
          display_order: newPosition.display_order
        }])

      if (error) throw error

      setNewPosition({ category_id: '', name: '', description: '', display_order: 0 })
      setShowAddPositionForm(false)
      loadPositions()
    } catch (err: any) {
      console.error('Error adding position:', err)
      setError(err.message || 'Failed to add position')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePosition = async (position: StaffPosition) => {
    if (!position.name.trim()) {
      setError('Position name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('staff_positions')
        .update({
          category_id: position.category_id,
          name: position.name.trim(),
          description: position.description.trim(),
          display_order: position.display_order
        })
        .eq('id', position.id)

      if (error) throw error

      setEditingPosition(null)
      loadPositions()
    } catch (err: any) {
      console.error('Error updating position:', err)
      setError(err.message || 'Failed to update position')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePosition = async (id: string) => {
    if (!confirm('Are you sure you want to delete this position?')) return

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('staff_positions')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadPositions()
    } catch (err: any) {
      console.error('Error deleting position:', err)
      setError(err.message || 'Failed to delete position')
    } finally {
      setSaving(false)
    }
  }

  // Specialization functions
  const handleAddSpecialization = async () => {
    if (!newSpecialization.name.trim()) {
      setError('Specialization name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('staff_specializations')
        .insert([{
          category_id: newSpecialization.category_id || null,
          name: newSpecialization.name.trim(),
          description: newSpecialization.description.trim(),
          display_order: newSpecialization.display_order
        }])

      if (error) throw error

      setNewSpecialization({ category_id: '', name: '', description: '', display_order: 0 })
      setShowAddSpecializationForm(false)
      loadSpecializations()
    } catch (err: any) {
      console.error('Error adding specialization:', err)
      setError(err.message || 'Failed to add specialization')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSpecialization = async (specialization: StaffSpecialization) => {
    if (!specialization.name.trim()) {
      setError('Specialization name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('staff_specializations')
        .update({
          category_id: specialization.category_id || null,
          name: specialization.name.trim(),
          description: specialization.description.trim(),
          display_order: specialization.display_order
        })
        .eq('id', specialization.id)

      if (error) throw error

      setEditingSpecialization(null)
      loadSpecializations()
    } catch (err: any) {
      console.error('Error updating specialization:', err)
      setError(err.message || 'Failed to update specialization')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSpecialization = async (id: string) => {
    if (!confirm('Are you sure you want to delete this specialization?')) return

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('staff_specializations')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadSpecializations()
    } catch (err: any) {
      console.error('Error deleting specialization:', err)
      setError(err.message || 'Failed to delete specialization')
    } finally {
      setSaving(false)
    }
  }

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'No Category'
    const category = categories.find(c => c.id === categoryId)
    return category ? category.name : 'Unknown Category'
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Staff Structure Management</h2>
      </div>

      {error && (
        <div className="p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mb-6">
        <div className="bg-fuchsia-100 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-fuchsia-800">Categories</h3>
          <p className="text-2xl font-bold text-fuchsia-800">{categories.length}</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900">Positions</h3>
          <p className="text-2xl font-bold text-blue-900">{positions.length}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">Specializations</h3>
          <p className="text-2xl font-bold text-green-800">{specializations.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2">
          {[
            { key: 'categories', label: 'Categories', count: categories.length },
            { key: 'positions', label: 'Positions', count: positions.length },
            { key: 'specializations', label: 'Specializations', count: specializations.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-3 border-b-2 font-semibold text-sm transition-all ${
                activeTab === tab.key
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-fuchsia-800">Staff Categories</h3>
            <button
              onClick={() => setShowAddCategoryForm(!showAddCategoryForm)}
              className="bg-fuchsia-800 hover:bg-fuchsia-900 text-white px-4 py-3 rounded font-semibold transition-colors"
            >
              {showAddCategoryForm ? 'Cancel' : 'Add Category'}
            </button>
          </div>

          {/* Add Category Form */}
          {showAddCategoryForm && (
            <div className="p-6">
              <h4 className="mb-4">Add New Category</h4>
              
              <div className="mb-4">
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                  placeholder="Category name"
                />
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                  placeholder="Description"
                />
                <input
                  type="number"
                  value={newCategory.display_order}
                  onChange={(e) => setNewCategory({ ...newCategory, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                  placeholder="Display order"
                  min="0"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddCategory}
                  disabled={saving || !newCategory.name.trim()}
                  className="bg-fuchsia-800 hover:bg-fuchsia-900 text-white px-6 py-3 rounded font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Adding...' : 'Add Category'}
                </button>
                <button
                  onClick={() => setShowAddCategoryForm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Categories List */}
          {categories.length === 0 ? (
            <div className="text-center p-6">
              <div className="mb-4">📁</div>
              <p className="text-gray-600 text-lg">
                No categories found. Add your first category to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {categories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-5 bg-white">
                  {editingCategory?.id === category.id ? (
                    // Edit Mode
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                          placeholder="Category name"
                        />
                        <input
                          type="text"
                          value={editingCategory.description}
                          onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                          placeholder="Description"
                        />
                        <input
                          type="number"
                          value={editingCategory.display_order}
                          onChange={(e) => setEditingCategory({ ...editingCategory, display_order: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                          placeholder="Display order"
                          min="0"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateCategory(editingCategory)}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          disabled={saving}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-xl font-bold text-gray-900">
                            {category.name}
                          </h4>
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-900">
                            Order: {category.display_order}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-800">
                            {positions.filter(p => p.category_id === category.id).length} positions
                          </span>
                        </div>
                        
                        <p className="mb-2">
                          {category.description || 'No description'}
                        </p>

                        <p className="text-sm text-gray-600">
                          Created: {format(new Date(category.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="text-blue-600 hover:text-blue-700 underline text-sm transition-colors"
                        >
                          Edit
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
      )}

      {/* Positions Tab */}
      {activeTab === 'positions' && (
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-blue-900">Staff Positions</h3>
            <button
              onClick={() => setShowAddPositionForm(!showAddPositionForm)}
              className="bg-blue-900 hover:bg-blue-950 text-white px-4 py-3 rounded font-semibold transition-colors"
            >
              {showAddPositionForm ? 'Cancel' : 'Add Position'}
            </button>
          </div>

          {/* Add Position Form */}
          {showAddPositionForm && (
            <div className="p-6">
              <h4 className="mb-4">Add New Position</h4>
              
              <div className="mb-4">
                <select
                  value={newPosition.category_id}
                  onChange={(e) => setNewPosition({ ...newPosition, category_id: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newPosition.name}
                  onChange={(e) => setNewPosition({ ...newPosition, name: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                  placeholder="Position name"
                />
                <input
                  type="text"
                  value={newPosition.description}
                  onChange={(e) => setNewPosition({ ...newPosition, description: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                  placeholder="Description"
                />
                <input
                  type="number"
                  value={newPosition.display_order}
                  onChange={(e) => setNewPosition({ ...newPosition, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                  placeholder="Display order"
                  min="0"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddPosition}
                  disabled={saving || !newPosition.name.trim() || !newPosition.category_id}
                  className="bg-blue-900 hover:bg-blue-950 text-white px-6 py-3 rounded font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Adding...' : 'Add Position'}
                </button>
                <button
                  onClick={() => setShowAddPositionForm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Positions List */}
          {positions.length === 0 ? (
            <div className="text-center p-6">
              <div className="mb-4">💼</div>
              <p className="text-gray-600 text-lg">
                No positions found. Add your first position to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {positions.map((position) => (
                <div key={position.id} className="border border-gray-200 rounded-lg p-5 bg-white">
                  {editingPosition?.id === position.id ? (
                    // Edit Mode
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                        <select
                          value={editingPosition.category_id}
                          onChange={(e) => setEditingPosition({ ...editingPosition, category_id: e.target.value })}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={editingPosition.name}
                          onChange={(e) => setEditingPosition({ ...editingPosition, name: e.target.value })}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                          placeholder="Position name"
                        />
                        <input
                          type="text"
                          value={editingPosition.description}
                          onChange={(e) => setEditingPosition({ ...editingPosition, description: e.target.value })}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                          placeholder="Description"
                        />
                        <input
                          type="number"
                          value={editingPosition.display_order}
                          onChange={(e) => setEditingPosition({ ...editingPosition, display_order: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                          placeholder="Display order"
                          min="0"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdatePosition(editingPosition)}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setEditingPosition(null)}
                          disabled={saving}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-xl font-bold text-gray-900">
                            {position.name}
                          </h4>
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-fuchsia-50 text-fuchsia-800">
                            {getCategoryName(position.category_id)}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-900">
                            Order: {position.display_order}
                          </span>
                        </div>
                        
                        <p className="mb-2">
                          {position.description || 'No description'}
                        </p>

                        <p className="text-sm text-gray-600">
                          Created: {format(new Date(position.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setEditingPosition(position)}
                          className="text-blue-600 hover:text-blue-700 underline text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePosition(position.id)}
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
      )}

      {/* Specializations Tab */}
      {activeTab === 'specializations' && (
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-green-800">Staff Specializations</h3>
            <button
              onClick={() => setShowAddSpecializationForm(!showAddSpecializationForm)}
              className="bg-green-800 hover:bg-green-900 text-white px-4 py-3 rounded font-semibold transition-colors"
            >
              {showAddSpecializationForm ? 'Cancel' : 'Add Specialization'}
            </button>
          </div>

          {/* Add Specialization Form */}
          {showAddSpecializationForm && (
            <div className="p-6">
              <h4 className="mb-4">Add New Specialization</h4>
              
              <div className="mb-4">
                <select
                  value={newSpecialization.category_id}
                  onChange={(e) => setNewSpecialization({ ...newSpecialization, category_id: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                >
                  <option value="">Select Category (Optional)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newSpecialization.name}
                  onChange={(e) => setNewSpecialization({ ...newSpecialization, name: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                  placeholder="Specialization name"
                />
                <input
                  type="text"
                  value={newSpecialization.description}
                  onChange={(e) => setNewSpecialization({ ...newSpecialization, description: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                  placeholder="Description"
                />
                <input
                  type="number"
                  value={newSpecialization.display_order}
                  onChange={(e) => setNewSpecialization({ ...newSpecialization, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                  placeholder="Display order"
                  min="0"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddSpecialization}
                  disabled={saving || !newSpecialization.name.trim()}
                  className="bg-green-800 hover:bg-green-900 text-white px-6 py-3 rounded font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Adding...' : 'Add Specialization'}
                </button>
                <button
                  onClick={() => setShowAddSpecializationForm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Specializations List */}
          {specializations.length === 0 ? (
            <div className="text-center p-6">
              <div className="mb-4">⭐</div>
              <p className="text-gray-600 text-lg">
                No specializations found. Add your first specialization to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {specializations.map((specialization) => (
                <div key={specialization.id} className="border border-gray-200 rounded-lg p-5 bg-white">
                  {editingSpecialization?.id === specialization.id ? (
                    // Edit Mode
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                        <select
                          value={editingSpecialization.category_id || ''}
                          onChange={(e) => setEditingSpecialization({ ...editingSpecialization, category_id: e.target.value || null })}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                        >
                          <option value="">No Category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={editingSpecialization.name}
                          onChange={(e) => setEditingSpecialization({ ...editingSpecialization, name: e.target.value })}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                          placeholder="Specialization name"
                        />
                        <input
                          type="text"
                          value={editingSpecialization.description}
                          onChange={(e) => setEditingSpecialization({ ...editingSpecialization, description: e.target.value })}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                          placeholder="Description"
                        />
                        <input
                          type="number"
                          value={editingSpecialization.display_order}
                          onChange={(e) => setEditingSpecialization({ ...editingSpecialization, display_order: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                          placeholder="Display order"
                          min="0"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateSpecialization(editingSpecialization)}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setEditingSpecialization(null)}
                          disabled={saving}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-xl font-bold text-gray-900">
                            {specialization.name}
                          </h4>
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-fuchsia-50 text-fuchsia-800">
                            {getCategoryName(specialization.category_id)}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-800">
                            Order: {specialization.display_order}
                          </span>
                        </div>
                        
                        <p className="mb-2">
                          {specialization.description || 'No description'}
                        </p>

                        <p className="text-sm text-gray-600">
                          Created: {format(new Date(specialization.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setEditingSpecialization(specialization)}
                          className="text-blue-600 hover:text-blue-700 underline text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSpecialization(specialization.id)}
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
      )}
    </div>
  )
}
