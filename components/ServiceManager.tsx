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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Service Management</h2>
      
      {/* Add new service form */}
      <div className="mb-8 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-4">Add New Service</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Service name"
            value={newService.name}
            onChange={(e) => setNewService({ ...newService, name: e.target.value })}
            className="px-3 py-2 border rounded"
          />
          <select
            value={newService.category_id}
            onChange={(e) => setNewService({ ...newService, category_id: e.target.value })}
            className="px-3 py-2 border rounded"
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
            className="px-3 py-2 border rounded"
          />
          <input
            type="number"
            placeholder="Price"
            step="0.01"
            value={newService.price}
            onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })}
            className="px-3 py-2 border rounded"
          />
          <textarea
            placeholder="Description"
            value={newService.description}
            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
            className="px-3 py-2 border rounded col-span-2"
          />
          <button
            onClick={handleAddService}
            className="col-span-2 bg-pink-600 text-white py-2 rounded hover:bg-pink-700"
          >
            Add Service
          </button>
        </div>
      </div>

      {/* Services list */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Service</th>
              <th className="text-left py-2">Category</th>
              <th className="text-left py-2">Duration</th>
              <th className="text-left py-2">Price</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.id} className="border-b">
                <td className="py-2">
                  {editingService?.id === service.id ? (
                    <input
                      type="text"
                      value={editingService.name}
                      onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                      className="px-2 py-1 border rounded"
                    />
                  ) : (
                    service.name
                  )}
                </td>
                <td className="py-2">{service.category?.name}</td>
                <td className="py-2">
                  {editingService?.id === service.id ? (
                    <input
                      type="number"
                      value={editingService.duration}
                      onChange={(e) => setEditingService({ ...editingService, duration: parseInt(e.target.value) })}
                      className="px-2 py-1 border rounded w-20"
                    />
                  ) : (
                    `${service.duration} min`
                  )}
                </td>
                <td className="py-2">
                  {editingService?.id === service.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editingService.price}
                      onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) })}
                      className="px-2 py-1 border rounded w-20"
                    />
                  ) : (
                    `$${service.price}`
                  )}
                </td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-sm ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {service.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-2">
                  {editingService?.id === service.id ? (
                    <>
                      <button
                        onClick={() => handleUpdateService(editingService)}
                        className="text-green-600 hover:text-green-800 mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingService(null)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingService(service)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
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
      </div>
    </div>
  )
}
