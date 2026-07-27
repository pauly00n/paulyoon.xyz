"use client"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import GlassPillAuto from "@/components/ui/glasspill-auto"
import { cn } from "@/lib/utils"
import styles from "./nav.module.css"

type NavLink = { label: string; href: string; sectionId?: string }

const navLinks: NavLink[] = [
  { label: "Work", href: "#work", sectionId: "work" },
  { label: "Projects", href: "#projects", sectionId: "projects" },
  { label: "Resume", href: "/resume.pdf" },
]

export function Nav() {
  const pathname = usePathname()
  const [overProjects, setOverProjects] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (pathname === "/branding") return

    function check() {
      const projects = document.getElementById('projects')
      if (!projects) { setOverProjects(false); return }
      const { top, bottom } = projects.getBoundingClientRect()
      setOverProjects(top < 74 && bottom > 0)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [pathname])

  useEffect(() => {
    if (pathname === "/branding") return

    const ids = navLinks.map(l => l.sectionId).filter(Boolean) as string[]
    const els = ids.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    if (!els.length) return

    function pick() {
      const probe = 74 + 24
      let current: string | null = null
      for (const el of els) {
        const { top, bottom } = el.getBoundingClientRect()
        if (top <= probe && bottom > probe) { current = el.id; break }
      }
      setActiveId(current)
    }
    pick()
    window.addEventListener('scroll', pick, { passive: true })
    window.addEventListener('resize', pick)
    return () => {
      window.removeEventListener('scroll', pick)
      window.removeEventListener('resize', pick)
    }
  }, [pathname])

  if (pathname === "/branding") return null

  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center bg-transparent">
      <nav aria-label="Primary">
        <GlassPillAuto
          className="flex items-center gap-6 px-6 py-3"
          tintOpacity={overProjects ? 40 : 20}
        >
          <a href="#" aria-label="Home" className="flex items-center">
            <svg
              width={20}
              height={20}
              viewBox="0 0 50 50"
              role="img"
              aria-label="PY Logo"
              className="text-black"
            >
              <mask id="py-logo-mask">
                <rect width="50" height="50" fill="#000" />
                <path d="M15 6 L15 14 L24.26 25.85" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="butt" strokeLinejoin="miter" />
                <path d="M21.5 21 L28.5 21 L28.5 46 L21.5 46 Z" fill="#fff" />
                <path d="M24 6 L28.5 6 A11 11 0 0 1 28.5 28 L28.5 21 A4 4 0 0 0 28.5 13 L24 13 Z" fill="#fff" />
                <rect x={28} y={21} width={1} height={7} fill="#fff" />
              </mask>
              <rect width="50" height="50" fill="currentColor" mask="url(#py-logo-mask)" />
            </svg>
          </a>
          <div className="h-4 w-px bg-foreground/10" />
          {navLinks.map((link) => {
            const isActive = link.sectionId ? activeId === link.sectionId : false
            return (
              <a
                key={link.href + link.label}
                href={link.href}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  styles.link,
                  "text-sm transition-colors",
                  isActive ? `text-black ${styles.active}` : "text-black/70 hover:text-black"
                )}
              >
                {link.label}
              </a>
            )
          })}
        </GlassPillAuto>
      </nav>
    </header>
  )
}
