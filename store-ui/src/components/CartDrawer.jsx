import { useEffect } from 'react'
import { useCart } from '../context/CartContext.jsx'
import styles from './CartDrawer.module.css'

export default function CartDrawer({ onClose, onCheckout }) {
  const { items, removeItem, updateQty, total, count } = useCart()

  // Close on Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={styles.overlay}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Cart {count > 0 && <span className={styles.countBadge}>{count}</span>}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        <div className={styles.items}>
          {items.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🛒</div>
              <div className={styles.emptyMsg}>Your cart is empty</div>
              <button className={styles.emptyBack} onClick={onClose}>Continue shopping</button>
            </div>
          )}
          {items.map(item => (
            <div key={item.id} className={styles.item}>
              <span className={styles.itemEmoji}>{item.imageEmoji}</span>
              <div className={styles.itemInfo}>
                <div className={styles.itemName}>{item.name}</div>
                <div className={styles.itemPriceRow}>
                  <span className={styles.itemUnit}>R {item.price.toLocaleString('en-ZA', {minimumFractionDigits: 2})} each</span>
                  <span className={styles.itemSubtotal}>R {(item.price * item.qty).toLocaleString('en-ZA', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
              <div className={styles.qtyRow}>
                <button className={styles.qtyBtn} onClick={() => updateQty(item.id, item.qty - 1)} aria-label="Decrease">−</button>
                <span className={styles.qty}>{item.qty}</span>
                <button className={styles.qtyBtn} onClick={() => updateQty(item.id, item.qty + 1)} aria-label="Increase">+</button>
              </div>
              <button className={styles.removeBtn} onClick={() => removeItem(item.id)} aria-label="Remove item">✕</button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>{count} item{count !== 1 ? 's' : ''}</span>
              <span className={styles.totalAmount}>R {total.toLocaleString('en-ZA', {minimumFractionDigits: 2})}</span>
            </div>
            <button className={styles.checkoutBtn} onClick={onCheckout}>
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
