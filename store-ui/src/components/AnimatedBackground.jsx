import { useEffect, useRef } from 'react'
import styles from './AnimatedBackground.module.css'

export const BACKGROUNDS = [
  { id: 'orbs',      label: 'Floating Orbs',   icon: '🔮' },
  { id: 'wave',      label: 'Aurora Wave',      icon: '🌊' },
  { id: 'grid',      label: 'Retro Grid',       icon: '⊞'  },
  { id: 'particles', label: 'Particle Field',   icon: '✦'  },
  { id: 'video',     label: 'Geometric Video',  icon: '🎬' },
  { id: 'none',      label: 'None',             icon: '○'  },
]

export default function AnimatedBackground({ theme }) {
  useEffect(() => {
    const active = theme && theme !== 'none'
    document.body.classList.toggle('bg-active', active)
    return () => document.body.classList.remove('bg-active')
  }, [theme])

  if (!theme || theme === 'none') return null
  if (theme === 'orbs')      return <OrbsBackground />
  if (theme === 'wave')      return <WaveBackground />
  if (theme === 'grid')      return <GridBackground />
  if (theme === 'particles') return <ParticlesBackground />
  if (theme === 'video')     return <VideoBackground />
  return null
}

/* ─── 1. Floating Colour Orbs ─────────────────────────────────────────────── */
function OrbsBackground() {
  return (
    <div className={styles.orbs} aria-hidden="true">
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />
      <div className={`${styles.orb} ${styles.orb4}`} />
      <div className={`${styles.orb} ${styles.orb5}`} />
    </div>
  )
}

/* ─── 2. Aurora Wave — canvas sine-wave curtains ─────────────────────────── */
function WaveBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight
    let raf
    let t = 0

    // Each aurora band: y position, amplitude, wavelength, speed, colour stop list
    const BANDS = [
      {
        baseY: 0.15, amp: 0.06, freq: 1.4, speed: 0.4, thickness: 0.10,
        colors: isDark
          ? ['rgba(99,102,241,0)', 'rgba(99,102,241,0.7)', 'rgba(139,92,246,0.9)', 'rgba(99,102,241,0)']
          : ['rgba(99,102,241,0)', 'rgba(99,102,241,0.45)', 'rgba(139,92,246,0.6)', 'rgba(99,102,241,0)']
      },
      {
        baseY: 0.35, amp: 0.07, freq: 1.1, speed: 0.28, thickness: 0.09,
        colors: isDark
          ? ['rgba(167,139,250,0)', 'rgba(167,139,250,0.75)', 'rgba(236,72,153,0.85)', 'rgba(167,139,250,0)']
          : ['rgba(167,139,250,0)', 'rgba(167,139,250,0.50)', 'rgba(236,72,153,0.55)', 'rgba(167,139,250,0)']
      },
      {
        baseY: 0.55, amp: 0.08, freq: 0.9, speed: 0.35, thickness: 0.11,
        colors: isDark
          ? ['rgba(59,130,246,0)', 'rgba(59,130,246,0.65)', 'rgba(99,102,241,0.80)', 'rgba(59,130,246,0)']
          : ['rgba(59,130,246,0)', 'rgba(59,130,246,0.40)', 'rgba(99,102,241,0.50)', 'rgba(59,130,246,0)']
      },
      {
        baseY: 0.73, amp: 0.05, freq: 1.6, speed: 0.50, thickness: 0.08,
        colors: isDark
          ? ['rgba(236,72,153,0)', 'rgba(236,72,153,0.60)', 'rgba(167,139,250,0.80)', 'rgba(236,72,153,0)']
          : ['rgba(236,72,153,0)', 'rgba(236,72,153,0.38)', 'rgba(167,139,250,0.48)', 'rgba(236,72,153,0)']
      },
    ]

    function drawBand(band) {
      const centerY = band.baseY * H
      const amp     = band.amp * H
      const thick   = band.thickness * H
      const steps   = W + 2

      // Build the top and bottom wave paths
      const topPath    = []
      const bottomPath = []

      for (let x = 0; x <= steps; x++) {
        // Two sine waves added together = more organic shape
        const sine =
          Math.sin((x / W) * Math.PI * 2 * band.freq + t * band.speed) * amp +
          Math.sin((x / W) * Math.PI * 2 * band.freq * 1.7 + t * band.speed * 0.6) * amp * 0.4

        topPath.push({ x, y: centerY + sine - thick * 0.5 })
        bottomPath.push({ x, y: centerY + sine + thick * 0.5 })
      }

      // Draw filled shape between top and bottom wave
      ctx.beginPath()
      ctx.moveTo(topPath[0].x, topPath[0].y)
      for (let i = 1; i < topPath.length; i++) {
        ctx.lineTo(topPath[i].x, topPath[i].y)
      }
      for (let i = bottomPath.length - 1; i >= 0; i--) {
        ctx.lineTo(bottomPath[i].x, bottomPath[i].y)
      }
      ctx.closePath()

      // Vertical gradient for feathered edges (transparent → colour → transparent)
      const grad = ctx.createLinearGradient(0, centerY - thick, 0, centerY + thick)
      grad.addColorStop(0,    band.colors[0])
      grad.addColorStop(0.3,  band.colors[1])
      grad.addColorStop(0.7,  band.colors[2])
      grad.addColorStop(1,    band.colors[3])

      ctx.fillStyle = grad
      ctx.fill()
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)

      // Soft background glow
      const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.7)
      bgGrad.addColorStop(0, isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)')
      bgGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      BANDS.forEach(b => drawBand(b))
      t += 0.012
      raf = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])

  return (
    <div className={styles.wave} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.auroraCanvas} />
    </div>
  )
}

