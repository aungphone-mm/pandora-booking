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
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-pink-500/5">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-block bg-gradient-to-r from-pink-500 to-purple-500 text-white px-5 py-2 rounded-full text-sm font-semibold mb-4 tracking-wide">
              Our Gallery
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-4">
              Our Beautiful Work
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
              Take a glimpse at our salon and the beautiful transformations we create for our valued customers
            </p>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative rounded-3xl overflow-hidden shadow-2xl cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-pink-500/20 aspect-[4/3]"
              >
                <img
                  src={photo.image_url}
                  alt={photo.alt_text || 'Pandora Beauty Salon'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Caption Overlay */}
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/70 to-transparent text-white">
                    <p className="m-0 text-base font-medium">
                      {photo.caption}
                    </p>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="bg-white rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-2xl">
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
          className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-6 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[90vw] max-h-[90vh] cursor-default"
          >
            <img
              src={selectedPhoto.image_url}
              alt={selectedPhoto.alt_text || 'Pandora Beauty Salon'}
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
            />
            {selectedPhoto.caption && (
              <p
                id="lightbox-caption"
                className="text-white text-center mt-4 text-lg"
              >
                {selectedPhoto.caption}
              </p>
            )}

            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              aria-label="Close lightbox"
              title="Close (or press ESC)"
              className="absolute -top-4 -right-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white border-none rounded-full w-12 h-12 text-2xl cursor-pointer shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}
