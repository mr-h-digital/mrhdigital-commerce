import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './CheckoutModal.module.css'

const PROVINCES = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal',
                   'Limpopo','Mpumalanga','North West','Northern Cape','Western Cape']
const VAT_RATE = 0.15

export default function CheckoutModal({ onClose, onOrderPlaced }) {
  const { items, total: subtotal, clear } = useCart()
  const { profile, authFetch }            = useAuth()
  const vat   = Math.round(subtotal * VAT_RATE * 100) / 100
  const total = Math.round((subtotal + vat) * 100) / 100

  const [form, setForm] = useState({
    name:       profile?.name  ?? '',
    email:      profile?.email ?? '',
    street: '', suburb: '', city: '', postalCode: '', province: 'Gauteng',
    card: '4111 1111 1111 1111', expiry: '12/27', cvv: '123'
  })

  // Re-fill when profile loads (if modal opened before auth completed)
  useEffect(() => {
    if (profile) {
      setForm(f => ({
        ...f,
        name:  f.name  || profile.name  || '',
        email: f.email || profile.email || '',
      }))
    }
  }, [profile?.id])
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && !placing) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, placing])

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim())       errs.name       = 'Required'
    if (!form.email.trim())      errs.email      = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email'
    if (!form.street.trim())     errs.street     = 'Required'
    if (!form.suburb.trim())     errs.suburb     = 'Required'
    if (!form.city.trim())       errs.city       = 'Required'
    if (!form.postalCode.trim()) errs.postalCode = 'Required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setPlacing(true)
    setApiError(null)
    try {
      const orderItems = items.map(i => ({
        productId: i.id, productName: i.name,
        quantity: i.qty, unitPrice: i.price
      }))
      const body = {
        customerId:    profile?.id ?? form.email.split('@')[0],
        customerName:  form.name,
        customerEmail: form.email,
        items:         orderItems,
        street: form.street, suburb: form.suburb,
        city: form.city, postalCode: form.postalCode, province: form.province
      }
      // Use authenticated endpoint if logged in, else legacy endpoint
      const endpoint = profile ? '/api/orders/me' : '/api/orders'
      const res = await authFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error()
      const order = await res.json()
      clear()
      onOrderPlaced(order)
    } catch {
      setApiError('Cannot reach order-service. Make sure Spring Boot is running.')
    } finally {
      setPlacing(false)
    }
  }

  function handleBackdropClick() {
    if (placing) return
    if (form.name || form.email || form.street) {
      if (!window.confirm('Close checkout? Your form data will be lost.')) return
    }
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Checkout</h2>
          <button className={styles.closeBtn} onClick={handleBackdropClick} disabled={placing}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.left}>
            <form onSubmit={handleSubmit} className={styles.form} noValidate>

              <section className={styles.section}>
                <div className={styles.sectionTitle}>Contact</div>
                <Field label="Full Name" value={form.name} onChange={v => set('name', v)} error={errors.name} required />
                <Field label="Email" type="email" value={form.email} onChange={v => set('email', v)} error={errors.email} required />
              </section>

              <section className={styles.section}>
                <div className={styles.sectionTitle}>Delivery Address</div>
                <Field label="Street Address" value={form.street} onChange={v => set('street', v)} error={errors.street} required />
                <div className={styles.row2}>
                  <Field label="Suburb" value={form.suburb} onChange={v => set('suburb', v)} error={errors.suburb} required />
                  <Field label="City" value={form.city} onChange={v => set('city', v)} error={errors.city} required />
                </div>
                <div className={styles.row2}>
                  <Field label="Postal Code" value={form.postalCode} onChange={v => set('postalCode', v)} error={errors.postalCode} required />
                  <div className={styles.field}>
                    <label className={styles.label}>Province <span className={styles.req}>*</span></label>
                    <select className={styles.input} value={form.province} onChange={e => set('province', e.target.value)}>
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className={styles.deliveryNote}>
                  🚚 Estimated delivery: 3–5 business days
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionTitle}>Payment</div>
                <div className={styles.simBanner}>🔒 Simulated — no real card is charged</div>
                <Field label="Card Number" value={form.card} onChange={v => set('card', v)} />
                <div className={styles.row2}>
                  <Field label="Expiry" value={form.expiry} onChange={v => set('expiry', v)} />
                  <Field label="CVV" value={form.cvv} onChange={v => set('cvv', v)} />
                </div>
              </section>

              {apiError && <div className={styles.error}>⚠ {apiError}</div>}

              <button className={styles.placeBtn} type="submit" disabled={placing || items.length === 0}>
                {placing ? 'Placing order…' : `Place Order — R ${total.toLocaleString('en-ZA', {minimumFractionDigits:2})}`}
              </button>
            </form>
          </div>

          <div className={styles.right}>
            <div className={styles.summaryTitle}>Order Summary</div>
            {items.map(i => (
              <div key={i.id} className={styles.summaryRow}>
                <span>{i.imageEmoji} {i.name}{i.qty > 1 && <span className={styles.qty}> ×{i.qty}</span>}</span>
                <span>R {(i.price * i.qty).toLocaleString('en-ZA', {minimumFractionDigits:2})}</span>
              </div>
            ))}
            <div className={styles.summaryDivider} />
            <div className={styles.summaryLine}>
              <span>Subtotal (excl. VAT)</span>
              <span>R {subtotal.toLocaleString('en-ZA', {minimumFractionDigits:2})}</span>
            </div>
            <div className={styles.summaryLine}>
              <span>VAT (15%)</span>
              <span>R {vat.toLocaleString('en-ZA', {minimumFractionDigits:2})}</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryTotal}>
              <span>Total (incl. VAT)</span>
              <span>R {total.toLocaleString('en-ZA', {minimumFractionDigits:2})}</span>
            </div>

            <div className={styles.kafkaFlow}>
              <div className={styles.kafkaTitle}>What happens next</div>
              {[
                { n:1, icon:'📤', step:'order.created published to Kafka' },
                { n:2, icon:'📦', step:'Inventory checks & reserves stock' },
                { n:3, icon:'💳', step:'Payment processes the charge' },
                { n:4, icon:'✅', step:'Order confirmed & stock committed' },
                { n:5, icon:'↩️', step:'Payment failure? Stock auto-released (Saga)' },
              ].map(s => (
                <div key={s.n} className={styles.kafkaStep}>
                  <span className={styles.stepNum}>{s.n}</span>
                  <span>{s.icon}</span>
                  <span>{s.step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required, error }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}{required && <span className={styles.req}>*</span>}</label>
      <input
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
      />
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  )
}
