'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ServiceManager() {
  const supabase = createClient()
  const [services, setServices] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [editingService, setEditingService] = useState<any>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'duration'>('name')
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    category_id: '',
    duration: 60,
    price: 0,
    is_active: true
  })

  useEffect(() => {
    loadData()
    
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
      .service-card {
        transition: all 0.3s ease-in-out;
      }
      .service-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
      }
      .filter-select {
        transition: all 0.2s ease-in-out;
      }
      .filter-select:focus {
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
        border-color: #22c55e;
      }
      .table-row {
        transition: all 0.2s ease-in-out;
      }
      .table-row:hover {
        background-color: #f8fafc;
        transform: scale(1.002);
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
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
        border-color: #22c55e;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          category:service_categories(name)
        `)
        .order('category_id')

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .order('display_order')

      if (servicesError) throw servicesError
      if (categoriesError) throw categoriesError

      setServices(servicesData || [])
      setCategories(categoriesData || [])
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddService = async () => {
    try {
      setError(null)
      const { error } = await supabase
        .from('services')
        .insert([newService])

      if (error) throw error

      setNewService({
        name: '',
        description: '',
        category_id: '',
        duration: 60,
        price: 0,
        is_active: true
      })
      setShowAddForm(false)
      loadData()
    } catch (err: any) {
      console.error('Error adding service:', err)
      setError(err.message || 'Failed to add service')
    }
  }

  const handleUpdateService = async (service: any) => {
    try {
      setError(null)
      const { error } = await supabase
        .from('services')
        .update({
          name: service.name,
          description: service.description,
          category_id: service.category_id,
          duration: service.duration,
          price: service.price,
          is_active: service.is_active
        })
        .eq('id', service.id)

      if (error) throw error

      setEditingService(null)
      loadData()
    } catch (err: any) {
      console.error('Error updating service:', err)
      setError(err.message || 'Failed to update service')
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      setError(null)
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadData()
    } catch (err: any) {
      console.error('Error deleting service:', err)
      setError(err.message || 'Failed to delete service')
    }
  }

  const toggleServiceStatus = async (id: string, currentStatus: boolean) => {
    try {
      setError(null)
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      loadData()
    } catch (err: any) {
      console.error('Error toggling service status:', err)
      setError(err.message || 'Failed to toggle service status')
    }
  }

  // Filter and sort services
  const filteredAndSortedServices = services
    .filter(service => {
      if (filterCategory !== 'all' && service.category_id !== filterCategory) return false
      if (filterStatus !== 'all') {
        if (filterStatus === 'active' && !service.is_active) return false
        if (filterStatus === 'inactive' && service.is_active) return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price':
          return b.price - a.price
        case 'duration':
          return b.duration - a.duration
        default:
          return 0
      }
    })

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
          borderTop: '4px solid #22c55e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#1e293b'
        }}>Loading Services</h2>
        <p style={{
          color: '#64748b',
          fontSize: '1rem'
        }}>Please wait while we fetch your service data...</p>
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
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(34, 197, 94, 0.3)',
        padding: '32px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }} className="service-card">
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
            }}>✨ Service Management</h2>
            <p style={{
              fontSize: '1.1rem',
              margin: '0',
              opacity: '0.9'
            }}>Manage your salon services and pricing</p>
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
            {showAddForm ? '❌ Cancel' : '➕ Add Service'}
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

      {/* Enhanced Filters and Sorting */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.06)',
        padding: '32px',
        border: '1px solid #f1f5f9'
      }} className="service-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem'
          }}>🔍</div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: '0',
            color: '#1e293b'
          }}>Filter & Sort Options</h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.95rem',
              fontWeight: '600',
              color: '#475569',
              marginBottom: '8px'
            }}>📂 Filter by Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                background: 'white',
                color: '#1e293b'
              }}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.95rem',
              fontWeight: '600',
              color: '#475569',
              marginBottom: '8px'
            }}>📊 Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                background: 'white',
                color: '#1e293b'
              }}
              className="filter-select"
            >
              <option value="all">All Services</option>
              <option value="active">✅ Active Only</option>
              <option value="inactive">❌ Inactive Only</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.95rem',
              fontWeight: '600',
              color: '#475569',
              marginBottom: '8px'
            }}>📋 Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'duration')}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                background: 'white',
                color: '#1e293b'
              }}
              className="filter-select"
            >
              <option value="name">✨ Name</option>
              <option value="price">💰 Price (High to Low)</option>
              <option value="duration">⏱️ Duration (Long to Short)</option>
            </select>
          </div>
        </div>
      </div>

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
        }} className="service-card">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✨</div>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 8px 0'
          }}>Total Services</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#1e293b',
            margin: '0'
          }}>{services.length}</p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #16a34a',
          boxShadow: '0 6px 20px rgba(34, 197, 94, 0.15)',
          textAlign: 'center'
        }} className="service-card">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#166534',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 8px 0'
          }}>Active Services</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#166534',
            margin: '0'
          }}>
            {services.filter(s => s.is_active).length}
          </p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #dc2626',
          boxShadow: '0 6px 20px rgba(220, 38, 38, 0.15)',
          textAlign: 'center'
        }} className="service-card">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>❌</div>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#991b1b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 8px 0'
          }}>Inactive Services</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#991b1b',
            margin: '0'
          }}>
            {services.filter(s => !s.is_active).length}
          </p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #eab308',
          boxShadow: '0 6px 20px rgba(234, 179, 8, 0.15)',
          textAlign: 'center'
        }} className="service-card">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💰</div>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#a16207',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 8px 0'
          }}>Avg Price</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#a16207',
            margin: '0'
          }}>
            {services.length > 0 
              ? Math.round(services.reduce((acc, s) => acc + s.price, 0) / services.length)
              : 0
            }Ks
          </p>
        </div>
      </div>

      {/* Enhanced Add Service Form */}
      {showAddForm && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '2px solid #22c55e',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 15px 35px rgba(34, 197, 94, 0.2)'
        }} className="service-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
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
              color: '#166534'
            }}>Add New Service</h3>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <input
              type="text"
              placeholder="✨ Service name"
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              style={{
                padding: '16px',
                border: '2px solid #16a34a',
                borderRadius: '12px',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                backgroundColor: 'white'
              }}
              className="form-input"
            />
            <select
              value={newService.category_id}
              onChange={(e) => setNewService({ ...newService, category_id: e.target.value })}
              style={{
                padding: '16px',
                border: '2px solid #16a34a',
                borderRadius: '12px',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                backgroundColor: 'white'
              }}
              className="form-input"
            >
              <option value="">📂 Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="⏱️ Duration (minutes)"
              value={newService.duration}
              onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) })}
              style={{
                padding: '16px',
                border: '2px solid #16a34a',
                borderRadius: '12px',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                backgroundColor: 'white'
              }}
              className="form-input"
            />
            <input
              type="number"
              placeholder="💰 Price"
              step="0.01"
              value={newService.price}
              onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })}
              style={{
                padding: '16px',
                border: '2px solid #16a34a',
                borderRadius: '12px',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                backgroundColor: 'white'
              }}
              className="form-input"
            />
          </div>
          
          <textarea
            placeholder="📝 Description"
            value={newService.description}
            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
            style={{
              width: '100%',
              padding: '16px',
              border: '2px solid #16a34a',
              borderRadius: '12px',
              outline: 'none',
              marginTop: '20px',
              marginBottom: '16px',
              minHeight: '100px',
              fontSize: '1rem',
              fontWeight: '500',
              backgroundColor: 'white',
              resize: 'vertical'
            }}
            className="form-input"
          />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '2px solid #16a34a'
          }}>
            <input
              type="checkbox"
              id="active-new-service"
              checked={newService.is_active}
              onChange={(e) => setNewService({ ...newService, is_active: e.target.checked })}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer'
              }}
            />
            <label
              htmlFor="active-new-service"
              style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: newService.is_active ? '#166534' : '#991b1b',
                cursor: 'pointer'
              }}
            >
              {newService.is_active ? '✅ Active (Service will be immediately available)' : '❌ Inactive (Service will be hidden)'}
            </label>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={handleAddService}
              style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: 'white',
                padding: '16px 24px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                boxShadow: '0 6px 20px rgba(22, 163, 74, 0.3)'
              }}
              className="action-button"
            >
              ✅ Add Service
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

      {/* Enhanced Services Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
        padding: '0',
        border: '1px solid #f1f5f9',
        overflow: 'hidden'
      }} className="service-card">
        {filteredAndSortedServices.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 32px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px', opacity: '0.5' }}>✨</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#475569'
            }}>
              No services found
            </h3>
            <p style={{ fontSize: '1rem', opacity: '0.8' }}>
              {filterCategory !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters to see more services.'
                : 'Add your first service to get started.'
              }
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  <th style={{
                    textAlign: 'left',
                    padding: '20px 24px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>✨ Service</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '20px 24px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>📂 Category</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '20px 24px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>⏱️ Duration</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '20px 24px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>💰 Price</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '20px 24px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>📊 Status</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '20px 24px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    color: '#374151',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>⚡ Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedServices.map((service, index) => (
                  <tr key={service.id} style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: index % 2 === 0 ? 'white' : '#fafbfc'
                  }} className="table-row">
                    <td style={{ padding: '20px 24px' }}>
                      {editingService?.id === service.id ? (
                        <input
                          type="text"
                          value={editingService.name}
                          onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                          style={{
                            padding: '8px 12px',
                            border: '2px solid #22c55e',
                            borderRadius: '8px',
                            outline: 'none',
                            fontSize: '1rem',
                            fontWeight: '500',
                            width: '200px'
                          }}
                          className="form-input"
                        />
                      ) : (
                        <div>
                          <p style={{ 
                            fontWeight: '600',
                            fontSize: '1.1rem',
                            color: '#1e293b',
                            margin: '0 0 4px 0'
                          }}>{service.name}</p>
                          {service.description && (
                            <p style={{
                              fontSize: '0.85rem',
                              color: '#64748b',
                              margin: '0',
                              lineHeight: '1.4'
                            }}>{service.description}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      {editingService?.id === service.id ? (
                        <select
                          value={editingService.category_id}
                          onChange={(e) => setEditingService({ ...editingService, category_id: e.target.value })}
                          style={{
                            padding: '8px 12px',
                            border: '2px solid #22c55e',
                            borderRadius: '8px',
                            outline: 'none',
                            fontSize: '1rem',
                            fontWeight: '500',
                            width: '180px'
                          }}
                          className="form-input"
                        >
                          <option value="">Select category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{
                          fontSize: '0.9rem',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          backgroundColor: '#f0fdf4',
                          color: '#166534',
                          fontWeight: '600',
                          border: '1px solid #bbf7d0'
                        }}>
                          {service.category?.name || 'No Category'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      {editingService?.id === service.id ? (
                        <input
                          type="number"
                          value={editingService.duration}
                          onChange={(e) => setEditingService({ ...editingService, duration: parseInt(e.target.value) })}
                          style={{
                            padding: '8px 12px',
                            border: '2px solid #22c55e',
                            borderRadius: '8px',
                            outline: 'none',
                            fontSize: '1rem',
                            fontWeight: '500',
                            width: '100px'
                          }}
                          className="form-input"
                        />
                      ) : (
                        <span style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#3b82f6'
                        }}>
                          ⏱️ {service.duration} min
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      {editingService?.id === service.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingService.price}
                          onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) })}
                          style={{
                            padding: '8px 12px',
                            border: '2px solid #22c55e',
                            borderRadius: '8px',
                            outline: 'none',
                            fontSize: '1rem',
                            fontWeight: '500',
                            width: '100px'
                          }}
                          className="form-input"
                        />
                      ) : (
                        <span style={{
                          fontSize: '1.1rem',
                          fontWeight: '700',
                          color: '#059669'
                        }}>
                          💰 {service.price.toLocaleString()}Ks
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      {editingService?.id === service.id ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <input
                            type="checkbox"
                            id={`active-${editingService.id}`}
                            checked={editingService.is_active}
                            onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked })}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer'
                            }}
                          />
                          <label
                            htmlFor={`active-${editingService.id}`}
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              color: editingService.is_active ? '#166534' : '#991b1b',
                              cursor: 'pointer'
                            }}
                          >
                            {editingService.is_active ? '✅ Active' : '❌ Inactive'}
                          </label>
                        </div>
                      ) : (
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          backgroundColor: service.is_active ? '#dcfce7' : '#fee2e2',
                          color: service.is_active ? '#166534' : '#991b1b',
                          border: service.is_active ? '1px solid #16a34a' : '1px solid #dc2626'
                        }}>
                          {service.is_active ? '✅ Active' : '❌ Inactive'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      {editingService?.id === service.id ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleUpdateService(editingService)}
                            style={{
                              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                            }}
                            className="action-button"
                          >
                            ✅ Save
                          </button>
                          <button
                            onClick={() => setEditingService(null)}
                            style={{
                              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
                            }}
                            className="action-button"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => setEditingService(service)}
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
                            onClick={() => toggleServiceStatus(service.id, service.is_active)}
                            style={{
                              background: service.is_active
                                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              boxShadow: service.is_active
                                ? '0 4px 12px rgba(245, 158, 11, 0.3)'
                                : '0 4px 12px rgba(22, 163, 74, 0.3)'
                            }}
                            className="action-button"
                          >
                            {service.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            style={{
                              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                            }}
                            className="action-button"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
