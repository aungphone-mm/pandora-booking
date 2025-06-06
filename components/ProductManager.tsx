'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProductManager() {
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category_id: '',
    price: 0,
    is_active: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: productsData } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(name)
      `)
      .order('category_id')

    const { data: categoriesData } = await supabase
      .from('product_categories')
      .select('*')
      .order('display_order')

    setProducts(productsData || [])
    setCategories(categoriesData || [])
  }

  const handleAddProduct = async () => {
    const { error } = await supabase
      .from('products')
      .insert([newProduct])

    if (!error) {
      setNewProduct({
        name: '',
        description: '',
        category_id: '',
        price: 0,
        is_active: true
      })
      loadData()
    }
  }

  const handleUpdateProduct = async (product: any) => {
    const { error } = await supabase
      .from('products')
      .update({
        name: product.name,
        description: product.description,
        category_id: product.category_id,
        price: product.price,
        is_active: product.is_active
      })
      .eq('id', product.id)

    if (!error) {
      setEditingProduct(null)
      loadData()
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (!error) {
        loadData()
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Product Management</h2>
      
      {/* Add new product form */}
      <div className="mb-8 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Product name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            className="px-3 py-2 border rounded"
          />
          <select
            value={newProduct.category_id}
            onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
            className="px-3 py-2 border rounded"
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Price"
            step="0.01"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
            className="px-3 py-2 border rounded"
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={newProduct.is_active}
              onChange={(e) => setNewProduct({ ...newProduct, is_active: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="active">Active</label>
          </div>
          <textarea
            placeholder="Description"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            className="px-3 py-2 border rounded col-span-2"
          />
          <button
            onClick={handleAddProduct}
            className="col-span-2 bg-pink-600 text-white py-2 rounded hover:bg-pink-700"
          >
            Add Product
          </button>
        </div>
      </div>

      {/* Products list */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Product</th>
              <th className="text-left py-2">Category</th>
              <th className="text-left py-2">Price</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-b">
                <td className="py-2">
                  {editingProduct?.id === product.id ? (
                    <div>
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="px-2 py-1 border rounded mb-1 w-full"
                      />
                      <textarea
                        value={editingProduct.description}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        className="px-2 py-1 border rounded w-full text-sm"
                        rows={2}
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">{product.description}</div>
                    </div>
                  )}
                </td>
                <td className="py-2">
                  {editingProduct?.id === product.id ? (
                    <select
                      value={editingProduct.category_id}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                      className="px-2 py-1 border rounded"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  ) : (
                    product.category?.name
                  )}
                </td>
                <td className="py-2">
                  {editingProduct?.id === product.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                      className="px-2 py-1 border rounded w-20"
                    />
                  ) : (
                    `$${product.price}`
                  )}
                </td>
                <td className="py-2">
                  {editingProduct?.id === product.id ? (
                    <input
                      type="checkbox"
                      checked={editingProduct.is_active}
                      onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                    />
                  ) : (
                    <span className={`px-2 py-1 rounded text-sm ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </td>
                <td className="py-2">
                  {editingProduct?.id === product.id ? (
                    <>
                      <button
                        onClick={() => handleUpdateProduct(editingProduct)}
                        className="text-green-600 hover:text-green-800 mr-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingProduct(null)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
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