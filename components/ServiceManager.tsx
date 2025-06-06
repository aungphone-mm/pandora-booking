'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ServiceManager() {
  const supabase = createClient()
  const [services, setServices] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [editingService, setEditingService] = useState<any>(null)
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
  }, [])

  const loadData = async () => {
    const { data: servicesData } = await supabase
      .from('services')
      .select(`
        *,
        category:service_categories(name)
      `)
      .order('category_id')

    const { data: categoriesData } = await supabase
      .from('service_categories')
      .select('*')
      .order('display_order')

    setServices(servicesData || [])
    setCategories(categoriesData || [])
  }

  const handleAddService = async () => {
    const { error } = await supabase
      .from('services')
      .insert([newService])

    if (!error) {
      setNewService({
        name: '',
        description: '',
        category_id: '',
        duration: 60,
        price: 0,
        is_active: true
      })
      loadData()
    }
  }

  const handleUpdateService = async (service: any) => {
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

    if (!error) {
      setEditingService(null)
      loadData()
    }
  }

  const handleDeleteService = async (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)

      if (!error) {
        loadData()
      }
    }
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '24px'
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '24px'
      }}>Service Management</h2>
      
      {/* Add new service form */}
      <div style={{
        marginBottom: '32px',
        padding: '16px',
        border: '1px solid #d1d5db',
        borderRadius: '8px'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '16px'
        }}>Add New Service</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <input
            type="text"
            placeholder="Service name"
            value={newService.name}
            onChange={(e) => setNewService({ ...newService, name: e.target.value })}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          />
          <select
            value={newService.category_id}
            onChange={(e) => setNewService({ ...newService, category_id: e.target.value })}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Duration (minutes)"
            value={newService.duration}
            onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) })}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          />
          <input
            type="number"
            placeholder="Price"
            step="0.01"
            value={newService.price}
            onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          />
          <textarea
            placeholder="Description"
            value={newService.description}
            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              gridColumn: '1 / -1'
            }}
          />
          <button
            onClick={handleAddService}
            style={{
              gridColumn: '1 / -1',
              backgroundColor: '#ec4899',
              color: 'white',
              padding: '12px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Add Service
          </button>
        </div>
      </div>

      {/* Services list */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{
                textAlign: 'left',
                padding: '12px 8px',
                fontWeight: '600'
              }}>Service</th>
              <th style={{
                textAlign: 'left',
                padding: '12px 8px',
                fontWeight: '600'
              }}>Category</th>
              <th style={{
                textAlign: 'left',
                padding: '12px 8px',
                fontWeight: '600'
              }}>Duration</th>
              <th style={{
                textAlign: 'left',
                padding: '12px 8px',
                fontWeight: '600'
              }}>Price</th>
              <th style={{
                textAlign: 'left',
                padding: '12px 8px',
                fontWeight: '600'
              }}>Status</th>
              <th style={{
                textAlign: 'left',
                padding: '12px 8px',
                fontWeight: '600'
              }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 8px' }}>
                  {editingService?.id === service.id ? (
                    <input
                      type="text"
                      value={editingService.name}
                      onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                      style={{
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    service.name
                  )}
                </td>
                <td style={{ padding: '12px 8px' }}>{service.category?.name}</td>
                <td style={{ padding: '12px 8px' }}>
                  {editingService?.id === service.id ? (
                    <input
                      type="number"
                      value={editingService.duration}
                      onChange={(e) => setEditingService({ ...editingService, duration: parseInt(e.target.value) })}
                      style={{
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        width: '80px'
                      }}
                    />
                  ) : (
                    `${service.duration} min`
                  )}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  {editingService?.id === service.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editingService.price}
                      onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) })}
                      style={{
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        width: '80px'
                      }}
                    />
                  ) : (
                    `$${service.price}`
                  )}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    backgroundColor: service.is_active ? '#dcfce7' : '#fee2e2',
                    color: service.is_active ? '#166534' : '#991b1b'
                  }}>
                    {service.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px 8px' }}>
                  {editingService?.id === service.id ? (
                    <>
                      <button
                        onClick={() => handleUpdateService(editingService)}
                        style={{
                          color: '#059669',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          marginRight: '8px'
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingService(null)}
                        style={{
                          color: '#6b7280',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingService(service)}
                        style={{
                          color: '#2563eb',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          marginRight: '8px'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        style={{
                          color: '#dc2626',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}