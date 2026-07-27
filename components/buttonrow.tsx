"use client"

import { useEffect, useRef, useState } from "react"
import { Github, Mail, Linkedin, Twitter } from "lucide-react"
import GlassButton2 from "@/components/ui/glassbutton2"

const SOCIALS = [
  { href: "https://github.com/pauly00n", icon: Github, label: "GitHub" },
  { href: "mailto:pauljy@stanford.edu", icon: Mail, label: "Email" },
  { href: "https://linkedin.com/in/pauljinyoon", icon: Linkedin, label: "LinkedIn" },
  { href: "https://x.com/asian1x", icon: Twitter, label: "Twitter" },
]

const W = 52
const GAP = 12
const EASING = "cubic-bezier(0.4, 0, 0.2, 1)"
const SEQUENCE = [0, 1, 2, 3, 2, 1]

export function ButtonRow() {
  const [tick, setTick] = useState(0)
  const rowRef = useRef<HTMLDivElement>(null)
  const active = SEQUENCE[tick % SEQUENCE.length]

  useEffect(() => {
    const el = rowRef.current
    if (!el) return

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let id: number | undefined
    let inView = false
    let focusWithin = el.contains(document.activeElement)
    let reduceMotion = motion.matches

    const sync = () => {
      const shouldRun = inView && !document.hidden && !focusWithin && !reduceMotion
      if (shouldRun && id === undefined) {
        id = window.setInterval(() => setTick(t => t + 1), 2000)
      } else if (!shouldRun && id !== undefined) {
        window.clearInterval(id)
        id = undefined
      }
    }

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      sync()
    })
    const onFocusIn = () => {
      focusWithin = true
      sync()
    }
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget
      if (next instanceof Node && el.contains(next)) return
      focusWithin = false
      sync()
    }
    const onMotionChange = (event: MediaQueryListEvent) => {
      reduceMotion = event.matches
      sync()
    }

    io.observe(el)
    el.addEventListener("focusin", onFocusIn)
    el.addEventListener("focusout", onFocusOut)
    document.addEventListener("visibilitychange", sync)
    motion.addEventListener("change", onMotionChange)

    return () => {
      io.disconnect()
      el.removeEventListener("focusin", onFocusIn)
      el.removeEventListener("focusout", onFocusOut)
      document.removeEventListener("visibilitychange", sync)
      motion.removeEventListener("change", onMotionChange)
      if (id !== undefined) window.clearInterval(id)
    }
  }, [])

  const STEP = W + GAP
  const CONTAINER_W = W * 5 + GAP * 4

  return (
    <div ref={rowRef} className="mt-10 flex justify-center">
      <div style={{ position: "relative", width: CONTAINER_W, height: W }}>
        {SOCIALS.map((social, i) => {
          const isActive = i === active
          const left =
            i < active
              ? i * STEP
              : i === active
                ? active * STEP
                : (i + 1) * STEP

          return (
            <GlassButton2
              key={social.label}
              href={social.href}
              fill
              spanStyle={{ gap: isActive ? "6px" : "0px" }}
              wrapperStyle={{
                position: "absolute",
                left,
                top: 0,
                width: isActive ? W * 2 + GAP : W,
                height: W,
                transition: `width 0.45s ${EASING}, left 0.45s ${EASING}`,
              }}
            >
              <social.icon className="h-5 w-5 shrink-0" />
              <span
                style={{
                  display: "inline-block",
                  maxWidth: isActive ? "80px" : "0px",
                  opacity: isActive ? 1 : 0,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  transition: isActive
                    ? `max-width 0.4s ${EASING} 0.05s, opacity 0.1s ease 0.05s`
                    : `max-width 0.4s ${EASING} 0.05s, opacity 0s`,
                  fontSize: "0.875rem",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  letterSpacing: "-0.05em",
                  color: "rgba(50, 50, 50, 1)",
                }}
              >
                {social.label}
              </span>
            </GlassButton2>
          )
        })}
      </div>
    </div>
  )
}
