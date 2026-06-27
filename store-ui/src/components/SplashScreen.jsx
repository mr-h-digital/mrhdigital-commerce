import { useState, useEffect, useRef } from 'react'
import styles from './SplashScreen.module.css'

const TAGLINE   = 'Premium Tech, Powered by Kafka'
const PRODUCTS  = ['💻', '📱', '🎧', '🖥️', '📲', '🖱️']
const DURATION  = 5000   // ms before auto-dismiss
const SEEN_KEY  = 'techstore_splash_date'

function hasSeenToday() {
  try {
    const stored = localStorage.getItem(SEEN_KEY)
    if (!stored) return false
    // Show full splash again after midnight (new day)
    return stored === new Date().toDateString()
  } catch { return false }
}

export default function SplashScreen({ onDone }) {
  const [phase, setPhase]         = useState('enter')
  const [typed, setTyped]         = useState('')
  const [progress, setProgress]   = useState(0)
  const [returning, setReturning] = useState(false)
  const rafRef   = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (hasSeenToday()) {
      // Already seen today — show a brief 1.5s branded flash then enter
      setReturning(true)
      setTimeout(() => dismiss(), 1500)
      return
    }

    // Fresh visit — run the full sequence
    const typeDelay = 800   // start typing after logo animates in
    let typeTimer

    // Typewriter
    typeTimer = setTimeout(() => {
      let i = 0
      const interval = setInterval(() => {
        i++
        setTyped(TAGLINE.slice(0, i))
        if (i >= TAGLINE.length) clearInterval(interval)
      }, 48)
    }, typeDelay)

    // Progress bar
    startRef.current = performance.now()
    function tick(now) {
      const elapsed = now - startRef.current
      const pct = Math.min(100, (elapsed / DURATION) * 100)
      setProgress(pct)
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        dismiss()
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      clearTimeout(typeTimer)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  function dismiss() {
    try { localStorage.setItem(SEEN_KEY, new Date().toDateString()) } catch {}
    setPhase('exit')
    setTimeout(onDone, 550)
  }

  if (returning) {
    return (
      <div className={`${styles.splash} ${styles.splashReturning}`} aria-label="TechStore">
        <div className={styles.bg} />
        <div className={styles.center}>
          <div className={styles.logoWrap}>
            <div className={styles.logoRing} />
            <div className={styles.logoMark}>
              <span className={styles.logoLetter}>T</span>
            </div>
          </div>
          <div className={styles.brandName}>TechStore</div>
          <div className={styles.brandSub}>by Kafka</div>
        </div>
        <div className={styles.footer} aria-hidden="true">
          ⚡ Powered by Apache Kafka · Spring Boot · React
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${styles.splash} ${phase === 'exit' ? styles.splashExit : ''}`}
      role="dialog"
      aria-label="TechStore loading"
      aria-modal="true"
    >
      {/* Background — always the dramatic dark gradient */}
      <div className={styles.bg} />

      {/* Orbiting product icons */}
      <div className={styles.orbit} aria-hidden="true">
        {PRODUCTS.map((emoji, i) => (
          <span
            key={i}
            className={styles.orbitItem}
            style={{ '--i': i, '--total': PRODUCTS.length }}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* Central content */}
      <div className={styles.center}>
        {/* Logo mark */}
        <div className={styles.logoWrap}>
          <div className={styles.logoRing} />
          <div className={styles.logoRing2} />
          <div className={styles.logoMark}>
            <span className={styles.logoLetter}>T</span>
          </div>
        </div>

        {/* Brand name */}
        <div className={styles.brandName}>TechStore</div>
        <div className={styles.brandSub}>by Kafka</div>

        {/* Typewriter tagline */}
        <div className={styles.tagline}>
          {typed}
          <span className={styles.cursor} aria-hidden="true">|</span>
        </div>

        {/* Kafka pipeline badge strip */}
        <div className={styles.badges}>
          {['Event-Driven', 'Microservices', 'Saga Pattern', 'Circuit Breaker'].map(b => (
            <span key={b} className={styles.badge}>{b}</span>
          ))}
        </div>

        {/* Progress bar */}
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          <div className={styles.progressGlow} style={{ left: `${progress}%` }} />
        </div>

        {/* Skip / Enter button */}
        <button className={styles.enterBtn} onClick={dismiss}>
          Enter Store
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      {/* Bottom credit */}
      <div className={styles.footer} aria-hidden="true">
        ⚡ Powered by Apache Kafka · Spring Boot · React
      </div>
    </div>
  )
}
