'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type Staff = {
  id: string
  full_name: string
  email: string
  phone: string
  job_position: string
  specializations: string[]
  bio: string
  is_active: boolean
  hourly_rate: number
  commission_rate: number
  hire_date: string
}

type Position = {
  id: string
  name: string
  category_id: string
  description: string
}

export default function StaffManager() {
  const supabase = createClient()
  const [staff, setStaff] = useState<Staff[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'position' | 'hire_date'>('name')
  const [newStaff, setNewStaff] = useState({
    full_name: '',
    email: '',
    phone: '',
    job_position: '',
    specializations: '',
    bio: '',
    hourly_rate: 0,
    commission_rate: 0,
    hire_date: new Date().toISOString().split('T')[0],
    is_active: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      await Promise.all([
        loadStaff(),
        loadPositions()
      ])
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadStaff = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    setStaff(data || [])
  }

  const loadPositions = async () => {
    const { data, error } = await supabase
      .from('staff_positions')
      .select('*')
      .eq('is_active', true)
      .order('display_order')

    if (error) throw error
    setPositions(data || [])
  }

  const handleAddStaff = async () => {
    try {
      setError(null)
      const specializationsArray = newStaff.specializations
        ? newStaff.specializations.split(',').map(s => s.trim()).filter(s => s)
        : []

      const { error } = await supabase
        .from('staff')
        .insert([{
          full_name: newStaff.full_name,
          email: newStaff.email,
          phone: newStaff.phone,
          job_position: newStaff.job_position,
          specializations: specializationsArray,
          bio: newStaff.bio,
          hourly_rate: newStaff.hourly_rate,
          commission_rate: newStaff.commission_rate,
          hire_date: newStaff.hire_date,
          is_active: newStaff.is_active
        }])

      if (error) throw error

      setNewStaff({
        full_name: '',
        email: '',
        phone: '',
        job_position: '',
        specializations: '',
        bio: '',
        hourly_rate: 0,
        commission_rate: 0,
        hire_date: new Date().toISOString().split('T')[0],
        is_active: true
      })
      setShowAddForm(false)
      loadData()
    } catch (error: any) {
      console.error('Error adding staff:', error)
      setError(error.message || 'Failed to add staff member')
    }
  }

  const handleUpdateStaff = async (staffMember: Staff) => {
    try {
      setError(null)
      const specializationsArray = Array.isArray(staffMember.specializations)
        ? staffMember.specializations
        : (staffMember.specializations as string).split(',').map(s => s.trim()).filter(s => s)

      const { error } = await supabase
        .from('staff')
        .update({
          full_name: staffMember.full_name,
          email: staffMember.email,
          phone: staffMember.phone,
          job_position: staffMember.job_position,
          specializations: specializationsArray,
          bio: staffMember.bio,
          hourly_rate: staffMember.hourly_rate,
          commission_rate: staffMember.commission_rate,
          hire_date: staffMember.hire_date,
          is_active: staffMember.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', staffMember.id)

      if (error) throw error

      setEditingStaff(null)
      loadData()
    } catch (error: any) {
      console.error('Error updating staff:', error)
      setError(error.message || 'Failed to update staff member')
    }
  }

  const toggleStaffStatus = async (id: string, currentStatus: boolean) => {
    try {
      setError(null)
      const { error } = await supabase
        .from('staff')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      loadData()
    } catch (error: any) {
      console.error('Error updating staff status:', error)
      setError(error.message || 'Failed to update staff status')
    }
  }

  // Filter and sort staff
  const filteredAndSortedStaff = staff
    .filter(staffMember => {
      if (filterStatus === 'all') return true
      return filterStatus === 'active' ? staffMember.is_active : !staffMember.is_active
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.full_name.localeCompare(b.full_name)
        case 'position':
          return (a.job_position || '').localeCompare(b.job_position || '')
        case 'hire_date':
          return new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime()
        default:
          return 0
      }
    })

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? { backgroundColor: '#dcfce7', color: '#166534' }
      : { backgroundColor: '#fee2e2', color: '#991b1b' }
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
        }}>Staff Management</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => window.open('/admin/staff-categories', '_blank')}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Manage Positions
          </button>
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
            {showAddForm ? 'Cancel' : 'Add Staff Member'}
          </button>
        </div>
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

      {/* Filters and Sorting */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center'
      }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none'
            }}
          >
            <option value="all">All Staff</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'position' | 'hire_date')}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none'
            }}
          >
            <option value="name">Name</option>
            <option value="position">Position</option>
            <option value="hire_date">Hire Date</option>
          </select>
        </div>
      </div>

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
          }}>Total Staff</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>{staff.length}</p>
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
          }}>Active</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#166534'
          }}>
            {staff.filter(s => s.is_active).length}
          </p>
        </div>
        <div style={{
          backgroundColor: '#fee2e2',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#991b1b'
          }}>Inactive</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#991b1b'
          }}>
            {staff.filter(s => !s.is_active).length}
          </p>
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
          }}>With Positions</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1e40af'
          }}>
            {staff.filter(s => s.job_position).length}
          </p>
        </div>
      </div>

      {/* Add Staff Form */}
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
          }}>Add New Staff Member</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <input
              type="text"
              placeholder="Full Name"
              value={newStaff.full_name}
              onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
            <input
              type="email"
              placeholder="Email"
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
            <input
              type="tel"
              placeholder="Phone"
              value={newStaff.phone}
              onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
            <select
              value={newStaff.job_position}
              onChange={(e) => setNewStaff({ ...newStaff, job_position: e.target.value })}
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none'
              }}
            >
              <option value="">Select Position</option>
              {positions.map(position => (
                <option key={position.id} value={position.name}>{position.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Hourly Rate"
              step="0.01"
              value={newStaff.hourly_rate}
              onChange={(e) => setNewStaff({ ...newStaff, hourly_rate: parseFloat(e.target.value) || 0 })}
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
            <input
              type="number"
              placeholder="Commission Rate (%)"
              step="0.1"
              max="100"
              value={newStaff.commission_rate}
              onChange={(e) => setNewStaff({ ...newStaff, commission_rate: parseFloat(e.target.value) || 0 })}
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
            <input
              type="date"
              value={newStaff.hire_date}
              onChange={(e) => setNewStaff({ ...newStaff, hire_date: e.target.value })}
              style={{
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px'
            }}>
              <input
                type="checkbox"
                id="active"
                checked={newStaff.is_active}
                onChange={(e) => setNewStaff({ ...newStaff, is_active: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="active" style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                Active
              </label>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Specializations (comma separated)"
              value={newStaff.specializations}
              onChange={(e) => setNewStaff({ ...newStaff, specializations: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginTop: '4px'
            }}>Enter specializations separated by commas (e.g. Hair Cutting, Hair Coloring, Styling)</p>
          </div>

          <textarea
            placeholder="Bio"
            value={newStaff.bio}
            onChange={(e) => setNewStaff({ ...newStaff, bio: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none',
              marginBottom: '16px',
              minHeight: '80px'
            }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddStaff}
              style={{
                backgroundColor: '#ec4899',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Add Staff Member
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

      {/* Staff List */}
      {filteredAndSortedStaff.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 0'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</div>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
            {filterStatus === 'all' 
              ? 'No staff members found. Add your first staff member to get started.' 
              : `No ${filterStatus} staff members found.`
            }
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAndSortedStaff.map(staffMember => (
            <div key={staffMember.id} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: staffMember.is_active ? 'white' : '#f9fafb'
            }}>
              {editingStaff?.id === staffMember.id ? (
                // Edit Mode
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px'
                  }}>
                    <input
                      type="text"
                      value={editingStaff.full_name}
                      onChange={(e) => setEditingStaff({ ...editingStaff, full_name: e.target.value })}
                      style={{
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                      placeholder="Full Name"
                    />
                    <input
                      type="email"
                      value={editingStaff.email}
                      onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                      style={{
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                      placeholder="Email"
                    />
                    <input
                      type="tel"
                      value={editingStaff.phone}
                      onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                      style={{
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                      placeholder="Phone"
                    />
                    <select
                      value={editingStaff.job_position}
                      onChange={(e) => setEditingStaff({ ...editingStaff, job_position: e.target.value })}
                      style={{
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                    >
                      <option value="">Select Position</option>
                      {positions.map(position => (
                        <option key={position.id} value={position.name}>{position.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={editingStaff.hourly_rate}
                      onChange={(e) => setEditingStaff({ ...editingStaff, hourly_rate: parseFloat(e.target.value) || 0 })}
                      style={{
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                      placeholder="Hourly Rate"
                    />
                    <input
                      type="number"
                      step="0.1"
                      max="100"
                      value={editingStaff.commission_rate}
                      onChange={(e) => setEditingStaff({ ...editingStaff, commission_rate: parseFloat(e.target.value) || 0 })}
                      style={{
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                      placeholder="Commission Rate (%)"
                    />
                    <input
                      type="date"
                      value={editingStaff.hire_date}
                      onChange={(e) => setEditingStaff({ ...editingStaff, hire_date: e.target.value })}
                      style={{
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px'
                    }}>
                      <input
                        type="checkbox"
                        id={`active-${editingStaff.id}`}
                        checked={editingStaff.is_active}
                        onChange={(e) => setEditingStaff({ ...editingStaff, is_active: e.target.checked })}
                        style={{ marginRight: '8px' }}
                      />
                      <label htmlFor={`active-${editingStaff.id}`} style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        Active
                      </label>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={Array.isArray(editingStaff.specializations) ? editingStaff.specializations.join(', ') : editingStaff.specializations}
                      onChange={(e) => setEditingStaff({ 
                        ...editingStaff, 
                        specializations: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                      placeholder="Specializations (comma separated)"
                    />
                  </div>

                  <textarea
                    value={editingStaff.bio}
                    onChange={(e) => setEditingStaff({ ...editingStaff, bio: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      outline: 'none',
                      minHeight: '80px'
                    }}
                    placeholder="Bio"
                  />

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleUpdateStaff(editingStaff)}
                      style={{
                        backgroundColor: '#16a34a',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingStaff(null)}
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
              ) : (
                // View Mode
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px'
                    }}>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: staffMember.is_active ? '#111827' : '#6b7280'
                      }}>
                        {staffMember.full_name}
                      </h3>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontWeight: '500',
                        ...getStatusColor(staffMember.is_active)
                      }}>
                        {staffMember.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px',
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <p><strong>Position:</strong> {staffMember.job_position || 'No position assigned'}</p>
                        <p><strong>Email:</strong> {staffMember.email}</p>
                        <p><strong>Phone:</strong> {staffMember.phone}</p>
                      </div>
                      <div>
                        <p><strong>Hired:</strong> {format(new Date(staffMember.hire_date), 'MMM d, yyyy')}</p>
                        <p><strong>Rate:</strong> ${staffMember.hourly_rate}/hr</p>
                        <p><strong>Commission:</strong> {staffMember.commission_rate}%</p>
                      </div>
                    </div>

                    {staffMember.specializations && staffMember.specializations.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '4px'
                        }}>Specializations:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {staffMember.specializations.map((spec, index) => (
                            <span key={index} style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: '#dbeafe',
                              color: '#1e40af'
                            }}>
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {staffMember.bio && (
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        fontStyle: 'italic'
                      }}>{staffMember.bio}</p>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginLeft: '16px'
                  }}>
                    <button
                      onClick={() => setEditingStaff(staffMember)}
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
                      onClick={() => toggleStaffStatus(staffMember.id, staffMember.is_active)}
                      style={{
                        color: staffMember.is_active ? '#dc2626' : '#16a34a',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        textDecoration: 'underline'
                      }}
                    >
                      {staffMember.is_active ? 'Deactivate' : 'Activate'}
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
