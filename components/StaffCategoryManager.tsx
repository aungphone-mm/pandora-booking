'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    display_order: 0
  })

  // Positions state
  const [positions, setPositions] = useState<StaffPosition[]>([])
  const [editingPosition, setEditingPosition] = useState<StaffPosition | null>(null)
  const [newPosition, setNewPosition] = useState({
    category_id: '',
    name: '',
    description: '',
    display_order: 0
  })

  // Specializations state
  const [specializations, setSpecializations] = useState<StaffSpecialization[]>([])
  const [editingSpecialization, setEditingSpecialization] = useState<StaffSpecialization | null>(null)
  const [newSpecialization, setNewSpecialization] = useState({
    category_id: '',
    name: '',
    description: '',
    display_order: 0
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadCategories(),
        loadPositions(),
        loadSpecializations()
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_categories')
        .select('*')
        .order('display_order')

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  const loadPositions = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_positions')
        .select('*')
        .order('display_order')

      if (error) throw error
      setPositions(data || [])
    } catch (err) {
      console.error('Error loading positions:', err)
    }
  }

  const loadSpecializations = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_specializations')
        .select('*')
        .order('display_order')

      if (error) throw error
      setSpecializations(data || [])
    } catch (err) {
      console.error('Error loading specializations:', err)
    }
  }

  // Category functions
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('staff_categories')
        .insert([{
          name: newCategory.name.trim(),
          description: newCategory.description.trim(),
          display_order: newCategory.display_order
        }])

      if (error) throw error

      setNewCategory({ name: '', description: '', display_order: 0 })
      loadCategories()
    } catch (err) {
      console.error('Error adding category:', err)
      alert('Error adding category')
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
          description: category.description.trim(),
          display_order: category.display_order
        })
        .eq('id', category.id)

      if (error) throw error

      setEditingCategory(null)
      loadCategories()
    } catch (err) {
      console.error('Error updating category:', err)
      alert('Error updating category')
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
      const { error } = await supabase
        .from('staff_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadAllData()
    } catch (err) {
      console.error('Error deleting category:', err)
      alert('Error deleting category')
    } finally {
      setSaving(false)
    }
  }

  // Position functions
  const handleAddPosition = async () => {
    if (!newPosition.name.trim() || !newPosition.category_id) return

    try {
      setSaving(true)
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
      loadPositions()
    } catch (err) {
      console.error('Error adding position:', err)
      alert('Error adding position')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePosition = async (position: StaffPosition) => {
    if (!position.name.trim()) return

    try {
      setSaving(true)
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
    } catch (err) {
      console.error('Error updating position:', err)
      alert('Error updating position')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePosition = async (id: string) => {
    if (!confirm('Are you sure you want to delete this position?')) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('staff_positions')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadPositions()
    } catch (err) {
      console.error('Error deleting position:', err)
      alert('Error deleting position')
    } finally {
      setSaving(false)
    }
  }

  // Specialization functions
  const handleAddSpecialization = async () => {
    if (!newSpecialization.name.trim()) return

    try {
      setSaving(true)
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
      loadSpecializations()
    } catch (err) {
      console.error('Error adding specialization:', err)
      alert('Error adding specialization')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSpecialization = async (specialization: StaffSpecialization) => {
    if (!specialization.name.trim()) return

    try {
      setSaving(true)
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
    } catch (err) {
      console.error('Error updating specialization:', err)
      alert('Error updating specialization')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSpecialization = async (id: string) => {
    if (!confirm('Are you sure you want to delete this specialization?')) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('staff_specializations')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadSpecializations()
    } catch (err) {
      console.error('Error deleting specialization:', err)
      alert('Error deleting specialization')
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
      <h2 className="text-2xl font-bold mb-6">Staff Structure Management</h2>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'categories', label: 'Categories', count: categories.length },
            { key: 'positions', label: 'Positions', count: positions.length },
            { key: 'specializations', label: 'Specializations', count: specializations.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          {/* Add new category form */}
          <div className="mb-8 p-4 border rounded">
            <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="px-3 py-2 border rounded"
                placeholder="Category name"
              />
              <input
                type="text"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="px-3 py-2 border rounded"
                placeholder="Description"
              />
              <input
                type="number"
                value={newCategory.display_order}
                onChange={(e) => setNewCategory({ ...newCategory, display_order: parseInt(e.target.value) || 0 })}
                className="px-3 py-2 border rounded"
                placeholder="Order"
                min="0"
              />
              <button
                onClick={handleAddCategory}
                disabled={saving || !newCategory.name.trim()}
                className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 disabled:opacity-50"
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
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-left py-2">Order</th>
                  <th className="text-left py-2">Positions</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
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
                          type="text"
                          value={editingCategory.description}
                          onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                          className="px-2 py-1 border rounded w-full"
                        />
                      ) : (
                        <span className="text-sm text-gray-600">{category.description}</span>
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
                      <span className="text-sm text-blue-600">
                        {positions.filter(p => p.category_id === category.id).length}
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
          </div>
        </div>
      )}

      {/* Positions Tab */}
      {activeTab === 'positions' && (
        <div>
          {/* Add new position form */}
          <div className="mb-8 p-4 border rounded">
            <h3 className="text-lg font-semibold mb-4">Add New Position</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <select
                value={newPosition.category_id}
                onChange={(e) => setNewPosition({ ...newPosition, category_id: e.target.value })}
                className="px-3 py-2 border rounded"
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
                className="px-3 py-2 border rounded"
                placeholder="Position name"
              />
              <input
                type="text"
                value={newPosition.description}
                onChange={(e) => setNewPosition({ ...newPosition, description: e.target.value })}
                className="px-3 py-2 border rounded"
                placeholder="Description"
              />
              <input
                type="number"
                value={newPosition.display_order}
                onChange={(e) => setNewPosition({ ...newPosition, display_order: parseInt(e.target.value) || 0 })}
                className="px-3 py-2 border rounded"
                placeholder="Order"
                min="0"
              />
              <button
                onClick={handleAddPosition}
                disabled={saving || !newPosition.name.trim() || !newPosition.category_id}
                className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Position'}
              </button>
            </div>
          </div>

          {/* Positions list */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Position</th>
                  <th className="text-left py-2">Category</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-left py-2">Order</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => (
                  <tr key={position.id} className="border-b">
                    <td className="py-2">
                      {editingPosition?.id === position.id ? (
                        <input
                          type="text"
                          value={editingPosition.name}
                          onChange={(e) => setEditingPosition({ ...editingPosition, name: e.target.value })}
                          className="px-2 py-1 border rounded w-full"
                        />
                      ) : (
                        <span className="font-medium">{position.name}</span>
                      )}
                    </td>
                    <td className="py-2">
                      {editingPosition?.id === position.id ? (
                        <select
                          value={editingPosition.category_id}
                          onChange={(e) => setEditingPosition({ ...editingPosition, category_id: e.target.value })}
                          className="px-2 py-1 border rounded"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-blue-600">{getCategoryName(position.category_id)}</span>
                      )}
                    </td>
                    <td className="py-2">
                      {editingPosition?.id === position.id ? (
                        <input
                          type="text"
                          value={editingPosition.description}
                          onChange={(e) => setEditingPosition({ ...editingPosition, description: e.target.value })}
                          className="px-2 py-1 border rounded w-full"
                        />
                      ) : (
                        <span className="text-sm text-gray-600">{position.description}</span>
                      )}
                    </td>
                    <td className="py-2">
                      {editingPosition?.id === position.id ? (
                        <input
                          type="number"
                          value={editingPosition.display_order}
                          onChange={(e) => setEditingPosition({ ...editingPosition, display_order: parseInt(e.target.value) || 0 })}
                          className="px-2 py-1 border rounded w-20"
                          min="0"
                        />
                      ) : (
                        <span>{position.display_order}</span>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        {editingPosition?.id === position.id ? (
                          <>
                            <button
                              onClick={() => handleUpdatePosition(editingPosition)}
                              disabled={saving}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPosition(null)}
                              disabled={saving}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingPosition(position)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePosition(position.id)}
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
          </div>
        </div>
      )}

      {/* Specializations Tab */}
      {activeTab === 'specializations' && (
        <div>
          {/* Add new specialization form */}
          <div className="mb-8 p-4 border rounded">
            <h3 className="text-lg font-semibold mb-4">Add New Specialization</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <select
                value={newSpecialization.category_id}
                onChange={(e) => setNewSpecialization({ ...newSpecialization, category_id: e.target.value })}
                className="px-3 py-2 border rounded"
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
                className="px-3 py-2 border rounded"
                placeholder="Specialization name"
              />
              <input
                type="text"
                value={newSpecialization.description}
                onChange={(e) => setNewSpecialization({ ...newSpecialization, description: e.target.value })}
                className="px-3 py-2 border rounded"
                placeholder="Description"
              />
              <input
                type="number"
                value={newSpecialization.display_order}
                onChange={(e) => setNewSpecialization({ ...newSpecialization, display_order: parseInt(e.target.value) || 0 })}
                className="px-3 py-2 border rounded"
                placeholder="Order"
                min="0"
              />
              <button
                onClick={handleAddSpecialization}
                disabled={saving || !newSpecialization.name.trim()}
                className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Specialization'}
              </button>
            </div>
          </div>

          {/* Specializations list */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Specialization</th>
                  <th className="text-left py-2">Category</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-left py-2">Order</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {specializations.map((specialization) => (
                  <tr key={specialization.id} className="border-b">
                    <td className="py-2">
                      {editingSpecialization?.id === specialization.id ? (
                        <input
                          type="text"
                          value={editingSpecialization.name}
                          onChange={(e) => setEditingSpecialization({ ...editingSpecialization, name: e.target.value })}
                          className="px-2 py-1 border rounded w-full"
                        />
                      ) : (
                        <span className="font-medium">{specialization.name}</span>
                      )}
                    </td>
                    <td className="py-2">
                      {editingSpecialization?.id === specialization.id ? (
                        <select
                          value={editingSpecialization.category_id || ''}
                          onChange={(e) => setEditingSpecialization({ ...editingSpecialization, category_id: e.target.value || null })}
                          className="px-2 py-1 border rounded"
                        >
                          <option value="">No Category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-blue-600">{getCategoryName(specialization.category_id)}</span>
                      )}
                    </td>
                    <td className="py-2">
                      {editingSpecialization?.id === specialization.id ? (
                        <input
                          type="text"
                          value={editingSpecialization.description}
                          onChange={(e) => setEditingSpecialization({ ...editingSpecialization, description: e.target.value })}
                          className="px-2 py-1 border rounded w-full"
                        />
                      ) : (
                        <span className="text-sm text-gray-600">{specialization.description}</span>
                      )}
                    </td>
                    <td className="py-2">
                      {editingSpecialization?.id === specialization.id ? (
                        <input
                          type="number"
                          value={editingSpecialization.display_order}
                          onChange={(e) => setEditingSpecialization({ ...editingSpecialization, display_order: parseInt(e.target.value) || 0 })}
                          className="px-2 py-1 border rounded w-20"
                          min="0"
                        />
                      ) : (
                        <span>{specialization.display_order}</span>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        {editingSpecialization?.id === specialization.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateSpecialization(editingSpecialization)}
                              disabled={saving}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingSpecialization(null)}
                              disabled={saving}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingSpecialization(specialization)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSpecialization(specialization.id)}
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
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-pink-600">{categories.length}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{positions.length}</div>
            <div className="text-sm text-gray-600">Positions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{specializations.length}</div>
            <div className="text-sm text-gray-600">Specializations</div>
          </div>
        </div>
      </div>
    </div>
  )
}