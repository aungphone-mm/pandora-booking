'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type GalleryPhoto = {
  id: string
  image_url: string
  storage_path: string
  alt_text: string | null
  caption: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

const MAX_PHOTOS = 5

export default function GalleryManager() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null)

  // Upload form state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')

  useEffect(() => {
    loadPhotos()

    // Add CSS animations
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
      .gallery-card {
        transition: all 0.3s ease-in-out;
      }
      .gallery-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(236, 72, 153, 0.2);
      }
      .action-button {
        transition: all 0.2s ease;
      }
      .action-button:hover {
        transform: translateY(-2px);
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const loadPhotos = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/gallery?includeInactive=true')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load photos')
      }

      setPhotos(data.photos || [])
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load photos'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Invalid file type. Please use JPEG, PNG, or WebP.')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('alt_text', altText)
      formData.append('caption', caption)

      const response = await fetch('/api/gallery', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photo')
      }

      // Reset form
      setSelectedFile(null)
      setPreviewUrl(null)
      setAltText('')
      setCaption('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      loadPhotos()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload photo'
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      setError(null)

      const response = await fetch(`/api/gallery?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete photo')
      }

      loadPhotos()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete photo'
      setError(errorMessage)
    }
  }

  const handleToggleActive = async (photo: GalleryPhoto) => {
    try {
      setError(null)

      const response = await fetch('/api/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: photo.id,
          is_active: !photo.is_active
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update photo')
      }

      loadPhotos()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update photo'
      setError(errorMessage)
    }
  }

  const handleUpdatePhoto = async () => {
    if (!editingPhoto) return

    try {
      setError(null)

      const response = await fetch('/api/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPhoto.id,
          alt_text: editingPhoto.alt_text,
          caption: editingPhoto.caption
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update photo')
      }

      setEditingPhoto(null)
      loadPhotos()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update photo'
      setError(errorMessage)
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return

    const newPhotos = [...photos]
    const temp = newPhotos[index]
    newPhotos[index] = newPhotos[index - 1]
    newPhotos[index - 1] = temp

    await updateOrder(newPhotos)
  }

  const handleMoveDown = async (index: number) => {
    if (index === photos.length - 1) return

    const newPhotos = [...photos]
    const temp = newPhotos[index]
    newPhotos[index] = newPhotos[index + 1]
    newPhotos[index + 1] = temp

    await updateOrder(newPhotos)
  }

  const updateOrder = async (orderedPhotos: GalleryPhoto[]) => {
    try {
      setError(null)

      const response = await fetch('/api/gallery/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoIds: orderedPhotos.map(p => p.id)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reorder photos')
      }

      loadPhotos()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder photos'
      setError(errorMessage)
    }
  }

  const cancelUpload = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setAltText('')
    setCaption('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-pink-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-600 to-purple-600 rounded-3xl p-8 mb-8 shadow-[0_10px_40px_rgba(236,72,153,0.3)]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white m-0 mb-2 flex items-center gap-3">
              <span className="text-4xl">🖼️</span>
              Photo Gallery
            </h1>
            <p className="text-white/90 m-0">
              Manage photos displayed on the home page ({photos.length} of {MAX_PHOTOS})
            </p>
          </div>
          <div className="bg-white/20 rounded-2xl px-6 py-4 backdrop-blur-[10px]">
            <div className="text-3xl font-extrabold text-white text-center">
              {photos.length}/{MAX_PHOTOS}
            </div>
            <div className="text-sm text-white/80">
              Photos
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-400 rounded-2xl px-6 py-4 mb-6 text-red-600 font-semibold flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto bg-transparent border-none text-xl cursor-pointer hover:opacity-70"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload Section */}
      {photos.length < MAX_PHOTOS && (
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-[3px] border-dashed border-green-600 rounded-[20px] p-8 mb-8">
          <h2 className="text-xl font-bold text-green-800 m-0 mb-5 flex items-center gap-2">
            <span>📤</span> Upload New Photo
          </h2>

          {!previewUrl ? (
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="action-button bg-gradient-to-br from-green-600 to-green-700 text-white border-none rounded-xl px-8 py-4 text-base font-semibold cursor-pointer flex items-center gap-2 mx-auto hover:from-green-700 hover:to-green-800 transition-all"
              >
                <span className="text-xl">📁</span>
                Choose Photo
              </button>
              <p className="text-slate-600 mt-3 text-sm">
                Supported formats: JPEG, PNG, WebP (Max 5MB)
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[200px_1fr] gap-6 items-start">
              {/* Preview */}
              <div>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-[150px] object-cover rounded-xl border-2 border-green-600"
                />
              </div>

              {/* Form Fields */}
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Alt text (for accessibility)"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-300 rounded-[10px] text-base focus:outline-none focus:border-green-600"
                />
                <input
                  type="text"
                  placeholder="Caption (optional)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-300 rounded-[10px] text-base focus:outline-none focus:border-green-600"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="action-button bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white border-none rounded-[10px] px-6 py-3 text-base font-semibold flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <span className="animate-spin inline-block">⏳</span>
                        Uploading...
                      </>
                    ) : (
                      <>✅ Upload Photo</>
                    )}
                  </button>
                  <button
                    onClick={cancelUpload}
                    disabled={uploading}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 border-2 border-slate-200 rounded-[10px] px-6 py-3 text-base font-semibold disabled:cursor-not-allowed"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Limit Reached Message */}
      {photos.length >= MAX_PHOTOS && (
        <div className="bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-500 rounded-2xl px-6 py-4 mb-6 text-amber-900 font-semibold flex items-center gap-3">
          <span className="text-2xl">📷</span>
          Maximum {MAX_PHOTOS} photos reached. Delete a photo to upload a new one.
        </div>
      )}

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-15 px-5 bg-slate-50 rounded-[20px] border-2 border-dashed border-slate-200">
          <div className="text-6xl mb-4">🖼️</div>
          <h3 className="text-xl text-slate-600 font-semibold">
            No photos yet
          </h3>
          <p className="text-slate-400">
            Upload your first photo to display on the home page
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={`gallery-card bg-white rounded-[20px] overflow-hidden border-2 border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.05)] ${photo.is_active ? 'opacity-100' : 'opacity-60'}`}
            >
              {/* Image */}
              <div className="relative">
                <img
                  src={photo.image_url}
                  alt={photo.alt_text || 'Gallery photo'}
                  className="w-full h-[200px] object-cover"
                />

                {/* Order Badge */}
                <div className="absolute top-3 left-3 bg-gradient-to-br from-pink-600 to-purple-600 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold text-base shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                  {index + 1}
                </div>

                {/* Status Badge */}
                <div className={`absolute top-3 right-3 text-white rounded-[20px] px-3 py-1 text-xs font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.2)] ${photo.is_active ? 'bg-green-600' : 'bg-red-600'}`}>
                  {photo.is_active ? 'Active' : 'Hidden'}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {editingPhoto?.id === photo.id ? (
                  // Edit Mode
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Alt text"
                      value={editingPhoto.alt_text || ''}
                      onChange={(e) => setEditingPhoto({ ...editingPhoto, alt_text: e.target.value })}
                      className="px-3 py-2.5 border-2 border-pink-600 rounded-lg text-sm focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Caption"
                      value={editingPhoto.caption || ''}
                      onChange={(e) => setEditingPhoto({ ...editingPhoto, caption: e.target.value })}
                      className="px-3 py-2.5 border-2 border-pink-600 rounded-lg text-sm focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdatePhoto}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white border-none rounded-lg px-2 py-2 text-sm font-semibold cursor-pointer transition-colors"
                      >
                        ✓ Save
                      </button>
                      <button
                        onClick={() => setEditingPhoto(null)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border-2 border-slate-200 rounded-lg px-2 py-2 text-sm font-semibold cursor-pointer transition-colors"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    {photo.caption && (
                      <p className="m-0 mb-2 font-semibold text-gray-800">
                        {photo.caption}
                      </p>
                    )}
                    {photo.alt_text && (
                      <p className="m-0 mb-4 text-sm text-slate-600">
                        Alt: {photo.alt_text}
                      </p>
                    )}
                    {!photo.caption && !photo.alt_text && (
                      <p className="m-0 mb-4 text-sm text-slate-400 italic">
                        No caption or alt text
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {/* Reorder Buttons */}
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        aria-label={`Move photo ${index + 1} up in gallery order`}
                        title="Move up"
                        className={`action-button border-none rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${index === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer'}`}
                      >
                        ⬆️
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === photos.length - 1}
                        aria-label={`Move photo ${index + 1} down in gallery order`}
                        title="Move down"
                        className={`action-button border-none rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${index === photos.length - 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer'}`}
                      >
                        ⬇️
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => setEditingPhoto(photo)}
                        aria-label={`Edit photo ${index + 1} caption and alt text`}
                        title="Edit photo details"
                        className="action-button bg-amber-100 hover:bg-amber-200 text-amber-900 border-none rounded-lg px-3 py-2 text-sm font-semibold cursor-pointer transition-colors"
                      >
                        ✏️ Edit
                      </button>

                      {/* Toggle Active */}
                      <button
                        onClick={() => handleToggleActive(photo)}
                        aria-label={photo.is_active ? `Hide photo ${index + 1} from public gallery` : `Show photo ${index + 1} in public gallery`}
                        title={photo.is_active ? 'Hide from public' : 'Show to public'}
                        className={`action-button border-none rounded-lg px-3 py-2 text-sm font-semibold cursor-pointer transition-colors ${photo.is_active ? 'bg-red-100 hover:bg-red-200 text-red-600' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}
                      >
                        {photo.is_active ? '👁️ Hide' : '👁️ Show'}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(photo.id)}
                        aria-label={`Delete photo ${index + 1} permanently`}
                        title="Delete photo"
                        className="action-button bg-red-100 hover:bg-red-200 text-red-600 border-none rounded-lg px-3 py-2 text-sm font-semibold cursor-pointer transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
