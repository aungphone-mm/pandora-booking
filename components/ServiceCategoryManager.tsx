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
        }}>Service Category Management</h2>
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
          {showAddForm ? 'Cancel' : 'Add Category'}
        </button>
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
          backgroundColor: '#f9fafb',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#6b7280'
          }}>Total Categories</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827'
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
          }}>Max Order</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1e40af'
          }}>
            {Math.max(...categories.map(c => c.display_order), 0)}
          </p>
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
          }}>Added This Week</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#166534'
          }}>
            {categories.filter(c => new Date(c.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length}
          </p>
        </div>
      </div>

      {/* Add Category Form */}
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
          }}>Add New Service Category</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '16px',
            alignItems: 'end'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Category Name
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none'
                }}
                placeholder="Enter category name"
              />
            </div>
            <div style={{ minWidth: '120px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Display Order
              </label>
              <input
                type="number"
                value={newCategory.display_order}
                onChange={(e) => setNewCategory({ ...newCategory, display_order: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none'
                }}
                min="0"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={handleAddCategory}
              disabled={saving || !newCategory.name.trim()}
              style={{
                backgroundColor: saving ? '#9ca3af' : '#ec4899',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '4px',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: saving || !newCategory.name.trim() ? 0.6 : 1
              }}
            >
              {saving ? 'Adding...' : 'Add Category'}
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

      {/* Categories List */}
      {categories.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 0'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📂</div>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
            No service categories found. Add your first category to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {categories.map((category, index) => (
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
                    gridTemplateColumns: '1fr auto',
                    gap: '16px',
                    alignItems: 'end'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '4px'
                      }}>
                        Category Name
                      </label>
                      <input
                        type="text"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ minWidth: '120px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '4px'
                      }}>
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={editingCategory.display_order}
                        onChange={(e) => setEditingCategory({ ...editingCategory, display_order: parseInt(e.target.value) || 0 })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          outline: 'none'
                        }}
                        min="0"
                      />
                    </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: '#111827'
                      }}>
                        {category.name}
                      </h3>
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
                    </div>
                    
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
                    alignItems: 'center',
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
                      onClick={() => moveCategory(category.id, 'up')}
                      disabled={index === 0 || saving}
                      style={{
                        color: saving || index === 0 ? '#9ca3af' : '#8b5cf6',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: saving || index === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '1.25rem',
                        fontWeight: 'bold'
                      }}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveCategory(category.id, 'down')}
                      disabled={index === categories.length - 1 || saving}
                      style={{
                        color: saving || index === categories.length - 1 ? '#9ca3af' : '#8b5cf6',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: saving || index === categories.length - 1 ? 'not-allowed' : 'pointer',
                        fontSize: '1.25rem',
                        fontWeight: 'bold'
                      }}
                      title="Move down"
                    >
                      ↓
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
  )
}
