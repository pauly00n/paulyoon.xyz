export function HeroBackground() {
  return (
    <>
      {/* Base gradient */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(160deg, #f5f9fd 0%, #e8f3fb 25%, #d6eaf8 50%, #c4e0f5 70%, #d8ecf9 100%)",
        }}
      />

      {/* Noise overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/noise.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
          opacity: 0.10,
          mixBlendMode: "normal",
        }}
      />

      {/* Drifting radial bloom */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          style={{
            position: "absolute",
            inset: "-25%",
            background:
              "radial-gradient(ellipse 50% 50%, rgba(60, 160, 220, 0.52), transparent)",
            animation: "driftBloom 10s ease-in-out infinite",
          }}
        />
      </div>
    </>
  )
}
