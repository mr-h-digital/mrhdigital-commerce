import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import AdminProducts from './AdminProducts.jsx'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { profile } = useAuth()

  // All hooks must come before any conditional return — Rules of Hooks
  const [analytics, setAnalytics]     = useState(null)
  const [events, setEvents]           = useState([])
  const [emails, setEmails]           = useState([])
  const [cb, setCb]                   = useState(null)
  const [stock, setStock]             = useState({})
  const [products, setProducts]       = useState([])
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [dashTab, setDashTab]         = useState('analytics')

  useEffect(() => {
    async function load() {
      try {
        const [ana, evts, ems, cbState] = await Promise.all([
          fetch('http://localhost:8086/api/analytics').then(r => r.json()),
          fetch('http://localhost:8086/api/events').then(r => r.json()),
          fetch('http://localhost:8086/api/emails').then(r => r.json()),
          fetch('http://localhost:8086/api/circuit-breaker').then(r => r.json()).catch(() => null),
        ])
        setAnalytics(ana); setEvents(evts); setEmails([...ems]); setCb(cbState)
      } catch {}
      setLoading(false)
    }

    async function loadStock() {
      try {
        const [stk, prods] = await Promise.all([
          fetch('http://localhost:8084/api/inventory/stock').then(r => r.json()),
          fetch('http://localhost:8082/api/products').then(r => r.json()),
        ])
        setStock(stk)
        setProducts(prods)
      } catch {}
    }

    load()
    loadStock()
    const id1 = setInterval(load, 4000)
    const id2 = setInterval(loadStock, 5000)
    return () => { clearInterval(id1); clearInterval(id2) }
  }, [])

  async function handleReplayEvents() {
    try {
      const res = await fetch('http://localhost:8086/api/events/replay?count=5', { method: 'POST' })
      const result = await res.json()
      alert(result.message)
    } catch { alert('Replay failed — is notification-service running?') }
  }

  async function resetCircuitBreaker() {
    try {
      await fetch('http://localhost:8085/api/payment/circuit-breaker/reset', { method: 'POST' })
    } catch {}
  }

  // Guard after all hooks — safe to conditionally return here
  if (!profile?.isAdmin) {
    return (
      <div style={{ textAlign:'center', padding:'80px 20px' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <div style={{ fontSize:20, fontWeight:700 }}>Admin access required</div>
        <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:8 }}>
          This dashboard is only available to users with the ADMIN role.
        </div>
      </div>
    )
  }

  if (loading) return <div className={styles.loading}>Loading analytics…</div>
  if (!analytics) return (
    <div className={styles.offline}>
      <div className={styles.offlineIcon}>📊</div>
      <div className={styles.offlineTitle}>notification-service offline</div>
      <div className={styles.offlineSub}>Start all backend services to see the dashboard</div>
    </div>
  )

  const cbColor = !cb ? '#6b7899' : cb.state === 'CLOSED' ? '#10b981' : cb.state === 'OPEN' ? '#ef4444' : '#f59e0b'

  return (
    <div className={styles.root}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Store Dashboard</h1>
        <div className={styles.headerActions}>
          <span className={styles.live}><span className={styles.liveDot} /> Live</span>
          <button className={styles.replayBtn} onClick={handleReplayEvents}>⟳ Replay last 5 events</button>
        </div>
      </div>

      {/* Dashboard tabs */}
      <div className={styles.dashTabs}>
        <button className={`${styles.dashTab} ${dashTab === 'analytics' ? styles.dashTabActive : ''}`}
          onClick={() => setDashTab('analytics')}>📊 Analytics</button>
        <button className={`${styles.dashTab} ${dashTab === 'products'  ? styles.dashTabActive : ''}`}
          onClick={() => setDashTab('products')}>🛍 Products</button>
      </div>

      {dashTab === 'products' && <AdminProducts />}
      {dashTab === 'analytics' && <>

      {/* Circuit Breaker */}
      {cb && (
        <div className={styles.cbCard} style={{ borderColor: cbColor + '55' }}>
          <div className={styles.cbLeft}>
            <div className={styles.cbIcon} style={{ background: cbColor + '22', color: cbColor }}>⚡</div>
            <div>
              <div className={styles.cbTitle}>Payment Gateway — Circuit Breaker</div>
              <div className={styles.cbDetail}>
                State: <strong style={{color: cbColor}}>{cb.state}</strong>
                {cb.state !== 'CLOSED' && cb.openedAt && <> · Opened: {new Date(cb.openedAt).toLocaleTimeString('en-ZA')}</>}
                {' '}· Failures: {cb.consecutiveFailures}/{cb.failureThreshold}
                {cb.state !== 'CLOSED' && <> · Auto-recovers after {cb.recoveryTimeoutSeconds}s</>}
              </div>
              <div className={styles.cbExplain}>
                {cb.state === 'CLOSED' && '✅ Gateway healthy — processing payments normally'}
                {cb.state === 'OPEN'   && '🚫 Gateway tripped — rejecting payments fast-fail to protect downstream'}
                {cb.state === 'HALF_OPEN' && '🟡 Testing recovery — next payment will determine if gateway is healthy'}
              </div>
            </div>
          </div>
          {cb.state !== 'CLOSED' && (
            <button className={styles.cbReset} onClick={resetCircuitBreaker}>Manual reset</button>
          )}
        </div>
      )}

      {/* KPI cards */}
      <div className={styles.kpiGrid}>
        <KpiCard icon="📦" label="Total Orders"       value={analytics.totalOrders}   color="#6366f1" />
        <KpiCard icon="✅" label="Confirmed"           value={analytics.confirmed}     color="#10b981" />
        <KpiCard icon="🚚" label="Dispatched"          value={analytics.dispatched}    color="#f472b6" />
        <KpiCard icon="🏠" label="Delivered"           value={analytics.delivered}     color="#10b981" />
        <KpiCard icon="↩" label="Returned"             value={analytics.returned}      color="#f59e0b" />
        <KpiCard icon="❌" label="Failed / Cancelled"  value={Number(analytics.failed)+Number(analytics.cancelled)} color="#ef4444" />
        <KpiCard icon="⚠" label="DLQ Messages"        value={analytics.dlqMessages}   color="#f97316" />
        <KpiCard icon="📈" label="Success Rate"
          value={`${analytics.successRate}%`}
          color={analytics.successRate >= 80 ? '#10b981' : analytics.successRate >= 50 ? '#f59e0b' : '#ef4444'}
        />
      </div>

      {/* Stock levels */}
      {products.length > 0 && (
        <StockPanel products={products} stock={stock} />
      )}

      <div className={styles.cols}>
        {/* Recent events */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Recent Kafka Events</div>
          {events.length === 0 && <div className={styles.empty}>No events yet — place an order!</div>}
          {events.slice(0, 12).map(ev => (
            <div key={ev.id} className={`${styles.eventRow} ${styles[`ev_${ev.status}`]}`}>
              <div className={styles.evLeft}>
                <span className={styles.evTopic}>{ev.topic}</span>
                <div className={styles.evSummary}>{ev.summary}</div>
                <div className={styles.evDetail}>{ev.detail}</div>
              </div>
              <div className={`${styles.evBadge} ${styles[`badge_${ev.status}`]}`}>{ev.status}</div>
            </div>
          ))}
        </div>

        {/* Email previews */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Simulated Order Emails ({emails.length})</div>
          {emails.length === 0 && <div className={styles.empty}>Emails appear when orders are placed</div>}
          {emails.slice(0, 10).map(email => (
            <div key={email.orderId} className={styles.emailRow} onClick={() => setSelectedEmail(email)}>
              <div className={styles.emailIcon}>{getEmailIcon(email.status)}</div>
              <div className={styles.emailInfo}>
                <div className={styles.emailSubject}>Order {email.orderId} — {email.status}</div>
                <div className={styles.emailTo}>To: {email.customerEmail || '—'}</div>
              </div>
              <div className={`${styles.emailBadge} ${styles[`badge_${['CONFIRMED','DELIVERED','RETURNED'].includes(email.status) ? 'SUCCESS' : ['FAILED','CANCELLED'].includes(email.status) ? 'FAILURE' : 'INFO'}`]}`}>
                {email.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedEmail && <EmailPreviewModal email={selectedEmail} onClose={() => setSelectedEmail(null)} />}
      </>}
    </div>
  )
}

function StockPanel({ products, stock }) {
  const MAX_STOCK = 50 // visual scale ceiling

  // Sort: out of stock first, then low stock, then by product name
  const sorted = [...products].sort((a, b) => {
    const qa = stock[a.id] ?? 0
    const qb = stock[b.id] ?? 0
    if (qa === 0 && qb > 0) return -1
    if (qb === 0 && qa > 0) return 1
    if (qa <= 3 && qb > 3)  return -1
    if (qb <= 3 && qa > 3)  return 1
    return a.name.localeCompare(b.name)
  })

  const outOfStock = sorted.filter(p => (stock[p.id] ?? 0) === 0).length
  const lowStock   = sorted.filter(p => (stock[p.id] ?? 0) > 0 && (stock[p.id] ?? 0) <= 3).length
  const healthy    = sorted.length - outOfStock - lowStock

  return (
    <div className={styles.stockPanel}>
      <div className={styles.stockHeader}>
        <div className={styles.panelTitle} style={{marginBottom:0}}>Inventory Stock Levels</div>
        <div className={styles.stockSummary}>
          <span className={styles.stockSumItem} style={{color:'var(--red)'}}>
            ● {outOfStock} out of stock
          </span>
          <span className={styles.stockSumItem} style={{color:'var(--yellow)'}}>
            ● {lowStock} low stock
          </span>
          <span className={styles.stockSumItem} style={{color:'var(--green)'}}>
            ● {healthy} healthy
          </span>
        </div>
      </div>

      <div className={styles.stockGrid}>
        {sorted.map(product => {
          const qty  = stock[product.id] ?? '—'
          const num  = typeof qty === 'number' ? qty : 0
          const pct  = Math.min(100, (num / MAX_STOCK) * 100)
          const oos  = num === 0
          const low  = num > 0 && num <= 3
          const color = oos ? '#ef4444' : low ? '#f59e0b' : '#10b981'

          return (
            <div key={product.id} className={`${styles.stockRow} ${oos ? styles.stockRowOos : low ? styles.stockRowLow : ''}`}>
              <span className={styles.stockEmoji}>{product.imageEmoji}</span>
              <div className={styles.stockInfo}>
                <div className={styles.stockName}>{product.name}</div>
                <div className={styles.stockBarWrap}>
                  <div className={styles.stockBar}>
                    <div className={styles.stockBarFill} style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className={styles.stockQty} style={{ color }}>
                    {oos ? 'Out of stock' : `${qty} in stock`}
                  </span>
                </div>
              </div>
              <span className={styles.stockId}>{product.id}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, color }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiIcon} style={{ background: color + '22', color }}>{icon}</div>
      <div className={styles.kpiValue} style={{ color }}>{value}</div>
      <div className={styles.kpiLabel}>{label}</div>
    </div>
  )
}

function EmailPreviewModal({ email, onClose }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const isConfirmed = ['CONFIRMED','DISPATCHED','DELIVERED'].includes(email.status)
  const isFailed    = ['FAILED','CANCELLED'].includes(email.status)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.emailModal} onClick={e => e.stopPropagation()}>
        <button className={styles.emailClose} onClick={onClose}>✕</button>
        <div className={`${styles.emailHeader} ${isConfirmed ? styles.emailHeaderOk : isFailed ? styles.emailHeaderFail : styles.emailHeaderPending}`}>
          <div className={styles.emailHeaderIcon}>{getEmailIcon(email.status)}</div>
          <div className={styles.emailHeaderBrand}>TechStore</div>
          <div className={styles.emailHeaderSubject}>
            {isConfirmed ? 'Your order has been confirmed!' : isFailed ? 'Order update' : 'Your order is being processed'}
          </div>
        </div>
        <div className={styles.emailBody}>
          <p className={styles.emailGreeting}>Hi {email.customerName || 'Valued Customer'},</p>
          <p className={styles.emailIntro}>
            {isConfirmed
              ? `Great news! Order ${email.orderId} confirmed and will be dispatched shortly.`
              : isFailed
              ? `We're sorry — order ${email.orderId} could not be completed.`
              : `Order ${email.orderId} received and being processed.`}
          </p>
          {email.items?.length > 0 && (
            <div className={styles.emailItems}>
              <div className={styles.emailItemsTitle}>Items</div>
              {email.items.map((item,i) => (
                <div key={i} className={styles.emailItem}>
                  <span>{item.name} ×{item.qty}</span>
                  <span>R {item.lineTotal?.toLocaleString('en-ZA',{minimumFractionDigits:2})}</span>
                </div>
              ))}
              <div className={styles.emailDivider} />
              <div className={styles.emailItem}><span>Subtotal (excl. VAT)</span><span>R {email.subtotal?.toLocaleString('en-ZA',{minimumFractionDigits:2})}</span></div>
              <div className={styles.emailItem}><span>VAT (15%)</span><span>R {email.vat?.toLocaleString('en-ZA',{minimumFractionDigits:2})}</span></div>
              <div className={`${styles.emailItem} ${styles.emailTotal}`}><span>Total</span><span>R {email.total?.toLocaleString('en-ZA',{minimumFractionDigits:2})}</span></div>
            </div>
          )}
          {email.street && isConfirmed && (
            <div className={styles.emailAddress}>
              <div className={styles.emailAddressTitle}>📍 Delivery Address</div>
              <div>{email.street}, {email.suburb}, {email.city}, {email.postalCode}, {email.province}</div>
              {email.estimatedDelivery && <div className={styles.emailDelivery}>🚚 {email.estimatedDelivery}</div>}
            </div>
          )}
          <div className={styles.emailKafka}>
            <div className={styles.emailKafkaTitle}>⚡ Kafka Pipeline</div>
            <div className={styles.emailKafkaNote}>
              This notification was assembled from Kafka events flowing through order-service → inventory-service → payment-service → dispatch-service → notification-service. Each status change is a separate event on a separate topic.
            </div>
          </div>
          <div className={styles.emailFooter}>Simulated email for Kafka training purposes only.</div>
        </div>
      </div>
    </div>
  )
}

function getEmailIcon(s) {
  if (['CONFIRMED','DELIVERED','RETURNED'].includes(s)) return '✅'
  if (['FAILED','CANCELLED'].includes(s)) return '❌'
  if (s === 'DISPATCHED') return '🚚'
  return '📧'
}
