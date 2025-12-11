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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#ec4899',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 10px 40px rgba(236, 72, 153, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2.5rem' }}>🖼️</span>
              Photo Gallery
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>
              Manage photos displayed on the home page ({photos.length} of {MAX_PHOTOS})
            </p>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '16px',
            padding: '16px 24px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', textAlign: 'center' }}>
              {photos.length}/{MAX_PHOTOS}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
              Photos
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          border: '2px solid #f87171',
          borderRadius: '16px',
          padding: '16px 24px',
          marginBottom: '24px',
          color: '#dc2626',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload Section */}
      {photos.length < MAX_PHOTOS && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '3px dashed #22c55e',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#166534', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📤</span> Upload New Photo
          </h2>

          {!previewUrl ? (
            <div style={{ textAlign: 'center' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 32px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 auto'
                }}
                className="action-button"
              >
                <span style={{ fontSize: '1.25rem' }}>📁</span>
                Choose Photo
              </button>
              <p style={{ color: '#64748b', marginTop: '12px', fontSize: '0.875rem' }}>
                Supported formats: JPEG, PNG, WebP (Max 5MB)
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', alignItems: 'start' }}>
              {/* Preview */}
              <div>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '2px solid #22c55e'
                  }}
                />
              </div>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input
                  type="text"
                  placeholder="Alt text (for accessibility)"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    border: '2px solid #d1d5db',
                    borderRadius: '10px',
                    fontSize: '1rem'
                  }}
                />
                <input
                  type="text"
                  placeholder="Caption (optional)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    border: '2px solid #d1d5db',
                    borderRadius: '10px',
                    fontSize: '1rem'
                  }}
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    style={{
                      background: uploading ? '#9ca3af' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px 24px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    className="action-button"
                  >
                    {uploading ? (
                      <>
                        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                        Uploading...
                      </>
                    ) : (
                      <>✅ Upload Photo</>
                    )}
                  </button>
                  <button
                    onClick={cancelUpload}
                    disabled={uploading}
                    style={{
                      background: '#f1f5f9',
                      color: '#64748b',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 24px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: uploading ? 'not-allowed' : 'pointer'
                    }}
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
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '2px solid #f59e0b',
          borderRadius: '16px',
          padding: '16px 24px',
          marginBottom: '24px',
          color: '#92400e',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '1.5rem' }}>📷</span>
          Maximum {MAX_PHOTOS} photos reached. Delete a photo to upload a new one.
        </div>
      )}

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#f8fafc',
          borderRadius: '20px',
          border: '2px dashed #e2e8f0'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🖼️</div>
          <h3 style={{ fontSize: '1.25rem', color: '#64748b', fontWeight: '600' }}>
            No photos yet
          </h3>
          <p style={{ color: '#94a3b8' }}>
            Upload your first photo to display on the home page
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="gallery-card"
              style={{
                background: 'white',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '2px solid #e2e8f0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                opacity: photo.is_active ? 1 : 0.6
              }}
            >
              {/* Image */}
              <div style={{ position: 'relative' }}>
                <img
                  src={photo.image_url}
                  alt={photo.alt_text || 'Gallery photo'}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover'
                  }}
                />

                {/* Order Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '1rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                  {index + 1}
                </div>

                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: photo.is_active ? '#22c55e' : '#ef4444',
                  color: 'white',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                  {photo.is_active ? 'Active' : 'Hidden'}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '20px' }}>
                {editingPhoto?.id === photo.id ? (
                  // Edit Mode
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                      type="text"
                      placeholder="Alt text"
                      value={editingPhoto.alt_text || ''}
                      onChange={(e) => setEditingPhoto({ ...editingPhoto, alt_text: e.target.value })}
                      style={{
                        padding: '10px 12px',
                        border: '2px solid #ec4899',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Caption"
                      value={editingPhoto.caption || ''}
                      onChange={(e) => setEditingPhoto({ ...editingPhoto, caption: e.target.value })}
                      style={{
                        padding: '10px 12px',
                        border: '2px solid #ec4899',
                        borderRadius: '8px',
                        fontSize: '0.875rem'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleUpdatePhoto}
                        style={{
                          flex: 1,
                          background: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        ✓ Save
                      </button>
                      <button
                        onClick={() => setEditingPhoto(null)}
                        style={{
                          flex: 1,
                          background: '#f1f5f9',
                          color: '#64748b',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '8px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    {photo.caption && (
                      <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1f2937' }}>
                        {photo.caption}
                      </p>
                    )}
                    {photo.alt_text && (
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: '#64748b' }}>
                        Alt: {photo.alt_text}
                      </p>
                    )}
                    {!photo.caption && !photo.alt_text && (
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        No caption or alt text
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Reorder Buttons */}
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        aria-label={`Move photo ${index + 1} up in gallery order`}
                        title="Move up"
                        style={{
                          background: index === 0 ? '#f1f5f9' : '#e0e7ff',
                          color: index === 0 ? '#94a3b8' : '#4f46e5',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: index === 0 ? 'not-allowed' : 'pointer'
                        }}
                        className="action-button"
                      >
                        ⬆️
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === photos.length - 1}
                        aria-label={`Move photo ${index + 1} down in gallery order`}
                        title="Move down"
                        style={{
                          background: index === photos.length - 1 ? '#f1f5f9' : '#e0e7ff',
                          color: index === photos.length - 1 ? '#94a3b8' : '#4f46e5',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: index === photos.length - 1 ? 'not-allowed' : 'pointer'
                        }}
                        className="action-button"
                      >
                        ⬇️
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => setEditingPhoto(photo)}
                        aria-label={`Edit photo ${index + 1} caption and alt text`}
                        title="Edit photo details"
                        style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                        className="action-button"
                      >
                        ✏️ Edit
                      </button>

                      {/* Toggle Active */}
                      <button
                        onClick={() => handleToggleActive(photo)}
                        aria-label={photo.is_active ? `Hide photo ${index + 1} from public gallery` : `Show photo ${index + 1} in public gallery`}
                        title={photo.is_active ? 'Hide from public' : 'Show to public'}
                        style={{
                          background: photo.is_active ? '#fee2e2' : '#dcfce7',
                          color: photo.is_active ? '#dc2626' : '#16a34a',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                        className="action-button"
                      >
                        {photo.is_active ? '👁️ Hide' : '👁️ Show'}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(photo.id)}
                        aria-label={`Delete photo ${index + 1} permanently`}
                        title="Delete photo"
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                        className="action-button"
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
