import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import AuthModal from './AuthModal.jsx'
import styles from './AuthButton.module.css'

export default function AuthButton() {
  const { profile, logout } = useAuth()
  const [modalTab, setModalTab] = useState(null)  // null | 'login' | 'register'
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Not logged in
  if (!profile) {
    return (
      <>
        <div className={styles.guestBtns}>
          <button className={styles.loginBtn}    onClick={() => setModalTab('login')}>
            Sign in
          </button>
          <button className={styles.registerBtn} onClick={() => setModalTab('register')}>
            Register
          </button>
        </div>
        {modalTab && <AuthModal initialTab={modalTab} onClose={() => setModalTab(null)} />}
      </>
    )
  }

  // Logged in — show avatar + dropdown
  const initials = [profile.firstName?.[0], profile.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || profile.email[0].toUpperCase()

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.avatarBtn} onClick={() => setMenuOpen(v => !v)} aria-label="Account">
        <div className={styles.avatar}>{initials}</div>
        {profile.isAdmin && <span className={styles.adminDot} title="Admin" />}
      </button>

      {menuOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>
            <div className={styles.dropAvatar}>{initials}</div>
            <div>
              <div className={styles.dropName}>{profile.name}</div>
              <div className={styles.dropEmail}>{profile.email}</div>
              {profile.isAdmin && <span className={styles.adminBadge}>Admin</span>}
            </div>
          </div>
          <div className={styles.dropDivider} />
          <button className={styles.dropItem}
            onClick={() => { setMenuOpen(false); logout() }}>
            <LogoutIcon /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function LogoutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}
