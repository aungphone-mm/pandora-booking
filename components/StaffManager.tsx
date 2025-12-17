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
      <div className="bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-12 text-center border border-slate-100">
        <div className="inline-block w-12 h-12 border-4 border-slate-100 border-t-violet-500 rounded-full animate-spin mb-5"></div>
        <h2 className="mb-2">Loading Staff</h2>
        <p className="text-slate-500 text-base">Please wait while we fetch your staff data...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.6s_ease-out]">
      {/* Enhanced Header */}
      <div className="staff-card bg-gradient-to-br from-violet-500 to-violet-700 rounded-[20px] shadow-[0_15px_35px_rgba(139,92,246,0.3)] p-8 text-white relative overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-4xl font-extrabold m-0 mb-2 [text-shadow:0_2px_4px_rgba(0,0,0,0.1)]">👥 Staff Management</h2>
            <p className="text-lg m-0 opacity-90">Manage your salon team and staff information</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.open('/admin/staff-categories', '_blank')}
              className="action-button bg-gradient-to-br from-blue-500 to-blue-700 text-white px-5 py-4 rounded-xl border-none cursor-pointer font-semibold text-[0.95rem] shadow-[0_6px_20px_rgba(59,130,246,0.3)] flex items-center gap-2"
            >
              ⚙️ Manage Positions
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="action-button bg-gradient-to-br from-pink-600 to-pink-700 text-white px-6 py-4 rounded-xl border-none cursor-pointer font-semibold text-base shadow-[0_6px_20px_rgba(236,72,153,0.3)] flex items-center gap-2"
            >
              {showAddForm ? '❌ Cancel' : '➕ Add Staff Member'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-400 rounded-2xl p-6 shadow-[0_8px_25px_rgba(248,113,113,0.2)]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-red-600 font-semibold m-0 text-lg">{error}</p>
          </div>
        </div>
      )}

      {/* Enhanced Filters and Sorting */}
      <div className="staff-card bg-white rounded-[20px] shadow-[0_8px_25px_rgba(0,0,0,0.06)] p-8 border border-slate-100">
        <div className="mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center text-xl">🔍</div>
          <h3 className="text-2xl font-bold m-0 text-slate-800">Filter & Sort Options</h3>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
          <div>
            <label className="mb-2">👥 Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium bg-white text-slate-800"
            >
              <option value="all">All Staff</option>
              <option value="active">✅ Active Only</option>
              <option value="inactive">❌ Inactive Only</option>
            </select>
          </div>

          <div>
            <label className="mb-2">📋 Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'position' | 'hire_date')}
              className="filter-select w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium bg-white text-slate-800"
            >
              <option value="name">👤 Name</option>
              <option value="position">💼 Position</option>
              <option value="hire_date">📅 Hire Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
        <div className="staff-card bg-gradient-to-br from-slate-50 to-slate-200 p-6 rounded-2xl border border-slate-200 shadow-[0_6px_20px_rgba(0,0,0,0.06)] text-center">
          <div className="mb-2">👥</div>
          <h3 className="text-[0.9rem] font-semibold text-slate-500 uppercase tracking-[0.5px] m-0 mb-2">Total Staff</h3>
          <p className="text-[2.5rem] font-extrabold text-slate-800 m-0">{staff.length}</p>
        </div>

        <div className="staff-card bg-gradient-to-br from-green-50 to-green-200 p-6 rounded-2xl border border-green-600 shadow-[0_6px_20px_rgba(34,197,94,0.15)] text-center">
          <div className="mb-2">✅</div>
          <h3 className="text-[0.9rem] font-semibold text-green-800 uppercase tracking-[0.5px] m-0 mb-2">Active</h3>
          <p className="text-[2.5rem] font-extrabold text-green-800 m-0">
            {staff.filter(s => s.is_active).length}
          </p>
        </div>

        <div className="staff-card bg-gradient-to-br from-red-50 to-red-200 p-6 rounded-2xl border border-red-600 shadow-[0_6px_20px_rgba(220,38,38,0.15)] text-center">
          <div className="mb-2">❌</div>
          <h3 className="text-[0.9rem] font-semibold text-red-800 uppercase tracking-[0.5px] m-0 mb-2">Inactive</h3>
          <p className="text-[2.5rem] font-extrabold text-red-800 m-0">
            {staff.filter(s => !s.is_active).length}
          </p>
        </div>

        <div className="staff-card bg-gradient-to-br from-blue-50 to-blue-300 p-6 rounded-2xl border border-blue-500 shadow-[0_6px_20px_rgba(59,130,246,0.15)] text-center">
          <div className="mb-2">💼</div>
          <h3 className="text-[0.9rem] font-semibold text-blue-900 uppercase tracking-[0.5px] m-0 mb-2">With Positions</h3>
          <p className="text-[2.5rem] font-extrabold text-blue-900 m-0">
            {staff.filter(s => s.job_position).length}
          </p>
        </div>
      </div>

      {/* Enhanced Add Staff Form */}
      {showAddForm && (
        <div className="staff-card bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-amber-500 rounded-[20px] p-8 shadow-[0_15px_35px_rgba(245,158,11,0.2)]">
          <div className="mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-xl">➕</div>
            <h3 className="text-2xl font-bold m-0 text-amber-900">Add New Staff Member</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 mb-5">
            <input
              type="text"
              placeholder="👤 Full Name"
              value={newStaff.full_name}
              onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
              className="form-input p-4 border-2 border-amber-400 rounded-xl outline-none text-base font-medium bg-white focus:border-amber-600"
            />
            <input
              type="email"
              placeholder="📧 Email"
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              className="form-input p-4 border-2 border-amber-400 rounded-xl outline-none text-base font-medium bg-white focus:border-amber-600"
            />
            <input
              type="tel"
              placeholder="📞 Phone"
              value={newStaff.phone}
              onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
              className="form-input p-4 border-2 border-amber-400 rounded-xl outline-none text-base font-medium bg-white focus:border-amber-600"
            />
            <select
              value={newStaff.job_position}
              onChange={(e) => setNewStaff({ ...newStaff, job_position: e.target.value })}
              className="form-input p-4 border-2 border-amber-400 rounded-xl outline-none text-base font-medium bg-white focus:border-amber-600"
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
              className="form-input p-4 border-2 border-amber-400 rounded-xl outline-none text-base font-medium bg-white focus:border-amber-600"
            />
            <input
              type="number"
              placeholder="📊 Commission Rate (%)"
              step="0.1"
              max="100"
              value={newStaff.commission_rate}
              onChange={(e) => setNewStaff({ ...newStaff, commission_rate: parseFloat(e.target.value) || 0 })}
              className="form-input p-4 border-2 border-amber-400 rounded-xl outline-none text-base font-medium bg-white focus:border-amber-600"
            />
            <input
              type="date"
              value={newStaff.hire_date}
              onChange={(e) => setNewStaff({ ...newStaff, hire_date: e.target.value })}
              className="form-input p-4 border-2 border-amber-400 rounded-xl outline-none text-base font-medium bg-white focus:border-amber-600"
            />
            <div className="p-4">
              <input
                type="checkbox"
                id="active"
                checked={newStaff.is_active}
                onChange={(e) => setNewStaff({ ...newStaff, is_active: e.target.checked })}
                className="mr-3 w-[18px] h-[18px]"
              />
              <label htmlFor="active" className="text-base font-semibold text-amber-900">
                ✅ Active
              </label>
            </div>
          </div>
          
          <div className="mb-5">
            <input
              type="text"
              placeholder="✨ Specializations (comma separated)"
              value={newStaff.specializations}
              onChange={(e) => setNewStaff({ ...newStaff, specializations: e.target.value })}
              className="form-input p-4 border-2 border-amber-400 rounded-xl outline-none text-base font-medium bg-white focus:border-amber-600"
            />
            <p className="text-[0.85rem] text-amber-900 mt-2 font-medium">💡 Enter specializations separated by commas (e.g. Hair Cutting, Hair Coloring, Styling)</p>
          </div>

          <textarea
            placeholder="📝 Bio"
            value={newStaff.bio}
            onChange={(e) => setNewStaff({ ...newStaff, bio: e.target.value })}
            className="form-input p-4 border-2 border-amber-400 rounded-xl outline-none text-base font-medium bg-white focus:border-amber-600"
          />

          <div className="flex gap-4">
            <button
              onClick={handleAddStaff}
              className="action-button bg-gradient-to-br from-green-600 to-green-700 text-white px-6 py-4 rounded-xl border-none cursor-pointer font-semibold text-base shadow-[0_6px_20px_rgba(22,163,74,0.3)]"
            >
              ✅ Add Staff Member
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="action-button bg-gradient-to-br from-gray-500 to-gray-600 text-white px-6 py-4 rounded-xl border-none cursor-pointer font-semibold text-base shadow-[0_6px_20px_rgba(107,114,128,0.3)]"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Staff List */}
      <div className="staff-card bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-0 border border-slate-100 overflow-hidden">
        {filteredAndSortedStaff.length === 0 ? (
          <div className="text-center py-16 px-8 text-slate-500">
            <div className="mb-4">👥</div>
            <h3 className="mb-2">
              {filterStatus === 'all' 
                ? 'No staff members found' 
                : `No ${filterStatus} staff members found`
              }
            </h3>
            <p className="text-base opacity-80">
              {filterStatus === 'all' 
                ? 'Add your first staff member to get started.' 
                : 'Try changing the filter to see other staff members.'
              }
            </p>
          </div>
        ) : (
          <div className="p-8">
            <div className="mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl flex items-center justify-center text-xl">👥</div>
              <h3 className="text-2xl font-bold m-0 text-slate-800">Staff Members ({filteredAndSortedStaff.length})</h3>
            </div>
            
            <div className="flex flex-col gap-5">
              {filteredAndSortedStaff.map(staffMember => (
                <div key={staffMember.id} className="p-6">
                  {editingStaff?.id === staffMember.id ? (
                    // Edit Mode
                    <div className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
                        <input
                          type="text"
                          value={editingStaff.full_name}
                          onChange={(e) => setEditingStaff({ ...editingStaff, full_name: e.target.value })}
                          className="form-input p-3 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium focus:border-violet-600"
                          placeholder="Full Name"
                        />
                        <input
                          type="email"
                          value={editingStaff.email}
                          onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                          className="form-input p-3 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium focus:border-violet-600"
                          placeholder="Email"
                        />
                        <input
                          type="tel"
                          value={editingStaff.phone}
                          onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                          className="form-input p-3 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium focus:border-violet-600"
                          placeholder="Phone"
                        />
                        <select
                          value={editingStaff.job_position}
                          onChange={(e) => setEditingStaff({ ...editingStaff, job_position: e.target.value })}
                          className="form-input p-3 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium focus:border-violet-600"
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
                          className="form-input p-3 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium focus:border-violet-600"
                          placeholder="Hourly Rate"
                        />
                        <input
                          type="number"
                          step="0.1"
                          max="100"
                          value={editingStaff.commission_rate}
                          onChange={(e) => setEditingStaff({ ...editingStaff, commission_rate: parseFloat(e.target.value) || 0 })}
                          className="form-input p-3 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium focus:border-violet-600"
                          placeholder="Commission Rate (%)"
                        />
                        <input
                          type="date"
                          value={editingStaff.hire_date}
                          onChange={(e) => setEditingStaff({ ...editingStaff, hire_date: e.target.value })}
                          className="form-input p-3 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium focus:border-violet-600"
                        />
                        <div className="flex items-center p-3 px-4 border-2 border-slate-200 rounded-xl">
                          <input
                            type="checkbox"
                            id={`active-${editingStaff.id}`}
                            checked={editingStaff.is_active}
                            onChange={(e) => setEditingStaff({ ...editingStaff, is_active: e.target.checked })}
                            className="mr-3 w-4 h-4"
                          />
                          <label htmlFor={`active-${editingStaff.id}`} className="text-base font-medium text-gray-700">
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
                          className="form-input w-full p-3 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium focus:border-violet-600"
                          placeholder="Specializations (comma separated)"
                        />
                      </div>

                      <textarea
                        value={editingStaff.bio}
                        onChange={(e) => setEditingStaff({ ...editingStaff, bio: e.target.value })}
                        className="form-input w-full p-3 px-4 border-2 border-slate-200 rounded-xl outline-none min-h-[80px] text-base font-medium resize-vertical focus:border-violet-600"
                        placeholder="Bio"
                      />

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleUpdateStaff(editingStaff)}
                          className="action-button bg-gradient-to-br from-green-600 to-green-700 text-white px-6 py-3 rounded-xl border-none cursor-pointer font-semibold text-[0.95rem] shadow-[0_4px_12px_rgba(22,163,74,0.3)]"
                        >
                          ✅ Save Changes
                        </button>
                        <button
                          onClick={() => setEditingStaff(null)}
                          className="action-button bg-gradient-to-br from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl border-none cursor-pointer font-semibold text-[0.95rem] shadow-[0_4px_12px_rgba(107,114,128,0.3)]"
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="mb-4">
                          <h3 className={`text-[1.4rem] font-bold m-0 ${staffMember.is_active ? "text-slate-800" : "text-slate-500"}`}>
                            👤 {staffMember.full_name}
                          </h3>
                          <span className={`text-[0.85rem] px-3 py-1.5 rounded-[20px] font-semibold ${staffMember.is_active ? "bg-gradient-to-br from-green-50 to-green-200 text-green-800 border border-green-600" : "bg-gradient-to-br from-red-50 to-red-200 text-red-800 border border-red-600"}`}>
                            {staffMember.is_active ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 text-[0.95rem] text-slate-500 mb-4">
                          <div className="p-3">
                            <p className="m-0 mb-1 font-semibold text-slate-600">💼 <strong>Position:</strong></p>
                            <p className="m-0">{staffMember.job_position || 'No position assigned'}</p>
                          </div>
                          <div className="p-3">
                            <p className="m-0 mb-1 font-semibold text-slate-600">📧 <strong>Email:</strong></p>
                            <p className="m-0">{staffMember.email}</p>
                          </div>
                          <div className="p-3">
                            <p className="m-0 mb-1 font-semibold text-slate-600">📞 <strong>Phone:</strong></p>
                            <p className="m-0">{staffMember.phone}</p>
                          </div>
                          <div className="p-3">
                            <p className="m-0 mb-1 font-semibold text-slate-600">📅 <strong>Hired:</strong></p>
                            <p className="m-0">{format(new Date(staffMember.hire_date), 'MMM d, yyyy')}</p>
                          </div>
                          <div className="p-3">
                            <p className="m-0 mb-1 font-semibold text-slate-600">💰 <strong>Rate:</strong></p>
                            <p className="m-0">${staffMember.hourly_rate}/hr</p>
                          </div>
                          <div className="p-3">
                            <p className="m-0 mb-1 font-semibold text-slate-600">📊 <strong>Commission:</strong></p>
                            <p className="m-0">{staffMember.commission_rate}%</p>
                          </div>
                        </div>

                        {staffMember.specializations && staffMember.specializations.length > 0 && (
                          <div className="mb-4">
                            <p className="mb-2">✨ Specializations:</p>
                            <div className="flex flex-wrap gap-2">
                              {staffMember.specializations.map((spec, index) => (
                                <span key={index} className="text-[0.85rem] px-3 py-1.5 rounded-[20px] bg-violet-100 text-violet-700 font-semibold border border-violet-300">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {staffMember.bio && (
                          <div className="p-3">
                            <p className="text-[0.95rem] text-sky-700 italic m-0 leading-relaxed">📝 {staffMember.bio}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-6">
                        <button
                          onClick={() => setEditingStaff(staffMember)}
                          className="action-button bg-gradient-to-br from-blue-500 to-blue-700 text-white border-none rounded-lg px-4 py-2 cursor-pointer text-sm font-semibold shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => toggleStaffStatus(staffMember.id, staffMember.is_active)}
                          className={`action-button text-white border-none rounded-lg px-4 py-2 cursor-pointer text-sm font-semibold ${staffMember.is_active ? "bg-gradient-to-br from-red-600 to-red-700 shadow-[0_4px_12px_rgba(220,38,38,0.3)]" : "bg-gradient-to-br from-green-600 to-green-700 shadow-[0_4px_12px_rgba(22,163,74,0.3)]"}`}
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