/* ─── 3. Retro Grid ───────────────────────────────────────────────────────── */
function GridBackground() {
  return (
    <div className={styles.grid} aria-hidden="true">
      <div className={styles.gridLines} />
      <div className={styles.gridGlow} />
      <div className={styles.gridTopFade} />
    </div>
  )
}

/* ─── 4. Particle Field ───────────────────────────────────────────────────── */
function ParticlesBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let raf
    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

    // Use multiple colours for richness
    const COLOURS = isDark
      ? ['rgba(129,140,248,1)', 'rgba(167,139,250,1)', 'rgba(236,72,153,1)', 'rgba(96,165,250,1)']
      : ['rgba(79,70,229,1)',   'rgba(124,58,237,1)',  'rgba(236,72,153,1)', 'rgba(59,130,246,1)']

    const PARTICLE_COUNT = 100
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:       Math.random() * W,
      y:       Math.random() * H,
      r:       Math.random() * 2.5 + 0.8,
      speed:   Math.random() * 0.5 + 0.15,
      opacity: Math.random() * 0.6 + 0.2,
      drift:   (Math.random() - 0.5) * 0.4,
      colour:  COLOURS[Math.floor(Math.random() * COLOURS.length)],
    }))

    function draw() {
      ctx.clearRect(0, 0, W, H)
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.colour
        ctx.globalAlpha = p.opacity
        ctx.fill()

        p.y -= p.speed
        p.x += p.drift
        p.opacity += (Math.random() - 0.5) * 0.012

        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W }
        if (p.x < -10)  p.x = W + 10
        if (p.x > W+10) p.x = -10
        p.opacity = Math.max(0.1, Math.min(isDark ? 0.85 : 0.65, p.opacity))
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [])

  return <canvas ref={canvasRef} className={styles.particles} aria-hidden="true" />
}

/* ─── 5. Video Background ─────────────────────────────────────────────────── */
// Uses the Pexels "Digital animation of geometric shapes" video (ID 8675548).
// File must exist at /videos/bg-geometric.mp4 in the public folder.
// Light mode: 25% opacity tint keeps the page readable.
// Dark mode:  45% opacity — video colours pop more on dark background.
function VideoBackground() {
  return (
    <div className={styles.videoBg} aria-hidden="true">
      <video
        className={styles.videoEl}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/videos/bg-geometric.mp4" type="video/mp4" />
      </video>
      {/* Colour tint overlay — lightens in light mode, darker in dark mode */}
      <div className={styles.videoTint} />
    </div>
  )
}
