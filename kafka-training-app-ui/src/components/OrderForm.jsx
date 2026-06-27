import { useState } from 'react'
import styles from './OrderForm.module.css'

const PRODUCTS = ['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard', 'Mouse', 'Headset']

function randomId() {
  return 'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

export default function OrderForm({ onSend, sending, status }) {
  const [form, setForm] = useState({
    orderId: randomId(),
    product: 'Laptop',
    quantity: 1,
    price: 999.99
  })

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSend({ ...form, quantity: Number(form.quantity), price: Number(form.price) })
    setForm(f => ({ ...f, orderId: randomId() }))
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Send Order to Kafka</h2>
      <p className={styles.subtitle}>
        Produces a message to the <code className={styles.code}>orders</code> topic.<br/>
        The key is <code className={styles.code}>orderId</code> — this determines the partition.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Order ID <span className={styles.hint}>(becomes the message key)</span></label>
          <input
            className={styles.input}
            value={form.orderId}
            onChange={e => set('orderId', e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Product</label>
          <select
            className={styles.input}
            value={form.product}
            onChange={e => set('product', e.target.value)}
          >
            {PRODUCTS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Quantity</label>
            <input
              className={styles.input} type="number" min="1" max="100"
              value={form.quantity}
              onChange={e => set('quantity', e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Price (R)</label>
            <input
              className={styles.input} type="number" step="0.01" min="0"
              value={form.price}
              onChange={e => set('price', e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.preview}>
          <span className={styles.previewLabel}>Message preview</span>
          <code className={styles.previewCode}>
            ORDER:{form.orderId}|{form.product}|{form.quantity}|{parseFloat(form.price).toFixed(2)}
          </code>
        </div>

        <button className={styles.btn} type="submit" disabled={sending}>
          {sending ? <><Spinner /> Sending…</> : '⬆  Produce Message'}
        </button>
      </form>

      {status && (
        <div className={`${styles.statusBar} ${status.ok ? styles.statusOk : styles.statusErr}`}>
          {status.ok ? '✓' : '✗'} {status.msg}
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return <span className="spin" style={{display:'inline-block', marginRight:6}}>◌</span>
}
