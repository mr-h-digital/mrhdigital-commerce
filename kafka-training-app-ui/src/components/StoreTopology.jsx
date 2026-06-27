import { useState, useEffect, useCallback } from 'react'
import styles from './StoreTopology.module.css'

const POLL_MS = 3000

const SERVICES = [
  { name: 'product-service',      port: 8082, color: '#a78bfa', icon: '🛍️', role: 'REST + Flash Sales',        desc: 'Catalog, reviews, flash sales',     healthUrl: 'http://localhost:8082/actuator/health' },
  { name: 'order-service',        port: 8083, color: '#818cf8', icon: '📋', role: 'Producer + Consumer',        desc: 'Orders, cancellations, returns',    healthUrl: 'http://localhost:8083/actuator/health' },
  { name: 'inventory-service',    port: 8084, color: '#34d399', icon: '📦', role: 'Consumer + Producer',        desc: 'Stock reservation + Saga release',  healthUrl: 'http://localhost:8084/actuator/health' },
  { name: 'payment-service',      port: 8085, color: '#fbbf24', icon: '💳', role: 'Consumer + Circuit Breaker', desc: 'Payments with circuit breaker',     healthUrl: 'http://localhost:8085/actuator/health' },
  { name: 'notification-service', port: 8086, color: '#60a5fa', icon: '🔔', role: 'Consumer + API',             desc: 'Event hub, emails, analytics',      healthUrl: 'http://localhost:8086/actuator/health' },
  { name: 'dispatch-service',     port: 8087, color: '#f472b6', icon: '🚚', role: 'Consumer + Producer',        desc: 'Courier assignment + delivery sim', healthUrl: 'http://localhost:8087/actuator/health' },
]

const TOPIC_COLORS = {
  'order.created':          '#818cf8',
  'order.cancelled':        '#f87171',
  'order.dispatched':       '#f472b6',
  'order.delivered':        '#4ade80',
  'order.return.requested': '#fbbf24',
  'refund.issued':          '#34d399',
  'inventory.reserved':     '#34d399',
  'inventory.released':     '#fbbf24',
  'inventory.failed':       '#f87171',
  'payment.completed':      '#4ade80',
  'payment.failed':         '#f87171',
  'payment.dlq':            '#ef4444',
  'order.status.updated':   '#60a5fa',
}

const STATUS_COLORS = {
  SUCCESS: { bg: 'rgba(34,197,94,.12)', text: '#22c55e', border: 'rgba(34,197,94,.3)' },
  FAILURE: { bg: 'rgba(239,68,68,.12)', text: '#ef4444', border: 'rgba(239,68,68,.3)' },
  INFO:    { bg: 'rgba(99,102,241,.12)', text: '#818cf8', border: 'rgba(99,102,241,.3)' },
}

