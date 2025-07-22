import AdminDashboard from '@/components/AdminDashboard'

export default function AdminDashboardPage() {
  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '24px',
      }}
      className="dashboard-container"
      >
        {/* Enhanced Page Header */}
        <div style={{
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          }}
          className="dashboard-title"
          >
            Admin Dashboard
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#64748b',
            margin: '0',
            fontWeight: '500',
          }}
          className="dashboard-subtitle"
          >
            Comprehensive business management for Pandora Beauty Salon
          </p>
        </div>
        
        {/* Dashboard Component */}
        <AdminDashboard />
      </div>

      {/* Mobile-specific styles using regular style tag */}
      <style>{`
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px !important;
          }
          
          .dashboard-title {
            font-size: 2rem !important;
          }
          
          .dashboard-subtitle {
            font-size: 1rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .dashboard-container {
            padding: 12px !important;
          }
          
          .dashboard-title {
            font-size: 1.75rem !important;
          }
          
          .dashboard-subtitle {
            font-size: 0.9rem !important;
            padding: 0 8px;
          }
        }
      `}</style>
    </>
  )
}