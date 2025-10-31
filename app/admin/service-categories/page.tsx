import ServiceCategoryManager from '@/components/ServiceCategoryManager'

export default function AdminServiceCategoriesPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '24px'
    }}>
      <ServiceCategoryManager />
    </div>
  )
}