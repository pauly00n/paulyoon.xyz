'use client'

import React, {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { cn, hexToRgb } from '@/lib/utils'

export interface GlassPillProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  className?: string

  borderRadius?: number

  glassThickness?: number
  bezelWidth?: number
  refractiveIndex?: number
  scaleRatio?: number
  surfaceFn?: 'convex_squircle' | 'convex_circle' | 'concave' | 'lip'

  blurAmount?: number
  specularOpacity?: number
  specularSaturation?: number

  shadowColor?: string
  shadowBlur?: number
  shadowSpread?: number

  tintColor?: string
  tintOpacity?: number

  outerShadowBlur?: number
}

const SURFACE_FNS = {
  convex_squircle: (x: number) => Math.pow(1 - Math.pow(1 - x, 4), 0.25),
  convex_circle:   (x: number) => Math.sqrt(1 - (1 - x) * (1 - x)),
  concave:         (x: number) => 1 - Math.sqrt(1 - (1 - x) * (1 - x)),
  lip: (x: number) => {
    const convex  = Math.pow(1 - Math.pow(1 - Math.min(x * 2, 1), 4), 0.25)
    const concave = 1 - Math.sqrt(1 - (1 - x) * (1 - x)) + 0.1
    const t = 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3
    return convex * (1 - t) + concave * t
  },
}

function calculateRefractionProfile(
  glassThickness: number,
  bezelWidth: number,
  heightFn: (x: number) => number,
  ior: number,
  samples = 128
) {
  const eta = 1 / ior

  function refract(nx: number, ny: number): [number, number] | null {
    const dot = ny
    const k   = 1 - eta * eta * (1 - dot * dot)
    if (k < 0) return null
    const sq = Math.sqrt(k)
    return [-(eta * dot + sq) * nx, eta - (eta * dot + sq) * ny]
  }

  const profile = new Float64Array(samples)
  for (let i = 0; i < samples; i++) {
    const x    = i / samples
    const y    = heightFn(x)
    const dx   = x < 1 ? 0.0001 : -0.0001
    const y2   = heightFn(x + dx)
    const deriv = (y2 - y) / dx
    const mag  = Math.sqrt(deriv * deriv + 1)
    const ref  = refract(-deriv / mag, -1 / mag)
    profile[i] = ref ? ref[0] * ((y * bezelWidth + glassThickness) / ref[1]) : 0
  }
  return profile
}

function generateDisplacementMap(
  w: number, h: number, radius: number, bezelWidth: number,
  profile: Float64Array, maxDisp: number
) {
  const c   = document.createElement('canvas')
  c.width   = w
  c.height  = h
  const ctx = c.getContext('2d')
  if (!ctx) return ''

  const img = ctx.createImageData(w, h)
  const d   = img.data
  for (let i = 0; i < d.length; i += 4) { d[i] = 128; d[i+1] = 128; d[i+2] = 0; d[i+3] = 255 }

  const r = radius, rSq = r*r, r1Sq = (r+1)**2, rBSq = Math.max(r - bezelWidth, 0)**2
  const wB = w - r*2, hB = h - r*2, S = profile.length

  for (let y1 = 0; y1 < h; y1++) {
    for (let x1 = 0; x1 < w; x1++) {
      const x    = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0
      const y    = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0
      const dSq  = x*x + y*y
      if (dSq > r1Sq || dSq < rBSq) continue
      const dist     = Math.sqrt(dSq)
      const fromSide = r - dist
      const op       = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq))
      if (op <= 0 || dist === 0) continue
      const cos  = x / dist, sin = y / dist
      const bi   = Math.min(((fromSide / bezelWidth) * S) | 0, S - 1)
      const disp = profile[bi] || 0
      const idx  = (y1 * w + x1) * 4
      d[idx]     = (128 + (-cos * disp / maxDisp) * 127 * op + 0.5) | 0
      d[idx + 1] = (128 + (-sin * disp / maxDisp) * 127 * op + 0.5) | 0
    }
  }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL()
}

function generateSpecularMap(
  w: number, h: number, radius: number, bezelWidth: number, angle = Math.PI / 3
) {
  const c   = document.createElement('canvas')
  c.width   = w
  c.height  = h
  const ctx = c.getContext('2d')
  if (!ctx) return ''

  const img = ctx.createImageData(w, h)
  const d   = img.data
  d.fill(0)

  const r = radius, rSq = r*r, r1Sq = (r+1)**2, rBSq = Math.max(r - bezelWidth, 0)**2
  const wB = w - r*2, hB = h - r*2
  const sv = [Math.cos(angle), Math.sin(angle)]

  for (let y1 = 0; y1 < h; y1++) {
    for (let x1 = 0; x1 < w; x1++) {
      const x   = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0
      const y   = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0
      const dSq = x*x + y*y
      if (dSq > r1Sq || dSq < rBSq) continue
      const dist     = Math.sqrt(dSq)
      const fromSide = r - dist
      const op       = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq))
      if (op <= 0 || dist === 0) continue
      const cos   = x / dist, sin = -y / dist
      const dot   = Math.abs(cos * sv[0] + sin * sv[1])
      const edge  = Math.sqrt(Math.max(0, 1 - (1 - fromSide) ** 2))
      const coeff = dot * edge
      const col   = (255 * coeff) | 0
      const idx   = (y1 * w + x1) * 4
      d[idx] = d[idx+1] = d[idx+2] = col
      d[idx+3] = (col * coeff * op) | 0
    }
  }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL()
}

