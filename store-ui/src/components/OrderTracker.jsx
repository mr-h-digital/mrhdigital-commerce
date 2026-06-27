import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './OrderTracker.module.css'

const ALL_STEPS = ['PENDING','INVENTORY_RESERVED','CONFIRMED','DISPATCHED','DELIVERED']
const STATUS_LABELS = {
  PENDING:           'Order Placed',
  INVENTORY_RESERVED:'Stock Reserved',
  CONFIRMED:         'Confirmed',
  DISPATCHED:        'Dispatched',
  DELIVERED:         'Delivered',
  RETURN_REQUESTED:  'Return Requested',
  RETURNED:          'Returned & Refunded',
  FAILED:            'Failed',
  CANCELLED:         'Cancelled'
}
const STATUS_ICONS = {
  PENDING:'🕐', INVENTORY_RESERVED:'📦', CONFIRMED:'✅',
  DISPATCHED:'🚚', DELIVERED:'🏠', RETURN_REQUESTED:'↩',
  RETURNED:'💳', FAILED:'❌', CANCELLED:'🚫'
}
const TERMINAL = ['DELIVERED','RETURNED','FAILED','CANCELLED']
const STEP_COLORS = {
  PENDING:'#818cf8', INVENTORY_RESERVED:'#34d399', CONFIRMED:'#4ade80',
  DISPATCHED:'#f472b6', DELIVERED:'#10b981'
}

export default function OrderTracker({ orders, onViewChange, authenticated, onOrdersReload }) {
  const { authFetch, profile } = useAuth()
  const [liveOrders,  setLiveOrders]  = useState(orders)
  const [orderEvents, setOrderEvents] = useState({})
  const liveRef = useRef(liveOrders)
  liveRef.current = liveOrders

  useEffect(() => { setLiveOrders(orders) }, [orders])

  // Poll order status — use authFetch when logged in so the Bearer token is sent
  useEffect(() => {
    if (orders.length === 0) return
    const interval = setInterval(async () => {
      const current = liveRef.current
      if (current.every(o => TERMINAL.includes(o.status))) return
      const updated = await Promise.all(
        current.map(async o => {
          if (TERMINAL.includes(o.status)) return o
          try {
            const res = await authFetch(`/api/orders/${o.orderId}`)
            if (!res.ok) return o
            return await res.json()
          } catch { return o }
        })
      )
      setLiveOrders(updated)
    }, 2000)
    return () => clearInterval(interval)
  }, [orders.length, authFetch])

  // Poll Kafka event timeline — public endpoint, plain fetch is fine
  useEffect(() => {
    if (orders.length === 0) return
    async function fetchEvents() {
      const eventsMap = {}
      await Promise.all(liveRef.current.map(async o => {
        try {
          const res = await fetch(`http://localhost:8086/api/events/order/${o.orderId}`)
          if (res.ok) eventsMap[o.orderId] = await res.json()
        } catch {}
      }))
      setOrderEvents(prev => ({ ...prev, ...eventsMap }))
    }
    fetchEvents()
    const id = setInterval(fetchEvents, 3000)
    return () => clearInterval(id)
  }, [orders.length])

  async function handleCancel(orderId) {
    if (!window.confirm('Cancel this order?')) return
    try {
      // Use user-scoped endpoint when authenticated, legacy when guest
      const url = profile
        ? `/api/orders/me/${orderId}/cancel`
        : `/api/orders/${orderId}/cancel`
      const res = await authFetch(url, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Cancelled by customer' })
      })
      if (res.ok) {
        const updated = await res.json()
        setLiveOrders(prev => prev.map(o => o.orderId === orderId ? updated : o))
        // Reload full list from server if authenticated (ensures server state is reflected)
        onOrdersReload?.()
      }
    } catch {}
  }

  async function handleReturn(orderId) {
    if (!window.confirm('Request a return and refund for this order?')) return
    try {
      const url = profile
        ? `/api/orders/me/${orderId}/return`
        : `/api/orders/${orderId}/return`
      const res = await authFetch(url, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Customer return request' })
      })
      if (res.ok) {
        const updated = await res.json()
        setLiveOrders(prev => prev.map(o => o.orderId === orderId ? updated : o))
        onOrdersReload?.()
      }
    } catch {}
  }

  if (orders.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🛍️</div>
        <h2 className={styles.emptyTitle}>No orders yet</h2>
        <p className={styles.emptySub}>Place an order to see the full Kafka event chain in real-time</p>
        <button className={styles.shopBtn} onClick={() => onViewChange('shop')}>Start shopping →</button>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My Orders</h1>
        <span className={styles.pageCount}>{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
      </div>
      <div className={styles.orders}>
        {liveOrders.map(order => (
          <OrderCard key={order.orderId} order={order}
            events={orderEvents[order.orderId] || []}
            onCancel={handleCancel} onReturn={handleReturn}
          />
        ))}
      </div>
    </div>
  )
}

