import { useState, useEffect, useRef, useCallback } from 'react'
import OrderForm from './components/OrderForm.jsx'
import MessageFeed from './components/MessageFeed.jsx'
import PartitionView from './components/PartitionView.jsx'
import TopologyDiagram from './components/TopologyDiagram.jsx'
import ConceptPanel from './components/ConceptPanel.jsx'
import StoreTopology from './components/StoreTopology.jsx'
import styles from './App.module.css'

const POLL_INTERVAL = 2000

export default function App() {
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [backendOnline, setBackendOnline] = useState(null)
  const [storeOnline, setStoreOnline] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'dark')
  const prevCountRef = useRef(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/orders/messages')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMessages(data)
      setBackendOnline(true)
    } catch {
      setBackendOnline(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'dashboard') return
    fetchMessages()
    const id = setInterval(fetchMessages, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchMessages, activeTab])

  useEffect(() => {
    prevCountRef.current = messages.length
  }, [messages])

  async function handleSendOrder(order) {
    setSending(true)
    setSendStatus(null)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      })
      const text = await res.text()
      setSendStatus({ ok: res.ok, msg: text })
      if (res.ok) setTimeout(fetchMessages, 300)
    } catch {
      setSendStatus({ ok: false, msg: 'Cannot reach backend — is Spring Boot running on port 8081?' })
    } finally {
      setSending(false)
    }
  }

  async function handleClear() {
    await fetch('/api/orders/messages', { method: 'DELETE' })
    setMessages([])
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'store', label: 'Online Store' },
    { id: 'concepts', label: 'Concepts' },
  ]

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <KafkaIcon />
            <span>Kafka Training</span>
          </div>
          <nav className={styles.nav}>
            {tabs.map(t => (
              <button
                key={t.id}
                className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t.id)}
              >{t.label}</button>
            ))}
          </nav>
          <div className={styles.rightControls}>
            <div className={styles.status}>
              {activeTab === 'store' ? (
                <>
                  <span className={`${styles.dot} ${storeOnline === true ? styles.dotGreen : storeOnline === 'partial' ? styles.dotYellow : storeOnline === false ? styles.dotRed : styles.dotGray}`} />
                  <span className={styles.statusLabel}>
                    {storeOnline === true ? 'All services online' : storeOnline === 'partial' ? 'Some services offline' : storeOnline === false ? 'Services offline' : 'Connecting…'}
                  </span>
                </>
              ) : (
                <>
                  <span className={`${styles.dot} ${backendOnline === true ? styles.dotGreen : backendOnline === false ? styles.dotRed : styles.dotGray}`} />
                  <span className={styles.statusLabel}>
                    {backendOnline === true ? 'Backend online' : backendOnline === false ? 'Backend offline' : 'Connecting…'}
                  </span>
                </>
              )}
            </div>
            <button
              className={styles.themeToggle}
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {activeTab === 'dashboard' && (
          <div className={styles.dashboard}>
            <div className={styles.leftCol}>
              <TopologyDiagram messageCount={messages.length} />
              <OrderForm onSend={handleSendOrder} sending={sending} status={sendStatus} />
            </div>
            <div className={styles.rightCol}>
              <PartitionView messages={messages} />
              <MessageFeed messages={messages} onClear={handleClear} />
            </div>
          </div>
        )}
        {activeTab === 'store' && <StoreTopology onHealthChange={setStoreOnline} />}
        {activeTab === 'concepts' && <ConceptPanel />}
      </main>
    </div>
  )
}

function KafkaIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="6" r="4" fill="var(--accent)" />
      <circle cx="5" cy="22" r="4" fill="var(--accent)" />
      <circle cx="23" cy="22" r="4" fill="var(--accent)" />
      <line x1="14" y1="10" x2="5" y2="18" stroke="var(--accent)" strokeWidth="1.5" opacity=".6"/>
      <line x1="14" y1="10" x2="23" y2="18" stroke="var(--accent)" strokeWidth="1.5" opacity=".6"/>
      <line x1="5" y1="18" x2="23" y2="18" stroke="var(--accent)" strokeWidth="1.5" opacity=".6"/>
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}