export default function StoreTopology({ onHealthChange }) {
  const [events, setEvents] = useState([])
  const [filter, setFilter] = useState('all')
  const [notificationOnline, setNotificationOnline] = useState(null)
  const [serviceHealth, setServiceHealth] = useState({})

  const checkHealth = useCallback(async () => {
    const results = await Promise.all(
      SERVICES.map(async svc => {
        try {
          const res = await fetch(svc.healthUrl, { signal: AbortSignal.timeout(2000) })
          const body = await res.json().catch(() => ({}))
          return { name: svc.name, up: res.ok && body.status === 'UP' }
        } catch {
          return { name: svc.name, up: false }
        }
      })
    )
    const map = {}
    results.forEach(r => { map[r.name] = r.up })
    setServiceHealth(map)
    const allUp = results.every(r => r.up)
    const anyUp = results.some(r => r.up)
    onHealthChange?.(anyUp ? (allUp ? true : 'partial') : false)
  }, [onHealthChange])

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8086/api/events', { signal: AbortSignal.timeout(2000) })
      if (!res.ok) throw new Error()
      setEvents(await res.json())
      setNotificationOnline(true)
    } catch {
      setNotificationOnline(false)
    }
  }, [])

  useEffect(() => {
    checkHealth()
    fetchEvents()
    const healthId = setInterval(checkHealth, POLL_MS)
    const eventsId = setInterval(fetchEvents, POLL_MS)
    return () => { clearInterval(healthId); clearInterval(eventsId) }
  }, [checkHealth, fetchEvents])

  async function handleClear() {
    await fetch('http://localhost:8086/api/events', { method: 'DELETE' })
    setEvents([])
  }

  const topics = ['all', ...new Set(events.map(e => e.topic))]
  const filtered = filter === 'all' ? events : events.filter(e => e.topic === filter)
  const counts = {
    total: events.length,
    success: events.filter(e => e.status === 'SUCCESS').length,
    failure: events.filter(e => e.status === 'FAILURE').length,
  }

  return (
    <div className={styles.root}>
      {/* Architecture overview */}
      <div className={styles.arch}>
        <h2 className={styles.archTitle}>Online Store — Event-Driven Architecture</h2>
        <div className={styles.services}>
          {SERVICES.map(s => {
            const up = serviceHealth[s.name]
            const statusColor = up === true ? '#22c55e' : up === false ? '#ef4444' : '#6b7899'
            const statusLabel = up === true ? 'Running' : up === false ? 'Offline' : '…'
            return (
              <div key={s.name} className={styles.service} style={{ borderColor: s.color + '55' }}>
                <div className={styles.serviceTopRow}>
                  <span className={styles.serviceIcon}>{s.icon}</span>
                  <span
                    className={styles.serviceStatus}
                    style={{ background: statusColor + '22', color: statusColor, borderColor: statusColor + '55' }}
                  >
                    <span className={styles.serviceDot} style={{ background: statusColor, boxShadow: up ? `0 0 5px ${statusColor}` : 'none' }} />
                    {statusLabel}
                  </span>
                </div>
                <span className={styles.serviceName}>{s.name}</span>
                <span className={styles.servicePort}>:{s.port}</span>
                <span className={styles.serviceRole} style={{ color: s.color }}>{s.role}</span>
                <span className={styles.serviceDesc}>{s.desc}</span>
              </div>
            )
          })}
        </div>

        <div className={styles.flow}>
          {[
            { from: 'order-service',     topic: 'order.created',          to: 'inventory-service + notification' },
            { from: 'order-service',     topic: 'order.cancelled',        to: 'notification-service' },
            { from: 'inventory-service', topic: 'inventory.reserved',     to: 'payment-service + order-service' },
            { from: 'inventory-service', topic: 'inventory.failed',       to: 'order-service + notification' },
            { from: 'order-service',     topic: 'inventory.released',     to: 'inventory-service (Saga ↩)' },
            { from: 'payment-service',   topic: 'payment.completed',      to: 'order-service + dispatch-service' },
            { from: 'payment-service',   topic: 'payment.failed',         to: 'order-service + notification' },
            { from: 'payment-service',   topic: 'payment.dlq',            to: 'notification-service (DLQ ⚠)' },
            { from: 'dispatch-service',  topic: 'order.dispatched',       to: 'order-service + notification' },
            { from: 'dispatch-service',  topic: 'order.delivered',        to: 'order-service + notification' },
            { from: 'order-service',     topic: 'order.return.requested', to: 'inventory-service + notification' },
            { from: 'order-service',     topic: 'refund.issued',          to: 'notification-service' },
            { from: 'order-service',     topic: 'order.status.updated',   to: 'notification-service' },
          ].map(f => (
            <div key={f.topic} className={styles.flowRow}>
              <span className={styles.flowFrom}>{f.from}</span>
              <span className={styles.flowArrow}>→</span>
              <span className={styles.flowTopic} style={{ background: (TOPIC_COLORS[f.topic] ?? '#818cf8') + '22', color: TOPIC_COLORS[f.topic] ?? '#818cf8', borderColor: (TOPIC_COLORS[f.topic] ?? '#818cf8') + '44' }}>
                {f.topic}
              </span>
              <span className={styles.flowArrow}>→</span>
              <span className={styles.flowTo}>{f.to}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live event feed */}
      <div className={styles.feed}>
        <div className={styles.feedHeader}>
          <div className={styles.feedTitle}>
            Live Event Stream
            <span className={`${styles.dot} ${notificationOnline ? styles.dotGreen : styles.dotRed}`} />
            <span className={styles.dotLabel}>{notificationOnline ? 'notification-service live' : 'notification-service offline'}</span>
          </div>
          <div className={styles.feedActions}>
            <div className={styles.stats}>
              <span className={styles.stat}>{counts.total} events</span>
              <span className={styles.statOk}>{counts.success} ok</span>
              <span className={styles.statErr}>{counts.failure} failed</span>
            </div>
            <button className={styles.clearBtn} onClick={handleClear}>Clear</button>
          </div>
        </div>

        <div className={styles.topicFilter}>
          {topics.map(t => (
            <button
              key={t}
              className={`${styles.topicBtn} ${filter === t ? styles.topicBtnActive : ''}`}
              onClick={() => setFilter(t)}
              style={filter === t && t !== 'all' ? { background: (TOPIC_COLORS[t] ?? '#818cf8') + '22', color: TOPIC_COLORS[t] ?? '#818cf8', borderColor: (TOPIC_COLORS[t] ?? '#818cf8') + '55' } : {}}
            >{t}</button>
          ))}
        </div>

        <div className={styles.events}>
          {filtered.length === 0 && (
            <div className={styles.empty}>
              {notificationOnline === false
                ? 'Cannot reach notification-service on port 8086. Start the backend services first.'
                : 'No events yet — place an order in the Store UI to see the flow.'}
            </div>
          )}
          {filtered.map(ev => {
            const c = STATUS_COLORS[ev.status] ?? STATUS_COLORS.INFO
            const topicColor = TOPIC_COLORS[ev.topic] ?? '#818cf8'
            return (
              <div key={ev.id} className={styles.event}>
                <div className={styles.eventLeft}>
                  <span className={styles.eventTopic} style={{ background: topicColor + '18', color: topicColor, borderColor: topicColor + '44' }}>
                    {ev.topic}
                  </span>
                  <div className={styles.eventBody}>
                    <span className={styles.eventSummary}>{ev.summary}</span>
                    <span className={styles.eventDetail}>{ev.detail}</span>
                  </div>
                </div>
                <div className={styles.eventRight}>
                  <span className={styles.eventStatus} style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                    {ev.status}
                  </span>
                  <span className={styles.eventTime}>
                    {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
