'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sale } from '@/contexts/SalesContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import Receipt from '@/components/Receipt'
import styles from './orders.module.css'
import { apiRequest } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import { exportToExcel } from '@/lib/excel'

type Pagination = { page: number; limit: number; total: number; totalPages: number }

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <OrdersContent />
      </Layout>
    </ProtectedRoute>
  )
}

function OrdersContent() {
  const toast = useToast()
  const [orders, setOrders] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const limit = 20
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { startDateIso, endDateIso } = useMemo(() => {
    if (dateFilter === 'all') return { startDateIso: null as string | null, endDateIso: null as string | null }

    if (dateFilter === 'custom') {
      if (!customStartDate || !customEndDate) {
        return { startDateIso: null as string | null, endDateIso: null as string | null }
      }

      const start = new Date(`${customStartDate}T00:00:00.000`)
      const end = new Date(`${customEndDate}T23:59:59.999`)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return { startDateIso: null as string | null, endDateIso: null as string | null }
      }

      return { startDateIso: start.toISOString(), endDateIso: end.toISOString() }
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const start = new Date(today)

    if (dateFilter === 'week') start.setDate(start.getDate() - 7)
    if (dateFilter === 'month') start.setMonth(start.getMonth() - 1)

    return { startDateIso: start.toISOString(), endDateIso: now.toISOString() }
  }, [dateFilter, customStartDate, customEndDate])

  const exportOrdersToExcel = async () => {
    if (isExporting) return

    try {
      setIsExporting(true)

      const toDateOnly = (iso: string) => {
        const d = new Date(iso)
        if (Number.isNaN(d.getTime())) return ''
        return d.toISOString().slice(0, 10)
      }

      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (startDateIso && endDateIso) {
        params.set('startDate', startDateIso)
        params.set('endDate', endDateIso)
      }

      const url = params.toString() ? `/api/sales?${params.toString()}` : '/api/sales'
      const data = await apiRequest<{ success: boolean; sales: Sale[] }>(url)

      if (!data.success) {
        toast.error('Failed to export orders')
        return
      }

      const allOrders = Array.isArray(data.sales) ? data.sales : []

      const ordersSheet = allOrders.map((o) => ({
        orderId: o.id,
        date: toDateOnly(o.timestamp),
        status: o.status,
        paymentMethod: o.paymentMethod,
        customerName: o.customerName || '',
        customerType: o.customerType || '',
        subtotal: o.subtotal ?? '',
        discountRate: o.discountRate ?? '',
        discountAmount: o.discountAmount ?? '',
        vatRate: o.vatRate ?? '',
        vatAmount: o.vatAmount ?? '',
        vatableSales: o.vatableSales ?? '',
        vatExemptSales: o.vatExemptSales ?? '',
        total: o.total,
        itemCount: Array.isArray(o.items) ? o.items.reduce((sum, it) => sum + (it.quantity || 0), 0) : 0,
      }))

      const orderItemsSheet = allOrders.flatMap((o) => {
        const items = Array.isArray(o.items) ? o.items : []
        return items.map((it) => ({
          orderId: o.id,
          productId: it.product.id,
          productSku: it.product.sku,
          productName: it.product.name,
          unitPrice: it.product.price,
          quantity: it.quantity,
          lineTotal: it.product.price * it.quantity,
        }))
      })

      const dateTag = new Date().toISOString().slice(0, 10)
      exportToExcel(
        {
          Orders: ordersSheet,
          OrderItems: orderItemsSheet,
        },
        `Farmacia_Transactions_${dateTag}.xlsx`
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export orders')
    } finally {
      setIsExporting(false)
    }
  }

  useEffect(() => {
    // Reset to page 1 when filters change
    setPage(1)
  }, [searchQuery, dateFilter, customStartDate, customEndDate])

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(limit))
        if (searchQuery.trim()) params.set('search', searchQuery.trim())
        if (startDateIso && endDateIso) {
          params.set('startDate', startDateIso)
          params.set('endDate', endDateIso)
        }

        const data = await apiRequest<{
          success: boolean
          sales: Sale[]
          pagination?: Pagination
        }>(`/api/sales?${params.toString()}`)

        if (data.success) {
          setOrders(data.sales)
          setPagination(data.pagination || null)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load orders')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, startDateIso, endDateIso, searchQuery])

  const handleViewOrder = (order: Sale) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const saleDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (saleDate.getTime() === today.getTime()) {
      return 'Today'
    }

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (saleDate.getTime() === yesterday.getTime()) {
      return 'Yesterday'
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  return (
    <div className={styles.orders}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>Orders & Transactions</h1>
            <p className={styles.headerSubtitle}>View and manage all sales transactions</p>
          </div>
          <button
            className={styles.exportButton}
            type="button"
            onClick={() => void exportOrdersToExcel()}
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
        </div>
      </header>

      <main className={styles.main}>
        {/* Filters and Search */}
        <div className={styles.filters}>
          <div className={styles.searchBar}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search by invoice ID or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.dateFilters}>
            <button
              onClick={() => setDateFilter('all')}
              className={`${styles.filterButton} ${dateFilter === 'all' ? styles.active : ''}`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`${styles.filterButton} ${dateFilter === 'today' ? styles.active : ''}`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`${styles.filterButton} ${dateFilter === 'week' ? styles.active : ''}`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`${styles.filterButton} ${dateFilter === 'month' ? styles.active : ''}`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`${styles.filterButton} ${dateFilter === 'custom' ? styles.active : ''}`}
            >
              Custom
            </button>
          </div>

          {dateFilter === 'custom' && (
            <div className={styles.dateRangeRow}>
              <div className={styles.dateRangeField}>
                <label className={styles.dateRangeLabel} htmlFor="orders-start-date">From</label>
                <input
                  id="orders-start-date"
                  type="date"
                  className={styles.dateRangeInput}
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className={styles.dateRangeField}>
                <label className={styles.dateRangeLabel} htmlFor="orders-end-date">To</label>
                <input
                  id="orders-end-date"
                  type="date"
                  className={styles.dateRangeInput}
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Orders Table */}
        <div className={styles.ordersTable}>
          {isLoading ? (
            <div className={styles.emptyState}>
              <p>Loading orders...</p>
            </div>
          ) : orders.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Payment Method</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className={styles.orderId}>{order.id}</td>
                    <td className={styles.date}>{formatDateShort(order.timestamp)}</td>
                    <td>{order.customerName || 'Walk-in Customer'}</td>
                    <td className={styles.itemsCount}>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                    <td className={styles.paymentMethod}>
                      <span className={styles.paymentBadge}>{order.paymentMethod}</span>
                    </td>
                    <td className={styles.total}>₱{order.total.toFixed(2)}</td>
                    <td>
                      <span className={`${styles.status} ${styles[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewOrder(order)}
                        className={styles.viewButton}
                        aria-label="View order details"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11M5 11H19L20 21H4L5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>No orders found</h3>
              <p>
                {searchQuery || dateFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No orders have been placed yet. Start making sales!'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
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

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Order Details</h2>
                <p className={styles.modalSubtitle}>{selectedOrder.id}</p>
              </div>
              <button onClick={handleCloseModal} className={styles.closeButton}>
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.orderInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Date & Time:</span>
                  <span className={styles.infoValue}>{formatDate(selectedOrder.timestamp)}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Customer:</span>
                  <span className={styles.infoValue}>{selectedOrder.customerName || 'Walk-in Customer'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Payment Method:</span>
                  <span className={styles.infoValue}>
                    <span className={styles.paymentBadge}>{selectedOrder.paymentMethod}</span>
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Status:</span>
                  <span className={styles.infoValue}>
                    <span className={`${styles.status} ${styles[selectedOrder.status]}`}>
                      {selectedOrder.status}
                    </span>
                  </span>
                </div>
              </div>

              <div className={styles.orderItems}>
                <h3 className={styles.itemsTitle}>Order Items</h3>
                <div className={styles.itemsList}>
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className={styles.orderItem}>
                      <div className={styles.itemInfo}>
                        <h4 className={styles.itemName}>{item.product.name}</h4>
                        <p className={styles.itemDetails}>
                          SKU: {item.product.sku} • {item.quantity} × ₱{item.product.price.toFixed(2)}
                        </p>
                      </div>
                      <div className={styles.itemTotal}>
                        ₱{(item.product.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.orderTotal}>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Total:</span>
                  <span className={styles.totalAmount}>₱{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.receiptSection}>
                <Receipt sale={selectedOrder} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

