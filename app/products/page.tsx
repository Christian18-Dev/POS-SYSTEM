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
import { isExpiringSoon } from '@/lib/expirationAlerts'
import { exportToExcel } from '@/lib/excel'

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
  const [isExporting, setIsExporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [batchesModalProduct, setBatchesModalProduct] = useState<Product | null>(null)
  const [expiringBatchActionId, setExpiringBatchActionId] = useState<string | null>(null)
  const [confirmExpiredBatch, setConfirmExpiredBatch] = useState<null | {
    productId: string
    productName: string
    batch: { id: string; expirationDate: string; quantity: number }
  }>(null)
  const [openMenuProductId, setOpenMenuProductId] = useState<string | null>(null)
  const [actionModal, setActionModal] = useState<null | 'restock' | 'adjust' | 'delete'>(null)
  const [actionProduct, setActionProduct] = useState<Product | null>(null)
  const [isActionSubmitting, setIsActionSubmitting] = useState(false)
  const [restockForm, setRestockForm] = useState({ quantity: '1', manufacturingDate: '', expirationDate: '', note: '' })
  const [adjustForm, setAdjustForm] = useState({ newStock: '', note: '' })
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    price: '',
    cost: '',
    category: '',
    sku: '',
  })

  const limit = 12

  const exportProductsToExcel = async () => {
    if (isExporting) return

    try {
      setIsExporting(true)

      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (selectedCategory) params.set('category', selectedCategory)

      const url = params.toString() ? `/api/products?${params.toString()}` : '/api/products'
      const data = await apiRequest<{ success: boolean; products: Product[] }>(url)

      if (!data.success) {
        toast.error('Failed to export products')
        return
      }

      const allProducts = Array.isArray(data.products) ? data.products : []

      const productsSheet = allProducts.map((p) => ({
        sku: p.sku,
        name: p.name,
        brand: p.brand || '',
        category: p.category,
        description: p.description,
        price: p.price,
        cost: p.cost ?? 0,
        stock: p.stock,
      }))

      const dateTag = new Date().toISOString().slice(0, 10)
      exportToExcel(
        {
          Products: productsSheet,
        },
        `Farmacia_Products_${dateTag}.xlsx`
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export products')
    } finally {
      setIsExporting(false)
    }
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim())
    }, 300)
    return () => window.clearTimeout(handle)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearchQuery, selectedCategory])

  const fetchProducts = async (targetPage: number, query: string, category: string) => {
    setIsFetching(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(targetPage))
      params.set('limit', String(limit))
      if (query) params.set('search', query)
      if (category) params.set('category', category)

      const data = await apiRequest<{
        success: boolean
        products: Product[]
        pagination?: Pagination
      }>(`/api/products?${params.toString()}`)

      if (data.success) {
        setProducts(Array.isArray(data.products) ? data.products : [])
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
    setRestockForm({ quantity: '1', manufacturingDate: '', expirationDate: '', note: '' })
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
    setRestockForm({ quantity: '1', manufacturingDate: '', expirationDate: '', note: '' })
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
        body: JSON.stringify({
          quantity,
          manufacturingDate: restockForm.manufacturingDate,
          expirationDate: restockForm.expirationDate,
          note: restockForm.note,
        }),
      })

      toast.success('Restock recorded')
      closeActionModal()
      await fetchProducts(page, debouncedSearchQuery, selectedCategory)
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
      await fetchProducts(page, debouncedSearchQuery, selectedCategory)
      await refreshProducts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to adjust stock')
    } finally {
      setIsActionSubmitting(false)
    }
  }

  useEffect(() => {
    fetchProducts(page, debouncedSearchQuery, selectedCategory)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearchQuery, selectedCategory])

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
        brand: product.brand || '',
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
        brand: '',
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
      brand: '',
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
      brand: formData.brand,
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
      await fetchProducts(page, debouncedSearchQuery, selectedCategory)
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
      else await fetchProducts(page, debouncedSearchQuery, selectedCategory)
      await refreshProducts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const pageLabel = useMemo(() => {
    if (!pagination) return `Page ${page}`
    return `Page ${pagination.page} of ${pagination.totalPages}`
  }, [page, pagination])

  const categories = useMemo(() => {
    const unique = new Set<string>()
    for (const product of products) {
      const category = product.category?.trim()
      if (category) unique.add(category)
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [products])

  return (
    <div className={styles.products}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>Products</h1>
            <p className={styles.headerSubtitle}>Manage your product inventory</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className={styles.exportButton}
              type="button"
              onClick={() => void exportProductsToExcel()}
              disabled={isExporting}
            >
              <span className={styles.exportButtonText}>Download</span>
              <span className={styles.exportButtonIcon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 35 35"
                  className={styles.exportButtonSvg}
                  aria-hidden="true"
                >
                  <path d="M17.5,22.131a1.249,1.249,0,0,1-1.25-1.25V2.187a1.25,1.25,0,0,1,2.5,0V20.881A1.25,1.25,0,0,1,17.5,22.131Z"></path>
                  <path d="M17.5,22.693a3.189,3.189,0,0,1-2.262-.936L8.487,15.006a1.249,1.249,0,0,1,1.767-1.767l6.751,6.751a.7.7,0,0,0,.99,0l6.751-6.751a1.25,1.25,0,0,1,1.768,1.767l-6.752,6.751A3.191,3.191,0,0,1,17.5,22.693Z"></path>
                  <path d="M31.436,34.063H3.564A3.318,3.318,0,0,1,.25,30.749V22.011a1.25,1.25,0,0,1,2.5,0v8.738a.815.815,0,0,0,.814.814H31.436a.815.815,0,0,0,.814-.814V22.011a1.25,1.25,0,1,1,2.5,0v8.738A3.318,3.318,0,0,1,31.436,34.063Z"></path>
                </svg>
              </span>
            </button>

            {isAdmin && (
              <button onClick={() => handleOpenModal()} className={styles.addButton}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Add Product
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.controlsBar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search products by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className={styles.categorySelect}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

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
                      {!!product.brand && <p className={styles.productBrand}>{product.brand}</p>}
                      <p className={styles.productSku}>SKU: {product.sku}</p>
                    </div>
                    <div className={styles.productActions}>
                      {isLowStock(product.stock) && (
                        <span className={styles.lowStockBadge}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M10.29 3.86L1.82 18A2 2 0 0 0 3.53 21H20.47A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Low stock
                        </span>
                      )}
                      {isExpiringSoon(product.expirationDate) && (
                        <span className={styles.expiringSoonBadge}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M8 7V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M16 7V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M4 11H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 5H18A2 2 0 0 1 20 7V19A2 2 0 0 1 18 21H6A2 2 0 0 1 4 19V7A2 2 0 0 1 6 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Expiring
                        </span>
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

                  {Array.isArray(product.batches) && product.batches.length > 0 && (
                    <button
                      type="button"
                      className={styles.viewBatchesButton}
                      onClick={() => setBatchesModalProduct(product)}
                    >
                      View Batches
                    </button>
                  )}

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
                    disabled={page <= 1 || isFetching}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    className={styles.paginationButton}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages || isFetching}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {!isFetching &&
          products.length === 0 &&
          debouncedSearchQuery.trim() === '' &&
          selectedCategory === '' && (
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

        {!isFetching && products.length === 0 && (debouncedSearchQuery.trim() !== '' || selectedCategory !== '') && (
          <div className={styles.emptyState}>
            <h3>No matching products</h3>
            <p>Try adjusting your search or category filter.</p>
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
                <label htmlFor="brand">Brand Name</label>
                <input
                  id="brand"
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
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

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="restock-mfg">Manufacturing Date</label>
                    <input
                      id="restock-mfg"
                      type="date"
                      value={restockForm.manufacturingDate}
                      onChange={(e) => setRestockForm((p) => ({ ...p, manufacturingDate: e.target.value }))}
                      disabled={isActionSubmitting}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="restock-exp">Expiration Date *</label>
                    <input
                      id="restock-exp"
                      type="date"
                      value={restockForm.expirationDate}
                      onChange={(e) => setRestockForm((p) => ({ ...p, expirationDate: e.target.value }))}
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

      {batchesModalProduct && (
        <div className={styles.modalOverlay} onClick={() => setBatchesModalProduct(null)}>
          <div className={`${styles.modal} ${styles.batchesModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Batches: {batchesModalProduct.name}</h2>
              <button onClick={() => setBatchesModalProduct(null)} className={styles.closeButton}>
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className={styles.batchesModalBody}>
              {(() => {
                const visibleBatches = (batchesModalProduct.batches || [])
                  .filter((b) => typeof b?.quantity === 'number' && b.quantity > 0)
                  .slice()
                  .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())

                const totalQty = visibleBatches.reduce((sum, b) => sum + b.quantity, 0)

                return (
                  <>
                    <div className={styles.batchesModalSummary}>
                      <span className={styles.batchesModalSummaryItem}>
                        <span className={styles.batchesModalSummaryLabel}>Batches</span>
                        <span className={styles.batchesModalSummaryValue}>{visibleBatches.length}</span>
                      </span>
                      <span className={styles.batchesModalSummaryItem}>
                        <span className={styles.batchesModalSummaryLabel}>Total Qty</span>
                        <span className={styles.batchesModalSummaryValue}>{totalQty}</span>
                      </span>
                    </div>

                    <div className={styles.batchesModalTable}>
                      <div className={styles.batchesModalTableHeader}>
                        <span className={styles.batchesModalHeaderCell}>Manufacturing Date</span>
                        <span className={styles.batchesModalHeaderCell}>Expiration Date</span>
                        <span
                          className={`${styles.batchesModalHeaderCell} ${styles.batchesModalHeaderCellRight}`}
                        >
                          Quantity
                        </span>
                        <span
                          className={`${styles.batchesModalHeaderCell} ${styles.batchesModalHeaderCellRight}`}
                        >
                          Added on
                        </span>
                        <span
                          className={`${styles.batchesModalHeaderCell} ${styles.batchesModalHeaderCellRight}`}
                        >
                          Action
                        </span>
                      </div>

                      {visibleBatches.length > 0 ? (
                        <div className={styles.batchesModalList}>
                          {visibleBatches.map((b, idx) => (
                            <div
                              key={`${batchesModalProduct.id}-batch-${idx}`}
                              className={styles.batchesModalRow}
                            >
                              <span className={styles.batchesModalCellPrimary}>
                                {b.manufacturingDate ? String(b.manufacturingDate).slice(0, 10) : ''}
                              </span>
                              <span className={styles.batchesModalCellPrimary}>
                                {String(b.expirationDate).slice(0, 10)}
                              </span>
                              <span className={styles.batchesModalCellQty}>{b.quantity} pcs</span>
                              <span className={styles.batchesModalCellMeta}>
                                {b.receivedAt ? String(b.receivedAt).slice(0, 10) : ''}
                              </span>
                              <span className={styles.batchesModalCellAction}>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    className={styles.batchesModalExpired}
                                    disabled={b.quantity <= 0 || expiringBatchActionId === b.id}
                                    onClick={async () => {
                                      setConfirmExpiredBatch({
                                        productId: batchesModalProduct.id,
                                        productName: batchesModalProduct.name,
                                        batch: {
                                          id: b.id,
                                          expirationDate: b.expirationDate,
                                          quantity: b.quantity,
                                        },
                                      })
                                    }}
                                  >
                                    Expired
                                  </button>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.batchesModalEmpty}>
                          No available batches. Restock this product to create a new batch.
                        </div>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {confirmExpiredBatch && (
        <div className={styles.modalOverlay} onClick={() => setConfirmExpiredBatch(null)}>
          <div
            className={`${styles.modal} ${styles.confirmExpiredModal}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-expired-batch-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="confirm-expired-batch-title">Confirm expired batch</h2>
              <button onClick={() => setConfirmExpiredBatch(null)} className={styles.closeButton}>
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className={styles.confirmExpiredBody}>
              <div className={styles.confirmExpiredIntro}>
                <div className={styles.confirmExpiredIntroTitle}>This action cannot be undone</div>
                <div className={styles.confirmExpiredIntroText}>
                  Expiring a batch will permanently remove its quantity from stock.
                </div>
              </div>

              <div className={styles.confirmExpiredDetails}>
                <div className={styles.confirmExpiredDetailRow}>
                  <span className={styles.confirmExpiredDetailLabel}>Product</span>
                  <span className={styles.confirmExpiredDetailValue}>{confirmExpiredBatch.productName}</span>
                </div>
                <div className={styles.confirmExpiredDetailRow}>
                  <span className={styles.confirmExpiredDetailLabel}>Expiration date</span>
                  <span className={styles.confirmExpiredDetailValue}>
                    {String(confirmExpiredBatch.batch.expirationDate).slice(0, 10)}
                  </span>
                </div>
                <div className={styles.confirmExpiredDetailRow}>
                  <span className={styles.confirmExpiredDetailLabel}>Quantity to remove</span>
                  <span className={styles.confirmExpiredDetailValue}>{confirmExpiredBatch.batch.quantity} pcs</span>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setConfirmExpiredBatch(null)}
                  disabled={expiringBatchActionId === confirmExpiredBatch.batch.id}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  disabled={expiringBatchActionId === confirmExpiredBatch.batch.id}
                  onClick={async () => {
                    try {
                      setExpiringBatchActionId(confirmExpiredBatch.batch.id)
                      await apiRequest<{ success: boolean; product: Product }>(
                        `/api/products/${confirmExpiredBatch.productId}/batches/${confirmExpiredBatch.batch.id}/expired`,
                        {
                          method: 'POST',
                          body: JSON.stringify({
                            note: `Expired batch (${String(confirmExpiredBatch.batch.expirationDate).slice(0, 10)})`,
                          }),
                        }
                      )
                      toast.success('Expired stock removed')
                      setConfirmExpiredBatch(null)
                      await fetchProducts(page, debouncedSearchQuery, selectedCategory)
                      await refreshProducts()
                      if (batchesModalProduct?.id === confirmExpiredBatch.productId) {
                        const refreshed = await apiRequest<{ success: boolean; product: Product }>(
                          `/api/products/${confirmExpiredBatch.productId}`
                        )
                        if (refreshed.success) {
                          setBatchesModalProduct(refreshed.product)
                        }
                      }
                    } catch (error) {
                      toast.error(
                        error instanceof Error ? error.message : 'Failed to remove expired stock'
                      )
                    } finally {
                      setExpiringBatchActionId(null)
                    }
                  }}
                >
                  {expiringBatchActionId === confirmExpiredBatch.batch.id ? 'Removing…' : 'Mark as expired'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

