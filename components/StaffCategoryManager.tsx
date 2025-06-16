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
          display_order: category.display_order,
          updated_at: new Date().toISOString()
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
          display_order: position.display_order,
          updated_at: new Date().toISOString()
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
          display_order: specialization.display_order,
          updated_at: new Date().toISOString()
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

  const getTabStyle = (isActive: boolean) => ({
    padding: '12px 16px',
    borderBottom: isActive ? '2px solid #ec4899' : '2px solid transparent',
    fontWeight: '600',
    fontSize: '0.875rem',
    color: isActive ? '#ec4899' : '#6b7280',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  })

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
            border: '2px solid #8b5cf6',
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
        }}>Staff Structure Management</h2>
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

      {/* Summary Stats */}
      <div style={{
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: '#fef7ff',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#a21caf'
          }}>Categories</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#a21caf'
          }}>{categories.length}</p>
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
          }}>Positions</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1e40af'
          }}>{positions.length}</p>
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
          }}>Specializations</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#166534'
          }}>{specializations.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'categories', label: 'Categories', count: categories.length },
            { key: 'positions', label: 'Positions', count: positions.length },
            { key: 'specializations', label: 'Specializations', count: specializations.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={getTabStyle(activeTab === tab.key)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#a21caf'
            }}>Staff Categories</h3>
            <button
              onClick={() => setShowAddCategoryForm(!showAddCategoryForm)}
              style={{
                backgroundColor: '#a21caf',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {showAddCategoryForm ? 'Cancel' : 'Add Category'}
            </button>
          </div>

          {/* Add Category Form */}
          {showAddCategoryForm && (
            <div style={{
              marginBottom: '24px',
              padding: '24px',
              border: '2px solid #a21caf',
              borderRadius: '8px',
              backgroundColor: '#fef7ff'
            }}>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                marginBottom: '16px',
                color: '#a21caf'
              }}>Add New Category</h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                  placeholder="Category name"
                />
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                  placeholder="Description"
                />
                <input
                  type="number"
                  value={newCategory.display_order}
                  onChange={(e) => setNewCategory({ ...newCategory, display_order: parseInt(e.target.value) || 0 })}
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                  placeholder="Display order"
                  min="0"
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleAddCategory}
                  disabled={saving || !newCategory.name.trim()}
                  style={{
                    backgroundColor: saving ? '#9ca3af' : '#a21caf',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: saving || !newCategory.name.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    opacity: saving || !newCategory.name.trim() ? 0.6 : 1
                  }}
                >
                  {saving ? 'Adding...' : 'Add Category'}
                </button>
                <button
                  onClick={() => setShowAddCategoryForm(false)}
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

          {/* Categories List */}
          {categories.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 0'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📁</div>
              <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
                No categories found. Add your first category to get started.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {categories.map((category) => (
                <div key={category.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: 'white'
                }}>
                  {editingCategory?.id === category.id ? (
                    // Edit Mode
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px'
                      }}>
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          style={{
                            padding: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            outline: 'none'
                          }}
                          placeholder="Category name"
                        />
                        <input
                          type="text"
                          value={editingCategory.description}
                          onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                          style={{
                            padding: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            outline: 'none'
                          }}
                          placeholder="Description"
                        />
                        <input
                          type="number"
                          value={editingCategory.display_order}
                          onChange={(e) => setEditingCategory({ ...editingCategory, display_order: parseInt(e.target.value) || 0 })}
                          style={{
                            padding: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            outline: 'none'
                          }}
                          placeholder="Display order"
                          min="0"
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdateCategory(editingCategory)}
                          disabled={saving}
                          style={{
                            backgroundColor: saving ? '#9ca3af' : '#16a34a',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            opacity: saving ? 0.6 : 1
                          }}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          disabled={saving}
                          style={{
                            backgroundColor: '#6b7280',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            opacity: saving ? 0.6 : 1
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
                          marginBottom: '8px'
                        }}>
                          <h4 style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: '#111827'
                          }}>
                            {category.name}
                          </h4>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontWeight: '500',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af'
                          }}>
                            Order: {category.display_order}
                          </span>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontWeight: '500',
                            backgroundColor: '#dcfce7',
                            color: '#166534'
                          }}>
                            {positions.filter(p => p.category_id === category.id).length} positions
                          </span>
                        </div>
                        
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          marginBottom: '8px'
                        }}>
                          {category.description || 'No description'}
                        </p>

                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          Created: {format(new Date(category.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginLeft: '16px'
                      }}>
                        <button
                          onClick={() => setEditingCategory(category)}
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
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={saving}
                          style={{
                            color: saving ? '#9ca3af' : '#dc2626',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
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
      )}

      {/* Positions Tab */}
      {activeTab === 'positions' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1e40af'
            }}>Staff Positions</h3>
            <button
              onClick={() => setShowAddPositionForm(!showAddPositionForm)}
              style={{
                backgroundColor: '#1e40af',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {showAddPositionForm ? 'Cancel' : 'Add Position'}
            </button>
          </div>

          {/* Add Position Form */}
          {showAddPositionForm && (
            <div style={{
              marginBottom: '24px',
              padding: '24px',
              border: '2px solid #1e40af',
              borderRadius: '8px',
              backgroundColor: '#f0f9ff'
            }}>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                marginBottom: '16px',
                color: '#1e40af'
              }}>Add New Position</h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <select
                  value={newPosition.category_id}
                  onChange={(e) => setNewPosition({ ...newPosition, category_id: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
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
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                  placeholder="Position name"
                />
                <input
                  type="text"
                  value={newPosition.description}
                  onChange={(e) => setNewPosition({ ...newPosition, description: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                  placeholder="Description"
                />
                <input
                  type="number"
                  value={newPosition.display_order}
                  onChange={(e) => setNewPosition({ ...newPosition, display_order: parseInt(e.target.value) || 0 })}
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                  placeholder="Display order"
                  min="0"
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleAddPosition}
                  disabled={saving || !newPosition.name.trim() || !newPosition.category_id}
                  style={{
                    backgroundColor: saving ? '#9ca3af' : '#1e40af',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: saving || !newPosition.name.trim() || !newPosition.category_id ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    opacity: saving || !newPosition.name.trim() || !newPosition.category_id ? 0.6 : 1
                  }}
                >
                  {saving ? 'Adding...' : 'Add Position'}
                </button>
                <button
                  onClick={() => setShowAddPositionForm(false)}
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

          {/* Positions List */}
          {positions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 0'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💼</div>
              <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
                No positions found. Add your first position to get started.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {positions.map((position) => (
                <div key={position.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: 'white'
                }}>
                  {editingPosition?.id === position.id ? (
                    // Edit Mode
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px'
                      }}>
                        <select
                          value={editingPosition.category_id}
                          onChange={(e) => setEditingPosition({ ...editingPosition, category_id: e.target.value })}
                          style={{
                            padding: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            outline: 'none'
                          }}
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={editingPosition.name}
                          onChange={(e) => setEditingPosition({ ...editingPosition, name: e.target.value })}
                          style={{
                            padding: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            outline: 'none'
                          }}
                          placeholder="Position name"
                        />
                        <input
                          type="text"
                          value={editingPosition.description}
                          onChange={(e) => setEditingPosition({ ...editingPosition, description: e.target.value })}
                          style={{
                            padding: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            outline: 'none'
                          }}
                          placeholder="Description"
                        />
                        <input
                          type="number"
                          value={editingPosition.display_order}
                          onChange={(e) => setEditingPosition({ ...editingPosition, display_order: parseInt(e.target.value) || 0 })}
                          style={{
                            padding: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            outline: 'none'
                          }}
                          placeholder="Display order"
                          min="0"
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdatePosition(editingPosition)}
                          disabled={saving}
                          style={{
                            backgroundColor: saving ? '#9ca3af' : '#16a34a',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            opacity: saving ? 0.6 : 1
                          }}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setEditingPosition(null)}
                          disabled={saving}
                          style={{
                            backgroundColor: '#6b7280',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            opacity: saving ? 0.6 : 1
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
                          marginBottom: '8px'
                        }}>
                          <h4 style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: '#111827'
                          }}>
                            {position.name}
                          </h4>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontWeight: '500',
                            backgroundColor: '#fef7ff',
                            color: '#a21caf'
                          }}>
                            {getCategoryName(position.category_id)}
                          </span>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontWeight: '500',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af'
                          }}>
                            Order: {position.display_order}
                          </span>
                        </div>
                        
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          marginBottom: '8px'
                        }}>
                          {position.description || 'No description'}
                        </p>

                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          Created: {format(new Date(position.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginLeft: '16px'
                      }}>
                        <button
                          onClick={() => setEditingPosition(position)}
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
                          onClick={() => handleDeletePosition(position.id)}
                          disabled={saving}
                          style={{
                            color: saving ? '#9ca3af' : '#dc2626',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
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
      )}

      {/* Specializations Tab */}
      {activeTab === 'specializations' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#166534'
            }}>Staff Specializations</h3>
            <button
              onClick={() => setShowAddSpecializationForm(!showAddSpecializationForm)}
              style={{
                backgroundColor: '#166534',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {showAddSpecializationForm ? 'Cancel' : 'Add Specialization'}
            </button>
          </div>

          {/* Add Specialization Form */}
          {showAddSpecializationForm && (
            <div style={{
              marginBottom: '24px',
              padding: '24px',
              border: '2px solid #166534',
              borderRadius: '8px',
              backgroundColor: '#f0fdf4'
            }}>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                marginBottom: '16px',
                color: '#166534'
              }}>Add New Specialization</h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <select
                  value={newSpecialization.category_id}
                  onChange={(e) => setNewSpecialization({ ...newSpecialization, category_id: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
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
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                  placeholder="Specialization name"
                />
                <input
                  type="text"
                  value={newSpecialization.description}
                  onChange={(e) => setNewSpecialization({ ...newSpecialization, description: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                  placeholder="Description"
                />
                <input
                  type="number"
                  value={newSpecialization.display_order}
                  onChange={(e) => setNewSpecialization({ ...newSpecialization, display_order: parseInt(e.target.value) || 0 })}
                  style={{
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                  placeholder="Display order"
                  min="0"
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleAddSpecialization}
                  disabled={saving || !newSpecialization.name.trim()}
                  style={{
                    backgroundColor: saving ? '#9ca3af' : '#166534',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: saving || !newSpecialization.name.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    opacity: saving || !newSpecialization.name.trim() ? 0.6 : 1
                  }}
                >
                  {saving ? 'Adding...' : 'Add Specialization'}
                </button>
                <button
                  onClick={() => setShowAddSpecializationForm(false)}
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

          {/* Specializations List */}
          {specializations.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 0'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⭐</div>
              <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
                No specializations found. Add your first specialization to get started.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {specializations.map((specialization) => (
                <div key={specialization.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: 'white'
                }}>
                  {editingSpecialization?.id === specialization.id ? (
                    // Edit Mode
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px'
                      }}>
                        <select
                          value={editingSpecialization.category_id || ''}
                          onChange={(e) => setEditingSpecialization({ ...editingSpecialization, category_id: e.target.value || null })}
                          style={{
                            padding: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            outline: 'none'
                          }}
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
                          style={{
                            padding: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            outline: 'none'
                          }}
                          placeholder="Specialization name"
                        />
                        <input
                          type="text"
                          value={editingSpecialization.description}
                          onChange={(e) => setEditingSpecialization({ ...editingSpecialization, description: e.target.value })}
                          style={{
                            padding: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            outline: 'none'
                          }}
                          placeholder="Description"
                        />
                        <input
                          type="number"
                          value={editingSpecialization.display_order}
                          onChange={(e) => setEditingSpecialization({ ...editingSpecialization, display_order: parseInt(e.target.value) || 0 })}
                          style={{
                            padding: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            outline: 'none'
                          }}
                          placeholder="Display order"
                          min="0"
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdateSpecialization(editingSpecialization)}
                          disabled={saving}
                          style={{
                            backgroundColor: saving ? '#9ca3af' : '#16a34a',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            opacity: saving ? 0.6 : 1
                          }}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setEditingSpecialization(null)}
                          disabled={saving}
                          style={{
                            backgroundColor: '#6b7280',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            opacity: saving ? 0.6 : 1
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
                          marginBottom: '8px'
                        }}>
                          <h4 style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: '#111827'
                          }}>
                            {specialization.name}
                          </h4>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontWeight: '500',
                            backgroundColor: '#fef7ff',
                            color: '#a21caf'
                          }}>
                            {getCategoryName(specialization.category_id)}
                          </span>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontWeight: '500',
                            backgroundColor: '#dcfce7',
                            color: '#166534'
                          }}>
                            Order: {specialization.display_order}
                          </span>
                        </div>
                        
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          marginBottom: '8px'
                        }}>
                          {specialization.description || 'No description'}
                        </p>

                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          Created: {format(new Date(specialization.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginLeft: '16px'
                      }}>
                        <button
                          onClick={() => setEditingSpecialization(specialization)}
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
                          onClick={() => handleDeleteSpecialization(specialization.id)}
                          disabled={saving}
                          style={{
                            color: saving ? '#9ca3af' : '#dc2626',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
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
      )}
    </div>
  )
}
