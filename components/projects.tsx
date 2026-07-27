"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { ArrowUpRight, Github } from "lucide-react"
import { SectionHeading, SectionShell } from "@/components/ui/section"
import { useIntersectionOnce } from "@/hooks/use-intersection-once"
import { useMobileScrollLine } from "@/hooks/use-mobile-scroll-line"
import { revealStyle } from "@/hooks/use-reveal-style"

type BentoCfg = {
  /** Visual row in the bento (0-indexed) — used for animation grouping. */
  bentoRow: number
  /** Tailwind classes applied at md+ only. Mobile is always 1-col. */
  spanClass: string
  /** Animation keyframe name (defined in globals.css). */
  anim: string
  /** Animation delay in ms (added on top of the row's base trigger). */
  delay: number
}

type Project = {
  title: string
  description: string
  tags: string[]
  liveUrl?: string
  githubUrl?: string
  image: string
}

// Desktop bento layout (md+), 6-col grid, 240px row units. Three 4×2 feature
// cards zig-zag down the page, each flanked by two stacked shorts:
//   Row 0 (rows 1-2): LemonLime 4×2 (left) | Ask Stella, AutoML (right stack)
//   Row 1 (rows 3-4): S1R, Hidden (left stack) | Personal Site Brand Kit 4×2 (right)
//   Row 2 (rows 5-6): Stanford Christian Students 4×2 (left) | Wigner, Timestamping (right stack)
// 9 cards → 36 grid-units → 6 rows, fully tiled. Array order is tuned for the
// grid's sparse auto-flow (also the mobile 1-col order). Mobile: 1-col stack.
const projects: (Project & BentoCfg)[] = [
  {
    title: "LemonLime AI Website",
    description: "Frontend landing page, hero, mockups, and subpages.",
    tags: ["Next.js", "Typescript", "Supabase"],
    liveUrl: "https://lemonlime.ai",
    image: "/lemonlimeai.png",
    bentoRow: 0,
    spanClass: "md:col-span-4 md:row-span-2",
    anim: "projectsFadeTopLeft",
    delay: 0,
  },
  {
    title: "Ask Stella",
    description:
      "Full stack web app solving radiologists' pain points with AI workflows, integrating multiple into one place.",
    tags: ["Next.js", "TypeScript", "Supabase"],
    liveUrl: "https://stella-ashy.vercel.app",
    githubUrl: "https://github.com/pauly00n/personal-website",
    image: "/stella1.png",
    bentoRow: 0,
    spanClass: "md:col-span-2 md:row-span-1",
    anim: "projectsFadeTopRight",
    delay: 140,
  },
  {
    title: "AutoML-Cardiac",
    description:
      "Autonomous ML experiment framework for cardiac MRI classification on the ACDC dataset.",
    tags: ["PyTorch", "Python", "Markdown"],
    githubUrl: "https://github.com/pauly00n/AutoML-Cardiac",
    image: "/automl-cardiac.png",
    bentoRow: 0,
    spanClass: "md:col-span-2 md:row-span-1",
    anim: "projectsFadeTopRight",
    delay: 240,
  },
  {
    title: "S1R PET/MRI Knee Pain Research",
    description:
      "Analyzed PET/MRI scans of patients with chronic knee pain. Presented at SNMMI conference. Co-author of manuscript",
    tags: ["Horos", "Excel", "Powerpoint"],
    liveUrl: "https://jnm.snmjournals.org/content/62/supplement_1/143",
    image: "/knee-pain.png",
    bentoRow: 1,
    spanClass: "md:col-span-2 md:row-span-1",
    anim: "projectsFadeLeft",
    delay: 0,
  },
  {
    title: "Personal Site Brand Kit",
    description:
      "A complete brand system for this site: logo construction, type scale, color, motion, the glass material, and a slide template, set down as a living guidelines deck.",
    tags: ["Design", "Typography", "Next.js"],
    liveUrl: "/branding",
    image: "/branding2.png",
    bentoRow: 1,
    spanClass: "md:col-span-4 md:row-span-2",
    anim: "projectsFadeRight",
    delay: 140,
  },
  {
    title: "Hidden Studios AdTech Platform",
    description:
      "Ad campaign scheduling platform with impression forecasting powered by live Fortnite player-count data",
    tags: ["Next.js", "TypeScript", "Supabase"],
    image: "/hidden-studios1.png",
    bentoRow: 1,
    spanClass: "md:col-span-2 md:row-span-1",
    anim: "projectsFadeLeft",
    delay: 240,
  },
  {
    title: "Stanford Christian Students App",
    description:
      "Full stack web & mobile app delivering daily scripture reading(s) for Stanford students",
    tags: ["React Native", "TypeScript", "AWS"],
    liveUrl: "https://apps.apple.com/us/app/stanford-christian-students/id1606989492",
    image: "/scsapp.png",
    bentoRow: 2,
    spanClass: "md:col-span-4 md:row-span-2",
    anim: "projectsFadeLeft",
    delay: 0,
  },
  {
    title: "Formalizing Wigner's Semicircle Law",
    description:
      "Translating random matrix theory proofs into machine-verified mathematics",
    tags: ["Lean", "Mathlib", "LaTeX"],
    liveUrl: "https://fredraj3.github.io/SemicircleLaw/",
    githubUrl: "https://github.com/FredRaj3/SemicircleLaw",
    image: "/formalizing.png",
    bentoRow: 2,
    spanClass: "md:col-span-2 md:row-span-1",
    anim: "projectsFadeRight",
    delay: 140,
  },
  {
    title: "Timestamping Video Game Eliminations",
    description:
      "Lightweight computer vision pipeline for splicing Brawl Stars highlights from raw footage",
    tags: ["Python", "YOLOv8", "OpenCV"],
    githubUrl: "https://github.com/pauly00n/timestamping-video-game-eliminations",
    image: "/timestamping.jpeg",
    bentoRow: 2,
    spanClass: "md:col-span-2 md:row-span-1",
    anim: "projectsFadeRight",
    delay: 240,
  },
]

