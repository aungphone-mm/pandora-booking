'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show install prompt after a short delay
      setTimeout(() => setShowInstallPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Don't show again for 7 days
    localStorage.setItem('installPromptDismissed', Date.now().toString())
  }

  // Don't show if already installed or dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedTime < sevenDays) {
        setShowInstallPrompt(false)
      }
    }
  }, [])

  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl p-5 max-w-md w-[calc(100%-40px)] z-[1000] animate-[slideUp_0.3s_ease-out]">
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <button
        onClick={handleDismiss}
        className="absolute top-2.5 right-2.5 bg-none border-none text-xl cursor-pointer text-gray-400 p-1.5 leading-none hover:text-gray-600 transition-colors duration-200"
        aria-label="Dismiss"
      >
        ×
      </button>

      <div className="flex items-start gap-4">
        <div className="w-15 h-15 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl flex-shrink-0">
          💆
        </div>

        <div className="flex-1">
          <h3 className="m-0 mb-1.5 text-base font-semibold text-gray-800">
            Install Pandora Salon App
          </h3>
          <p className="m-0 mb-4 text-sm text-gray-500 leading-relaxed">
            Get quick access to book appointments and manage your bookings!
          </p>

          <div className="flex gap-2.5">
            <button
              onClick={handleInstallClick}
              className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-none py-2.5 px-5 rounded-lg text-sm font-semibold cursor-pointer flex-1 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 hover:shadow-lg"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="bg-gray-100 text-gray-500 border-none py-2.5 px-5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-gray-200 transition-all duration-200"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
