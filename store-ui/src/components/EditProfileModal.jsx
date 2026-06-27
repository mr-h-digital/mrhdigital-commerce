import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './EditProfileModal.module.css'

export default function EditProfileModal({ onClose, onSaved }) {
  const { profile, updateProfile, changePassword } = useAuth()
  const [tab, setTab] = useState('profile') // 'profile' | 'password'

  // Profile form
  const [form, setForm] = useState({
    firstName: profile?.firstName || '',
    lastName:  profile?.lastName  || '',
    email:     profile?.email     || '',
  })
  // Password form
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' })
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false })

  const [busy,    setBusy]    = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose, busy])

  async function handleProfileSave(e) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) { setError('Name fields are required'); return }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Valid email required'); return }
    setBusy(true); setError(null); setSuccess(null)
    try {
      await updateProfile({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim() })
      setSuccess('Profile updated successfully!')
      onSaved?.()
      setTimeout(onClose, 1500)
    } catch (err) {
      setError(err.message || 'Update failed')
    } finally { setBusy(false) }
  }

  async function handlePasswordSave(e) {
    e.preventDefault()
    if (!pwdForm.current) { setError('Enter your current password'); return }
    if (pwdForm.next.length < 8) { setError('New password must be at least 8 characters'); return }
    if (pwdForm.next !== pwdForm.confirm) { setError('New passwords do not match'); return }
    setBusy(true); setError(null); setSuccess(null)
    try {
      await changePassword(pwdForm.current, pwdForm.next)
      setSuccess('Password changed successfully!')
      setPwdForm({ current: '', next: '', confirm: '' })
      setTimeout(onClose, 1500)
    } catch (err) {
      const msg = err.message || ''
      setError(msg.includes('Invalid user credentials') ? 'Current password is incorrect' : msg || 'Password change failed')
    } finally { setBusy(false) }
  }

  const set  = (f, v) => { setForm(p => ({...p, [f]: v}));    setError(null) }
  const setP = (f, v) => { setPwdForm(p => ({...p, [f]: v})); setError(null) }
  const toggleEye = f => setShowPwd(p => ({...p, [f]: !p[f]}))

  const initials = [profile?.firstName?.[0], profile?.lastName?.[0]].filter(Boolean).join('').toUpperCase()

  return createPortal(
    <div className={styles.overlay} onClick={() => !busy && onClose()}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>{initials}</div>
            <div>
              <div className={styles.headerTitle}>Edit Profile</div>
              <div className={styles.headerSub}>{profile?.email}</div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} disabled={busy}>
            <CloseIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'profile'  ? styles.tabActive : ''}`} onClick={() => { setTab('profile');  setError(null); setSuccess(null) }}>Profile</button>
          <button className={`${styles.tab} ${tab === 'password' ? styles.tabActive : ''}`} onClick={() => { setTab('password'); setError(null); setSuccess(null) }}>Password</button>
        </div>

        <div className={styles.body}>
          {error   && <div className={styles.error}  role="alert"><ErrorIcon />{error}</div>}
          {success && <div className={styles.success} role="status">✓ {success}</div>}

          {/* ── Profile tab ── */}
          {tab === 'profile' && (
            <form onSubmit={handleProfileSave} className={styles.form} noValidate>
              <div className={styles.row2}>
                <Field id="ep-first" label="First name" value={form.firstName} onChange={v => set('firstName', v)} autoFocus />
                <Field id="ep-last"  label="Last name"  value={form.lastName}  onChange={v => set('lastName', v)} />
              </div>
              <Field id="ep-email" label="Email address" type="email" value={form.email} onChange={v => set('email', v)} />
              <div className={styles.roleNote}>
                <LockIcon /> Role: <strong>{profile?.isAdmin ? 'Admin' : 'Customer'}</strong> — roles can only be changed by an administrator
              </div>
              <button className={styles.saveBtn} type="submit" disabled={busy}>
                {busy ? <Spinner /> : 'Save changes'}
              </button>
            </form>
          )}

          {/* ── Password tab ── */}
          {tab === 'password' && (
            <form onSubmit={handlePasswordSave} className={styles.form} noValidate>
              <PwdField id="ep-cur"  label="Current password"  value={pwdForm.current}  onChange={v => setP('current', v)}  show={showPwd.current}  onToggle={() => toggleEye('current')}  autoFocus />
              <PwdField id="ep-new"  label="New password"       value={pwdForm.next}     onChange={v => setP('next', v)}     show={showPwd.next}     onToggle={() => toggleEye('next')}     hint="Minimum 8 characters" />
              <PwdField id="ep-conf" label="Confirm new password" value={pwdForm.confirm} onChange={v => setP('confirm', v)} show={showPwd.confirm}  onToggle={() => toggleEye('confirm')} matchError={pwdForm.confirm && pwdForm.confirm !== pwdForm.next} />
              <button className={styles.saveBtn} type="submit" disabled={busy}>
                {busy ? <Spinner /> : 'Change password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function Field({ id, label, value, onChange, type = 'text', autoFocus }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <input id={id} className={styles.input} type={type} value={value}
        autoFocus={autoFocus} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function PwdField({ id, label, value, onChange, show, onToggle, autoFocus, hint, matchError }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <div className={`${styles.pwdWrap} ${matchError ? styles.pwdError : ''}`}>
        <input id={id} className={styles.input} type={show ? 'text' : 'password'}
          value={value} autoFocus={autoFocus} onChange={e => onChange(e.target.value)} />
        <button type="button" className={styles.eyeBtn} onClick={onToggle} tabIndex={-1}
          aria-label={show ? 'Hide' : 'Show'}>{show ? <EyeOffIcon /> : <EyeIcon />}</button>
      </div>
      {hint && !matchError && <span className={styles.hint}>{hint}</span>}
      {matchError && <span className={styles.hint} style={{color:'var(--red)'}}>Passwords don't match</span>}
    </div>
  )
}

function Spinner()   { return <svg className={styles.spinner} width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/></svg> }
function CloseIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function ErrorIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> }
function LockIcon()  { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginRight:5}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> }
function EyeIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
function EyeOffIcon(){ return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg> }
