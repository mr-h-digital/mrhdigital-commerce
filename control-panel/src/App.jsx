import { useState, useEffect, useRef } from 'react'
import styles from './App.module.css'

const POLL_MS    = 2500
const THEME_KEY  = 'cp_theme'

const GROUP_LABELS = {
  infrastructure: 'Infrastructure',
  backend:        'Microservices',
  frontend:       'Frontend UIs'
}

const STATUS_CONFIG = {
  stopped:  { label: 'Stopped',  color: '#6b7899', bg: 'rgba(107,120,153,.12)', dot: '#6b7899', pulse: false },
  starting: { label: 'Starting', color: '#fbbf24', bg: 'rgba(251,191,36,.12)',  dot: '#fbbf24', pulse: true  },
  running:  { label: 'Running',  color: '#22c55e', bg: 'rgba(34,197,94,.12)',   dot: '#22c55e', pulse: true  },
  stopping: { label: 'Stopping', color: '#f97316', bg: 'rgba(249,115,22,.12)',  dot: '#f97316', pulse: true  },
  error:    { label: 'Error',    color: '#ef4444', bg: 'rgba(239,68,68,.12)',   dot: '#ef4444', pulse: false },
}

export default function App() {
  const [services,    setServices]    = useState([])
  const [selected,    setSelected]    = useState(null)
  const [logs,        setLogs]        = useState([])
  const [globalBusy,  setGlobalBusy]  = useState(false)
  const [theme,       setTheme]       = useState(() => localStorage.getItem(THEME_KEY) ?? 'dark')
  const logEndRef = useRef(null)

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    fetchServices()
    const id = setInterval(fetchServices, POLL_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!selected) return
    fetchLogs(selected)
    const id = setInterval(() => fetchLogs(selected), 1500)
    return () => clearInterval(id)
  }, [selected])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  async function fetchServices() {
    try {
      const r = await fetch('/ctrl/services')
      if (r.ok) setServices(await r.json())
    } catch {}
  }

  async function fetchLogs(id) {
    try {
      const r = await fetch(`/ctrl/logs/${id}`)
      if (r.ok) setLogs(await r.json())
    } catch {}
  }

  async function startSvc(id, e) {
    e.stopPropagation()
    await fetch(`/ctrl/start/${id}`, { method: 'POST' })
    fetchServices()
    setSelected(id)
  }

  async function stopSvc(id, e) {
    e.stopPropagation()
    await fetch(`/ctrl/stop/${id}`, { method: 'POST' })
    fetchServices()
  }

  async function startAll() {
    setGlobalBusy(true)
    await fetch('/ctrl/start-all', { method: 'POST' })
    setGlobalBusy(false)
    fetchServices()
  }

  async function stopAll() {
    setGlobalBusy(true)
    await fetch('/ctrl/stop-all', { method: 'POST' })
    setGlobalBusy(false)
    fetchServices()
  }

  const groups      = Object.keys(GROUP_LABELS)
  const running     = services.filter(s => s.status === 'running').length
  const starting    = services.filter(s => s.status === 'starting' || s.status === 'stopping').length
  const stopped     = services.filter(s => s.status === 'stopped'  || s.status === 'error').length
  const selectedSvc = services.find(s => s.id === selected)

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⚡</span>
            <span>Kafka Control Panel</span>
          </div>
          <div className={styles.stats}>
            <Stat label="Running"  value={running}  color="#22c55e" />
            <Stat label="Starting" value={starting} color="#fbbf24" />
            <Stat label="Stopped"  value={stopped}  color="#6b7899" />
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.themeToggle}
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className={styles.btnStartAll} onClick={startAll} disabled={globalBusy}>
            {globalBusy ? '…' : '▶  Start All'}
          </button>
          <button className={styles.btnStopAll} onClick={stopAll} disabled={globalBusy}>
            {globalBusy ? '…' : '■  Stop All'}
          </button>
        </div>
      </header>

      <div className={styles.body}>
        {/* Service list */}
        <div className={styles.sidebar}>
          {groups.map(group => {
            const svcs = services.filter(s => s.group === group)
            if (!svcs.length) return null
            return (
              <div key={group} className={styles.group}>
                <div className={styles.groupLabel}>{GROUP_LABELS[group]}</div>
                {svcs.map(svc => (
                  <ServiceRow
                    key={svc.id}
                    svc={svc}
                    selected={selected === svc.id}
                    onClick={() => { setSelected(svc.id); setLogs([]) }}
                    onStart={startSvc}
                    onStop={stopSvc}
                  />
                ))}
              </div>
            )
          })}
        </div>

        {/* Log pane */}
        <div className={styles.logPane}>
          {!selected && (
            <div className={styles.logEmpty}>
              <div className={styles.logEmptyIcon}>📋</div>
              <div>Click a service to view its logs</div>
            </div>
          )}
          {selected && (
            <>
              <div className={styles.logHeader}>
                <div className={styles.logTitle}>
                  <span style={{ color: selectedSvc?.color }}>{selectedSvc?.icon}</span>
                  <span>{selectedSvc?.name}</span>
                  {selectedSvc?.healthUrl && (
                    <a className={styles.logLink} href={selectedSvc.healthUrl} target="_blank" rel="noreferrer">
                      :{selectedSvc.port} ↗
                    </a>
                  )}
                </div>
                <StatusBadge status={selectedSvc?.status} />
              </div>
              <div className={styles.logScroll}>
                {logs.length === 0 && (
                  <div className={styles.logLine} style={{ color: 'var(--muted)' }}>
                    No output yet…
                  </div>
                )}
                {logs.map((entry, i) => (
                  <LogLine key={i} line={entry.line} t={entry.t} />
                ))}
                <div ref={logEndRef} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer quick-links */}
      <footer className={styles.footer}>
        {[
          { label: 'Store UI',           url: 'http://localhost:5174' },
          { label: 'Keycloak Admin',     url: 'http://localhost:8180/admin' },
          { label: 'Kafka Training UI',  url: 'http://localhost:5173' },
          { label: 'Kafka UI',           url: 'http://localhost:8080' },
          { label: 'Training App API',   url: 'http://localhost:8081/api/orders/messages' },
          { label: 'Products API',       url: 'http://localhost:8082/api/products' },
          { label: 'Orders API',         url: 'http://localhost:8083/api/orders' },
          { label: 'Stock API',          url: 'http://localhost:8084/api/inventory/stock' },
          { label: 'Events API',         url: 'http://localhost:8086/api/events' },
          { label: 'Products DB',        url: 'http://localhost:8082/h2-console' },
          { label: 'Orders DB',          url: 'http://localhost:8083/h2-console' },
          { label: 'Inventory DB',       url: 'http://localhost:8084/h2-console' },
        ].map(l => (
          <a key={l.url} className={styles.footerLink} href={l.url} target="_blank" rel="noreferrer">
            {l.label} ↗
          </a>
        ))}
      </footer>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function Stat({ label, value, color }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statVal} style={{ color }}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.stopped
  return (
    <span className={styles.badge} style={{ background: cfg.bg, color: cfg.color }}>
      <span className={`${styles.dotSmall} ${cfg.pulse ? styles.dotPulse : ''}`}
            style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function ServiceRow({ svc, selected, onClick, onStart, onStop }) {
  const cfg       = STATUS_CONFIG[svc.status] || STATUS_CONFIG.stopped
  const isRunning  = svc.status === 'running'
  const isStarting = svc.status === 'starting'
  const isStopping = svc.status === 'stopping'
  const showStop   = isRunning || isStarting || isStopping

  return (
    <div
      className={`${styles.svcRow} ${selected ? styles.svcRowSelected : ''}`}
      style={selected ? { borderColor: svc.color + '66' } : {}}
      onClick={onClick}
    >
      <span className={styles.svcIcon}>{svc.icon}</span>
      <div className={styles.svcInfo}>
        <div className={styles.svcName}>{svc.name}</div>
        <div className={styles.svcDesc}>{svc.description}</div>
      </div>
      <div className={styles.svcRight}>
        <span className={`${styles.dotSmall} ${cfg.pulse ? styles.dotPulse : ''}`}
              style={{ background: cfg.dot }} />
        {showStop
          ? <button className={styles.btnStop} disabled={isStopping} onClick={e => onStop(svc.id, e)}>
              {isStopping ? '…' : 'Stop'}
            </button>
          : <button className={styles.btnStart} style={{ '--c': svc.color }} onClick={e => onStart(svc.id, e)}>
              Start
            </button>
        }
      </div>
    </div>
  )
}

function LogLine({ line, t }) {
  const time = new Date(t).toLocaleTimeString('en-ZA', { hour12: false })
  let color = 'var(--text)'
  if (/error|exception|failed|fail/i.test(line))                    color = '#f87171'
  else if (/warn/i.test(line))                                       color = '#fbbf24'
  else if (/started|ready|running|success|reserved|completed/i.test(line)) color = '#4ade80'
  else if (/^\[/.test(line))                                         color = 'var(--muted)'

  return (
    <div className={styles.logLine}>
      <span className={styles.logTime}>{time}</span>
      <span style={{ color }}>{line}</span>
    </div>
  )
}

/* ── Icons ──────────────────────────────────────────────────────────────── */
function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}