// First index belonging to each bento row — used to gate row-wide reveal so the
// whole row animates together when the row's lead card enters the viewport.
const BENTO_ROW_TRIGGER: Record<number, number> = (() => {
  const m: Record<number, number> = {}
  projects.forEach((p, i) => {
    if (m[p.bentoRow] === undefined) m[p.bentoRow] = i
  })
  return m
})()

const NUM_PROJECTS = projects.length

const CARD_BG: React.CSSProperties = {
  background: "linear-gradient(160deg, #f5f9fd 0%, #e8f3fb 25%, #d6eaf8 50%, #c4e0f5 100%)",
}

const OVERLAY_BG: React.CSSProperties = {
  background: "linear-gradient(to bottom, transparent 25%, rgba(1, 60, 110, 0.55) 50%, rgba(0, 40, 85, 0.92) 100%)",
}

export function Projects() {
  const sectionRef = useRef<HTMLElement>(null)

  // Dynamic ref array — works for any number of cards without hardcoding refs
  const cardEls = useRef<(HTMLDivElement | null)[]>(projects.map(() => null))
  // Stable RefObject-compatible wrappers for useMobileScrollLine
  const cardRefObjects = useMemo(
    () => projects.map((_, i) => ({
      get current() { return cardEls.current[i] }
    })),
    []
  )

  const headingVisible = useIntersectionOnce(sectionRef)
  const [isMobile, setIsMobile] = useState(false)
  const [cardVisible, setCardVisible] = useState<boolean[]>(Array(NUM_PROJECTS).fill(false))
  // Tracks when each card's observer fired — used to detect simultaneous triggers
  const cardTriggeredAt = useRef<(number | null)[]>(Array(NUM_PROJECTS).fill(null))

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // Per-card observers — on desktop only even-indexed cards trigger their row pair
  useEffect(() => {
    const observers = cardEls.current.map((el, i) => {
      if (!el) return null
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            cardTriggeredAt.current[i] = performance.now()
            setCardVisible(prev => { const next = [...prev]; next[i] = true; return next })
            observer.disconnect()
          }
        },
        { threshold: 0.05 }
      )
      observer.observe(el)
      return observer
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  const activeIdx = useMobileScrollLine(
    cardRefObjects as Parameters<typeof useMobileScrollLine>[0],
    isMobile
  )
  const fadeStyle = (delayMs: number) => revealStyle(headingVisible, "projectsFadeIn", delayMs, 400)

  function cardFadeStyle(idx: number): React.CSSProperties {
    if (isMobile) {
      // Mobile: single column — each card fades in independently (unchanged)
      if (!cardVisible[idx]) return { opacity: 0 }
      return { animation: `projectsFadeLeft 440ms ease-out 0ms both` }
    }

    // Desktop bento: a row's lead card triggers all cards in that row.
    const proj = projects[idx]
    const rowTriggerIdx = BENTO_ROW_TRIGGER[proj.bentoRow]
    if (!cardVisible[rowTriggerIdx]) return { opacity: 0 }

    const myTime = cardTriggeredAt.current[rowTriggerIdx] ?? 0

    // If a previous bento row fired within 120ms of this one, they were
    // simultaneous — add 400ms stagger per such prior row so they cascade.
    let stagger = 0
    for (let r = 0; r < proj.bentoRow; r++) {
      const t = cardTriggeredAt.current[BENTO_ROW_TRIGGER[r]]
      if (t !== null && t !== undefined && Math.abs(myTime - t) < 120) stagger += 400
    }

    return { animation: `${proj.anim} 440ms ease-out ${proj.delay + stagger}ms both` }
  }

  return (
    <SectionShell id="projects" maxWidth="6xl" className="min-h-screen" sectionRef={sectionRef}>
        {/* Heading */}
        <SectionHeading
          first="Here's what I've"
          second="worked on."
          className="mb-10"
          firstStyle={fadeStyle(200)}
          secondStyle={fadeStyle(500)}
        />

        {/* Mobile: 1-col stack (unchanged). Desktop: bento 6-col grid. */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-6 md:gap-x-5 md:gap-y-3 md:auto-rows-[240px]">
          {projects.map((project, idx) => {
            const primaryUrl = project.liveUrl || project.githubUrl
            const CardShell = primaryUrl ? "a" : "div"
            const isExternal = primaryUrl ? !primaryUrl.startsWith("/") : false
            const isCardActive = isMobile && activeIdx === idx
            // Short bento cards (row-span-1) get a compact overlay variant on desktop
            // since the full overlay (title + description + tags) overflows their height.
            // Mobile is unchanged — uses the full overlay regardless of bento sizing.
            const isShort = project.spanClass.includes("row-span-1")
            return (
              <div
                key={project.title}
                ref={el => { cardEls.current[idx] = el }}
                className={`group ${project.spanClass} md:flex md:flex-col md:h-full`}
                style={cardFadeStyle(idx)}
              >

                {/* Image card */}
                <CardShell
                  {...(primaryUrl
                    ? {
                        href: primaryUrl,
                        ...(isExternal
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {}),
                      }
                    : {})}
                  className="relative block aspect-[4/3] md:aspect-auto md:flex-1 md:min-h-0 overflow-hidden rounded-2xl"
                  style={CARD_BG}
                >
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 ease-out md:group-hover:scale-[1.03]"
                    style={isCardActive ? { transform: 'scale(1.03)', transition: 'transform 500ms ease-out' } : undefined}
                  />

                  {/* Overlay */}
                  <div
                    className="absolute inset-0 opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 ease-out"
                    style={isCardActive ? { ...OVERLAY_BG, opacity: 1 } : OVERLAY_BG}
                  />

                  {/* Overlay content — full variant (mobile + tall desktop cards).
                      Staggered: title slides up first → description fades next → tags last. */}
                  <div
                    className={`absolute inset-x-0 bottom-0 p-6 opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 ease-out${isShort ? " md:hidden" : ""}`}
                    style={isCardActive ? { opacity: 1 } : undefined}
                  >
                    <h3
                      className="font-serif text-xl font-medium text-white leading-snug translate-y-3 md:group-hover:translate-y-0 transition-transform duration-500 ease-out"
                      style={isCardActive ? { transform: 'translateY(0)' } : undefined}
                    >
                      {project.title}
                    </h3>
                    <p
                      className="mt-2 text-sm leading-relaxed text-white/75 opacity-0 translate-y-3 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-[opacity,translate] duration-500 ease-out delay-100"
                      style={isCardActive ? { opacity: 1, transform: 'translateY(0)' } : undefined}
                    >
                      {project.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.tags.map((tag, ti) => (
                        <span
                          key={tag}
                          className="inline-flex rounded-full border border-white/25 px-3 py-1 text-xs text-white/65 opacity-0 translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-[opacity,translate] duration-400 ease-out"
                          style={{
                            transitionDelay: `${200 + ti * 60}ms`,
                            ...(isCardActive ? { opacity: 1, transform: 'translateY(0)' } : {}),
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Compact overlay — short desktop bento cards only.
                      Title + 2-line clamped description + arrow. Title slides in first,
                      description fades after a small delay to feel layered, not dumped. */}
                  {isShort && (
                    <div
                      aria-hidden="true"
                      className="hidden md:block absolute inset-x-0 bottom-0 px-5 pb-4 pt-5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"
                    >
                      <h3
                        className="font-serif text-[16px] font-medium text-white leading-tight line-clamp-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out"
                      >
                        {project.title}
                      </h3>
                      <p
                        className="mt-1.5 text-[12.5px] leading-snug text-white/75 line-clamp-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-[opacity,translate] duration-500 ease-out delay-100"
                      >
                        {project.description}
                      </p>
                    </div>
                  )}
                </CardShell>

                {/* Below-card row */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {project.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground/60 hover:text-foreground transition-colors"
                        aria-label={`${project.title} on GitHub`}
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        {...(!project.liveUrl.startsWith("/")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="text-muted-foreground/60 hover:text-foreground transition-colors"
                        aria-label={`${project.title} live`}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

              </div>
            )
          })}
        </div>
    </SectionShell>
  )
}
