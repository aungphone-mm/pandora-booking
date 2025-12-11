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
      .staff-card {
        transition: all 0.3s ease-in-out;
      }
      .staff-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
      }
      .filter-select {
        transition: all 0.2s ease-in-out;
      }
      .filter-select:focus {
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        border-color: #8b5cf6;
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
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        border-color: #8b5cf6;
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
          is_active: staffMember.is_active
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
      ? { 
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', 
          color: '#166534',
          border: '1px solid #16a34a'
        }
      : { 
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', 
          color: '#991b1b',
          border: '1px solid #dc2626'
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
          borderTop: '4px solid #8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#1e293b'
        }}>Loading Staff</h2>
        <p style={{
          color: '#64748b',
          fontSize: '1rem'
        }}>Please wait while we fetch your staff data...</p>
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
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(139, 92, 246, 0.3)',
        padding: '32px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }} className="staff-card">
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
            }}>👥 Staff Management</h2>
            <p style={{
              fontSize: '1.1rem',
              margin: '0',
              opacity: '0.9'
            }}>Manage your salon team and staff information</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.open('/admin/staff-categories', '_blank')}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '16px 20px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              className="action-button"
            >
              ⚙️ Manage Positions
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                color: 'white',
                padding: '16px 20px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                boxShadow: '0 6px 20px rgba(236, 72, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              className="action-button"
            >
              {showAddForm ? '❌ Cancel' : '➕ Add Staff Member'}
            </button>
          </div>
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
      }} className="staff-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
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
            }}>👥 Filter by Status</label>
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
              <option value="all">All Staff</option>
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
              onChange={(e) => setSortBy(e.target.value as 'name' | 'position' | 'hire_date')}
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
              <option value="name">👤 Name</option>
              <option value="position">💼 Position</option>
              <option value="hire_date">📅 Hire Date</option>
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
        }} className="staff-card">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 8px 0'
          }}>Total Staff</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#1e293b',
            margin: '0'
          }}>{staff.length}</p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #16a34a',
          boxShadow: '0 6px 20px rgba(34, 197, 94, 0.15)',
          textAlign: 'center'
        }} className="staff-card">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#166534',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 8px 0'
          }}>Active</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#166534',
            margin: '0'
          }}>
            {staff.filter(s => s.is_active).length}
          </p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #dc2626',
          boxShadow: '0 6px 20px rgba(220, 38, 38, 0.15)',
          textAlign: 'center'
        }} className="staff-card">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>❌</div>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#991b1b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 8px 0'
          }}>Inactive</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#991b1b',
            margin: '0'
          }}>
            {staff.filter(s => !s.is_active).length}
          </p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #3b82f6',
          boxShadow: '0 6px 20px rgba(59, 130, 246, 0.15)',
          textAlign: 'center'
        }} className="staff-card">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💼</div>
          <h3 style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#1e40af',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 8px 0'
          }}>With Positions</h3>
          <p style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#1e40af',
            margin: '0'
          }}>
            {staff.filter(s => s.job_position).length}
          </p>
        </div>
      </div>

      {/* Enhanced Add Staff Form */}
      {showAddForm && (
        <div style={{
          background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
          border: '2px solid #f59e0b',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 15px 35px rgba(245, 158, 11, 0.2)'
        }} className="staff-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
              color: '#92400e'
            }}>Add New Staff Member</h3>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <input
              type="text"
              placeholder="👤 Full Name"
              value={newStaff.full_name}
              onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
              style={{
                padding: '16px',
                border: '2px solid #fbbf24',
                borderRadius: '12px',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                backgroundColor: 'white'
              }}
              className="form-input"
            />
            <input
              type="email"
              placeholder="📧 Email"
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              style={{
                padding: '16px',
                border: '2px solid #fbbf24',
                borderRadius: '12px',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                backgroundColor: 'white'
              }}
              className="form-input"
            />
            <input
              type="tel"
              placeholder="📞 Phone"
              value={newStaff.phone}
              onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
              style={{
                padding: '16px',
                border: '2px solid #fbbf24',
                borderRadius: '12px',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                backgroundColor: 'white'
              }}
              className="form-input"
            />
            <select
              value={newStaff.job_position}
              onChange={(e) => setNewStaff({ ...newStaff, job_position: e.target.value })}
              style={{
                padding: '16px',
                border: '2px solid #fbbf24',
                borderRadius: '12px',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                backgroundColor: 'white'
              }}
              className="form-input"
            >
              <option value="">💼 Select Position</option>
              {positions.map(position => (
                <option key={position.id} value={position.name}>{position.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="💰 Hourly Rate"
              step="0.01"
              value={newStaff.hourly_rate}
              onChange={(e) => setNewStaff({ ...newStaff, hourly_rate: parseFloat(e.target.value) || 0 })}
              style={{
                padding: '16px',
                border: '2px solid #fbbf24',
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
              placeholder="📊 Commission Rate (%)"
              step="0.1"
              max="100"
              value={newStaff.commission_rate}
              onChange={(e) => setNewStaff({ ...newStaff, commission_rate: parseFloat(e.target.value) || 0 })}
              style={{
                padding: '16px',
                border: '2px solid #fbbf24',
                borderRadius: '12px',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                backgroundColor: 'white'
              }}
              className="form-input"
            />
            <input
              type="date"
              value={newStaff.hire_date}
              onChange={(e) => setNewStaff({ ...newStaff, hire_date: e.target.value })}
              style={{
                padding: '16px',
                border: '2px solid #fbbf24',
                borderRadius: '12px',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                backgroundColor: 'white'
              }}
              className="form-input"
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #fbbf24'
            }}>
              <input
                type="checkbox"
                id="active"
                checked={newStaff.is_active}
                onChange={(e) => setNewStaff({ ...newStaff, is_active: e.target.checked })}
                style={{ marginRight: '12px', width: '18px', height: '18px' }}
              />
              <label htmlFor="active" style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#92400e'
              }}>
                ✅ Active
              </label>
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="✨ Specializations (comma separated)"
              value={newStaff.specializations}
              onChange={(e) => setNewStaff({ ...newStaff, specializations: e.target.value })}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #fbbf24',
                borderRadius: '12px',
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                backgroundColor: 'white'
              }}
              className="form-input"
            />
            <p style={{
              fontSize: '0.85rem',
              color: '#92400e',
              marginTop: '8px',
              fontWeight: '500'
            }}>💡 Enter specializations separated by commas (e.g. Hair Cutting, Hair Coloring, Styling)</p>
          </div>

          <textarea
            placeholder="📝 Bio"
            value={newStaff.bio}
            onChange={(e) => setNewStaff({ ...newStaff, bio: e.target.value })}
            style={{
              width: '100%',
              padding: '16px',
              border: '2px solid #fbbf24',
              borderRadius: '12px',
              outline: 'none',
              marginBottom: '24px',
              minHeight: '100px',
              fontSize: '1rem',
              fontWeight: '500',
              backgroundColor: 'white',
              resize: 'vertical'
            }}
            className="form-input"
          />

          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={handleAddStaff}
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
              ✅ Add Staff Member
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

      {/* Enhanced Staff List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
        padding: '0',
        border: '1px solid #f1f5f9',
        overflow: 'hidden'
      }} className="staff-card">
        {filteredAndSortedStaff.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 32px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px', opacity: '0.5' }}>👥</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#475569'
            }}>
              {filterStatus === 'all' 
                ? 'No staff members found' 
                : `No ${filterStatus} staff members found`
              }
            </h3>
            <p style={{ fontSize: '1rem', opacity: '0.8' }}>
              {filterStatus === 'all' 
                ? 'Add your first staff member to get started.' 
                : 'Try changing the filter to see other staff members.'
              }
            </p>
          </div>
        ) : (
          <div style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>👥</div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: '0',
                color: '#1e293b'
              }}>Staff Members ({filteredAndSortedStaff.length})</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredAndSortedStaff.map(staffMember => (
                <div key={staffMember.id} style={{
                  border: '2px solid #f1f5f9',
                  borderRadius: '16px',
                  padding: '24px',
                  backgroundColor: staffMember.is_active ? 'white' : '#f8fafc',
                  transition: 'all 0.3s ease-in-out'
                }} className="staff-card">
                  {editingStaff?.id === staffMember.id ? (
                    // Edit Mode
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                            padding: '12px 16px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            outline: 'none',
                            fontSize: '1rem',
                            fontWeight: '500'
                          }}
                          className="form-input"
                          placeholder="Full Name"
                        />
                        <input
                          type="email"
                          value={editingStaff.email}
                          onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                          style={{
                            padding: '12px 16px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            outline: 'none',
                            fontSize: '1rem',
                            fontWeight: '500'
                          }}
                          className="form-input"
                          placeholder="Email"
                        />
                        <input
                          type="tel"
                          value={editingStaff.phone}
                          onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                          style={{
                            padding: '12px 16px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            outline: 'none',
                            fontSize: '1rem',
                            fontWeight: '500'
                          }}
                          className="form-input"
                          placeholder="Phone"
                        />
                        <select
                          value={editingStaff.job_position}
                          onChange={(e) => setEditingStaff({ ...editingStaff, job_position: e.target.value })}
                          style={{
                            padding: '12px 16px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            outline: 'none',
                            fontSize: '1rem',
                            fontWeight: '500'
                          }}
                          className="form-input"
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
                            padding: '12px 16px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            outline: 'none',
                            fontSize: '1rem',
                            fontWeight: '500'
                          }}
                          className="form-input"
                          placeholder="Hourly Rate"
                        />
                        <input
                          type="number"
                          step="0.1"
                          max="100"
                          value={editingStaff.commission_rate}
                          onChange={(e) => setEditingStaff({ ...editingStaff, commission_rate: parseFloat(e.target.value) || 0 })}
                          style={{
                            padding: '12px 16px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            outline: 'none',
                            fontSize: '1rem',
                            fontWeight: '500'
                          }}
                          className="form-input"
                          placeholder="Commission Rate (%)"
                        />
                        <input
                          type="date"
                          value={editingStaff.hire_date}
                          onChange={(e) => setEditingStaff({ ...editingStaff, hire_date: e.target.value })}
                          style={{
                            padding: '12px 16px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            outline: 'none',
                            fontSize: '1rem',
                            fontWeight: '500'
                          }}
                          className="form-input"
                        />
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 16px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '12px'
                        }}>
                          <input
                            type="checkbox"
                            id={`active-${editingStaff.id}`}
                            checked={editingStaff.is_active}
                            onChange={(e) => setEditingStaff({ ...editingStaff, is_active: e.target.checked })}
                            style={{ marginRight: '12px', width: '16px', height: '16px' }}
                          />
                          <label htmlFor={`active-${editingStaff.id}`} style={{
                            fontSize: '1rem',
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
                            padding: '12px 16px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            outline: 'none',
                            fontSize: '1rem',
                            fontWeight: '500'
                          }}
                          className="form-input"
                          placeholder="Specializations (comma separated)"
                        />
                      </div>

                      <textarea
                        value={editingStaff.bio}
                        onChange={(e) => setEditingStaff({ ...editingStaff, bio: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '12px',
                          outline: 'none',
                          minHeight: '80px',
                          fontSize: '1rem',
                          fontWeight: '500',
                          resize: 'vertical'
                        }}
                        className="form-input"
                        placeholder="Bio"
                      />

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => handleUpdateStaff(editingStaff)}
                          style={{
                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                          }}
                          className="action-button"
                        >
                          ✅ Save Changes
                        </button>
                        <button
                          onClick={() => setEditingStaff(null)}
                          style={{
                            background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
                          }}
                          className="action-button"
                        >
                          ❌ Cancel
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
                          gap: '16px',
                          marginBottom: '16px'
                        }}>
                          <h3 style={{
                            fontSize: '1.4rem',
                            fontWeight: '700',
                            color: staffMember.is_active ? '#1e293b' : '#64748b',
                            margin: '0'
                          }}>
                            👤 {staffMember.full_name}
                          </h3>
                          <span style={{
                            fontSize: '0.85rem',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontWeight: '600',
                            ...getStatusColor(staffMember.is_active)
                          }}>
                            {staffMember.is_active ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </div>
                        
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                          gap: '16px',
                          fontSize: '0.95rem',
                          color: '#64748b',
                          marginBottom: '16px'
                        }}>
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#475569' }}>💼 <strong>Position:</strong></p>
                            <p style={{ margin: '0' }}>{staffMember.job_position || 'No position assigned'}</p>
                          </div>
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#475569' }}>📧 <strong>Email:</strong></p>
                            <p style={{ margin: '0' }}>{staffMember.email}</p>
                          </div>
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#475569' }}>📞 <strong>Phone:</strong></p>
                            <p style={{ margin: '0' }}>{staffMember.phone}</p>
                          </div>
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#475569' }}>📅 <strong>Hired:</strong></p>
                            <p style={{ margin: '0' }}>{format(new Date(staffMember.hire_date), 'MMM d, yyyy')}</p>
                          </div>
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#475569' }}>💰 <strong>Rate:</strong></p>
                            <p style={{ margin: '0' }}>${staffMember.hourly_rate}/hr</p>
                          </div>
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#475569' }}>📊 <strong>Commission:</strong></p>
                            <p style={{ margin: '0' }}>{staffMember.commission_rate}%</p>
                          </div>
                        </div>

                        {staffMember.specializations && staffMember.specializations.length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            <p style={{
                              fontSize: '0.95rem',
                              fontWeight: '600',
                              color: '#475569',
                              marginBottom: '8px'
                            }}>✨ Specializations:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {staffMember.specializations.map((spec, index) => (
                                <span key={index} style={{
                                  fontSize: '0.85rem',
                                  padding: '6px 12px',
                                  borderRadius: '20px',
                                  backgroundColor: '#ede9fe',
                                  color: '#7c3aed',
                                  fontWeight: '600',
                                  border: '1px solid #c4b5fd'
                                }}>
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {staffMember.bio && (
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#f0f9ff',
                            borderRadius: '8px',
                            border: '1px solid #bae6fd'
                          }}>
                            <p style={{
                              fontSize: '0.95rem',
                              color: '#0369a1',
                              fontStyle: 'italic',
                              margin: '0',
                              lineHeight: '1.5'
                            }}>📝 {staffMember.bio}</p>
                          </div>
                        )}
                      </div>

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        marginLeft: '24px'
                      }}>
                        <button
                          onClick={() => setEditingStaff(staffMember)}
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
                          onClick={() => toggleStaffStatus(staffMember.id, staffMember.is_active)}
                          style={{
                            background: staffMember.is_active 
                              ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' 
                              : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            boxShadow: staffMember.is_active 
                              ? '0 4px 12px rgba(220, 38, 38, 0.3)'
                              : '0 4px 12px rgba(22, 163, 74, 0.3)'
                          }}
                          className="action-button"
                        >
                          {staffMember.is_active ? '❌ Deactivate' : '✅ Activate'}
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
