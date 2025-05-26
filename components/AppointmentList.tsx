'use client'

import { useState } from 'react'
import AppointmentManager from './AppointmentManager'
import SimpleAppointmentManager from './SimpleAppointmentManager'

export default function AppointmentList() {
  const [useSimpleVersion, setUseSimpleVersion] = useState(false)

  if (useSimpleVersion) {
    return (
      <div>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            Using simplified view due to database relationship issues.
            <button 
              onClick={() => setUseSimpleVersion(false)}
              className="ml-2 text-blue-600 underline"
            >
              Try full version
            </button>
          </p>
        </div>
        <SimpleAppointmentManager />
      </div>
    )
  }

  return (
    <div>
      <AppointmentManager />
      <div className="mt-4 text-center">
        <button
          onClick={() => setUseSimpleVersion(true)}
          className="text-gray-600 text-sm underline"
        >
          Switch to simple view if experiencing issues
        </button>
      </div>
    </div>
  )
}