function OrderCard({ order, events, onCancel, onReturn }) {
  const [showTimeline, setShowTimeline] = useState(false)
  const isFailed    = order.status === 'FAILED'
  const isConfirmed = ['CONFIRMED','DISPATCHED','DELIVERED'].includes(order.status)
  const isCancelled = order.status === 'CANCELLED'
  const isDelivered = order.status === 'DELIVERED'
  const isReturned  = ['RETURN_REQUESTED','RETURNED'].includes(order.status)
  const isTerminal  = TERMINAL.includes(order.status)
  const canCancel   = ['PENDING','INVENTORY_RESERVED'].includes(order.status)
  const canReturn   = ['DELIVERED','CONFIRMED'].includes(order.status)

  const stepIndex = ALL_STEPS.indexOf(order.status)

  return (
    <div className={`${styles.card}
      ${isFailed ? styles.cardFailed : ''}
      ${isDelivered ? styles.cardDelivered : ''}
      ${isConfirmed && !isDelivered ? styles.cardConfirmed : ''}
      ${isCancelled ? styles.cardCancelled : ''}
      ${isReturned ? styles.cardReturned : ''}`}>

      <div className={styles.cardHeader}>
        <div>
          <div className={styles.orderId}>{order.orderId}</div>
          <div className={styles.orderMeta}>
            {order.customerEmail}
            {order.createdAt && <> · {new Date(order.createdAt).toLocaleString('en-ZA')}</>}
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={`${styles.statusBadge}
            ${isFailed    ? styles.statusBadgeFailed    : ''}
            ${isDelivered ? styles.statusBadgeDelivered : ''}
            ${isConfirmed && !isDelivered ? styles.statusBadgeOk : ''}
            ${isCancelled ? styles.statusBadgeCancelled : ''}
            ${isReturned  ? styles.statusBadgeReturned  : ''}
            ${!isTerminal && !isConfirmed ? styles.statusBadgePending : ''}`}>
            {STATUS_ICONS[order.status]} {STATUS_LABELS[order.status] ?? order.status}
          </div>
          <div className={styles.actions}>
            {canCancel && <button className={styles.cancelBtn} onClick={() => onCancel(order.orderId)}>Cancel</button>}
            {canReturn  && <button className={styles.returnBtn} onClick={() => onReturn(order.orderId)}>Return</button>}
          </div>
        </div>
      </div>

      {/* Progress stepper */}
      {!isFailed && !isCancelled && !isReturned && (
        <div className={styles.stepper}>
          {ALL_STEPS.map((step, i) => {
            const done    = i < stepIndex || (i === stepIndex && isTerminal)
            const current = i === stepIndex && !isTerminal
            const color   = STEP_COLORS[step] || '#818cf8'
            return (
              <div key={step} className={styles.stepWrap}>
                <div className={`${styles.step} ${done ? styles.stepDone : current ? styles.stepCurrent : styles.stepPending}`}>
                  <div className={styles.stepDot} style={done || current ? {color} : {}}>
                    {done ? '✓' : current ? '●' : '○'}
                  </div>
                  <div className={styles.stepLabel}>{STATUS_LABELS[step]}</div>
                </div>
                {i < ALL_STEPS.length - 1 && (
                  <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ''}`}
                    style={done ? {background: color} : {}} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Status banners */}
      {(isFailed || isCancelled) && (
        <div className={styles.failReason}>{STATUS_ICONS[order.status]} {order.statusMessage}</div>
      )}
      {isDelivered && (
        <div className={styles.deliveredBanner}>
          🏠 Delivered! Enjoy your purchase.
          {canReturn && <span className={styles.returnHint}> · Not happy? Use the Return button above.</span>}
        </div>
      )}
      {order.status === 'DISPATCHED' && (
        <div className={styles.dispatchBanner}>
          🚚 On the way via <strong>{order.courier}</strong> · Tracking: <code>{order.trackingNumber}</code>
        </div>
      )}
      {isReturned && (
        <div className={styles.returnBanner}>
          ↩ {order.statusMessage}
        </div>
      )}

      {/* Delivery address */}
      {order.street && (
        <div className={styles.address}>
          <span className={styles.addressLabel}>📍</span>
          {order.street}, {order.suburb}, {order.city}, {order.postalCode}, {order.province}
        </div>
      )}

      {/* Items */}
      <div className={styles.items}>
        {order.items?.map((item, i) => (
          <span key={i} className={styles.itemChip}>{item.productName} ×{item.quantity}</span>
        ))}
      </div>

      {/* VAT breakdown */}
      <div className={styles.pricing}>
        {order.subtotalAmount != null ? (
          <>
            <div className={styles.pricingRow}><span>Subtotal (excl. VAT)</span><span>R {order.subtotalAmount.toLocaleString('en-ZA',{minimumFractionDigits:2})}</span></div>
            <div className={styles.pricingRow}><span>VAT (15%)</span><span>R {order.vatAmount?.toLocaleString('en-ZA',{minimumFractionDigits:2})}</span></div>
            <div className={`${styles.pricingRow} ${styles.pricingTotal}`}><span>Total (incl. VAT)</span><span>R {order.totalAmount?.toLocaleString('en-ZA',{minimumFractionDigits:2})}</span></div>
          </>
        ) : (
          <div className={`${styles.pricingRow} ${styles.pricingTotal}`}><span>Total</span><span>R {order.totalAmount?.toLocaleString('en-ZA',{minimumFractionDigits:2})}</span></div>
        )}
      </div>

      {/* Kafka event timeline toggle */}
      <button className={styles.timelineToggle} onClick={() => setShowTimeline(s => !s)}>
        <span className={`${styles.kafkaDot} ${isTerminal ? styles.kafkaDotIdle : ''}`} />
        {showTimeline ? 'Hide' : 'Show'} Kafka event timeline ({events.length} events)
        <span className={styles.toggleArrow}>{showTimeline ? '▲' : '▼'}</span>
      </button>

      {showTimeline && <EventTimeline events={events} />}
    </div>
  )
}

function EventTimeline({ events }) {
  if (events.length === 0) return (
    <div className={styles.timelineEmpty}>No events yet — events appear as the pipeline processes your order</div>
  )
  return (
    <div className={styles.timeline}>
      {events.map((ev, i) => {
        const color = ev.status === 'SUCCESS' ? '#10b981' : ev.status === 'FAILURE' ? '#ef4444' : '#818cf8'
        return (
          <div key={ev.id || i} className={styles.timelineItem}>
            <div className={styles.timelineLine}>
              <div className={styles.timelineDot} style={{background: color, boxShadow: `0 0 6px ${color}`}} />
              {i < events.length - 1 && <div className={styles.timelineConnector} />}
            </div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineHeader}>
                <span className={styles.timelineTopic}>{ev.topic}</span>
                <span className={styles.timelineType}>{ev.eventType}</span>
                <span className={styles.timelineTime}>
                  {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString('en-ZA') : ''}
                </span>
              </div>
              <div className={styles.timelineSummary}>{ev.summary}</div>
              <div className={styles.timelineDetail}>{ev.detail}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
