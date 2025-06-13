'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Staff = {
  id: string
  full_name: string
  email: string
  phone: string
  position: string
  specializations: string[]
  bio: string
  is_active: boolean
  hourly_rate: number
  commission_rate: number
  hire_date: string
}

export default function StaffManager() {
  const supabase = createClient()
  const [staff, setStaff] = useState<Staff[]>([])
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newStaff, setNewStaff] = useState({
    full_name: '',
    email: '',
    phone: '',
    position: '',
    specializations: [] as string[],
    bio: '',
    hourly_rate: 0,
    commission_rate: 0,
    hire_date: new Date().toISOString().split('T')[0]
  })

  const positions = [
    'Senior Stylist',
    'Stylist', 
    'Beautician',
    'Nail Technician',
    'Massage Therapist',
    'Manager',
    'Receptionist'
  ]

  const allSpecializations = [
    'haircut', 'coloring', 'styling', 'perms', 'extensions',
    'facial', 'skincare', 'eyebrows', 'lashes', 'waxing',
    'manicure', 'pedicure', 'nail_art', 'gel_nails',
    'massage', 'aromatherapy', 'hot_stone',
    'management', 'customer_service', 'reception'
  ]

  useEffect(() => {
    loadStaff()
  }, [])

  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setStaff(data || [])
    } catch (error) {
      console.error('Error loading staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStaff = async () => {
    try {
      const { error } = await supabase
        .from('staff')
        .insert([{
          ...newStaff,
          is_active: true
        }])

      if (error) throw error

      setNewStaff({
        full_name: '',
        email: '',
        phone: '',
        position: '',
        specializations: [],
        bio: '',
        hourly_rate: 0,
        commission_rate: 0,
        hire_date: new Date().toISOString().split('T')[0]
      })
      setShowAddForm(false)
      loadStaff()
    } catch (error) {
      console.error('Error adding staff:', error)
      alert('Failed to add staff member')
    }
  }

  const handleUpdateStaff = async (staffMember: Staff) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({
          full_name: staffMember.full_name,
          email: staffMember.email,
          phone: staffMember.phone,
          position: staffMember.position,
          specializations: staffMember.specializations,
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
      loadStaff()
    } catch (error) {
      console.error('Error updating staff:', error)
      alert('Failed to update staff member')
    }
  }

  const toggleStaffStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      loadStaff()
    } catch (error) {
      console.error('Error updating staff status:', error)
    }
  }

  const handleSpecializationToggle = (specialization: string, isEditing: boolean = false) => {
    if (isEditing && editingStaff) {
      const updated = editingStaff.specializations.includes(specialization)
        ? editingStaff.specializations.filter(s => s !== specialization)
        : [...editingStaff.specializations, specialization]
      
      setEditingStaff({ ...editingStaff, specializations: updated })
    } else {
      const updated = newStaff.specializations.includes(specialization)
        ? newStaff.specializations.filter(s => s !== specialization)
        : [...newStaff.specializations, specialization]
      
      setNewStaff({ ...newStaff, specializations: updated })
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Staff Management</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
        >
          Add Staff Member
        </button>
      </div>

      {/* Add Staff Form */}
      {showAddForm && (
        <div className="mb-8 p-6 border-2 border-pink-200 rounded-lg bg-pink-50">
          <h3 className="text-lg font-semibold mb-4">Add New Staff Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={newStaff.full_name}
              onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
              className="px-3 py-2 border rounded"
            />
            <input
              type="email"
              placeholder="Email"
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              className="px-3 py-2 border rounded"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={newStaff.phone}
              onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
              className="px-3 py-2 border rounded"
            />
            <select
              value={newStaff.position}
              onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}
              className="px-3 py-2 border rounded"
            >
              <option value="">Select Position</option>
              {positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Hourly Rate"
              step="0.01"
              value={newStaff.hourly_rate}
              onChange={(e) => setNewStaff({ ...newStaff, hourly_rate: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 border rounded"
            />
            <input
              type="number"
              placeholder="Commission Rate (%)"
              step="0.1"
              max="100"
              value={newStaff.commission_rate}
              onChange={(e) => setNewStaff({ ...newStaff, commission_rate: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 border rounded"
            />
            <input
              type="date"
              value={newStaff.hire_date}
              onChange={(e) => setNewStaff({ ...newStaff, hire_date: e.target.value })}
              className="px-3 py-2 border rounded"
            />
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specializations
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {allSpecializations.map(spec => (
                <label key={spec} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={newStaff.specializations.includes(spec)}
                    onChange={() => handleSpecializationToggle(spec)}
                    className="mr-1"
                  />
                  {spec.replace('_', ' ')}
                </label>
              ))}
            </div>
          </div>

          <textarea
            placeholder="Bio"
            value={newStaff.bio}
            onChange={(e) => setNewStaff({ ...newStaff, bio: e.target.value })}
            className="w-full px-3 py-2 border rounded mt-4"
            rows={3}
          />

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddStaff}
              className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
            >
              Add Staff Member
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Staff List */}
      <div className="grid gap-4">
        {staff.map(staffMember => (
          <div key={staffMember.id} className={`border rounded-lg p-4 ${staffMember.is_active ? 'bg-white' : 'bg-gray-100'}`}>
            {editingStaff?.id === staffMember.id ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={editingStaff.full_name}
                    onChange={(e) => setEditingStaff({ ...editingStaff, full_name: e.target.value })}
                    className="px-3 py-2 border rounded"
                  />
                  <input
                    type="email"
                    value={editingStaff.email}
                    onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    className="px-3 py-2 border rounded"
                  />
                  <input
                    type="tel"
                    value={editingStaff.phone}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="px-3 py-2 border rounded"
                  />
                  <select
                    value={editingStaff.position}
                    onChange={(e) => setEditingStaff({ ...editingStaff, position: e.target.value })}
                    className="px-3 py-2 border rounded"
                  >
                    {positions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {allSpecializations.map(spec => (
                    <label key={spec} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={editingStaff.specializations.includes(spec)}
                        onChange={() => handleSpecializationToggle(spec, true)}
                        className="mr-1"
                      />
                      {spec.replace('_', ' ')}
                    </label>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStaff(editingStaff)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingStaff(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className={`text-lg font-semibold ${!staffMember.is_active ? 'text-gray-500' : ''}`}>
                      {staffMember.full_name}
                    </h3>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      staffMember.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {staffMember.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Position:</strong> {staffMember.position}</p>
                      <p><strong>Email:</strong> {staffMember.email}</p>
                      <p><strong>Phone:</strong> {staffMember.phone}</p>
                    </div>
                    <div>
                      <p><strong>Hired:</strong> {new Date(staffMember.hire_date).toLocaleDateString()}</p>
                      <p><strong>Rate:</strong> ${staffMember.hourly_rate}/hr</p>
                      <p><strong>Commission:</strong> {staffMember.commission_rate}%</p>
                    </div>
                  </div>

                  {staffMember.specializations.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Specializations:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {staffMember.specializations.map(spec => (
                          <span key={spec} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {spec.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {staffMember.bio && (
                    <p className="mt-2 text-sm text-gray-600">{staffMember.bio}</p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setEditingStaff(staffMember)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStaffStatus(staffMember.id, staffMember.is_active)}
                    className={`text-sm ${
                      staffMember.is_active 
                        ? 'text-red-600 hover:text-red-800' 
                        : 'text-green-600 hover:text-green-800'
                    }`}
                  >
                    {staffMember.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {staff.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No staff members found. Add your first staff member to get started.
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{staff.length}</div>
            <div className="text-sm text-gray-600">Total Staff</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {staff.filter(s => s.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {staff.filter(s => !s.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Inactive</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {positions.length}
            </div>
            <div className="text-sm text-gray-600">Positions</div>
          </div>
        </div>
      </div>
    </div>
  )
}