// Test script to debug analytics endpoints
// Run with: node test-analytics.js

const testEndpoint = async (endpoint, params = '') => {
  try {
    const response = await fetch(`http://localhost:3000/api/analytics${endpoint}?${params}`)
    const data = await response.json()
    
    console.log(`\n=== ${endpoint} ===`)
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    return { success: response.ok, data, status: response.status }
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error)
    return { success: false, error: error.message }
  }
}

const runTests = async () => {
  console.log('Testing Analytics Endpoints...')
  
  // Test basic analytics first
  await testEndpoint('')
  
  // Test detailed analytics 
  await testEndpoint('/detailed', 'startDate=2024-01-01&endDate=2024-12-31')
  
  // Test summary analytics
  await testEndpoint('/summary')
}

runTests()
