'use client'

import React, {
  CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { cn, hexToRgb } from '@/lib/utils'
import type { BackdropSnapshot } from '@/types/backdrop-snapshot'
import { usePrebuiltSnapshot } from '@/hooks/use-prebuilt-snapshot'
import GlassPill, { GlassPillProps } from './glasspill'
import {
  SURFACE_FNS,
  calculateRefractionProfile,
  generateSpecularRGBA,
} from '@/lib/glass-physics'

export default function GlassPillSafari2(props: GlassPillProps) {
  const snapshot = usePrebuiltSnapshot()
  if (!snapshot) {
    return <GlassPill {...props} data-glasspill-snapshot-hide="" />
  }
  return <WebGLGlassPill {...props} snapshot={snapshot} />
}

const VS = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`

const FS = `
precision highp float;

uniform vec2 iResolution;
uniform vec2 iPillOrigin;
uniform vec2 iDocSize;
uniform float iDpr;
uniform float iBorderRadius;
uniform float iBezelWidth;
uniform float iScaleRatio;
uniform float iMaxDisp;
uniform float iBlur;
uniform float iSpecOpacity;
uniform float iSpecSat;
uniform sampler2D iBackdrop;
uniform sampler2D iProfile;
uniform sampler2D iSpec;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

vec4 sampleBlurred(vec2 uv) {
  if (iBlur <= 0.001) {
    return texture2D(iBackdrop, uv);
  }
  vec4 col = vec4(0.0);
  float total = 0.0;
  float s2 = 2.0 * iBlur * iBlur;
  for (int x = -2; x <= 2; x++) {
    for (int y = -2; y <= 2; y++) {
      float fx = float(x);
      float fy = float(y);
      float w = exp(-(fx * fx + fy * fy) / s2);
      vec2 off = vec2(fx, fy) * iBlur / iDocSize;
      col += texture2D(iBackdrop, uv + off) * w;
      total += w;
    }
  }
  return col / total;
}

vec3 boostSat(vec3 c, float amount) {
  float gray = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(gray), c, amount);
}

