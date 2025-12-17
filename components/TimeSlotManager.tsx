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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-[300px]">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Time Slot Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded font-semibold transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Time Slot'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
          >
            <option value="all">All Time Slots</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600">Total Slots</h3>
          <p className="text-2xl font-bold text-gray-900">{timeSlots.length}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">Active</h3>
          <p className="text-2xl font-bold text-green-800">
            {timeSlots.filter(slot => slot.is_active).length}
          </p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800">Inactive</h3>
          <p className="text-2xl font-bold text-red-800">
            {timeSlots.filter(slot => !slot.is_active).length}
          </p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900">Weekly Slots</h3>
          <p className="text-2xl font-bold text-blue-900">
            {timeSlots.filter(slot => slot.is_active).length * 7}
          </p>
        </div>
      </div>

      {/* Add Time Slot Form */}
      {showAddForm && (
        <div className="mb-6 p-6 border-2 border-amber-600 rounded-lg bg-amber-50">
          <h3 className="text-xl font-bold mb-4 text-amber-700">Add New Time Slot</h3>
          
          <div className="grid grid-cols-[auto_auto_1fr] gap-4 items-end mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={newTimeSlot.time}
                onChange={(e) => setNewTimeSlot({ ...newTimeSlot, time: e.target.value })}
                className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 min-w-[140px]"
              />
            </div>
            <div className="flex items-center p-3">
              <input
                type="checkbox"
                id="newActive"
                checked={newTimeSlot.is_active}
                onChange={(e) => setNewTimeSlot({ ...newTimeSlot, is_active: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="newActive" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>
          </div>
          
          {/* Quick add section */}
          <div className="p-4 bg-gray-100 rounded-lg mb-4">
            <h4 className="text-base font-semibold mb-2 text-gray-700">Quick Add Business Hours</h4>
            <button
              onClick={addCommonTimeSlots}
              disabled={saving}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium text-sm mb-1 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Adding...' : 'Add 9 AM - 5 PM (30 min intervals)'}
            </button>
            <p className="text-xs text-gray-600">
              Adds 30-minute intervals from 9:00 AM to 5:00 PM
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddTimeSlot}
              disabled={saving || !newTimeSlot.time}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Adding...' : 'Add Time Slot'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Time Slots List */}
      {filteredTimeSlots.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🕐</div>
          <p className="text-gray-600 text-lg">
            {filterStatus !== 'all'
              ? `No ${filterStatus} time slots found.`
              : 'No time slots configured. Add some time slots to get started.'
            }
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredTimeSlots.map((timeSlot) => (
            <div key={timeSlot.id} className="border border-gray-200 rounded-lg p-5 bg-white">
              {editingSlot?.id === timeSlot.id ? (
                // Edit Mode
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-[auto_auto] gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={editingSlot.time}
                        onChange={(e) => setEditingSlot({ ...editingSlot, time: e.target.value })}
                        className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600 min-w-[140px]"
                      />
                    </div>
                    <div className="flex items-center p-3">
                      <input
                        type="checkbox"
                        id={`active-${editingSlot.id}`}
                        checked={editingSlot.is_active}
                        onChange={(e) => setEditingSlot({ ...editingSlot, is_active: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor={`active-${editingSlot.id}`} className="text-sm font-medium text-gray-700">
                        Active
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateTimeSlot(editingSlot)}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setEditingSlot(null)}
                      disabled={saving}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-2xl font-bold font-mono ${timeSlot.is_active ? 'text-gray-900' : 'text-gray-600'}`}>
                        {formatTime(timeSlot.time)}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-full font-medium">
                        {timeSlot.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      Created: {format(new Date(timeSlot.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>

                  <div className="flex gap-2 items-center ml-4">
                    <button
                      onClick={() => setEditingSlot(timeSlot)}
                      className="text-blue-600 hover:text-blue-700 underline text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleSlotStatus(timeSlot.id, timeSlot.is_active)}
                      className={`hover:opacity-75 underline text-sm transition-opacity ${timeSlot.is_active ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {timeSlot.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteTimeSlot(timeSlot.id)}
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
  )
}
