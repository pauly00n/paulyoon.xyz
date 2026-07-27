'use client'

import { useEffect } from 'react'

export default function SnapshotBootstrap() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.location.search.includes('snapshot=1')) return
    import('@/lib/capture-backdrop').then(() => {
      window.__captureGlasspillReady = true
    })
  }, [])
  return null
}
