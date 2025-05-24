import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-6">
          Welcome to Pandora Beauty Salon
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Experience luxury beauty treatments in a relaxing environment
        </p>
        <Link 
          href="/booking" 
          className="inline-block bg-pink-600 text-white text-lg px-8 py-4 rounded-lg hover:bg-pink-700 transition"
        >
          Book Your Appointment
        </Link>
      </div>
      
      <div className="mt-16 grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Professional Staff</h3>
          <p className="text-gray-600">
            Our experienced beauticians provide top-quality services tailored to your needs.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Premium Products</h3>
          <p className="text-gray-600">
            We use only the finest beauty products to ensure the best results for our clients.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Relaxing Atmosphere</h3>
          <p className="text-gray-600">
            Enjoy our peaceful salon environment designed for your comfort and relaxation.
          </p>
        </div>
      </div>
    </div>
  )
}
