import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '48px 16px'
    }}>
      {/* Hero Section */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '24px',
          lineHeight: '1.2'
        }}>
          Welcome to Pandora Beauty Salon
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: '#6b7280',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          Experience luxury beauty treatments in a relaxing environment
        </p>
        <Link 
          href="/booking" 
          style={{
            display: 'inline-block',
            backgroundColor: '#ec4899',
            color: 'white',
            fontSize: '1.125rem',
            padding: '16px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          Book Your Appointment
        </Link>
      </div>
      
      {/* Features Section */}
      <div style={{
        marginTop: '64px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '32px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#1f2937'
          }}>
            Professional Staff
          </h3>
          <p style={{
            color: '#6b7280',
            lineHeight: '1.6'
          }}>
            Our experienced beauticians provide top-quality services tailored to your needs.
          </p>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#1f2937'
          }}>
            Premium Products
          </h3>
          <p style={{
            color: '#6b7280',
            lineHeight: '1.6'
          }}>
            We use only the finest beauty products to ensure the best results for our clients.
          </p>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#1f2937'
          }}>
            Relaxing Atmosphere
          </h3>
          <p style={{
            color: '#6b7280',
            lineHeight: '1.6'
          }}>
            Enjoy our peaceful salon environment designed for your comfort and relaxation.
          </p>
        </div>
      </div>
    </div>
  )
}