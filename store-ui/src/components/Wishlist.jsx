import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext.jsx'
import styles from './Wishlist.module.css'

export default function Wishlist({ wishlist, onRemove, onViewChange }) {
  const [products, setProducts] = useState([])
  const [stock, setStock] = useState({})
  const { addItem } = useCart()
  const [added, setAdded] = useState(null)

  useEffect(() => {
    if (wishlist.length === 0) return
    fetch('/api/products').then(r => r.json()).then(setProducts).catch(() => {})
    fetch('http://localhost:8084/api/inventory/stock').then(r => r.json()).then(setStock).catch(() => {})
  }, [wishlist])

  const wishlisted = products.filter(p => wishlist.includes(p.id))

  function handleAdd(product) {
    addItem(product)
    setAdded(product.id)
    setTimeout(() => setAdded(null), 1200)
  }

  if (wishlist.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>♡</div>
        <h2 className={styles.emptyTitle}>Your wishlist is empty</h2>
        <p className={styles.emptySub}>Heart any product to save it for later</p>
        <button className={styles.shopBtn} onClick={() => onViewChange('shop')}>Browse products →</button>
      </div>
    )
  }

  const totalValue = wishlisted.reduce((sum, p) => sum + p.price, 0)

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Wishlist</h1>
          <p className={styles.sub}>{wishlisted.length} item{wishlisted.length !== 1 ? 's' : ''} · Total value R {totalValue.toLocaleString('en-ZA', {minimumFractionDigits:2})}</p>
        </div>
      </div>

      <div className={styles.grid}>
        {wishlisted.map(product => {
          const oos = stock[product.id] === 0
          const low = stock[product.id] > 0 && stock[product.id] <= 3
          return (
            <div key={product.id} className={styles.card}>
              <button className={styles.remove} onClick={() => onRemove(product.id)} title="Remove">✕</button>
              <div className={styles.emoji}>{product.imageEmoji}</div>
              <div className={styles.brand}>{product.brand}</div>
              <div className={styles.name}>{product.name}</div>
              <div className={styles.specs}>{product.specs}</div>
              {oos && <div className={styles.oos}>Out of stock</div>}
              {low && <div className={styles.low}>Only {stock[product.id]} left!</div>}
              {product.onSale && product.salePrice < product.price && (
                <div className={styles.originalPrice}>R {product.price.toLocaleString('en-ZA', {minimumFractionDigits:2})}</div>
              )}
              <div className={styles.price} style={product.onSale ? {color:'var(--red)'} : {}}>
                R {(product.onSale && product.salePrice < product.price ? product.salePrice : product.price).toLocaleString('en-ZA', {minimumFractionDigits:2})}
              </div>
              <button
                className={`${styles.addBtn} ${added === product.id ? styles.addBtnDone : ''} ${oos ? styles.addBtnOos : ''}`}
                disabled={oos}
                onClick={() => handleAdd(product)}
              >
                {oos ? 'Out of stock' : added === product.id ? '✓ Added to cart!' : 'Add to Cart'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
