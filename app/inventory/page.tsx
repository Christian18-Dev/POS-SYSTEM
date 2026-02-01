'use client'

import { useEffect, useMemo, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import styles from './inventory.module.css'
import { apiRequest } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import { useProducts } from '@/contexts/ProductContext'

type MovementType = 'RESTOCK' | 'SALE' | 'ADJUSTMENT'

type InventoryMovementDto = {
  id: string
  productId: string
  type: MovementType
  change: number
  stockBefore: number
  stockAfter: number
  byUserId?: string
  byEmail?: string
  note?: string
  timestamp: string
}

type Pagination = { page: number; limit: number; total: number; totalPages: number }

export default function InventoryPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <InventoryContent />
      </Layout>
    </ProtectedRoute>
  )
}

function InventoryContent() {
  const toast = useToast()
  const { products } = useProducts()

  const [movements, setMovements] = useState<InventoryMovementDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination | null>(null)

  const [page, setPage] = useState(1)
  const limit = 25

  const [type, setType] = useState<MovementType>('RESTOCK')
  const [productId, setProductId] = useState<string>('')

  useEffect(() => {
    setPage(1)
  }, [type, productId])

  useEffect(() => {
    const fetchMovements = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(limit))
        if (type) params.set('type', type)
        if (productId) params.set('productId', productId)

        const data = await apiRequest<{
          success: boolean
          movements: InventoryMovementDto[]
          pagination: Pagination
        }>(`/api/inventory-movements?${params.toString()}`)

        if (data.success) {
          setMovements(data.movements)
          setPagination(data.pagination)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load inventory movements')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMovements()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, type, productId])

  const productNameById = useMemo(() => {
    const map = new Map<string, string>()
    products.forEach((p) => map.set(p.id, p.name))
    return map
  }, [products])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={styles.inventory}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>Inventory</h1>
            <p className={styles.headerSubtitle}>Inventory movement logs (restocks, sales, adjustments)</p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label htmlFor="type">Type</label>
            <select id="type" value={type} onChange={(e) => setType(e.target.value as MovementType)}>
              <option value="RESTOCK">RESTOCK</option>
              <option value="SALE">SALE</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="product">Product</label>
            <select id="product" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {isLoading ? (
            <div className={styles.emptyState}>
              <p>Loading inventory logs...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No logs found</h3>
              <p>Try changing the filters or create a restock.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Change</th>
                  <th>Stock Before</th>
                  <th>Stock After</th>
                  <th>By</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className={styles.date}>{formatDate(m.timestamp)}</td>
                    <td className={styles.product}>{productNameById.get(m.productId) || m.productId}</td>
                    <td>
                      <span className={`${styles.typeBadge} ${styles[m.type]}`}>{m.type}</span>
                    </td>
                    <td className={m.change >= 0 ? styles.positive : styles.negative}>
                      {m.change >= 0 ? `+${m.change}` : `${m.change}`}
                    </td>
                    <td>{m.stockBefore}</td>
                    <td>{m.stockAfter}</td>
                    <td className={styles.by}>{m.byEmail || '-'}</td>
                    <td className={styles.note}>{m.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>
              Page {pagination.page} of {pagination.totalPages} • {pagination.total} total
            </div>
            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.paginationButton}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
              >
                Prev
              </button>
              <button
                type="button"
                className={styles.paginationButton}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages || isLoading}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
