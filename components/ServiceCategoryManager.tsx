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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
        padding: '48px',
        textAlign: 'center',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{
          display: 'inline-block',
          width: '48px',
          height: '48px',
          border: '4px solid #f1f5f9',
          borderTop: '4px solid #9333ea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#1e293b'
        }}>Loading Categories</h2>
        <p style={{
          color: '#64748b',
          fontSize: '1rem'
        }}>Please wait while we fetch your category data...</p>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      animation: 'fadeIn 0.6s ease-out'
    }}>
      {/* Enhanced Header */}
      <div style={{
        background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(147, 51, 234, 0.3)',
        padding: '32px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }} className="category-card">
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div>
            <h2 style={{
              fontSize: '2.25rem',
              fontWeight: '800',
              margin: '0 0 8px 0',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>📂 Service Category Management</h2>
            <p style={{
              fontSize: '1.1rem',
              margin: '0',
              opacity: '0.9'
            }}>Organize your services into meaningful categories</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              boxShadow: '0 6px 20px rgba(236, 72, 153, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            className="action-button"
          >
            {showAddForm ? '❌ Cancel' : '➕ Add Category'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '1px solid #f87171',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 25px rgba(248, 113, 113, 0.2)'
        }} className="slideIn">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <p style={{ 
              color: '#dc2626', 
              fontWeight: '600',
              margin: '0',
              fontSize: '1.1rem'
            }}>{error}</p>
          </div>
        </div>
      )}

      {/* Enhanced Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
          textAlign: 'center'
        }} className="category-card">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📂</div>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 8px 0'
          }}>Total Categories</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#1e293b',
            margin: '0'
          }}>{categories.length}</p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #9333ea',
          boxShadow: '0 6px 20px rgba(147, 51, 234, 0.15)',
          textAlign: 'center'
        }} className="category-card">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#6d28d9',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 8px 0'
          }}>Max Order</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#6d28d9',
            margin: '0'
          }}>
            {Math.max(...categories.map(c => c.display_order), 0)}
          </p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #16a34a',
          boxShadow: '0 6px 20px rgba(34, 197, 94, 0.15)',
          textAlign: 'center'
        }} className="category-card">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📅</div>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#166534',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 8px 0'
          }}>Added This Week</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#166534',
            margin: '0'
          }}>
            {categories.filter(c => new Date(c.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length}
          </p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #3b82f6',
          boxShadow: '0 6px 20px rgba(59, 130, 246, 0.15)',
          textAlign: 'center'
        }} className="category-card">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔢</div>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#1e40af',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 8px 0'
          }}>Avg Order</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#1e40af',
            margin: '0'
          }}>
            {categories.length > 0 
              ? Math.round(categories.reduce((sum, c) => sum + c.display_order, 0) / categories.length)
              : 0
            }
          </p>
        </div>
      </div>

      {/* Enhanced Add Category Form */}
      {showAddForm && (
        <div style={{
          background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
          border: '2px solid #eab308',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 15px 35px rgba(234, 179, 8, 0.2)'
        }} className="category-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>➕</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: '0',
              color: '#a16207'
            }}>Add New Service Category</h3>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '20px',
            alignItems: 'end'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#92400e',
                marginBottom: '8px'
              }}>
                📂 Category Name
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #facc15',
                  borderRadius: '12px',
                  outline: 'none',
                  fontSize: '1rem',
                  fontWeight: '500',
                  backgroundColor: 'white'
                }}
                className="form-input"
                placeholder="Enter category name"
              />
            </div>
            <div style={{ minWidth: '160px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#92400e',
                marginBottom: '8px'
              }}>
                📊 Display Order
              </label>
              <input
                type="number"
                value={newCategory.display_order}
                onChange={(e) => setNewCategory({ ...newCategory, display_order: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid #facc15',
                  borderRadius: '12px',
                  outline: 'none',
                  fontSize: '1rem',
                  fontWeight: '500',
                  backgroundColor: 'white'
                }}
                className="form-input"
                min="0"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            <button
              onClick={handleAddCategory}
              disabled={saving || !newCategory.name.trim()}
              style={{
                background: saving ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                border: 'none',
                cursor: saving || !newCategory.name.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                boxShadow: '0 6px 20px rgba(22, 163, 74, 0.3)',
                opacity: saving || !newCategory.name.trim() ? 0.6 : 1
              }}
              className="action-button"
            >
              {saving ? '⏳ Adding...' : '✅ Add Category'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                boxShadow: '0 6px 20px rgba(107, 114, 128, 0.3)'
              }}
              className="action-button"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Categories List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
        padding: '0',
        border: '1px solid #f1f5f9',
        overflow: 'hidden'
      }} className="category-card">
        {categories.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 32px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px', opacity: '0.5' }}>📂</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#475569'
            }}>
              No service categories found
            </h3>
            <p style={{ fontSize: '1rem', opacity: '0.8' }}>
              Add your first category to organize your services.
            </p>
          </div>
        ) : (
          <div style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>📂</div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: '0',
                color: '#1e293b'
              }}>Service Categories ({categories.length})</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {categories.map((category, index) => (
                <div key={category.id} style={{
                  border: '2px solid #f1f5f9',
                  borderRadius: '16px',
                  padding: '24px',
                  backgroundColor: 'white',
                  transition: 'all 0.3s ease-in-out'
                }} className="category-card">
                  {editingCategory?.id === category.id ? (
                    // Edit Mode
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '20px',
                        alignItems: 'end'
                      }}>
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            color: '#475569',
                            marginBottom: '8px'
                          }}>
                            📂 Category Name
                          </label>
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '16px',
                              border: '2px solid #9333ea',
                              borderRadius: '12px',
                              outline: 'none',
                              fontSize: '1rem',
                              fontWeight: '500'
                            }}
                            className="form-input"
                          />
                        </div>
                        <div style={{ minWidth: '160px' }}>
                          <label style={{
                            display: 'block',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            color: '#475569',
                            marginBottom: '8px'
                          }}>
                            📊 Display Order
                          </label>
                          <input
                            type="number"
                            value={editingCategory.display_order}
                            onChange={(e) => setEditingCategory({ ...editingCategory, display_order: parseInt(e.target.value) || 0 })}
                            style={{
                              width: '100%',
                              padding: '16px',
                              border: '2px solid #9333ea',
                              borderRadius: '12px',
                              outline: 'none',
                              fontSize: '1rem',
                              fontWeight: '500'
                            }}
                            className="form-input"
                            min="0"
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => handleUpdateCategory(editingCategory)}
                          disabled={saving}
                          style={{
                            background: saving ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                            opacity: saving ? 0.6 : 1
                          }}
                          className="action-button"
                        >
                          {saving ? '⏳ Saving...' : '✅ Save Changes'}
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          disabled={saving}
                          style={{
                            background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)',
                            opacity: saving ? 0.6 : 1
                          }}
                          className="action-button"
                        >
                          ❌ Cancel
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
                          gap: '16px',
                          marginBottom: '12px'
                        }}>
                          <h3 style={{
                            fontSize: '1.4rem',
                            fontWeight: '700',
                            color: '#1e293b',
                            margin: '0'
                          }}>
                            📂 {category.name}
                          </h3>
                          <span style={{
                            fontSize: '0.85rem',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontWeight: '600',
                            backgroundColor: '#ede9fe',
                            color: '#7c3aed',
                            border: '1px solid #c4b5fd'
                          }}>
                            📊 Order: {category.display_order}
                          </span>
                        </div>
                        
                        <p style={{
                          fontSize: '0.95rem',
                          color: '#64748b',
                          margin: '0'
                        }}>
                          📅 Created: {format(new Date(category.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        marginLeft: '24px'
                      }}>
                        <button
                          onClick={() => setEditingCategory(category)}
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                          }}
                          className="action-button"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => moveCategory(category.id, 'up')}
                          disabled={index === 0 || saving}
                          style={{
                            background: saving || index === 0 ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            cursor: saving || index === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            boxShadow: saving || index === 0 ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)',
                            opacity: saving || index === 0 ? 0.5 : 1
                          }}
                          className="move-button"
                          title="Move up"
                        >
                          ⬆️
                        </button>
                        <button
                          onClick={() => moveCategory(category.id, 'down')}
                          disabled={index === categories.length - 1 || saving}
                          style={{
                            background: saving || index === categories.length - 1 ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            cursor: saving || index === categories.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            boxShadow: saving || index === categories.length - 1 ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)',
                            opacity: saving || index === categories.length - 1 ? 0.5 : 1
                          }}
                          className="move-button"
                          title="Move down"
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={saving}
                          style={{
                            background: saving ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            boxShadow: saving ? 'none' : '0 4px 12px rgba(220, 38, 38, 0.3)',
                            opacity: saving ? 0.5 : 1
                          }}
                          className="action-button"
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
