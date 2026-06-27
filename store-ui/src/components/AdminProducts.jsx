import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './AdminProducts.module.css'


const CATEGORIES = ['Laptop','Mobile','Tablet','Audio','Monitor','Peripherals']
const EMOJIS     = ['💻','📱','📲','🎧','🖥️','🖱️','⌨️','🖨️','📷','🎮']
const EMPTY_FORM = { name:'', category:'Laptop', brand:'', description:'', price:'', imageEmoji:'💻', specs:'', badge:'', featured:false, tags:'' }

export default function AdminProducts() {
  const [products,  setProducts]  = useState([])
  const [stock,     setStock]     = useState({})
  const [loading,   setLoading]   = useState(true)
  const [editing,   setEditing]   = useState(null)   // product | 'new' | null
  const [search,    setSearch]    = useState('')
  const [toast,     setToast]     = useState(null)
  const [confirmDel, setConfirmDel] = useState(null) // { id, name } | null

  useEffect(() => {
    loadAll()
    const id = setInterval(loadAll, 10000)
    return () => clearInterval(id)
  }, [])

  async function loadAll() {
    try {
      const [prods, stk] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('http://localhost:8084/api/inventory/stock').then(r => r.json()).catch(() => ({}))
      ])
      setProducts(prods); setStock(stk)
    } catch {}
    setLoading(false)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleDelete(id, name) {
    setConfirmDel({ id, name })
  }

  async function confirmDelete() {
    const { id, name } = confirmDel
    setConfirmDel(null)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) { setProducts(prev => prev.filter(p => p.id !== id)); showToast(`"${name}" deleted`) }
      else showToast('Delete failed', 'error')
    } catch { showToast('Delete failed', 'error') }
  }

  async function handleStockUpdate(productId, qty) {
    try {
      const res = await fetch(`http://localhost:8084/api/inventory/stock/${productId}?quantity=${qty}`, { method: 'PUT' })
      if (res.ok) { setStock(prev => ({...prev, [productId]: qty})); showToast('Stock updated') }
      else showToast('Stock update failed', 'error')
    } catch { showToast('Stock update failed', 'error') }
  }

  const filtered = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.root}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <input className={styles.search} placeholder="Search products…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className={styles.clearSearch} onClick={() => setSearch('')}>✕</button>}
        </div>
        <button className={styles.addBtn} onClick={() => setEditing('new')}>
          + Add Product
        </button>
      </div>

      {/* Product table */}
      {loading && <div className={styles.loading}>Loading products…</div>}
      {!loading && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Category</th>
                <th scope="col">Price</th>
                <th scope="col">Stock</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const qty  = stock[p.id]
                const oos  = qty === 0
                const low  = qty > 0 && qty <= 3
                return (
                  <tr key={p.id} className={oos ? styles.rowOos : ''}>
                    <td>
                      <div className={styles.productCell}>
                        <span className={styles.emoji}>{p.imageEmoji}</span>
                        <div>
                          <div className={styles.productName}>{p.name}</div>
                          <div className={styles.productBrand}>{p.brand} · {p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.catChip}>{p.category}</span></td>
                    <td className={styles.price}>R {p.price?.toLocaleString('en-ZA',{minimumFractionDigits:2})}</td>
                    <td>
                      <StockCell qty={qty} productId={p.id} onUpdate={handleStockUpdate} />
                    </td>
                    <td>
                      {p.featured && <span className={styles.chip} style={{background:'rgba(99,102,241,.15)',color:'var(--accent)'}}>Featured</span>}
                      {p.badge && <span className={styles.chip} style={{background:'rgba(16,185,129,.12)',color:'var(--green)'}}>{p.badge}</span>}
                      {oos && <span className={styles.chip} style={{background:'var(--red-bg)',color:'var(--red)'}}>Out of stock</span>}
                      {low && !oos && <span className={styles.chip} style={{background:'var(--yellow-bg)',color:'var(--yellow)'}}>Low stock</span>}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.editBtn} onClick={() => setEditing(p)} title="Edit">✏</button>
                        <button className={styles.delBtn}  onClick={() => handleDelete(p.id, p.name)} title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className={styles.empty}>No products found</div>}
        </div>
      )}

      {/* Edit / Add modal */}
      {editing && (
        <ProductFormModal
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={p => {
            setEditing(null)
            if (editing === 'new') setProducts(prev => [...prev, p])
            else setProducts(prev => prev.map(x => x.id === p.id ? p : x))
            showToast(editing === 'new' ? `"${p.name}" added!` : `"${p.name}" updated`)
          }}
        />
      )}

      {/* In-page delete confirmation */}
      {confirmDel && createPortal(
        <div className={styles.confirmOverlay} onClick={() => setConfirmDel(null)}>
          <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmIcon}>🗑</div>
            <div className={styles.confirmTitle}>Delete product?</div>
            <div className={styles.confirmMsg}>
              "<strong>{confirmDel.name}</strong>" will be permanently removed from the catalog.
              This cannot be undone.
            </div>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setConfirmDel(null)}>Cancel</button>
              <button className={styles.confirmDel} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastOk}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ── Inline stock editor ───────────────────────────────────────────────────

