import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import EditProfileModal from './EditProfileModal.jsx'
import styles from './MyAccount.module.css'

export default function MyAccount({ orders, onViewChange }) {
  const { profile, authFetch } = useAuth()
  const [stock,         setStock]         = useState({})
  const [products,      setProducts]      = useState([])
  const [editProfile,   setEditProfile]   = useState(false)

  useEffect(() => {
    async function loadStock() {
      try {
        const [stk, prods] = await Promise.all([
          fetch('http://localhost:8084/api/inventory/stock').then(r => r.json()),
          fetch('http://localhost:8082/api/products').then(r => r.json()),
        ])
        setStock(stk); setProducts(prods)
      } catch {}
    }
    loadStock()
    const id = setInterval(loadStock, 10000)
    return () => clearInterval(id)
  }, [])

  // Personal order stats
  const confirmed  = orders.filter(o => ['CONFIRMED','DISPATCHED','DELIVERED'].includes(o.status)).length
  const delivered  = orders.filter(o => o.status === 'DELIVERED').length
  const pending    = orders.filter(o => ['PENDING','INVENTORY_RESERVED'].includes(o.status)).length
  const failed     = orders.filter(o => ['FAILED','CANCELLED'].includes(o.status)).length
  const totalSpend = orders
    .filter(o => o.status !== 'CANCELLED' && o.status !== 'FAILED')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  const initials = [profile?.firstName?.[0], profile?.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || profile?.email?.[0]?.toUpperCase() || '?'

  // Stock: only show products relevant to user — all available and low-stock items
  const MAX_STOCK = 50
  const stockList = products
    .map(p => ({ ...p, qty: stock[p.id] ?? null }))
    .filter(p => p.qty !== null)
    .sort((a, b) => a.qty - b.qty) // lowest stock first

  const outOfStock = stockList.filter(p => p.qty === 0).length
  const lowStock   = stockList.filter(p => p.qty > 0 && p.qty <= 3).length

  return (
    <div className={styles.root}>
      {/* Profile header */}
      <div className={styles.profileCard}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.profileInfo}>
          <div className={styles.profileName}>{profile?.name}</div>
          <div className={styles.profileEmail}>{profile?.email}</div>
          <span className={styles.roleBadge}>
            {profile?.isAdmin ? '👑 Admin' : '👤 Customer'}
          </span>
        </div>
        <div className={styles.profileActions}>
          <button className={styles.editProfileBtn} onClick={() => setEditProfile(true)}>
            ✏ Edit Profile
          </button>
          <button className={styles.viewOrdersBtn} onClick={() => onViewChange('orders')}>
            View my orders →
          </button>
        </div>
      </div>

      {editProfile && (
        <EditProfileModal onClose={() => setEditProfile(false)} onSaved={() => setEditProfile(false)} />
      )}

      {/* Personal order KPIs */}
      <div className={styles.kpiGrid}>
        <StatCard icon="📦" label="Total Orders"   value={orders.length}           color="#6366f1" />
        <StatCard icon="✅" label="Confirmed"       value={confirmed}               color="#10b981" />
        <StatCard icon="🏠" label="Delivered"       value={delivered}               color="#10b981" />
        <StatCard icon="🕐" label="In Progress"     value={pending}                 color="#f59e0b" />
        <StatCard icon="❌" label="Failed/Cancelled" value={failed}                 color="#ef4444" />
        <StatCard icon="💰" label="Total Spend"
          value={`R ${totalSpend.toLocaleString('en-ZA', {minimumFractionDigits:2})}`}
          color="#8b5cf6" small />
      </div>

      {/* Recent orders summary */}
      {orders.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Recent Orders</div>
          <div className={styles.orderList}>
            {orders.slice(0, 5).map(order => {
              const isGood = ['CONFIRMED','DISPATCHED','DELIVERED'].includes(order.status)
              const isBad  = ['FAILED','CANCELLED'].includes(order.status)
              const color  = isGood ? '#10b981' : isBad ? '#ef4444' : '#f59e0b'
              return (
                <div key={order.orderId} className={styles.orderRow}>
                  <div className={styles.orderLeft}>
                    <span className={styles.orderId}>{order.orderId}</span>
                    <span className={styles.orderItems}>
                      {order.items?.map(i => `${i.productName} ×${i.quantity}`).join(', ')}
                    </span>
                  </div>
                  <div className={styles.orderRight}>
                    <span className={styles.orderStatus} style={{ color }}>
                      {order.status}
                    </span>
                    <span className={styles.orderTotal}>
                      R {order.totalAmount?.toLocaleString('en-ZA', {minimumFractionDigits:2})}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          {orders.length > 5 && (
            <button className={styles.moreBtn} onClick={() => onViewChange('orders')}>
              View all {orders.length} orders →
            </button>
          )}
        </div>
      )}

      {orders.length === 0 && (
        <div className={styles.noOrders}>
          <div className={styles.noOrdersIcon}>🛍️</div>
          <div className={styles.noOrdersTitle}>No orders yet</div>
          <p className={styles.noOrdersSub}>Start shopping to see your order history here</p>
          <button className={styles.shopBtn} onClick={() => onViewChange('shop')}>
            Browse products →
          </button>
        </div>
      )}

      {/* Stock availability — customer-relevant info */}
      {stockList.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Product Availability</div>
            <div className={styles.stockSummary}>
              {outOfStock > 0 && <span style={{color:'var(--red)'}}>● {outOfStock} out of stock</span>}
              {lowStock   > 0 && <span style={{color:'var(--yellow)'}}>● {lowStock} low stock</span>}
            </div>
          </div>
          <div className={styles.stockGrid}>
            {stockList.map(p => {
              const oos   = p.qty === 0
              const low   = p.qty > 0 && p.qty <= 3
              const color = oos ? '#ef4444' : low ? '#f59e0b' : '#10b981'
              const pct   = Math.min(100, (p.qty / MAX_STOCK) * 100)
              return (
                <div key={p.id} className={`${styles.stockRow} ${oos ? styles.oos : low ? styles.low : ''}`}>
                  <span className={styles.stockEmoji}>{p.imageEmoji}</span>
                  <div className={styles.stockInfo}>
                    <div className={styles.stockName}>{p.name}</div>
                    <div className={styles.stockBarWrap}>
                      <div className={styles.stockBar}>
                        <div className={styles.stockFill} style={{ width:`${pct}%`, background: color }} />
                      </div>
                      <span className={styles.stockQty} style={{ color }}>
                        {oos ? 'Out of stock' : `${p.qty} in stock`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color, small }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: color + '22', color }}>{icon}</div>
      <div className={`${styles.statValue} ${small ? styles.statValueSm : ''}`} style={{ color }}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}
