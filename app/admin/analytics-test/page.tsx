'use client'

import { useState } from 'react'

export default function AnalyticsTestPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const testEndpoint = async (endpoint: string, description: string) => {
    setLoading(true)
    const startTime = Date.now()
    
    try {
      const response = await fetch(endpoint)
      const endTime = Date.now()
      const data = await response.json()
      
      const result = {
        endpoint,
        description,
        status: response.status,
        success: response.ok,
        responseTime: endTime - startTime,
        data: response.ok ? 'Success' : data,
        timestamp: new Date().toISOString()
      }
      
      setResults(prev => [...prev, result])
      
    } catch (error) {
      const result = {
        endpoint,
        description,
        status: 'ERROR',
        success: false,
        responseTime: Date.now() - startTime,
        data: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
      
      setResults(prev => [...prev, result])
    }
    
    setLoading(false)
  }

  const runAllTests = async () => {
    setResults([])
    
    // Test basic analytics
    await testEndpoint('/api/analytics', 'Basic Analytics')
    
    // Test detailed analytics (current)
    await testEndpoint('/api/analytics/detailed?startDate=2024-01-01&endDate=2024-12-31', 'Detailed Analytics (Current)')
    
    // Test debug endpoint
    await testEndpoint('/api/analytics/detailed-debug', 'Debug Analytics')
    
    // Test fixed endpoint
    await testEndpoint('/api/analytics/detailed-fixed?startDate=2024-01-01&endDate=2024-12-31', 'Fixed Analytics')
  }

  const clearResults = () => setResults([])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics Endpoint Tester</h1>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={runAllTests}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Run All Tests'}
            </button>
            
            <button
              onClick={clearResults}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`border rounded-lg p-4 ${
                  result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {result.description}
                    </h3>
                    <p className="text-sm text-gray-600">{result.endpoint}</p>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-sm font-medium ${
                      result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.status}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {result.responseTime}ms
                    </div>
                  </div>
                </div>
                
                {!result.success && (
                  <div className="mt-2">
                    <details>
                      <summary className="cursor-pointer text-sm text-red-700 font-medium">
                        Show Error Details
                      </summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-40 text-red-800">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
                
                <div className="text-xs text-gray-400 mt-2">
                  {result.timestamp}
                </div>
              </div>
            ))}
          </div>
          
          {results.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Click "Run All Tests" to start testing your analytics endpoints
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
