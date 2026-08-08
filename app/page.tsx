'use client'

import { useEffect, useState } from 'react'

export default function LoginPage() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }

        return prev + 2
      })
    }, 80)

    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">

        {/* Main Terminal Card */}
        <div className="glass scanlines rounded-xl p-6 sm:p-8 shadow-2xl">

          {/* Star Jedi Heading */}
          <h1 className="font-star-jedi text-3xl sm:text-4xl text-white uppercase tracking-wider mb-1">
            COMMAND NEXUS
          </h1>

          {/* IBM Plex Body */}
          <p className="font-ibm text-sm text-gray-400 mb-6">
            Imperial Strategic Command — Awaiting secure uplink...
          </p>

          {/* Terminal Output */}
          <div className="font-share-tech text-base space-y-2">

            <p className="text-data-blue">
              IMPERIAL TERMINAL v1.0
            </p>

            <p className="text-amber">
              establishing secure uplink...
            </p>

            {/* Progress Bar */}
            <div className="w-full h-3.5 bg-steel rounded-sm mt-2 overflow-hidden">
              <div
                className="h-full bg-imperial-red transition-all duration-100 ease-linear rounded-sm"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-amber">
              {progress}% synced
              <span className="opacity-60 animate-pulse">_</span>
            </p>

          </div>

          {/* Sector Information */}
          <div className="mt-6 pt-4 border-t border-steel flex justify-between items-center">

            <span className="font-exo font-bold text-2xl text-white tracking-wide">
              SECTOR-7
            </span>

            <span className="font-exo font-semibold text-sm text-imperial-red uppercase tracking-wider border border-imperial-red/30 px-3 py-1 rounded-sm">
              awaiting_directive
            </span>

          </div>

          {/* Statistics */}
          <div className="mt-4 flex gap-6">

            <div>
              <p className="font-chakra font-semibold text-3xl text-imperial-red">
                247
              </p>

              <p className="font-ibm text-xs text-gray-500">
                ACTIVE TARGETS
              </p>
            </div>

            <div>
              <p className="font-chakra font-semibold text-3xl text-data-blue">
                68%
              </p>

              <p className="font-ibm text-xs text-gray-500">
                SECTOR CONTROL
              </p>
            </div>

          </div>

          {/* Login Button */}
          <button
            className="
              mt-6
              w-full
              bg-imperial-red
              hover:bg-red-700
              transition-colors
              text-white
              font-exo
              font-semibold
              py-3
              rounded-lg
              tracking-wider
              uppercase
            "
          >
            Initiate Session
          </button>

        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 font-ibm text-xs mt-4">
          PROJECT: VERDICT v1.0 • Imperial High Command
        </p>

      </div>
    </main>
  )
}