import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  function addItem(product) {
    // Use salePrice as the effective unit price when a sale is active
    const effectivePrice = product.onSale && product.salePrice < product.price
      ? product.salePrice
      : product.price
    const cartProduct = { ...product, price: effectivePrice, originalPrice: product.price }
    setItems(prev => {
      const existing = prev.find(i => i.id === cartProduct.id)
      if (existing) return prev.map(i => i.id === cartProduct.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...cartProduct, qty: 1 }]
    })
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateQty(id, qty) {
    if (qty < 1) { removeItem(id); return }
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  function clear() { setItems([]) }

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() { return useContext(CartContext) }
