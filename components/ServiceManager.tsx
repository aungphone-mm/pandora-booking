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
      <div className="bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-12 text-center border border-slate-100">
        <div className="inline-block w-12 h-12 border-4 border-slate-100 border-t-green-600 rounded-full animate-spin mb-5"></div>
        <h2 className="mb-2">Loading Services</h2>
        <p className="text-slate-500 text-base">Please wait while we fetch your service data...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.6s_ease-out]">
      {/* Enhanced Header */}
      <div className="service-card bg-gradient-to-br from-green-600 to-green-700 rounded-[20px] shadow-[0_15px_35px_rgba(34,197,94,0.3)] p-8 text-white relative overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-4xl font-extrabold m-0 mb-2 [text-shadow:0_2px_4px_rgba(0,0,0,0.1)]">✨ Service Management</h2>
            <p className="text-lg m-0 opacity-90">Manage your salon services and pricing</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="action-button bg-gradient-to-br from-pink-600 to-pink-700 text-white px-6 py-4 rounded-xl border-none cursor-pointer font-semibold text-base shadow-[0_6px_20px_rgba(236,72,153,0.3)] flex items-center gap-2"
          >
            {showAddForm ? '❌ Cancel' : '➕ Add Service'}
          </button>
        </div>
      </div>

      {error && (
        <div className="slideIn bg-gradient-to-br from-red-50 to-red-100 border border-red-400 rounded-2xl p-6 shadow-[0_8px_25px_rgba(248,113,113,0.2)]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-red-600 font-semibold m-0 text-lg">{error}</p>
          </div>
        </div>
      )}

      {/* Enhanced Filters and Sorting */}
      <div className="service-card bg-white rounded-[20px] shadow-[0_8px_25px_rgba(0,0,0,0.06)] p-8 border border-slate-100">
        <div className="mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center text-xl">🔍</div>
          <h3 className="text-2xl font-bold m-0 text-slate-800">Filter & Sort Options</h3>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
          <div>
            <label className="mb-2">📂 Filter by Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium bg-white text-slate-800"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2">📊 Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium bg-white text-slate-800"
            >
              <option value="all">All Services</option>
              <option value="active">✅ Active Only</option>
              <option value="inactive">❌ Inactive Only</option>
            </select>
          </div>

          <div>
            <label className="mb-2">📋 Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'duration')}
              className="filter-select w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium bg-white text-slate-800"
            >
              <option value="name">✨ Name</option>
              <option value="price">💰 Price (High to Low)</option>
              <option value="duration">⏱️ Duration (Long to Short)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
        <div className="service-card bg-gradient-to-br from-slate-50 to-slate-200 p-6 rounded-2xl border border-slate-200 shadow-[0_6px_20px_rgba(0,0,0,0.06)] text-center">
          <div className="mb-2">✨</div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider m-0 mb-2">Total Services</h3>
          <p className="text-5xl font-extrabold text-slate-800 m-0">{services.length}</p>
        </div>

        <div className="service-card bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-2xl border border-green-700 shadow-[0_6px_20px_rgba(34,197,94,0.15)] text-center">
          <div className="mb-2">✅</div>
          <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wider m-0 mb-2">Active Services</h3>
          <p className="text-5xl font-extrabold text-green-800 m-0">
            {services.filter(s => s.is_active).length}
          </p>
        </div>

        <div className="service-card bg-gradient-to-br from-red-100 to-red-200 p-6 rounded-2xl border border-red-600 shadow-[0_6px_20px_rgba(220,38,38,0.15)] text-center">
          <div className="mb-2">❌</div>
          <h3 className="text-sm font-semibold text-red-800 uppercase tracking-wider m-0 mb-2">Inactive Services</h3>
          <p className="text-5xl font-extrabold text-red-800 m-0">
            {services.filter(s => !s.is_active).length}
          </p>
        </div>

        <div className="service-card bg-gradient-to-br from-yellow-50 to-amber-100 p-6 rounded-2xl border border-yellow-500 shadow-[0_6px_20px_rgba(234,179,8,0.15)] text-center">
          <div className="mb-2">💰</div>
          <h3 className="text-sm font-semibold text-yellow-700 uppercase tracking-wider m-0 mb-2">Avg Price</h3>
          <p className="text-5xl font-extrabold text-yellow-700 m-0">
            {services.length > 0
              ? Math.round(services.reduce((acc, s) => acc + s.price, 0) / services.length)
              : 0
            }Ks
          </p>
        </div>
      </div>

      {/* Enhanced Add Service Form */}
      {showAddForm && (
        <div className="service-card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-600 rounded-[20px] p-8 shadow-[0_15px_35px_rgba(34,197,94,0.2)]">
          <div className="mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center text-xl">➕</div>
            <h3 className="text-2xl font-bold m-0 text-green-800">Add New Service</h3>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
            <input
              type="text"
              placeholder="✨ Service name"
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              className="form-input p-4 border-2 border-green-700 rounded-xl outline-none text-base font-medium bg-white"
            />
            <select
              value={newService.category_id}
              onChange={(e) => setNewService({ ...newService, category_id: e.target.value })}
              className="form-input p-4 border-2 border-green-700 rounded-xl outline-none text-base font-medium bg-white"
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
              className="form-input p-4 border-2 border-green-700 rounded-xl outline-none text-base font-medium bg-white"
            />
            <input
              type="number"
              placeholder="💰 Price"
              step="0.01"
              value={newService.price}
              onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })}
              className="form-input p-4 border-2 border-green-700 rounded-xl outline-none text-base font-medium bg-white"
            />
          </div>

          <textarea
            placeholder="📝 Description"
            value={newService.description}
            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
            className="form-input w-full p-4 border-2 border-green-700 rounded-xl outline-none mt-5 mb-4 min-h-[100px] text-base font-medium bg-white resize-y"
          />

          <div className="flex items-center gap-3 mb-6 p-4 bg-white rounded-xl border-2 border-green-700">
            <input
              type="checkbox"
              id="active-new-service"
              checked={newService.is_active}
              onChange={(e) => setNewService({ ...newService, is_active: e.target.checked })}
              className="w-5 h-5 cursor-pointer"
            />
            <label
              htmlFor="active-new-service"
              className={`text-base font-semibold cursor-pointer ${newService.is_active ? 'text-green-800' : 'text-red-800'}`}
            >
              {newService.is_active ? '✅ Active (Service will be immediately available)' : '❌ Inactive (Service will be hidden)'}
            </label>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleAddService}
              className="action-button bg-gradient-to-br from-green-700 to-green-800 text-white px-6 py-4 rounded-xl border-none cursor-pointer font-semibold text-base shadow-[0_6px_20px_rgba(22,163,74,0.3)]"
            >
              ✅ Add Service
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

      {/* Enhanced Services Table */}
      <div className="service-card bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-0 border border-slate-100 overflow-hidden">
        {filteredAndSortedServices.length === 0 ? (
          <div className="text-center py-16 px-8 text-slate-500">
            <div className="mb-4">✨</div>
            <h3 className="mb-2">
              No services found
            </h3>
            <p className="text-base opacity-80">
              {filterCategory !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters to see more services.'
                : 'Add your first service to get started.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-br from-slate-50 to-slate-200 border-b-2 border-slate-200">
                  <th className="text-left py-5 px-6 font-bold text-sm text-gray-700 uppercase tracking-wider">✨ Service</th>
                  <th className="text-left py-5 px-6 font-bold text-sm text-gray-700 uppercase tracking-wider">📂 Category</th>
                  <th className="text-left py-5 px-6 font-bold text-sm text-gray-700 uppercase tracking-wider">⏱️ Duration</th>
                  <th className="text-left py-5 px-6 font-bold text-sm text-gray-700 uppercase tracking-wider">💰 Price</th>
                  <th className="text-left py-5 px-6 font-bold text-sm text-gray-700 uppercase tracking-wider">📊 Status</th>
                  <th className="text-left py-5 px-6 font-bold text-sm text-gray-700 uppercase tracking-wider">⚡ Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedServices.map((service, index) => (
                  <tr key={service.id} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"} table-row`}>
                    <td className="py-5 px-6">
                      {editingService?.id === service.id ? (
                        <input
                          type="text"
                          value={editingService.name}
                          onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                          className="form-input p-2 px-3 border-2 border-green-600 rounded-lg outline-none text-base font-medium w-[200px]"
                        />
                      ) : (
                        <div>
                          <p className="font-semibold text-lg text-slate-800 m-0 mb-1">{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-slate-500 m-0 leading-snug">{service.description}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      {editingService?.id === service.id ? (
                        <select
                          value={editingService.category_id}
                          onChange={(e) => setEditingService({ ...editingService, category_id: e.target.value })}
                          className="form-input p-2 px-3 border-2 border-green-600 rounded-lg outline-none text-base font-medium w-[180px]"
                        >
                          <option value="">Select category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm py-1.5 px-3 rounded-[20px] bg-green-50 text-green-800 font-semibold border border-green-200">
                          {service.category?.name || 'No Category'}
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      {editingService?.id === service.id ? (
                        <input
                          type="number"
                          value={editingService.duration}
                          onChange={(e) => setEditingService({ ...editingService, duration: parseInt(e.target.value) })}
                          className="form-input p-2 px-3 border-2 border-green-600 rounded-lg outline-none text-base font-medium w-[100px]"
                        />
                      ) : (
                        <span className="text-base font-semibold text-blue-500">
                          ⏱️ {service.duration} min
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      {editingService?.id === service.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingService.price}
                          onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) })}
                          className="form-input p-2 px-3 border-2 border-green-600 rounded-lg outline-none text-base font-medium w-[100px]"
                        />
                      ) : (
                        <span className="text-lg font-bold text-emerald-600">
                          💰 {service.price.toLocaleString()}Ks
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      {editingService?.id === service.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`active-${editingService.id}`}
                            checked={editingService.is_active}
                            onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked })}
                            className="w-4.5 h-4.5 cursor-pointer"
                          />
                          <label
                            htmlFor={`active-${editingService.id}`}
                            className={`text-sm font-semibold cursor-pointer ${editingService.is_active ? "text-green-800" : "text-red-800"}`}
                          >
                            {editingService.is_active ? '✅ Active' : '❌ Inactive'}
                          </label>
                        </div>
                      ) : (
                        <span className={`py-1.5 px-3 rounded-[20px] text-sm font-semibold ${service.is_active ? "bg-green-100 text-green-800 border border-green-700" : "bg-red-100 text-red-800 border border-red-600"}`}>
                          {service.is_active ? '✅ Active' : '❌ Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      {editingService?.id === service.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateService(editingService)}
                            className="action-button bg-gradient-to-br from-green-700 to-green-800 text-white border-none rounded-lg py-2 px-4 cursor-pointer text-sm font-semibold shadow-[0_4px_12px_rgba(22,163,74,0.3)]"
                          >
                            ✅ Save
                          </button>
                          <button
                            onClick={() => setEditingService(null)}
                            className="action-button bg-gradient-to-br from-gray-500 to-gray-600 text-white border-none rounded-lg py-2 px-4 cursor-pointer text-sm font-semibold shadow-[0_4px_12px_rgba(107,114,128,0.3)]"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingService(service)}
                            className="action-button bg-gradient-to-br from-blue-500 to-blue-700 text-white border-none rounded-lg py-2 px-4 cursor-pointer text-sm font-semibold shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => toggleServiceStatus(service.id, service.is_active)}
                            className={`action-button text-white border-none rounded-lg py-2 px-4 cursor-pointer text-sm font-semibold ${service.is_active ? "bg-gradient-to-br from-amber-500 to-amber-600 shadow-[0_4px_12px_rgba(245,158,11,0.3)]" : "bg-gradient-to-br from-green-700 to-green-800 shadow-[0_4px_12px_rgba(22,163,74,0.3)]"}`}
                          >
                            {service.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="action-button bg-gradient-to-br from-red-600 to-red-700 text-white border-none rounded-lg py-2 px-4 cursor-pointer text-sm font-semibold shadow-[0_4px_12px_rgba(220,38,38,0.3)]"
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
