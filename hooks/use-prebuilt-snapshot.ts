'use client'

import { useEffect, useState } from 'react'
import type { BackdropSnapshot, SnapshotStatus } from '@/types/backdrop-snapshot'

// Bump this whenever you regenerate snapshots (npm run snapshot). It busts the
// browser's force-cache for both the manifest and the PNGs without any manual
// cache clearing on device.
const SNAPSHOT_VERSION = '3'
const MANIFEST_URL = `/glasspill-snapshots/manifest.json?v=${SNAPSHOT_VERSION}`

interface ManifestEntry {
  docWidth: number
  docHeight: number
  width: number
  height: number
  padX: number
  padY: number
  scale: number
  heroHeight: number
  file: string
}

interface Manifest {
  snapshots: ManifestEntry[]
}

function pushDebug(status: SnapshotStatus) {
  if (typeof window === 'undefined') return
  window.__glasspillDebug = status
  window.dispatchEvent(new CustomEvent('glasspill-debug', { detail: status }))
}

export function usePrebuiltSnapshot(): BackdropSnapshot | null {
  const [data, setData] = useState<BackdropSnapshot | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const t0 = performance.now()
      pushDebug({ state: 'fetching-manifest' })

      let manifest: Manifest
      try {
        const res = await fetch(MANIFEST_URL, { cache: 'force-cache' })
        if (!res.ok) throw new Error(`manifest ${res.status}`)
        manifest = await res.json()
      } catch (err) {
        pushDebug({ state: 'error', message: 'manifest: ' + (err as Error).message })
        return
      }
      if (cancelled) return

      const viewportW = window.innerWidth
      const entry = manifest.snapshots
        .slice()
        .sort((a, b) => Math.abs(a.docWidth - viewportW) - Math.abs(b.docWidth - viewportW))[0]
      if (!entry) {
        pushDebug({ state: 'error', message: 'no snapshots in manifest' })
        return
      }

      pushDebug({ state: 'loading-png', entry })
      const img = new Image()
      img.crossOrigin = 'anonymous'
      try {
        await new Promise<void>((res, rej) => {
          img.onload = () => res()
          img.onerror = () => rej(new Error('png load failed'))
          img.src = `${entry.file}?v=${SNAPSHOT_VERSION}`
        })
      } catch (err) {
        pushDebug({ state: 'error', message: (err as Error).message })
        return
      }
      if (cancelled) return

      const padW = Math.floor(entry.width * entry.scale)
      const padH = Math.floor(entry.height * entry.scale)
      const canvas = document.createElement('canvas')
      canvas.width = padW
      canvas.height = padH
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        pushDebug({ state: 'error', message: '2d ctx unavailable' })
        return
      }
      ctx.drawImage(img, 0, 0, padW, padH)

      const snap: BackdropSnapshot = {
        source: canvas,
        width: entry.width,
        height: entry.height,
        padX: entry.padX,
        padY: entry.padY,
        docWidth: entry.docWidth,
        docHeight: entry.docHeight,
        scale: entry.scale,
        heroHeight: entry.heroHeight,
      }
      console.log(`[glasspill] prebuilt ready in ${(performance.now() - t0).toFixed(0)}ms`, entry.file)
      pushDebug({ state: 'ready', data: snap })
      setData(snap)
    }

    load()
    return () => { cancelled = true }
  }, [])

  return data
}
