'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type GalleryPhoto = {
  id: string
  image_url: string
  alt_text: string | null
  caption: string | null
}

export default function HomeGallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null)

  useEffect(() => {
    loadPhotos()
  }, [])

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPhoto) {
        setSelectedPhoto(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [selectedPhoto])

  const loadPhotos = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('gallery_photos')
        .select('id, image_url, alt_text, caption')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(5)

      setPhotos(data || [])
    } catch (error) {
      console.error('Error loading gallery photos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't render if no photos
  if (loading || photos.length === 0) {
    return null
  }

  return (
    <>
      {/* Gallery Section */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(236,72,153,0.05) 100%)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              color: 'white',
              padding: '8px 20px',
              borderRadius: '30px',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '16px',
              letterSpacing: '0.5px'
            }}>
              Our Gallery
            </span>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 16px 0'
            }}>
              Our Beautiful Work
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '1.1rem',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Take a glimpse at our salon and the beautiful transformations we create for our valued customers
            </p>
          </div>

          {/* Photo Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                style={{
                  position: 'relative',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  aspectRatio: '4/3'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)'
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(236,72,153,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.1)'
                }}
              >
                <img
                  src={photo.image_url}
                  alt={photo.alt_text || 'Pandora Beauty Salon'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                />

                {/* Caption Overlay */}
                {photo.caption && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '20px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    color: 'white'
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '0.95rem',
                      fontWeight: '500'
                    }}>
                      {photo.caption}
                    </p>
                  </div>
                )}

                {/* Hover Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(236,72,153,0.3) 0%, rgba(139,92,246,0.3) 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0'
                }}
                >
                  <span style={{
                    background: 'white',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                  }}>
                    🔍
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-caption"
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              cursor: 'default'
            }}
          >
            <img
              src={selectedPhoto.image_url}
              alt={selectedPhoto.alt_text || 'Pandora Beauty Salon'}
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
              }}
            />
            {selectedPhoto.caption && (
              <p
                id="lightbox-caption"
                style={{
                  color: 'white',
                  textAlign: 'center',
                  marginTop: '16px',
                  fontSize: '1.1rem'
                }}
              >
                {selectedPhoto.caption}
              </p>
            )}

            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              aria-label="Close lightbox"
              title="Close (or press ESC)"
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                fontSize: '1.5rem',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}