function StockCell({ qty, productId, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [val,     setVal]     = useState(String(qty ?? 0))

  function commit() {
    const n = parseInt(val, 10)
    if (!isNaN(n) && n >= 0) onUpdate(productId, n)
    setEditing(false)
  }

  if (editing) return (
    <div className={styles.stockEdit}>
      <input className={styles.stockInput} type="number" min="0" value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        autoFocus />
    </div>
  )

  const color = qty === 0 ? 'var(--red)' : qty <= 3 ? 'var(--yellow)' : 'var(--green)'
  return (
    <button className={styles.stockBtn} onClick={() => { setVal(String(qty ?? 0)); setEditing(true) }}
      title="Click to edit stock">
      <span style={{ color, fontWeight:700 }}>{qty ?? '—'}</span>
      <span className={styles.stockPencil}>✏</span>
    </button>
  )
}

// ── Product form modal ────────────────────────────────────────────────────

function ProductFormModal({ product, onClose, onSaved }) {
  const isNew = !product
  const [form, setForm] = useState(isNew ? EMPTY_FORM : {
    name:        product.name        || '',
    category:    product.category    || 'Laptop',
    brand:       product.brand       || '',
    description: product.description || '',
    price:       String(product.price || ''),
    imageEmoji:  product.imageEmoji  || '💻',
    specs:       product.specs       || '',
    badge:       product.badge       || '',
    featured:    product.featured    || false,
    tags:        (product.tags || []).join(', '),
  })
  const [busy,  setBusy]  = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  function set(f, v) { setForm(p => ({...p, [f]: v})); setError(null) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim())  { setError('Name is required'); return }
    if (!form.brand.trim()) { setError('Brand is required'); return }
    const price = parseFloat(form.price)
    if (isNaN(price) || price <= 0) { setError('Valid price is required'); return }
    setBusy(true); setError(null)
    try {
      const body = {
        name:        form.name.trim(),
        category:    form.category,
        brand:       form.brand.trim(),
        description: form.description.trim(),
        price,
        imageEmoji:  form.imageEmoji,
        specs:       form.specs.trim(),
        badge:       form.badge.trim(),
        featured:    form.featured,
        tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
      }
      const url    = isNew ? '/api/products' : `/api/products/${product.id}`
      const method = isNew ? 'POST' : 'PUT'
      const res    = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(`${method} failed (${res.status})`)
      onSaved(await res.json())
    } catch (err) { setError(err.message || 'Save failed') }
    finally { setBusy(false) }
  }

  return createPortal(
    <div className={styles.overlay} onClick={() => !busy && onClose()}>
      <div className={styles.formModal} onClick={e => e.stopPropagation()}>
        <div className={styles.formHeader}>
          <span className={styles.formTitle}>{isNew ? '+ Add Product' : `Edit — ${product.name}`}</span>
          <button className={styles.formClose} onClick={onClose} disabled={busy}>✕</button>
        </div>
        {error && <div className={styles.formError}>⚠ {error}</div>}
        <form onSubmit={handleSubmit} className={styles.formBody} noValidate>
          <div className={styles.formGrid}>
            <F label="Product name *" value={form.name} onChange={v => set('name',v)} span2 />
            <div className={styles.fieldWrap}>
              <label className={styles.fl}>Category</label>
              <select className={styles.fi} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <F label="Brand *" value={form.brand} onChange={v => set('brand',v)} />
            <F label="Price (R) *" type="number" value={form.price} onChange={v => set('price',v)} />
            <F label="Specs" value={form.specs} onChange={v => set('specs',v)} span2 />
            <div className={styles.fieldWrap}>
              <label className={styles.fl}>Emoji</label>
              <select className={styles.fi} value={form.imageEmoji} onChange={e => set('imageEmoji', e.target.value)}>
                {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <F label="Badge (e.g. Best Seller)" value={form.badge} onChange={v => set('badge',v)} />
            <F label="Tags (comma-separated)" value={form.tags} onChange={v => set('tags',v)} span2 />
            <div className={styles.fieldWrap} style={{gridColumn:'span 2'}}>
              <label className={styles.fl}>Description</label>
              <textarea className={`${styles.fi} ${styles.ta}`} value={form.description}
                onChange={e => set('description', e.target.value)} rows={3} />
            </div>
            <div className={styles.fieldWrap}>
              <label className={styles.fl}>&nbsp;</label>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} />
                Featured product
              </label>
            </div>
          </div>
          <div className={styles.formFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={busy}>
              {busy ? 'Saving…' : isNew ? 'Add Product' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

function F({ label, value, onChange, type='text', span2 }) {
  return (
    <div className={styles.fieldWrap} style={span2 ? {gridColumn:'span 2'} : {}}>
      <label className={styles.fl}>{label}</label>
      <input className={styles.fi} type={type} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
