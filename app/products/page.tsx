'use client'

import { useEffect, useMemo, useState } from 'react'
import { Product } from '@/contexts/ProductContext'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import { useProducts } from '@/contexts/ProductContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import styles from './products.module.css'
import { apiRequest } from '@/lib/api'
import { isLowStock } from '@/lib/stockAlerts'

type Pagination = { page: number; limit: number; total: number; totalPages: number }

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <ProductsContent />
      </Layout>
    </ProtectedRoute>
  )
}

function ProductsContent() {
  const toast = useToast()
  const { isAdmin } = useAuth()
  const { refreshProducts } = useProducts()
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [isFetching, setIsFetching] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [openMenuProductId, setOpenMenuProductId] = useState<string | null>(null)
  const [actionModal, setActionModal] = useState<null | 'restock' | 'adjust' | 'delete'>(null)
  const [actionProduct, setActionProduct] = useState<Product | null>(null)
  const [isActionSubmitting, setIsActionSubmitting] = useState(false)
  const [restockForm, setRestockForm] = useState({ quantity: '1', note: '' })
  const [adjustForm, setAdjustForm] = useState({ newStock: '', note: '' })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    category: '',
    sku: '',
  })

  const limit = 12

  const fetchProducts = async (targetPage: number) => {
    setIsFetching(true)
    try {
      const data = await apiRequest<{
        success: boolean
        products: Product[]
        pagination?: Pagination
      }>(`/api/products?page=${targetPage}&limit=${limit}`)

      if (data.success) {
        setProducts(data.products)
        setPagination(data.pagination || null)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load products')
    } finally {
      setIsFetching(false)
    }
  }

  const openRestockModal = (product: Product) => {
    if (!isAdmin) {
      toast.error('Forbidden: Admin access required.')
      return
    }
    setOpenMenuProductId(null)
    setActionProduct(product)
    setRestockForm({ quantity: '1', note: '' })
    setActionModal('restock')
  }

  const openAdjustModal = (product: Product) => {
    if (!isAdmin) {
      toast.error('Forbidden: Admin access required.')
      return
    }
    setOpenMenuProductId(null)
    setActionProduct(product)
    setAdjustForm({ newStock: String(product.stock), note: '' })
    setActionModal('adjust')
  }

  const openDeleteModal = (product: Product) => {
    if (!isAdmin) {
      toast.error('Forbidden: Admin access required.')
      return
    }
    setOpenMenuProductId(null)
    setActionProduct(product)
    setActionModal('delete')
  }

  const closeActionModal = () => {
    if (isActionSubmitting) return
    setActionModal(null)
    setActionProduct(null)
    setRestockForm({ quantity: '1', note: '' })
    setAdjustForm({ newStock: '', note: '' })
  }

  const submitRestock = async () => {
    if (!isAdmin) {
      toast.error('Forbidden: Admin access required.')
      return
    }
    if (!actionProduct) return

    const quantity = parseInt(restockForm.quantity, 10)
    if (isNaN(quantity) || quantity <= 0 || quantity > 999999) {
      toast.error('Invalid quantity')
      return
    }

    try {
      setIsActionSubmitting(true)
      await apiRequest<{ success: boolean; product: Product }>(`/api/products/${actionProduct.id}/restock`, {
        method: 'POST',
        body: JSON.stringify({ quantity, note: restockForm.note }),
      })

      toast.success('Restock recorded')
      closeActionModal()
      await fetchProducts(page)
      await refreshProducts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to restock')
    } finally {
      setIsActionSubmitting(false)
    }
  }

  const submitAdjust = async () => {
    if (!isAdmin) {
      toast.error('Forbidden: Admin access required.')
      return
    }
    if (!actionProduct) return

    const newStock = parseInt(adjustForm.newStock, 10)
    if (isNaN(newStock) || newStock < 0 || newStock > 999999) {
      toast.error('Invalid stock')
      return
    }
    if (!adjustForm.note.trim()) {
      toast.error('Reason is required')
      return
    }

    try {
      setIsActionSubmitting(true)
      await apiRequest<{ success: boolean; product: Product }>(`/api/products/${actionProduct.id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({ newStock, note: adjustForm.note }),
      })

      toast.success('Stock adjusted')
      closeActionModal()
      await fetchProducts(page)
      await refreshProducts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to adjust stock')
    } finally {
      setIsActionSubmitting(false)
    }
  }

  useEffect(() => {
    fetchProducts(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => {
    if (!openMenuProductId) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuProductId(null)
    }

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      const menuRoot = target.closest(`[data-menu-root="${openMenuProductId}"]`)
      if (!menuRoot) setOpenMenuProductId(null)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [openMenuProductId])

  const handleOpenModal = (product?: Product) => {
    if (!isAdmin) {
      toast.error('Forbidden: Admin access required.')
      return
    }
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        cost: product.cost !== undefined ? String(product.cost) : '',
        category: product.category,
        sku: product.sku,
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        cost: '',
        category: '',
        sku: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      cost: '',
      category: '',
      sku: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAdmin) {
      toast.error('Forbidden: Admin access required.')
      return
    }
    
    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      cost: formData.cost === '' ? 0 : parseFloat(formData.cost),
      category: formData.category,
      sku: formData.sku,
    }

    try {
      if (editingProduct) {
        await apiRequest<{ success: boolean; product: Product }>(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(productData),
        })
      } else {
        await apiRequest<{ success: boolean; product: Product }>('/api/products', {
          method: 'POST',
          body: JSON.stringify({ ...productData, stock: 0 }),
        })
      }
      handleCloseModal()
      toast.success(editingProduct ? 'Product updated' : 'Product created')
      await fetchProducts(page)
      await refreshProducts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      toast.error('Forbidden: Admin access required.')
      return
    }
    try {
      await apiRequest<{ success: boolean }>(`/api/products/${id}`, { method: 'DELETE' })
      toast.success('Product deleted')
      // If we deleted the last item on the page, go back a page when possible
      const remaining = products.length - 1
      const nextPage = remaining <= 0 && page > 1 ? page - 1 : page
      if (nextPage !== page) setPage(nextPage)
      else await fetchProducts(page)
      await refreshProducts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const pageLabel = useMemo(() => {
    if (!pagination) return `Page ${page}`
    return `Page ${pagination.page} of ${pagination.totalPages}`
  }, [page, pagination])

  return (
    <div className={styles.products}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>Products</h1>
            <p className={styles.headerSubtitle}>Manage your product inventory</p>
          </div>
          {isAdmin && (
            <button onClick={() => handleOpenModal()} className={styles.addButton}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Add Product
            </button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {isFetching ? (
          <div className={styles.emptyState}>
            <p>Loading products...</p>
          </div>
        ) : (
          <>
            <div className={styles.productsGrid}>
              {products.map((product) => (
                <div key={product.id} className={styles.productCard}>
                  <div className={styles.productHeader}>
                    <div>
                      <h3 className={styles.productName}>{product.name}</h3>
                      <p className={styles.productSku}>SKU: {product.sku}</p>
                    </div>
                    <div className={styles.productActions}>
                      {isLowStock(product.stock) && (
                        <span className={styles.lowStockBadge}>LOW STOCK</span>
                      )}
                      {isAdmin && (
                        <div className={styles.menuRoot} data-menu-root={product.id}>
                          <button
                            type="button"
                            className={styles.menuButton}
                            aria-label="Open product actions"
                            aria-haspopup="menu"
                            aria-expanded={openMenuProductId === product.id}
                            onClick={() =>
                              setOpenMenuProductId((prev) => (prev === product.id ? null : product.id))
                            }
                          >
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="4" r="1.6" fill="currentColor" />
                              <circle cx="10" cy="10" r="1.6" fill="currentColor" />
                              <circle cx="10" cy="16" r="1.6" fill="currentColor" />
                            </svg>
                          </button>

                          {openMenuProductId === product.id && (
                            <div className={styles.menuDropdown} role="menu" aria-label="Product actions">
                              <button
                                type="button"
                                className={styles.menuItem}
                                role="menuitem"
                                onClick={() => openRestockModal(product)}
                              >
                                Restock
                              </button>
                              <button
                                type="button"
                                className={styles.menuItem}
                                role="menuitem"
                                onClick={() => openAdjustModal(product)}
                              >
                                Edit Stock
                              </button>
                              <div className={styles.menuDivider} />
                              <button
                                type="button"
                                className={styles.menuItem}
                                role="menuitem"
                                onClick={() => {
                                  setOpenMenuProductId(null)
                                  handleOpenModal(product)
                                }}
                              >
                                Edit Product
                              </button>
                              <button
                                type="button"
                                className={`${styles.menuItem} ${styles.menuDanger}`}
                                role="menuitem"
                                onClick={() => openDeleteModal(product)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className={styles.productDescription}>{product.description}</p>
                  <div className={styles.productDetails}>
                    <div className={styles.productDetail}>
                      <span className={styles.detailLabel}>Category:</span>
                      <span className={styles.detailValue}>{product.category}</span>
                    </div>
                    <div className={styles.productDetail}>
                      <span className={styles.detailLabel}>Stock:</span>
                      <span className={`${styles.detailValue} ${isLowStock(product.stock) ? styles.lowStock : ''}`}>
                        {product.stock} units
                      </span>
                    </div>
                  </div>
                  <div className={styles.productPrice}>₱{product.price.toFixed(2)}</div>
                </div>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className={styles.paginationBar}>
                <span className={styles.paginationInfo}>
                  {pageLabel} • {pagination.total} total
                </span>
                <div className={styles.paginationControls}>
                  <button
                    type="button"
                    className={styles.paginationButton}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    className={styles.paginationButton}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {products.length === 0 && (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 21V11C16 9.89543 15.1046 9 14 9H10C8.89543 9 8 9.89543 8 11V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>No products yet</h3>
            <p>Get started by adding your first product</p>
            {isAdmin && (
              <button onClick={() => handleOpenModal()} className={styles.addButton}>
                Add Product
              </button>
            )}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={handleCloseModal} className={styles.closeButton}>
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Product Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="sku">SKU *</label>
                <input
                  id="sku"
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="price">Price *</label>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="cost">Cost</label>
                  <input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="category">Category *</label>
                <input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={handleCloseModal} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {actionModal && actionProduct && (
        <div className={styles.modalOverlay} onClick={closeActionModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {actionModal === 'restock'
                  ? `Restock: ${actionProduct.name}`
                  : actionModal === 'adjust'
                    ? `Edit Stock: ${actionProduct.name}`
                    : `Delete: ${actionProduct.name}`}
              </h2>
              <button onClick={closeActionModal} className={styles.closeButton}>
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {actionModal === 'restock' && (
              <form
                className={styles.form}
                onSubmit={(e) => {
                  e.preventDefault()
                  void submitRestock()
                }}
              >
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="restock-qty">Quantity *</label>
                    <input
                      id="restock-qty"
                      type="number"
                      min="1"
                      value={restockForm.quantity}
                      onChange={(e) => setRestockForm((p) => ({ ...p, quantity: e.target.value }))}
                      required
                      disabled={isActionSubmitting}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="restock-note">Note (optional)</label>
                  <textarea
                    id="restock-note"
                    rows={3}
                    value={restockForm.note}
                    onChange={(e) => setRestockForm((p) => ({ ...p, note: e.target.value }))}
                    disabled={isActionSubmitting}
                  />
                </div>
                <div className={styles.formActions}>
                  <button type="button" onClick={closeActionModal} className={styles.cancelButton} disabled={isActionSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitButton} disabled={isActionSubmitting}>
                    {isActionSubmitting ? 'Saving...' : 'Restock'}
                  </button>
                </div>
              </form>
            )}

            {actionModal === 'adjust' && (
              <form
                className={styles.form}
                onSubmit={(e) => {
                  e.preventDefault()
                  void submitAdjust()
                }}
              >
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="adjust-new">New Stock *</label>
                    <input
                      id="adjust-new"
                      type="number"
                      min="0"
                      value={adjustForm.newStock}
                      onChange={(e) => setAdjustForm((p) => ({ ...p, newStock: e.target.value }))}
                      required
                      disabled={isActionSubmitting}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Current</label>
                    <input type="text" value={`${actionProduct.stock} units`} disabled />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="adjust-note">Reason *</label>
                  <textarea
                    id="adjust-note"
                    rows={3}
                    value={adjustForm.note}
                    onChange={(e) => setAdjustForm((p) => ({ ...p, note: e.target.value }))}
                    required
                    disabled={isActionSubmitting}
                  />
                </div>
                <div className={styles.formActions}>
                  <button type="button" onClick={closeActionModal} className={styles.cancelButton} disabled={isActionSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitButton} disabled={isActionSubmitting}>
                    {isActionSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            )}

            {actionModal === 'delete' && (
              <form
                className={styles.form}
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!isAdmin) {
                    toast.error('Forbidden: Admin access required.')
                    return
                  }
                  try {
                    setIsActionSubmitting(true)
                    await handleDelete(actionProduct.id)
                    closeActionModal()
                  } finally {
                    setIsActionSubmitting(false)
                  }
                }}
              >
                <div className={styles.formGroup}>
                  <label>Confirmation</label>
                  <textarea
                    rows={3}
                    value={`This will permanently delete ${actionProduct.name}. This cannot be undone.`}
                    disabled
                  />
                </div>
                <div className={styles.formActions}>
                  <button type="button" onClick={closeActionModal} className={styles.cancelButton} disabled={isActionSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.dangerButton} disabled={isActionSubmitting}>
                    {isActionSubmitting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

