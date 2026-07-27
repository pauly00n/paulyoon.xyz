'use client'

import { useEffect, useState } from 'react'
import GlassPill, { GlassPillProps } from './glasspill'
import GlassPillSafari, { GlassPillSafariProps } from './glasspill-safari'
import GlassPillSafari2 from './glasspill-safari2'

function isSafariBrowser() {
  if (typeof navigator === 'undefined') return false
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

function isMobileViewport() {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 600 || /iPhone|iPod|Android/i.test(navigator.userAgent)
}

type Mode = 'chrome' | 'safari-mobile' | 'safari-desktop'

export default function GlassPillAuto(props: GlassPillProps) {
  const [mode, setMode] = useState<Mode>('chrome')

  useEffect(() => {
    if (!isSafariBrowser()) return setMode('chrome')
    setMode(isMobileViewport() ? 'safari-mobile' : 'safari-desktop')
  }, [])

  if (mode === 'safari-mobile') return <GlassPillSafari2 {...props} />
  if (mode === 'safari-desktop') return <GlassPillSafari {...(props as GlassPillSafariProps)} />
  return <GlassPill {...props} />
}