export default function GlassPill({
  children,
  className,

  borderRadius       = 100,
  glassThickness     = 80,
  bezelWidth         = 20,
  refractiveIndex    = 3.0,
  scaleRatio         = 1.0,
  surfaceFn          = 'convex_squircle',

  blurAmount         = 2,
  specularOpacity    = 0.5,
  specularSaturation = 4,

  shadowColor        = '#ffffff',
  shadowBlur         = 20,
  shadowSpread       = -5,

  tintColor          = '#ffffff',
  tintOpacity        = 40,

  outerShadowBlur    = 24,

  style,
  ...divProps
}: GlassPillProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize]   = useState({ width: 0, height: 0 })
  const { width, height } = size
  const reactId  = useId()
  const filterId = useMemo(() => {
    const base = reactId.replace(/[:]/g, '')
    const signature = [
      width,
      height,
      borderRadius,
      glassThickness,
      bezelWidth,
      refractiveIndex,
      scaleRatio,
      surfaceFn,
      blurAmount,
      specularOpacity,
      specularSaturation,
    ].join('-')
    let hash = 0
    for (let i = 0; i < signature.length; i++) {
      hash = (hash * 31 + signature.charCodeAt(i)) | 0
    }
    return `glass-pill-filter-${base}-${(hash >>> 0).toString(36)}`
  }, [
    reactId,
    width,
    height,
    borderRadius,
    glassThickness,
    bezelWidth,
    refractiveIndex,
    scaleRatio,
    surfaceFn,
    blurAmount,
    specularOpacity,
    specularSaturation,
  ])

  // measure container via ResizeObserver — use offsetWidth/Height (border box, includes padding)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setSize({ width: el.offsetWidth, height: el.offsetHeight })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const [maps, setMaps] = useState<{ dispUrl: string; specUrl: string; scale: number } | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (width < 2 || height < 2) return

    const radius = Math.max(1, Math.min(borderRadius, Math.floor(Math.min(width, height) / 2)))
    const clampedBezel = Math.max(1, Math.min(bezelWidth, radius - 1, Math.min(width, height) / 2 - 1))
    const heightFn = SURFACE_FNS[surfaceFn]
    const profile  = calculateRefractionProfile(glassThickness, clampedBezel, heightFn, refractiveIndex, 128)
    const maxDisp  = Math.max(...Array.from(profile).map(Math.abs)) || 1

    setMaps({
      dispUrl: generateDisplacementMap(width, height, radius, clampedBezel, profile, maxDisp),
      specUrl: generateSpecularMap(width, height, radius, clampedBezel * 2.5),
      scale:   maxDisp * scaleRatio,
    })
  }, [width, height, borderRadius, glassThickness, bezelWidth, refractiveIndex, scaleRatio, surfaceFn])

  const tintRgb = useMemo(() => hexToRgb(tintColor), [tintColor])

  const containerStyle: CSSProperties = {
    borderRadius,
    boxShadow: `0px 4px ${outerShadowBlur}px rgba(0,0,0,0.18)`,
    ...style,
  }

  const overlayStyle: CSSProperties = {
    borderRadius,
    boxShadow: `inset 0 0 ${shadowBlur}px ${shadowSpread}px ${shadowColor}`,
    backgroundColor: `rgba(${tintRgb}, ${Math.max(0, Math.min(100, tintOpacity)) / 100})`,
    transition: 'background-color 500ms ease',
  }

  return (
    <div
      ref={containerRef}
      {...divProps}
      className="relative isolate overflow-hidden"
      style={containerStyle}
    >
      <svg
        aria-hidden="true"
        width="0"
        height="0"
        className="absolute overflow-hidden pointer-events-none"
        style={{ position: 'absolute' }}
      >
        <defs>
          {maps && (
            <filter
              id={filterId}
              x="0%" y="0%" width="100%" height="100%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation={blurAmount} result="blurred_source" />
              <feImage key={maps.dispUrl} href={maps.dispUrl} x="0" y="0" width={width} height={height} result="disp_map" />
              <feDisplacementMap
                in="blurred_source" in2="disp_map"
                scale={maps.scale} xChannelSelector="R" yChannelSelector="G"
                result="displaced"
              />
              <feColorMatrix in="displaced" type="saturate" values={String(specularSaturation)} result="displaced_sat" />
              <feImage key={maps.specUrl} href={maps.specUrl} x="0" y="0" width={width} height={height} result="spec_layer" />
              <feComposite in="displaced_sat" in2="spec_layer" operator="in" result="spec_masked" />
              <feComponentTransfer in="spec_layer" result="spec_faded">
                <feFuncA type="linear" slope={specularOpacity} />
              </feComponentTransfer>
              <feBlend in="spec_masked" in2="displaced" mode="normal" result="with_sat" />
              <feBlend in="spec_faded" in2="with_sat" mode="normal" />
            </filter>
          )}
        </defs>
      </svg>

      {/* backdrop refraction layer */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          borderRadius,
          backdropFilter:       maps ? `url(#${filterId})` : undefined,
          WebkitBackdropFilter: maps ? `url(#${filterId})` : undefined,
        }}
      />

      {/* inner highlight overlay */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
        style={overlayStyle}
      />

      {/* content — className goes here so layout (flex, gap, padding) applies where children live */}
      <span className={cn('relative z-20', className)}>
        {children}
      </span>
    </div>
  )
}
