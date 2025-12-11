import GalleryManager from '@/components/GalleryManager'
import { requireAdmin } from '@/lib/auth-helpers'

export default async function AdminGalleryPage() {
  await requireAdmin()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '24px'
    }}>
      <GalleryManager />
    </div>
  )
}
