"use client"

import { useEffect } from "react"

// Arrow-key (and PageUp/Down, Home/End, j/k) navigation for the snap deck.
// The deck (<main data-deck>) is the scroll container; its direct children are
// the panels. We find the panel nearest the viewport center and jump ±1.
export function DeckKeyNav() {
  useEffect(() => {
    const deck = document.querySelector<HTMLElement>("[data-deck]")
    if (!deck) return

    // Deck children are wrappers; on desktop they're display:contents (no box),
    // so resolve to the inner panel. Drop any with no box (e.g. hidden on mobile).
    const panels = () =>
      (Array.from(deck.children) as HTMLElement[])
        .map((el) =>
          el.getClientRects().length ? el : (el.firstElementChild as HTMLElement | null),
        )
        .filter((el): el is HTMLElement => !!el && el.getClientRects().length > 0)

    const currentIndex = () => {
      const ps = panels()
      const mid = deck.clientHeight / 2
      const deckTop = deck.getBoundingClientRect().top
      let curr = 0
      let best = Infinity
      ps.forEach((p, i) => {
        const r = p.getBoundingClientRect()
        const center = r.top - deckTop + r.height / 2
        const dist = Math.abs(center - mid)
        if (dist < best) {
          best = dist
          curr = i
        }
      })
      return curr
    }

    const goTo = (i: number) => {
      const ps = panels()
      const clamped = Math.max(0, Math.min(ps.length - 1, i))
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ps[clamped]?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      })
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
        case "j":
          e.preventDefault()
          goTo(currentIndex() + 1)
          break
        case "ArrowUp":
        case "PageUp":
        case "k":
          e.preventDefault()
          goTo(currentIndex() - 1)
          break
        case "Home":
          e.preventDefault()
          goTo(0)
          break
        case "End":
          e.preventDefault()
          goTo(panels().length - 1)
          break
      }
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return null
}
