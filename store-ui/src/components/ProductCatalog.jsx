import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useCart } from '../context/CartContext.jsx'
import styles from './ProductCatalog.module.css'

function useCountdown(secondsRemaining) {
  const [secs, setSecs] = useState(secondsRemaining)
  // Only reset when the remaining time increases (new sale started), not on every poll
  const prevRef = useRef(secondsRemaining)
  useEffect(() => {
    if (secondsRemaining > prevRef.current + 5) {
      setSecs(secondsRemaining) // new sale started
    }
    prevRef.current = secondsRemaining
  }, [secondsRemaining])
  useEffect(() => {
    if (secs <= 0) return
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [secs > 0]) // only re-start if transitioned from 0 → positive
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return secs > 0 ? `${h > 0 ? h + 'h ' : ''}${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s` : null
}

const CATEGORIES  = ['All', 'Laptop', 'Mobile', 'Tablet', 'Audio', 'Monitor', 'Peripherals']
const PAGE_SIZE   = 8
const SORTS = [
  { value: 'default',    label: 'Featured' },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'name-asc',   label: 'Name A → Z' },
  { value: 'rating',     label: 'Top Rated' },
]

export default function ProductCatalog({ wishlist, onWishlistToggle }) {
  const [products, setProducts]   = useState([])
  const [stock, setStock]         = useState({})
  const [loading, setLoading]     = useState(true)
  const [category, setCategory]   = useState('All')
  const [search, setSearch]       = useState('')
  const [sort, setSort]           = useState('default')
  const [added, setAdded]         = useState(null)
  const [selected, setSelected]   = useState(null)
  const [related, setRelated]     = useState([])
  const [page, setPage]           = useState(1)
  const { addItem } = useCart()

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('http://localhost:8084/api/inventory/stock').then(r => r.json()).catch(() => ({}))
    ]).then(([prods, stk]) => {
      setProducts(prods); setStock(stk); setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) { setRelated([]); return }
    fetch(`/api/products/${selected.id}/related?limit=3`)
      .then(r => r.json()).then(setRelated).catch(() => setRelated([]))
  }, [selected])

  // Refresh stock every 10s
  useEffect(() => {
    const id = setInterval(() =>
      fetch('http://localhost:8084/api/inventory/stock').then(r => r.json()).then(setStock).catch(() => {}),
      10000)
    return () => clearInterval(id)
  }, [])

  function handleAdd(product, qty = 1) {
    for (let i = 0; i < qty; i++) addItem(product)
    setAdded(product.id)
    setTimeout(() => setAdded(null), 1400)
  }

  const featured = products.filter(p => p.featured)
  const spotlight = featured[0]

  const categoryCounts = useMemo(() => {
    const c = { All: products.length }
    CATEGORIES.slice(1).forEach(cat => { c[cat] = products.filter(p => p.category === cat).length })
    return c
  }, [products])

  const filtered = useMemo(() => {
    setPage(1) // reset to first page whenever filters change
    let list = products.filter(p => {
      const matchCat    = category === 'All' || p.category === category
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase()) ||
        (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
      return matchCat && matchSearch
    })
    switch (sort) {
      case 'price-asc':  return [...list].sort((a, b) => a.price - b.price)
      case 'price-desc': return [...list].sort((a, b) => b.price - a.price)
      case 'name-asc':   return [...list].sort((a, b) => a.name.localeCompare(b.name))
      case 'rating':     return [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0))
      default:           return [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    }
  }, [products, category, search, sort])

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      {/* Hero spotlight — featured product */}
      {!loading && spotlight && category === 'All' && !search && (
        <HeroSpotlight product={spotlight} stock={stock[spotlight.id]}
          onAdd={handleAdd} justAdded={added === spotlight.id}
          onDetail={() => setSelected(spotlight)}
          wishlisted={wishlist.includes(spotlight.id)}
          onWishlist={() => onWishlistToggle(spotlight.id)}
        />
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.categories}>
          {CATEGORIES.map(c => (
            <button key={c}
              className={`${styles.catBtn} ${category === c ? styles.catBtnActive : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
              {categoryCounts[c] > 0 && <span className={styles.catCount}>{categoryCounts[c]}</span>}
            </button>
          ))}
        </div>
        <div className={styles.toolbarRight}>
          <div className={styles.searchWrap}>
            <SearchIcon />
            <input className={styles.search} placeholder="Search products, brands, tags…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>}
          </div>
          <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value)}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div className={styles.grid}>
          {[...Array(8)].map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className={styles.empty}>
          {products.length === 0
            ? <><div className={styles.emptyIcon}>🔌</div>
                <div className={styles.emptyTitle}>product-service offline</div>
                <div className={styles.emptyMsg}>Start the backend services then refresh</div></>
            : <><div className={styles.emptyIcon}>🔍</div>
                <div className={styles.emptyTitle}>Nothing found for "{search}"</div>
                <button className={styles.emptyReset} onClick={() => { setSearch(''); setCategory('All') }}>
                  Clear filters
                </button></>
          }
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <div className={styles.resultsBar}>
            <span>
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              {totalPages > 1 && (
                <span className={styles.pageInfo}> — page {page} of {totalPages}</span>
              )}
            </span>
            {(search || category !== 'All') && (
              <button className={styles.clearAll} onClick={() => { setSearch(''); setCategory('All') }}>
                Clear all ✕
              </button>
            )}
          </div>

          <div className={styles.grid}>
            {paginated.map(product => (
              <ProductCard key={product.id} product={product}
                stockLevel={stock[product.id]}
                onAdd={handleAdd} justAdded={added === product.id}
                onDetail={() => setSelected(product)}
                wishlisted={wishlist.includes(product.id)}
                onWishlist={() => onWishlistToggle(product.id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPage={p => {
              setPage(p)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }} />
          )}
        </>
      )}

      {selected && (
        <ProductModal product={selected} stockLevel={stock[selected.id]}
          related={related} stock={stock}
          onClose={() => setSelected(null)}
          onAdd={(p, qty) => { handleAdd(p, qty); setSelected(null) }}
          justAdded={added === selected.id}
          wishlisted={wishlist.includes(selected.id)}
          onWishlist={() => onWishlistToggle(selected.id)}
          onRelatedClick={p => setSelected(p)}
        />
      )}
    </div>
  )
}

function HeroSpotlight({ product, stock, onAdd, justAdded, onDetail, wishlisted, onWishlist }) {
  const outOfStock = stock === 0
  return (
    <div className={styles.hero} onClick={onDetail}>
      <div className={styles.heroContent}>
        <div className={styles.heroLeft}>
          {product.badge && <span className={styles.heroBadge}>{product.badge}</span>}
          <div className={styles.heroCategory}>{product.category}</div>
          <h1 className={styles.heroTitle}>{product.name}</h1>
          <p className={styles.heroDesc}>{product.description.slice(0, 120)}…</p>
          <div className={styles.heroMeta}>
            <StarRating rating={product.rating} count={product.reviewCount} light />
            <span className={styles.heroSpecs}>{product.specs}</span>
          </div>
          <div className={styles.heroFooter}>
            <div className={styles.heroPrice}>
              <span className={styles.heroFrom}>from</span>
              R {product.price.toLocaleString('en-ZA', {minimumFractionDigits:2})}
            </div>
            <button className={`${styles.heroBtn} ${justAdded ? styles.heroBtnDone : ''}`}
              disabled={outOfStock}
              onClick={e => { e.stopPropagation(); !outOfStock && onAdd(product) }}>
              {outOfStock ? 'Out of stock' : justAdded ? '✓ Added to cart!' : 'Add to Cart →'}
            </button>
          </div>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.heroEmoji}>{product.imageEmoji}</div>
          <button className={`${styles.heroWishlist} ${wishlisted ? styles.heroWishlistActive : ''}`}
            onClick={e => { e.stopPropagation(); onWishlist() }}>
            {wishlisted ? '♥' : '♡'}
          </button>
        </div>
      </div>
      <div className={styles.heroTagline}>
        ⚡ Kafka-powered · 🔄 Event-driven · 🏗 Microservices · ↩ Saga pattern
      </div>
    </div>
  )
}

function ProductCard({ product, stockLevel, onAdd, justAdded, onDetail, wishlisted, onWishlist }) {
  const outOfStock = stockLevel !== undefined && stockLevel === 0
  const lowStock   = stockLevel !== undefined && stockLevel > 0 && stockLevel <= 3
  const onSale     = product.onSale && product.salePrice < product.price
  const countdown  = useCountdown(product.saleSecondsRemaining || 0)

  const effectivePrice = onSale ? product.salePrice : product.price

  return (
    <div className={`${styles.card} ${outOfStock ? styles.cardOos : ''} ${onSale ? styles.cardSale : ''}`} onClick={onDetail}>
      <div className={styles.cardImgWrap}>
        <div className={styles.cardEmoji}>{product.imageEmoji}</div>
        {onSale && <span className={`${styles.cardBadge} ${styles.cardBadgeSale}`}>🔥 -{product.discountPercent}%</span>}
        {!onSale && product.badge && <span className={styles.cardBadge}>{product.badge}</span>}
        {outOfStock && <span className={`${styles.cardBadge} ${styles.cardBadgeOos}`}>Out of stock</span>}
        {lowStock && !outOfStock && <span className={`${styles.cardBadge} ${styles.cardBadgeLow}`}>Only {stockLevel} left</span>}
        <button className={`${styles.wishBtn} ${wishlisted ? styles.wishBtnActive : ''}`}
          onClick={e => { e.stopPropagation(); onWishlist() }}>
          {wishlisted ? '♥' : '♡'}
        </button>
      </div>

      {onSale && countdown && (
        <div className={styles.saleBar}>
          <span className={styles.saleName}>{product.saleName}</span>
          <span className={styles.saleCountdown}>⏱ {countdown}</span>
        </div>
      )}

      <div className={styles.cardBody}>
        <div className={styles.cardBrand}>{product.brand}</div>
        <h3 className={styles.cardName}>{product.name}</h3>
        <div className={styles.cardSpecs}>{product.specs}</div>
        {product.rating > 0 && <StarRating rating={product.rating} count={product.reviewCount} />}
        {product.tags?.length > 0 && (
          <div className={styles.cardTags}>
            {product.tags.slice(0,3).map(t => <span key={t} className={styles.tag}>{t}</span>)}
          </div>
        )}
        {/* Always show stock count */}
        {stockLevel !== undefined && (
          <div className={`${styles.cardStock} ${outOfStock ? styles.cardStockOos : lowStock ? styles.cardStockLow : styles.cardStockOk}`}>
            {outOfStock
              ? '✗ Out of stock'
              : lowStock
              ? `⚠ Only ${stockLevel} left`
              : `✓ ${stockLevel} in stock`}
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.priceBlock}>
          {onSale && <div className={styles.originalPrice}>R {product.price.toLocaleString('en-ZA',{minimumFractionDigits:2})}</div>}
          <div className={`${styles.cardPrice} ${onSale ? styles.cardPriceSale : ''}`}>
            R {effectivePrice.toLocaleString('en-ZA', {minimumFractionDigits:2})}
          </div>
        </div>
        <button
          className={`${styles.addBtn} ${justAdded ? styles.addBtnDone : ''} ${outOfStock ? styles.addBtnOos : ''}`}
          disabled={outOfStock}
          onClick={e => { e.stopPropagation(); !outOfStock && onAdd(product) }}
        >
          {outOfStock ? 'Sold out' : justAdded ? '✓' : '+'}
        </button>
      </div>
    </div>
  )
}

function ProductModal({ product, stockLevel, related, stock, onClose, onAdd, justAdded, wishlisted, onWishlist, onRelatedClick }) {
  const [qty, setQty] = useState(1)
  const [reviews, setReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({ author:'', rating:5, comment:'' })
  const [submitting, setSubmitting] = useState(false)
  const outOfStock = stockLevel === 0
  const maxQty = stockLevel !== undefined ? Math.min(stockLevel, 10) : 10
  const onSale = product.onSale && product.salePrice < product.price
  const effectivePrice = onSale ? product.salePrice : product.price
  const countdown = useCountdown(product.saleSecondsRemaining || 0)

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    fetch(`/api/products/${product.id}/reviews`).then(r => r.json()).then(setReviews).catch(() => {})
    return () => window.removeEventListener('keydown', fn)
  }, [onClose, product.id])

  async function submitReview(e) {
    e.preventDefault()
    if (!reviewForm.author.trim() || !reviewForm.comment.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(reviewForm)
      })
      if (res.ok) {
        const newReview = await res.json()
        setReviews(prev => [newReview, ...prev])
        setReviewForm({ author:'', rating:5, comment:'' })
      }
    } catch {} finally { setSubmitting(false) }
  }

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>✕</button>

        <div className={styles.modalBody}>
          <div className={styles.modalLeft}>
            <div className={styles.modalEmojiWrap}>
              <div className={styles.modalEmoji}>{product.imageEmoji}</div>
              {product.badge && <span className={styles.modalBadge}>{product.badge}</span>}
            </div>
            {product.rating > 0 && (
              <div className={styles.modalRating}>
                <StarRating rating={product.rating} count={product.reviewCount} large />
              </div>
            )}
          </div>

          <div className={styles.modalRight}>
            <div className={styles.modalBrand}>{product.brand}</div>
            <h2 className={styles.modalName}>{product.name}</h2>
            <code className={styles.modalSpecs}>{product.specs}</code>
            <p className={styles.modalDesc}>{product.description}</p>

            {product.tags?.length > 0 && (
              <div className={styles.cardTags}>
                {product.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
              </div>
            )}

            <div className={styles.stockRow}>
              {stockLevel === undefined && <span className={styles.stockUnknown}>Stock: checking…</span>}
              {stockLevel !== undefined && stockLevel === 0 && <span className={styles.stockOos}>✗ Out of stock</span>}
              {stockLevel !== undefined && stockLevel > 0 && stockLevel <= 3 && <span className={styles.stockLow}>⚠ Only {stockLevel} in stock</span>}
              {stockLevel !== undefined && stockLevel > 3 && <span className={styles.stockOk}>✓ {stockLevel} in stock</span>}
              <button className={`${styles.wishBtnModal} ${wishlisted ? styles.wishBtnActive : ''}`} onClick={onWishlist}>
                {wishlisted ? '♥ Wishlisted' : '♡ Wishlist'}
              </button>
            </div>

            {onSale && countdown && (
              <div className={styles.modalSaleBanner}>
                🔥 <strong>{product.saleName}</strong> — {product.discountPercent}% off · Ends in <strong>{countdown}</strong>
              </div>
            )}

            <div className={styles.modalPriceRow}>
              <div>
                {onSale && <div className={styles.modalOriginalPrice}>R {product.price.toLocaleString('en-ZA',{minimumFractionDigits:2})}</div>}
                <div className={`${styles.modalPrice} ${onSale ? styles.modalPriceSale : ''}`}>
                  R {effectivePrice.toLocaleString('en-ZA', {minimumFractionDigits:2})}
                </div>
              </div>
              {!outOfStock && (
                <div className={styles.qtyControl}>
                  <button className={styles.qtyBtn} onClick={() => setQty(q => Math.max(1, q-1))}>−</button>
                  <span className={styles.qtyVal}>{qty}</span>
                  <button className={styles.qtyBtn} onClick={() => setQty(q => Math.min(maxQty, q+1))}>+</button>
                  <span className={styles.qtyTotal}>= R {(effectivePrice * qty).toLocaleString('en-ZA', {minimumFractionDigits:2})}</span>
                </div>
              )}
            </div>

            <button
              className={`${styles.modalAddBtn} ${justAdded ? styles.addBtnDone : ''} ${outOfStock ? styles.addBtnOos : ''}`}
              disabled={outOfStock}
              onClick={() => !outOfStock && onAdd(product, qty)}
            >
              {outOfStock ? 'Out of stock' : justAdded ? `✓ Added ${qty}× to cart!` : `Add ${qty}× to Cart — R ${(effectivePrice*qty).toLocaleString('en-ZA', {minimumFractionDigits:2})}`}
            </button>
          </div>
        </div>

        {related.length > 0 && (
          <div className={styles.relatedSection}>
            <div className={styles.relatedTitle}>You might also like</div>
            <div className={styles.relatedGrid}>
              {related.map(r => (
                <div key={r.id} className={styles.relatedCard} onClick={() => onRelatedClick(r)}>
                  <div className={styles.relatedEmoji}>{r.imageEmoji}</div>
                  <div className={styles.relatedName}>{r.name}</div>
                  <div className={styles.relatedPrice}>R {r.price.toLocaleString('en-ZA', {minimumFractionDigits:2})}</div>
                  {r.rating > 0 && <StarRating rating={r.rating} count={r.reviewCount} small />}
                  {stock[r.id] === 0 && <span className={styles.relatedOos}>Out of stock</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews section */}
        <div className={styles.reviewsSection}>
          <div className={styles.reviewsTitle}>Customer Reviews ({reviews.length})</div>
          <div className={styles.reviewsList}>
            {reviews.slice(0, 4).map(r => (
              <div key={r.id} className={styles.reviewItem}>
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewAuthor}>{r.author}</span>
                  <span className={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                  <span className={styles.reviewDate}>{new Date(r.createdAt).toLocaleDateString('en-ZA')}</span>
                </div>
                <p className={styles.reviewComment}>{r.comment}</p>
              </div>
            ))}
            {reviews.length === 0 && <p className={styles.reviewsEmpty}>No reviews yet — be the first!</p>}
          </div>
          <form className={styles.reviewForm} onSubmit={submitReview}>
            <div className={styles.reviewFormTitle}>Write a Review</div>
            <div className={styles.reviewFormRow}>
              <input className={styles.reviewInput} placeholder="Your name" value={reviewForm.author}
                onChange={e => setReviewForm(f => ({...f, author: e.target.value}))} required />
              <select className={styles.reviewInput} value={reviewForm.rating}
                onChange={e => setReviewForm(f => ({...f, rating: Number(e.target.value)}))}>
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} {'★'.repeat(n)}</option>)}
              </select>
            </div>
            <textarea className={`${styles.reviewInput} ${styles.reviewTextarea}`}
              placeholder="What did you think?" value={reviewForm.comment}
              onChange={e => setReviewForm(f => ({...f, comment: e.target.value}))} required />
            <button className={styles.reviewSubmit} type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  )
}

function Pagination({ page, totalPages, onPage }) {
  // Build page number list with ellipsis for large ranges
  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <div className={styles.pagination}>
      <button
        className={styles.pageBtn}
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ‹ Prev
      </button>

      {pages.map((p, i) =>
        p === '…'
          ? <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>…</span>
          : <button
              key={p}
              className={`${styles.pageNum} ${p === page ? styles.pageNumActive : ''}`}
              onClick={() => onPage(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
      )}

      <button
        className={styles.pageBtn}
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        Next ›
      </button>
    </div>
  )
}

function StarRating({ rating, count, light, large, small }) {
  const full  = Math.floor(rating)
  const half  = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <div className={`${styles.stars} ${light ? styles.starsLight : ''} ${large ? styles.starsLarge : ''} ${small ? styles.starsSmall : ''}`}>
      {'★'.repeat(full)}{'½'.repeat(half ? 1 : 0)}{'☆'.repeat(empty)}
      <span className={styles.ratingNum}>{rating}</span>
      {count !== undefined && <span className={styles.ratingCount}>({count.toLocaleString()})</span>}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  )
}
