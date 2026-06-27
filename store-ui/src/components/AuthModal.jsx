import { useState, useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './AuthModal.module.css'

export default function AuthModal({ onClose, initialTab = 'login' }) {
  const { login, register } = useAuth()
  const [tab,   setTab]   = useState(initialTab)
  const [busy,  setBusy]  = useState(false)
  const [error, setError] = useState(null)

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '', showPwd: false })
  // Register form state — cleared each time tab switches to register
  const [regForm, setRegForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirm: '', showPwd: false, showConfirm: false
  })

  // Escape closes
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose, busy])

  function switchTab(t) {
    setTab(t)
    setError(null)
    // Reset the form we're switching TO so stale data doesn't persist
    if (t === 'register') setRegForm({ firstName:'', lastName:'', email:'', password:'', confirm:'', showPwd:false, showConfirm:false })
    if (t === 'login')    setLoginForm(f => ({ ...f, password: '', showPwd: false }))
  }

  // ── Login ────────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    if (!loginForm.email)    { setError('Please enter your email address'); return }
    if (!loginForm.password) { setError('Please enter your password'); return }
    setBusy(true); setError(null)
    try {
      await login(loginForm.email.trim(), loginForm.password)
      onClose()
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('Invalid user credentials') || msg.includes('invalid_grant')) {
        setError('The email or password is incorrect. Please try again.')
      } else if (msg.includes('ECONNREFUSED') || msg.includes('fetch')) {
        setError('Cannot reach the authentication server. Is Keycloak running?')
      } else {
        setError(msg || 'Sign in failed. Please try again.')
      }
    } finally { setBusy(false) }
  }

  // ── Register ─────────────────────────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault()
    const { firstName, lastName, email, password, confirm } = regForm
    // Field-level validation with specific messages
    if (!firstName.trim()) { setError('Please enter your first name'); return }
    if (!lastName.trim())  { setError('Please enter your last name');  return }
    if (!email.trim())     { setError('Please enter your email address'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address'); return
    }
    if (!password)           { setError('Please choose a password'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match — please re-enter'); return }

    setBusy(true); setError(null)
    try {
      await register(firstName.trim(), lastName.trim(), email.trim(), password)
      onClose()
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('already exists') || msg.includes('409') || msg.includes('User exists')) {
        setError('An account with this email already exists. Try signing in instead.')
      } else if (msg.includes('ECONNREFUSED') || msg.includes('fetch')) {
        setError('Cannot reach the authentication server. Is Keycloak running?')
      } else {
        setError(msg || 'Registration failed. Please try again.')
      }
    } finally { setBusy(false) }
  }

  function setL(f, v) { setLoginForm(p => ({...p, [f]: v})); setError(null) }
  function setR(f, v) { setRegForm(p => ({...p, [f]: v}));   setError(null) }

  return createPortal(
    <div className={styles.overlay} onClick={() => !busy && onClose()} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.logoMark}>T</div>
          <div>
            <div className={styles.headerTitle}>TechStore</div>
            <div className={styles.headerSub}>powered by Kafka</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} disabled={busy} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabs} role="tablist">
          <button role="tab" aria-selected={tab === 'login'}
            className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
            onClick={() => switchTab('login')}>Sign in</button>
          <button role="tab" aria-selected={tab === 'register'}
            className={`${styles.tab} ${tab === 'register' ? styles.tabActive : ''}`}
            onClick={() => switchTab('register')}>Create account</button>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>
          {error && (
            <div className={styles.error} role="alert">
              <ErrorIcon /> {error}
            </div>
          )}

          {/* Sign in */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className={styles.form} noValidate>
              <Field id="login-email" label="Email address" type="email"
                value={loginForm.email} onChange={v => setL('email', v)}
                placeholder="you@example.com" autoComplete="email" autoFocus />

              <PasswordField id="login-pwd" label="Password"
                value={loginForm.password} onChange={v => setL('password', v)}
                show={loginForm.showPwd} onToggle={() => setL('showPwd', !loginForm.showPwd)}
                placeholder="Your password" autoComplete="current-password" />

              <button className={styles.submitBtn} type="submit" disabled={busy}>
                {busy ? <LoadingSpinner /> : <>Sign in <ArrowIcon /></>}
              </button>

              <p className={styles.switchHint}>
                No account?{' '}
                <button type="button" className={styles.switchLink}
                  onClick={() => switchTab('register')}>
                  Create one for free
                </button>
              </p>
            </form>
          )}

          {/* Create account */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className={styles.form} noValidate>
              <div className={styles.row2}>
                <Field id="reg-first" label="First name" value={regForm.firstName}
                  onChange={v => setR('firstName', v)}
                  placeholder="First name" autoComplete="given-name" autoFocus />
                <Field id="reg-last" label="Last name" value={regForm.lastName}
                  onChange={v => setR('lastName', v)}
                  placeholder="Last name" autoComplete="family-name" />
              </div>

              <Field id="reg-email" label="Email address" type="email"
                value={regForm.email} onChange={v => setR('email', v)}
                placeholder="you@example.com" autoComplete="email" />

              <div className={styles.pwdGroup}>
                <PasswordField id="reg-pwd" label="Password"
                  value={regForm.password} onChange={v => setR('password', v)}
                  show={regForm.showPwd} onToggle={() => setR('showPwd', !regForm.showPwd)}
                  placeholder="Min. 8 characters" autoComplete="new-password" />
                {regForm.password && <PasswordStrength password={regForm.password} />}
              </div>

              <PasswordField id="reg-confirm" label="Confirm password"
                value={regForm.confirm} onChange={v => setR('confirm', v)}
                show={regForm.showConfirm} onToggle={() => setR('showConfirm', !regForm.showConfirm)}
                placeholder="Repeat your password" autoComplete="new-password"
                matchError={regForm.confirm && regForm.confirm !== regForm.password} />

              <button className={styles.submitBtn} type="submit" disabled={busy}>
                {busy ? <LoadingSpinner /> : <>Create account <ArrowIcon /></>}
              </button>

              <p className={styles.switchHint}>
                Already have an account?{' '}
                <button type="button" className={styles.switchLink}
                  onClick={() => switchTab('login')}>
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>

        <div className={styles.footer}>
          🔒 End-to-end secured · Powered by Keycloak
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Field components ────────────────────────────────────────────────────────

function Field({ id, label, value, onChange, type = 'text', placeholder, autoComplete, autoFocus }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <input
        id={id}
        className={styles.input}
        type={type} value={value} placeholder={placeholder}
        autoFocus={autoFocus} autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function PasswordField({ id, label, value, onChange, show, onToggle, placeholder, autoComplete, matchError }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <div className={`${styles.pwdWrap} ${matchError ? styles.pwdWrapError : ''}`}>
        <input
          id={id}
          className={`${styles.input} ${styles.pwdInput} ${matchError ? styles.inputError : ''}`}
          type={show ? 'text' : 'password'}
          value={value} placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
        />
        <button type="button" className={styles.eyeBtn} onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'} tabIndex={-1}>
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {matchError && <span className={styles.fieldHint} style={{color:'var(--red)'}}>Passwords don't match</span>}
    </div>
  )
}

// ── Password strength ────────────────────────────────────────────────────────

function PasswordStrength({ password }) {
  let score = 0
  if (password.length >= 8)            score++
  if (password.length >= 12)           score++
  if (/[A-Z]/.test(password))         score++
  if (/[0-9]/.test(password))         score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong']
  const colors = ['', '#ef4444', '#f59e0b', '#eab308', '#10b981', '#10b981']
  const hints  = [
    '',
    'Add uppercase letters, numbers or symbols',
    'Add numbers or symbols to strengthen it',
    'Getting better — try adding a symbol',
    'Strong password!',
    'Excellent password!'
  ]

  return (
    <div className={styles.strengthBlock}>
      <div className={styles.strengthBars}>
        {[1,2,3,4,5].map(i => (
          <div key={i} className={styles.strengthBar}
            style={{ background: i <= score ? colors[score] : 'var(--border2)',
                     transition: `background .3s ${i * 0.04}s` }} />
        ))}
      </div>
      <div className={styles.strengthRow}>
        <span className={styles.strengthLabel} style={{ color: colors[score] || 'var(--text-muted)' }}>
          {labels[score] || 'Enter a password'}
        </span>
        <span className={styles.strengthHint}>{hints[score]}</span>
      </div>
    </div>
  )
}

// ── Loading spinner ──────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <svg className={styles.spinner} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  )
}
function ErrorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0,marginTop:1}}>
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}
