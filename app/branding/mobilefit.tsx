"use client"

import { useEffect } from "react"

// On mobile, render each slide at a fixed desktop canvas width and scale it to
// the tile width. Every slide gets ONE uniform canvas height — the tallest
// slide's natural height — so the deck reads like desktop (uniform 92svh):
// dense slides fit exactly, sparse ones fill to the same height (their own
// layout centers the content), and nothing is clipped.
const CANVAS_W = 1080
// uniform height is the tallest slide's natural height times this factor —
// the max alone made every card too tall, so trim toward the typical slide
const HEIGHT_FACTOR = 0.85

export function MobileSlideFit() {
  useEffect(() => {
    const deck = document.querySelector<HTMLElement>("[data-deck]")
    if (!deck) return
    const mq = window.matchMedia("(max-width: 860px)")
    const tiles = () => Array.from(deck.querySelectorAll<HTMLElement>(":scope > div"))

    const apply = () => {
      const mobile = mq.matches
      const list = tiles()
      if (!mobile) {
        for (const tile of list) {
          const sec = tile.firstElementChild as HTMLElement | null
          tile.style.height = ""
          if (sec) sec.style.width = sec.style.height = sec.style.minHeight = sec.style.transform = ""
        }
        return
      }
      // pass 1 — collect every layout read before mutating slide styles
      const items: { tile: HTMLElement; sec: HTMLElement; tileW: number }[] = []
      for (const tile of list) {
        const sec = tile.firstElementChild as HTMLElement | null
        if (!sec) continue
        const tileW = tile.clientWidth
        if (!tileW) continue // hidden (e.g. contact sheet)
        items.push({ tile, sec, tileW })
      }

      // pass 2 — writes only: lay every slide out at the fixed canvas width
      for (const { sec } of items) {
        sec.style.width = `${CANVAS_W}px`
        sec.style.minHeight = "0px"
        sec.style.height = "auto"
        sec.style.transform = "none"
      }

      // pass 3 — reads only: one layout flush, then measure every natural height
      let maxH = 0
      for (const { sec } of items) {
        maxH = Math.max(maxH, sec.offsetHeight) // offsetHeight ignores transform
      }

      // pass 4 — writes only: set the uniform height and final scale
      const uniformH = Math.round(maxH * HEIGHT_FACTOR)
      for (const { tile, sec, tileW } of items) {
        const scale = tileW / CANVAS_W
        sec.style.height = `${uniformH}px`
        sec.style.minHeight = `${uniformH}px`
        sec.style.transform = `scale(${scale})`
        tile.style.height = `${Math.round(uniformH * scale)}px`
      }
    }

    apply()
    window.addEventListener("resize", apply)
    mq.addEventListener("change", apply)
    // re-measure once fonts swap in (changes text height)
    document.fonts?.ready.then(apply).catch(() => {})
    const t = setTimeout(apply, 600)
    return () => {
      window.removeEventListener("resize", apply)
      mq.removeEventListener("change", apply)
      clearTimeout(t)
    }
  }, [])

  return null
}
