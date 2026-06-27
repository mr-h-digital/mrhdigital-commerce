import { useState, useEffect } from 'react'
import { CartProvider } from './context/CartContext.jsx'
import { useAuth } from './context/AuthContext.jsx'
import Header from './components/Header.jsx'
import ProductCatalog from './components/ProductCatalog.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import CheckoutModal from './components/CheckoutModal.jsx'
import OrderTracker from './components/OrderTracker.jsx'
import Wishlist from './components/Wishlist.jsx'
import Dashboard from './components/Dashboard.jsx'
import AnimatedBackground, { BACKGROUNDS } from './components/AnimatedBackground.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import MyAccount from './components/MyAccount.jsx'
import styles from './App.module.css'

// localStorage keys — namespaced by userId when logged in, global when guest
const THEME_KEY    = 'techstore_theme'
const BG_KEY       = 'techstore_bg'

function ordersKey(userId)   { return userId ? `techstore_orders_${userId}`   : 'techstore_orders_guest' }
function wishlistKey(userId) { return userId ? `techstore_wishlist_${userId}` : 'techstore_wishlist_guest' }

export default function App() {
  const { profile, authFetch, loading: authLoading } = useAuth()
  const userId = profile?.id ?? null

  const [cartOpen,     setCartOpen]     = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [view,         setView]         = useState('shop')
  const [toast,        setToast]        = useState(null)
  const [splashDone,   setSplashDone]   = useState(false)

  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) ?? 'light')
  const [bg,    setBg]    = useState(() => localStorage.getItem(BG_KEY)    ?? 'orbs')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => { localStorage.setItem(BG_KEY, bg) }, [bg])

  // If user signs out while on Dashboard, redirect to Shop
  useEffect(() => {
    if (!profile && view === 'dashboard') {
      setView('shop')
    }
  }, [profile, view])

  // Orders — server-side when logged in, localStorage when guest
  const [trackedOrders, setTrackedOrders] = useState([])
  const [ordersLoaded,  setOrdersLoaded]  = useState(false)

  useEffect(() => {
    if (authLoading) return

    async function loadOrders() {
      if (userId) {
        // Authenticated — fetch from server
        try {
          const res = await authFetch('/api/orders/me')
          if (res.ok) {
            const serverOrders = await res.json()
            setTrackedOrders(serverOrders)
            setOrdersLoaded(true)
            return
          }
        } catch {}
      }
      // Guest or server unavailable — use localStorage
      try {
        const saved = JSON.parse(localStorage.getItem(ordersKey(userId)) || '[]')
        setTrackedOrders(saved)
      } catch { setTrackedOrders([]) }
      setOrdersLoaded(true)
    }

    loadOrders()
  }, [userId, authLoading])

  // Persist guest orders to localStorage (server handles authenticated user orders)
  useEffect(() => {
    if (!ordersLoaded || userId) return
    try { localStorage.setItem(ordersKey(null), JSON.stringify(trackedOrders)) } catch {}
  }, [trackedOrders, ordersLoaded, userId])

  // Wishlist — per-user in localStorage
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(wishlistKey(userId)) || '[]') } catch { return [] }
  })

  // Reload wishlist when user changes
  useEffect(() => {
    try { setWishlist(JSON.parse(localStorage.getItem(wishlistKey(userId)) || '[]')) } catch {}
  }, [userId])

  useEffect(() => {
    try { localStorage.setItem(wishlistKey(userId), JSON.stringify(wishlist)) } catch {}
  }, [wishlist, userId])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function handleOrderPlaced(order) {
    setTrackedOrders(prev => [order, ...prev])
    setCheckoutOpen(false)
    setCartOpen(false)
    setView('orders')
    showToast(`✓ Order ${order.orderId} placed! Kafka pipeline running…`)
  }

  function handleWishlistToggle(productId) {
    setWishlist(prev => {
      const next = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
      showToast(
        prev.includes(productId) ? 'Removed from wishlist' : '♥ Added to wishlist',
        prev.includes(productId) ? 'info' : 'success'
      )
      return next
    })
  }

  return (
    <CartProvider>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <AnimatedBackground theme={bg} />

      <div className={styles.root}>
        <Header
          onCartClick={() => setCartOpen(true)}
          view={view}
          onViewChange={setView}
          orderCount={trackedOrders.length}
          wishlistCount={wishlist.length}
          theme={theme}
          onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          bg={bg}
          onBgChange={setBg}
          backgrounds={BACKGROUNDS}
        />

        <main className={styles.main}>
          {view === 'shop' && (
            <ProductCatalog wishlist={wishlist} onWishlistToggle={handleWishlistToggle} />
          )}
          {view === 'orders' && (
            <OrderTracker
              orders={trackedOrders}
              onViewChange={setView}
              authenticated={!!userId}
              onOrdersReload={async () => {
                if (!userId) return
                try {
                  const res = await authFetch('/api/orders/me')
                  if (res.ok) setTrackedOrders(await res.json())
                } catch {}
              }}
            />
          )}
          {view === 'wishlist' && (
            <Wishlist
              wishlist={wishlist}
              onRemove={id => setWishlist(prev => prev.filter(x => x !== id))}
              onViewChange={setView}
            />
          )}
          {view === 'dashboard' && (
            profile?.isAdmin
              ? <Dashboard />
              : <MyAccount orders={trackedOrders} onViewChange={setView} />
          )}
        </main>

        {cartOpen && (
          <CartDrawer
            onClose={() => setCartOpen(false)}
            onCheckout={() => { setCartOpen(false); setCheckoutOpen(true) }}
          />
        )}
        {checkoutOpen && (
          <CheckoutModal
            onClose={() => setCheckoutOpen(false)}
            onOrderPlaced={handleOrderPlaced}
          />
        )}

        <div aria-live="polite" aria-atomic="true" className={styles.toastRegion}>
          {toast && (
            <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`} role="status">
              {toast.msg}
            </div>
          )}
        </div>
      </div>
    </CartProvider>
  )
}
