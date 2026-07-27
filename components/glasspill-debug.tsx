'use client'

import { useEffect, useRef, useState } from 'react'
import type { SnapshotStatus } from '@/types/backdrop-snapshot'

function ThumbCanvas({
  source,
  padX,
  padY,
  docWidth,
  docHeight,
  isNarrow,
}: {
  source: HTMLImageElement | HTMLCanvasElement
  padX: number
  padY: number
  docWidth: number
  docHeight: number
  isNarrow: boolean
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const maxH = isNarrow ? 120 : 400
    const maxW = isNarrow ? 80 : 200
    const sw = source.width || 1
    const sh = source.height || 1
    let w = maxW
    let h = Math.round((sh / sw) * w)
    if (h > maxH) {
      h = maxH
      w = Math.round((sw / sh) * h)
    }
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.drawImage(source, 0, 0, w, h)
  }, [source, padX, padY, docWidth, docHeight, isNarrow])
  return (
    <canvas
      ref={ref}
      style={{
        marginTop: 6,
        maxWidth: isNarrow ? 80 : 200,
        maxHeight: isNarrow ? 120 : 400,
        height: 'auto',
        border: '1px solid rgba(255,255,255,0.3)',
        display: 'block',
      }}
    />
  )
}

const SHOW_DEBUG = false

export function GlassPillDebug() {
  if (!SHOW_DEBUG) return null
  return <GlassPillDebugPanel />
}

function GlassPillDebugPanel() {
  const [status, setStatus] = useState<SnapshotStatus>({ state: 'idle' })
  const [align, setAlign] = useState<string>('')
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 699px)')
    const handler = (e: Event) => {
      setStatus((e as CustomEvent<SnapshotStatus>).detail)
    }
    const alignHandler = (e: Event) => {
      setAlign((e as CustomEvent<string>).detail)
    }
    window.addEventListener('glasspill-debug', handler)
    window.addEventListener('glasspill-align', alignHandler)
    setIsNarrow(mq.matches)
    const narrowHandler = (event: MediaQueryListEvent) => setIsNarrow(event.matches)
    mq.addEventListener('change', narrowHandler)
    const existing = window.__glasspillDebug
    if (existing) setStatus(existing)
    const existingAlign = window.__glasspillAlign
    if (existingAlign) setAlign(existingAlign)
    return () => {
      window.removeEventListener('glasspill-debug', handler)
      window.removeEventListener('glasspill-align', alignHandler)
      mq.removeEventListener('change', narrowHandler)
    }
  }, [])

  const color =
    status.state === 'ready' ? '#22c55e' :
    status.state === 'error' ? '#ef4444' :
    '#eab308'

  return (
    <div
      data-glasspill-snapshot-hide=""
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.85)',
        color: 'white',
        padding: '8px 10px',
        borderRadius: 8,
        font: '12px ui-monospace, monospace',
        maxWidth: isNarrow ? 140 : 320,
        fontSize: isNarrow ? 9 : 12,
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ width: 10, height: 10, borderRadius: 5, background: color, display: 'inline-block' }} />
        <strong>glasspill:</strong> {status.state}
      </div>
      {status.state === 'error' && (
        <div style={{ marginTop: 4, color: '#fca5a5', wordBreak: 'break-word' }}>
          {status.message}
        </div>
      )}
      {align && (
        <div style={{ marginTop: 4, fontSize: 10, color: '#9ca3af', wordBreak: 'break-all' }}>
          {align}
        </div>
      )}
      {status.state === 'ready' && (
        <>
          <div style={{ marginTop: 4 }}>
            doc {status.data.docWidth} × {status.data.docHeight} (pad {status.data.padX})
          </div>
          <ThumbCanvas
            source={status.data.source}
            padX={status.data.padX}
            padY={status.data.padY}
            docWidth={status.data.docWidth}
            docHeight={status.data.docHeight}
            isNarrow={isNarrow}
          />
        </>
      )}
    </div>
  )
}
