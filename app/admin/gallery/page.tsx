import GalleryManager from '@/components/GalleryManager'
import { requireAdmin } from '@/lib/auth-helpers'

export default async function AdminGalleryPage() {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-6">
      <GalleryManager />
    </div>
  )
}
