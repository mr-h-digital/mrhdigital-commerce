import { useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import AuthButton from './AuthButton.jsx'
import styles from './Header.module.css'

export default function Header({
  onCartClick, view, onViewChange,
  orderCount, wishlistCount,
  theme, onThemeToggle,
  bg, onBgChange, backgrounds = []
}) {
  const { count } = useCart()
  const { profile, login } = useAuth()
  const [bgPickerOpen, setBgPickerOpen] = useState(false)

  function handleDashboardClick() {
    if (profile) {
      onViewChange('dashboard')
    } else {
      login()
    }
  }

  return (
    <>
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <div className={styles.logo}
          onClick={() => onViewChange('shop')}
          role="button" tabIndex={0} aria-label="TechStore home"
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onViewChange('shop')}>
          <div className={styles.logoMark}><span>T</span></div>
          <div className={styles.logoText}>
            <span className={styles.logoName}>TechStore</span>
            <span className={styles.logoTag}>powered by Kafka</span>
          </div>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {[
            { id: 'shop',     label: 'Shop',      icon: '🛍' },
            { id: 'orders',   label: 'My Orders', icon: '📦', badge: orderCount },
            { id: 'wishlist', label: 'Wishlist',  icon: '♡',  badge: wishlistCount },
          ].map(item => (
            <button key={item.id}
              className={`${styles.navBtn} ${view === item.id ? styles.navBtnActive : ''}`}
              onClick={() => onViewChange(item.id)}>
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {item.badge > 0 && <span className={styles.navBadge}>{item.badge}</span>}
            </button>
          ))}

          {/* Dashboard / My Account — requires sign-in */}
          <button
            className={`${styles.navBtn} ${view === 'dashboard' ? styles.navBtnActive : ''} ${!profile ? styles.navBtnLocked : ''}`}
            onClick={handleDashboardClick}
            title={!profile ? 'Sign in to access your account' : profile.isAdmin ? 'Admin Dashboard' : 'My Account'}
          >
            <span className={styles.navIcon}>{profile?.isAdmin ? '📊' : '👤'}</span>
            <span className={styles.navLabel}>{profile?.isAdmin ? 'Dashboard' : 'My Account'}</span>
            {!profile && <LockIcon />}
          </button>
        </nav>

        {/* Actions */}
        <div className={styles.actions}>

          {/* Auth button — sign in / user avatar */}
          <AuthButton />

          {/* Background picker */}
          {backgrounds.length > 0 && (
            <div className={styles.bgPickerWrap}>
              <button
                className={`${styles.iconBtn} ${bgPickerOpen ? styles.iconBtnActive : ''}`}
                onClick={() => setBgPickerOpen(v => !v)}
                aria-label="Choose background"
                title="Background"
              >
                <SparkleIcon />
              </button>
              {bgPickerOpen && (
                <div className={styles.bgDropdown}>
                  <div className={styles.bgDropdownTitle}>Background</div>
                  {backgrounds.map(b => (
                    <button key={b.id}
                      className={`${styles.bgOption} ${bg === b.id ? styles.bgOptionActive : ''}`}
                      onClick={() => { onBgChange(b.id); setBgPickerOpen(false) }}>
                      <span className={styles.bgOptionIcon}>{b.icon}</span>
                      <span>{b.label}</span>
                      {bg === b.id && <span className={styles.bgOptionCheck}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Theme toggle */}
          <button className={styles.iconBtn} onClick={onThemeToggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Cart */}
          <button className={styles.cartBtn} onClick={onCartClick} aria-label={`Cart, ${count} items`}>
            <CartIcon />
            <span>Cart</span>
            {count > 0 && <span className={styles.cartCount}>{count}</span>}
          </button>
        </div>
      </div>
    </header>

    </>
  )
}

const CartIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
)
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)
const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginLeft:4,opacity:.6}}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
  </svg>
)