void main() {
  vec2 localPx = vec2(gl_FragCoord.x, iResolution.y * iDpr - gl_FragCoord.y) / iDpr;
  vec2 halfSize = iResolution * 0.5;
  vec2 p = localPx - halfSize;
  float sd = sdRoundedRect(p, halfSize, iBorderRadius);
  if (sd > 0.0) discard;

  // Corner-relative coords (matches generateDisplacementMap's x/y logic)
  float r = iBorderRadius;
  vec2 cc;
  if (localPx.x < r) {
    cc.x = localPx.x - r;
  } else if (localPx.x >= iResolution.x - r) {
    cc.x = localPx.x - r - (iResolution.x - 2.0 * r);
  } else {
    cc.x = 0.0;
  }
  if (localPx.y < r) {
    cc.y = localPx.y - r;
  } else if (localPx.y >= iResolution.y - r) {
    cc.y = localPx.y - r - (iResolution.y - 2.0 * r);
  } else {
    cc.y = 0.0;
  }

  float dist = length(cc);
  vec2 displacement = vec2(0.0);
  if (dist > 0.0001) {
    float fromSide = r - dist;
    if (fromSide > 0.0 && fromSide < iBezelWidth) {
      float t = fromSide / iBezelWidth;
      // sample at center of texel (128 samples wide)
      float u = (floor(t * 128.0) + 0.5) / 128.0;
      float pb = texture2D(iProfile, vec2(u, 0.5)).r;
      float pNorm = (pb * 255.0 - 128.0) / 127.0;
      float pDisp = pNorm * iMaxDisp;
      float cosA = cc.x / dist;
      float sinA = cc.y / dist;
      displacement = vec2(-cosA, -sinA) * pDisp * iScaleRatio;
    }
  }

  vec2 sampledLocal = localPx + displacement;
  vec2 docUv = (iPillOrigin + sampledLocal) / iDocSize;
  vec4 backdrop = sampleBlurred(docUv);

  // Specular layer (uv across pill)
  vec2 specUv = localPx / iResolution;
  vec4 spec = texture2D(iSpec, specUv);

  // Step 1: base = backdrop
  vec3 base = backdrop.rgb;
  // Step 2: blend saturated over base, masked by spec.a (chrome's spec_masked)
  vec3 saturated = boostSat(base, iSpecSat);
  base = mix(base, saturated, spec.a);
  // Step 3: blend faded specular highlight on top
  float blendA = clamp(spec.a * iSpecOpacity, 0.0, 1.0);
  base = mix(base, spec.rgb, blendA);

  gl_FragColor = vec4(base, 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

function WebGLGlassPill({
  children,
  className,
  borderRadius = 100,
  glassThickness = 80,
  bezelWidth = 20,
  refractiveIndex = 3.0,
  scaleRatio = 1.0,
  surfaceFn = 'convex_squircle',
  blurAmount = 2,
  specularOpacity = 0.5,
  specularSaturation = 4,
  shadowColor = '#ffffff',
  shadowBlur = 20,
  shadowSpread = -5,
  tintColor = '#ffffff',
  tintOpacity = 40,
  outerShadowBlur = 24,
  style,
  snapshot,
  ...divProps
}: GlassPillProps & { snapshot: BackdropSnapshot }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setSize({ width: el.offsetWidth, height: el.offsetHeight })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    if (size.width < 2 || size.height < 2) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.floor(size.width * dpr)
    canvas.height = Math.floor(size.height * dpr)

    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true })
    if (!gl) return

    const vs = compile(gl, gl.VERTEX_SHADER, VS)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FS)
    if (!vs || !fs) return

    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog))
      return
    }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(prog, 'position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    // ----- Compute physics in JS (same as glasspill.tsx) -----
    const clampedRadius = Math.max(1, Math.min(borderRadius, Math.floor(Math.min(size.width, size.height) / 2)))
    const clampedBezel = Math.max(1, Math.min(bezelWidth, clampedRadius - 1, Math.min(size.width, size.height) / 2 - 1))
    const heightFn = SURFACE_FNS[surfaceFn]
    const profile = calculateRefractionProfile(glassThickness, clampedBezel, heightFn, refractiveIndex, 128)
    let maxDisp = 0
    for (let i = 0; i < profile.length; i++) {
      const a = Math.abs(profile[i])
      if (a > maxDisp) maxDisp = a
    }
    if (maxDisp === 0) maxDisp = 1

    // Encode profile as a 128x1 RGBA byte texture (R = (norm+1)/2 * 255 mapped via 128 + n*127)
    const profileBytes = new Uint8Array(128 * 4)
    for (let i = 0; i < 128; i++) {
      const norm = profile[i] / maxDisp
      const byte = Math.max(0, Math.min(255, Math.round(128 + norm * 127)))
      profileBytes[i * 4] = byte
      profileBytes[i * 4 + 3] = 255
    }
    const profileTex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, profileTex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 128, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, profileBytes)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // Specular map — generated at pill size (matches glasspill.tsx, bezel*2.5)
    const specBezel = clampedBezel * 2.5
    const specData = generateSpecularRGBA(size.width, size.height, clampedRadius, specBezel)
    const specTex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, specTex)
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, size.width, size.height, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(specData.buffer)
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // Backdrop snapshot
    const backdropTex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, backdropTex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, snapshot.source)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // Uniforms
    const u = (n: string) => gl.getUniformLocation(prog, n)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(u('iResolution'), size.width, size.height)
    gl.uniform2f(u('iDocSize'), snapshot.width, snapshot.height)
    gl.uniform1f(u('iDpr'), dpr)
    gl.uniform1f(u('iBorderRadius'), clampedRadius)
    gl.uniform1f(u('iBezelWidth'), clampedBezel)
    gl.uniform1f(u('iScaleRatio'), scaleRatio)
    gl.uniform1f(u('iMaxDisp'), maxDisp)
    gl.uniform1f(u('iBlur'), blurAmount)
    gl.uniform1f(u('iSpecOpacity'), specularOpacity)
    gl.uniform1f(u('iSpecSat'), specularSaturation)
    gl.uniform1i(u('iBackdrop'), 0)
    gl.uniform1i(u('iProfile'), 1)
    gl.uniform1i(u('iSpec'), 2)

    const uOrigin = u('iPillOrigin')

    let raf = 0
    let loggedOnce = false
    const liveHeroEl = document.querySelector('.hero') as HTMLElement | null
    const draw = () => {
      raf = 0
      const rect = container.getBoundingClientRect()
      const liveDocW = Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth
      )
      const liveDocH = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.documentElement.clientHeight
      )
      const xScale = snapshot.docWidth / liveDocW
      const liveHeroH = liveHeroEl ? liveHeroEl.offsetHeight : 0
      const snapHeroH = snapshot.heroHeight ?? 0
      const liveY = rect.top + window.scrollY
      // piecewise: linear within hero, then 1:1 after (hero is the only region with viewport-relative sizing)
      let snapY: number
      if (snapHeroH > 0 && liveHeroH > 0) {
        if (liveY < liveHeroH) {
          snapY = liveY * (snapHeroH / liveHeroH)
        } else {
          snapY = snapHeroH + (liveY - liveHeroH)
        }
      } else {
        snapY = liveY
      }
      if (!loggedOnce) {
        loggedOnce = true
        const msg = `live ${liveDocW}x${liveDocH} hero ${liveHeroH} | snap ${snapshot.docWidth}x${snapshot.docHeight} hero ${snapHeroH} | pillY ${liveY.toFixed(0)}→${snapY.toFixed(0)}`
        console.log('[glasspill]', msg)
        window.__glasspillAlign = msg
        window.dispatchEvent(new CustomEvent('glasspill-align', { detail: msg }))
      }
      const offsetY = window.__glasspillOffsetY ?? 30
      const ox = (rect.left + window.scrollX) * xScale + snapshot.padX
      const oy = snapY + offsetY + snapshot.padY
      gl.uniform2f(uOrigin, ox, oy)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw)
    }
    const onPointerMove = (event: PointerEvent) => {
      if (event.buttons !== 0 || event.pressure > 0) schedule()
    }
    const onVisibilityChange = () => {
      if (!document.hidden) schedule()
    }

    draw()
    window.addEventListener('scroll', schedule, { passive: true })
    document.addEventListener('scroll', schedule, { capture: true, passive: true })
    window.addEventListener('resize', schedule)
    document.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      document.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      gl.deleteTexture(backdropTex)
      gl.deleteTexture(profileTex)
      gl.deleteTexture(specTex)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    }
  }, [
    size,
    snapshot,
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
      data-glasspill-snapshot-hide=""
      className="relative isolate overflow-hidden"
      style={containerStyle}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ width: '100%', height: '100%', borderRadius }}
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
        style={overlayStyle}
      />

      <span className={cn('relative z-20', className)}>
        {children}
      </span>
    </div>
  )
}
