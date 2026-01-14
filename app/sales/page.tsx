'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProducts } from '@/contexts/ProductContext'
import { useSales, CartItem, Sale } from '@/contexts/SalesContext'
import { useToast } from '@/contexts/ToastContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import Receipt from '@/components/Receipt'
import styles from './sales.module.css'

export default function SalesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <SalesContent />
      </Layout>
    </ProtectedRoute>
  )
}

function SalesContent() {
  const router = useRouter()
  const toast = useToast()
  const { products } = useProducts()
  const {
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    checkout,
  } = useSales()

  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash')
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product && product.stock > 0) {
      addToCart(product, 1)
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.info('Cart is empty')
      return
    }

    setIsProcessing(true)
    try {
      const sale = await checkout(customerName || undefined, paymentMethod)
      setCompletedSale(sale)
      setShowReceipt(true)
      setCustomerName('')
      setPaymentMethod('cash')
      toast.success('Sale completed')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error processing sale. Please try again.'
      toast.error(errorMessage)
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const cartTotal = getCartTotal()

  return (
    <div className={styles.sales}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>Sales</h1>
            <p className={styles.headerSubtitle}>Process new sales and transactions</p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.salesLayout}>
          {/* Products Section */}
          <div className={styles.productsSection}>
            <div className={styles.searchBar}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search products by name, SKU, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.productsGrid}>
              {filteredProducts.map((product) => {
                const cartItem = cart.find((item) => item.product.id === product.id)
                const isOutOfStock = product.stock === 0

                return (
                  <div
                    key={product.id}
                    className={`${styles.productCard} ${isOutOfStock ? styles.outOfStock : ''}`}
                  >
                    <div className={styles.productInfo}>
                      <h3 className={styles.productName}>{product.name}</h3>
                      <p className={styles.productSku}>{product.sku}</p>
                      <p className={styles.productCategory}>{product.category}</p>
                      <div className={styles.productPriceStock}>
                        <span className={styles.productPrice}>₱{product.price.toFixed(2)}</span>
                        <span className={`${styles.productStock} ${product.stock < 10 ? styles.lowStock : ''}`}>
                          Stock: {product.stock}
                        </span>
                      </div>
                    </div>
                    {cartItem ? (
                      <div className={styles.cartControls}>
                        <button
                          onClick={() => updateCartQuantity(product.id, cartItem.quantity - 1)}
                          className={styles.quantityButton}
                        >
                          -
                        </button>
                        <span className={styles.quantity}>{cartItem.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(product.id, cartItem.quantity + 1)}
                          className={styles.quantityButton}
                          disabled={product.stock <= cartItem.quantity}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        className={styles.addButton}
                        disabled={isOutOfStock}
                      >
                        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className={styles.emptyState}>
                <p>No products found. Try a different search term.</p>
              </div>
            )}
          </div>

          {/* Cart Section */}
          <div className={styles.cartSection}>
            <div className={styles.cartHeader}>
              <h2>Shopping Cart</h2>
              {cart.length > 0 && (
                <button onClick={clearCart} className={styles.clearButton}>
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className={styles.emptyCart}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11M5 11H19L20 21H4L5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>Your cart is empty</p>
                <p className={styles.emptyCartSubtext}>Add products to get started</p>
              </div>
            ) : (
              <>
                <div className={styles.cartItems}>
                  {cart.map((item: CartItem) => (
                    <div key={item.product.id} className={styles.cartItem}>
                      <div className={styles.cartItemInfo}>
                        <h4 className={styles.cartItemName}>{item.product.name}</h4>
                        <p className={styles.cartItemPrice}>₱{item.product.price.toFixed(2)} each</p>
                      </div>
                      <div className={styles.cartItemActions}>
                        <div className={styles.cartQuantityControls}>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className={styles.cartQuantityButton}
                          >
                            -
                          </button>
                          <span className={styles.cartQuantity}>{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className={styles.cartQuantityButton}
                            disabled={item.product.stock <= item.quantity}
                          >
                            +
                          </button>
                        </div>
                        <div className={styles.cartItemTotal}>
                          ₱{(item.product.price * item.quantity).toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className={styles.removeButton}
                          aria-label="Remove item"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 7.5H15M8.33333 10.8333V14.1667M11.6667 10.8333V14.1667M4.16667 7.5L4.99917 15.8333C4.99917 16.2754 5.17476 16.6993 5.48732 17.0118C5.79988 17.3244 6.22381 17.5 6.66584 17.5H13.3325C13.7745 17.5 14.1985 17.3244 14.511 17.0118C14.8236 16.6993 14.9992 16.2754 14.9992 15.8333L15.8333 7.5M7.5 7.5V5.83333C7.5 5.39131 7.67559 4.96738 7.98815 4.65482C8.30071 4.34226 8.72464 4.16667 9.16667 4.16667H10.8333C11.2754 4.16667 11.6993 4.34226 12.0118 4.65482C12.3244 4.96738 12.5 5.39131 12.5 5.83333V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.cartFooter}>
                  <div className={styles.cartTotal}>
                    <span className={styles.totalLabel}>Total:</span>
                    <span className={styles.totalAmount}>₱{cartTotal.toFixed(2)}</span>
                  </div>

                  <div className={styles.checkoutForm}>
                    <div className={styles.formGroup}>
                      <label htmlFor="customerName">Customer Name (Optional)</label>
                      <input
                        id="customerName"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Walk-in customer"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="paymentMethod">Payment Method</label>
                      <select
                        id="paymentMethod"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'other')}
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <button
                      onClick={handleCheckout}
                      className={styles.checkoutButton}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Complete Sale'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Receipt Modal */}
      {showReceipt && completedSale && (
        <div className={styles.receiptModalOverlay} onClick={() => setShowReceipt(false)}>
          <div className={styles.receiptModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.receiptModalHeader}>
              <h2 className={styles.receiptModalTitle}>Sale Completed!</h2>
              <button onClick={() => setShowReceipt(false)} className={styles.closeButton}>
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className={styles.receiptModalContent}>
              <Receipt sale={completedSale} onPrint={() => setShowReceipt(false)} />
              <div className={styles.receiptModalActions}>
                <button
                  onClick={() => {
                    setShowReceipt(false)
                    router.push('/dashboard')
                  }}
                  className={styles.doneButton}
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    setShowReceipt(false)
                    setCompletedSale(null)
                  }}
                  className={styles.newSaleButton}
                >
                  New Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

