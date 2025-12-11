'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type TimeSlot = {
  id: string
  time: string
  is_active: boolean
  created_at: string
}

export default function TimeSlotManager() {
  const supabase = createClient()
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [newTimeSlot, setNewTimeSlot] = useState({
    time: '',
    is_active: true
  })

  useEffect(() => {
    loadTimeSlots()
  }, [])

  const loadTimeSlots = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .order('time')

      if (error) throw error
      setTimeSlots(data || [])
    } catch (err: any) {
      console.error('Error loading time slots:', err)
      setError(err.message || 'Failed to load time slots')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTimeSlot = async () => {
    if (!newTimeSlot.time) {
      setError('Time is required')
      return
    }

    // Check for duplicates
    if (timeSlots.some(slot => slot.time === newTimeSlot.time)) {
      setError('This time slot already exists')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('time_slots')
        .insert([newTimeSlot])

      if (error) throw error

      setNewTimeSlot({
        time: '',
        is_active: true
      })
      setShowAddForm(false)
      loadTimeSlots()
    } catch (err: any) {
      console.error('Error adding time slot:', err)
      setError(err.message || 'Failed to add time slot')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTimeSlot = async (timeSlot: TimeSlot) => {
    if (!timeSlot.time) {
      setError('Time is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('time_slots')
        .update({
          time: timeSlot.time,
          is_active: timeSlot.is_active
        })
        .eq('id', timeSlot.id)

      if (error) throw error

      setEditingSlot(null)
      loadTimeSlots()
    } catch (err: any) {
      console.error('Error updating time slot:', err)
      setError(err.message || 'Failed to update time slot')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTimeSlot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time slot? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      const { error } = await supabase
        .from('time_slots')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadTimeSlots()
    } catch (err: any) {
      console.error('Error deleting time slot:', err)
      setError(err.message || 'Failed to delete time slot')
    } finally {
      setSaving(false)
    }
  }

  const toggleSlotStatus = async (id: string, currentStatus: boolean) => {
    try {
      setError(null)
      const { error } = await supabase
        .from('time_slots')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      loadTimeSlots()
    } catch (err: any) {
      console.error('Error updating time slot status:', err)
      setError(err.message || 'Failed to update time slot status')
    }
  }

  // Generate common time slots for quick add
  const generateCommonTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(timeString)
      }
    }
    return slots
  }

  const addCommonTimeSlots = async () => {
    if (!confirm('This will add common business hours (9:00 AM - 5:00 PM, every 30 minutes). Continue?')) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      const commonSlots = generateCommonTimeSlots()
      const existingTimes = timeSlots.map(slot => slot.time)
      const newSlots = commonSlots
        .filter(time => !existingTimes.includes(time))
        .map(time => ({ time, is_active: true }))

      if (newSlots.length > 0) {
        const { error } = await supabase
          .from('time_slots')
          .insert(newSlots)

        if (error) throw error
        loadTimeSlots()
      } else {
        setError('All common time slots already exist')
      }
    } catch (err: any) {
      console.error('Error adding common time slots:', err)
      setError(err.message || 'Failed to add common time slots')
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (time: string) => {
    try {
      return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } catch {
      return time // fallback to original format if parsing fails
    }
  }

  // Filter time slots
  const filteredTimeSlots = timeSlots.filter(slot => {
    if (filterStatus === 'all') return true
    return filterStatus === 'active' ? slot.is_active : !slot.is_active
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
            border: '2px solid #f59e0b',
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
        }}>Time Slot Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {showAddForm ? 'Cancel' : 'Add Time Slot'}
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

      {/* Filters */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
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
            <option value="all">All Time Slots</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
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
          }}>Total Slots</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>{timeSlots.length}</p>
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
            {timeSlots.filter(slot => slot.is_active).length}
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
            {timeSlots.filter(slot => !slot.is_active).length}
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
          }}>Weekly Slots</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1e40af'
          }}>
            {timeSlots.filter(slot => slot.is_active).length * 7}
          </p>
        </div>
      </div>

      {/* Add Time Slot Form */}
      {showAddForm && (
        <div style={{
          marginBottom: '24px',
          padding: '24px',
          border: '2px solid #f59e0b',
          borderRadius: '8px',
          backgroundColor: '#fffbeb'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: '#d97706'
          }}>Add New Time Slot</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto auto 1fr',
            gap: '16px',
            alignItems: 'end',
            marginBottom: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Time
              </label>
              <input
                type="time"
                value={newTimeSlot.time}
                onChange={(e) => setNewTimeSlot({ ...newTimeSlot, time: e.target.value })}
                style={{
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  minWidth: '140px'
                }}
              />
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px'
            }}>
              <input
                type="checkbox"
                id="newActive"
                checked={newTimeSlot.is_active}
                onChange={(e) => setNewTimeSlot({ ...newTimeSlot, is_active: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="newActive" style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                Active
              </label>
            </div>
          </div>
          
          {/* Quick add section */}
          <div style={{
            padding: '16px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#374151'
            }}>Quick Add Business Hours</h4>
            <button
              onClick={addCommonTimeSlots}
              disabled={saving}
              style={{
                backgroundColor: saving ? '#9ca3af' : '#6b7280',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '4px',
                opacity: saving ? 0.6 : 1
              }}
            >
              {saving ? 'Adding...' : 'Add 9 AM - 5 PM (30 min intervals)'}
            </button>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280'
            }}>
              Adds 30-minute intervals from 9:00 AM to 5:00 PM
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddTimeSlot}
              disabled={saving || !newTimeSlot.time}
              style={{
                backgroundColor: saving ? '#9ca3af' : '#f59e0b',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '4px',
                border: 'none',
                cursor: saving || !newTimeSlot.time ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: saving || !newTimeSlot.time ? 0.6 : 1
              }}
            >
              {saving ? 'Adding...' : 'Add Time Slot'}
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

      {/* Time Slots List */}
      {filteredTimeSlots.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 0'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🕐</div>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
            {filterStatus !== 'all'
              ? `No ${filterStatus} time slots found.`
              : 'No time slots configured. Add some time slots to get started.'
            }
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredTimeSlots.map((timeSlot) => (
            <div key={timeSlot.id} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: timeSlot.is_active ? 'white' : '#f9fafb'
            }}>
              {editingSlot?.id === timeSlot.id ? (
                // Edit Mode
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto auto',
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
                        Time
                      </label>
                      <input
                        type="time"
                        value={editingSlot.time}
                        onChange={(e) => setEditingSlot({ ...editingSlot, time: e.target.value })}
                        style={{
                          padding: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          outline: 'none',
                          minWidth: '140px'
                        }}
                      />
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px'
                    }}>
                      <input
                        type="checkbox"
                        id={`active-${editingSlot.id}`}
                        checked={editingSlot.is_active}
                        onChange={(e) => setEditingSlot({ ...editingSlot, is_active: e.target.checked })}
                        style={{ marginRight: '8px' }}
                      />
                      <label htmlFor={`active-${editingSlot.id}`} style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        Active
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleUpdateTimeSlot(editingSlot)}
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
                      onClick={() => setEditingSlot(null)}
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
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: timeSlot.is_active ? '#111827' : '#6b7280',
                        fontFamily: 'monospace'
                      }}>
                        {formatTime(timeSlot.time)}
                      </h3>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontWeight: '500',
                        ...getStatusColor(timeSlot.is_active)
                      }}>
                        {timeSlot.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      Created: {format(new Date(timeSlot.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    marginLeft: '16px'
                  }}>
                    <button
                      onClick={() => setEditingSlot(timeSlot)}
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
                      onClick={() => toggleSlotStatus(timeSlot.id, timeSlot.is_active)}
                      style={{
                        color: timeSlot.is_active ? '#dc2626' : '#16a34a',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        textDecoration: 'underline'
                      }}
                    >
                      {timeSlot.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteTimeSlot(timeSlot.id)}
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
