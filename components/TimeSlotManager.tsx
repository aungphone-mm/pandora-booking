'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TimeSlotManager() {
  const supabase = createClient()
  const [timeSlots, setTimeSlots] = useState<any[]>([])
  const [editingSlot, setEditingSlot] = useState<any>(null)
  const [newTimeSlot, setNewTimeSlot] = useState({
    time: '',
    is_active: true
  })

  useEffect(() => {
    loadTimeSlots()
  }, [])

  const loadTimeSlots = async () => {
    const { data } = await supabase
      .from('time_slots')
      .select('*')
      .order('time')

    setTimeSlots(data || [])
  }

  const handleAddTimeSlot = async () => {
    if (!newTimeSlot.time) return

    const { error } = await supabase
      .from('time_slots')
      .insert([newTimeSlot])

    if (!error) {
      setNewTimeSlot({
        time: '',
        is_active: true
      })
      loadTimeSlots()
    }
  }

  const handleUpdateTimeSlot = async (timeSlot: any) => {
    const { error } = await supabase
      .from('time_slots')
      .update({
        time: timeSlot.time,
        is_active: timeSlot.is_active
      })
      .eq('id', timeSlot.id)

    if (!error) {
      setEditingSlot(null)
      loadTimeSlots()
    }
  }

  const handleDeleteTimeSlot = async (id: string) => {
    if (confirm('Are you sure you want to delete this time slot?')) {
      const { error } = await supabase
        .from('time_slots')
        .delete()
        .eq('id', id)

      if (!error) {
        loadTimeSlots()
      }
    }
  }

  const toggleSlotStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('time_slots')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (!error) {
      loadTimeSlots()
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
    if (confirm('This will add common business hours (9:00 AM - 5:00 PM, every 30 minutes). Continue?')) {
      const commonSlots = generateCommonTimeSlots()
      const existingTimes = timeSlots.map(slot => slot.time)
      const newSlots = commonSlots
        .filter(time => !existingTimes.includes(time))
        .map(time => ({ time, is_active: true }))

      if (newSlots.length > 0) {
        const { error } = await supabase
          .from('time_slots')
          .insert(newSlots)

        if (!error) {
          loadTimeSlots()
        }
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Time Slot Management</h2>
      
      {/* Add new time slot form */}
      <div className="mb-8 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-4">Add New Time Slot</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              value={newTimeSlot.time}
              onChange={(e) => setNewTimeSlot({ ...newTimeSlot, time: e.target.value })}
              className="px-3 py-2 border rounded w-full"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="newActive"
              checked={newTimeSlot.is_active}
              onChange={(e) => setNewTimeSlot({ ...newTimeSlot, is_active: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="newActive" className="text-sm">Active</label>
          </div>
          <button
            onClick={handleAddTimeSlot}
            className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
          >
            Add Time Slot
          </button>
        </div>
        
        {/* Quick add common slots */}
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={addCommonTimeSlots}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
          >
            Quick Add: Business Hours (9 AM - 5 PM)
          </button>
          <p className="text-sm text-gray-600 mt-1">
            Adds 30-minute intervals from 9:00 AM to 5:00 PM
          </p>
        </div>
      </div>

      {/* Time slots list */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Time</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(timeSlot => (
              <tr key={timeSlot.id} className="border-b">
                <td className="py-2">
                  {editingSlot?.id === timeSlot.id ? (
                    <input
                      type="time"
                      value={editingSlot.time}
                      onChange={(e) => setEditingSlot({ ...editingSlot, time: e.target.value })}
                      className="px-2 py-1 border rounded"
                    />
                  ) : (
                    <span className="font-mono">
                      {new Date(`1970-01-01T${timeSlot.time}`).toLocaleTimeString([], { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </span>
                  )}
                </td>
                <td className="py-2">
                  {editingSlot?.id === timeSlot.id ? (
                    <input
                      type="checkbox"
                      checked={editingSlot.is_active}
                      onChange={(e) => setEditingSlot({ ...editingSlot, is_active: e.target.checked })}
                    />
                  ) : (
                    <button
                      onClick={() => toggleSlotStatus(timeSlot.id, timeSlot.is_active)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        timeSlot.is_active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {timeSlot.is_active ? 'Active' : 'Inactive'}
                    </button>
                  )}
                </td>
                <td className="py-2">
                  {editingSlot?.id === timeSlot.id ? (
                    <>
                      <button
                        onClick={() => handleUpdateTimeSlot(editingSlot)}
                        className="text-green-600 hover:text-green-800 mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingSlot(null)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingSlot(timeSlot)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTimeSlot(timeSlot.id)}
                        className="text-red-600 hover:text-red-800"
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
        
        {timeSlots.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No time slots configured. Add some time slots to get started.
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{timeSlots.length}</div>
            <div className="text-sm text-gray-600">Total Slots</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {timeSlots.filter(slot => slot.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {timeSlots.filter(slot => !slot.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Inactive</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {timeSlots.filter(slot => slot.is_active).length * 7}
            </div>
            <div className="text-sm text-gray-600">Weekly Slots</div>
          </div>
        </div>
      </div>
    </div>
  )
}