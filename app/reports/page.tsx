'use client'

import { useState, useMemo } from 'react'
import { useEffect } from 'react'
import { useSales, Sale } from '@/contexts/SalesContext'
import { useProducts } from '@/contexts/ProductContext'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import styles from './reports.module.css'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <ReportsContent />
      </Layout>
    </ProtectedRoute>
  )
}

function ReportsContent() {
  const { isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const { sales, getSalesByDateRange } = useSales()
  const { products } = useProducts()
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [isAdmin, isLoading, router])

  if (!isAdmin) {
    return null
  }

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(today)
    end.setHours(23, 59, 59, 999)

    let start: Date

    if (dateRange === 'today') {
      start = new Date(today)
    } else if (dateRange === 'week') {
      start = new Date(today)
      start.setDate(start.getDate() - 7)
    } else if (dateRange === 'month') {
      start = new Date(today)
      start.setMonth(start.getMonth() - 1)
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      start = new Date(customStartDate)
      end.setTime(new Date(customEndDate).getTime())
      end.setHours(23, 59, 59, 999)
      return { startDate: start, endDate: end }
    } else {
      // All time
      start = new Date(0)
    }

    return { startDate: start, endDate: end }
  }, [dateRange, customStartDate, customEndDate])

  // Get filtered sales
  const filteredSales = useMemo(() => {
    return getSalesByDateRange(startDate, endDate)
  }, [getSalesByDateRange, startDate, endDate])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
    const totalOrders = filteredSales.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const productCostById = new Map(products.map((p) => [p.id, p.cost ?? 0]))
    const totalCost = filteredSales.reduce((sum, sale) => {
      const saleCost = sale.items.reduce((s, item) => {
        const unitCost = productCostById.get(item.product.id) ?? 0
        return s + unitCost * item.quantity
      }, 0)
      return sum + saleCost
    }, 0)

    const totalProfit = totalRevenue - totalCost

    // Payment method breakdown
    const paymentMethods = filteredSales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total
      return acc
    }, {} as Record<string, number>)

    // Top selling products
    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>()
    
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = productSales.get(item.product.id) || {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
        }
        existing.quantity += item.quantity
        existing.revenue += item.product.price * item.quantity
        productSales.set(item.product.id, existing)
      })
    })

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Daily revenue for chart
    const dailyRevenue = new Map<string, number>()
    filteredSales.forEach((sale) => {
      const date = new Date(sale.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + sale.total)
    })

    const dailyRevenueArray = Array.from(dailyRevenue.entries())
      .sort((a, b) => {
        const dateA = new Date(a[0] + ', ' + new Date().getFullYear())
        const dateB = new Date(b[0] + ', ' + new Date().getFullYear())
        return dateA.getTime() - dateB.getTime()
      })
      .slice(-7) // Last 7 days

    const maxRevenue = Math.max(...dailyRevenueArray.map(([, revenue]) => revenue), 1)

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      totalOrders,
      averageOrderValue,
      paymentMethods,
      topProducts,
      dailyRevenue: dailyRevenueArray,
      maxRevenue,
    }
  }, [filteredSales, products])

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className={styles.reports}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>Reports & Analytics</h1>
            <p className={styles.headerSubtitle}>Sales insights and performance metrics</p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Date Range Filters */}
        <div className={styles.filters}>
          <div className={styles.dateFilters}>
            <button
              onClick={() => setDateRange('today')}
              className={`${styles.filterButton} ${dateRange === 'today' ? styles.active : ''}`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`${styles.filterButton} ${dateRange === 'week' ? styles.active : ''}`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`${styles.filterButton} ${dateRange === 'month' ? styles.active : ''}`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`${styles.filterButton} ${dateRange === 'all' ? styles.active : ''}`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`${styles.filterButton} ${dateRange === 'custom' ? styles.active : ''}`}
            >
              Custom Range
            </button>
          </div>

          {dateRange === 'custom' && (
            <div className={styles.customDateRange}>
              <div className={styles.dateInputGroup}>
                <label htmlFor="startDate">Start Date</label>
                <input
                  id="startDate"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className={styles.dateInputGroup}>
                <label htmlFor="endDate">End Date</label>
                <input
                  id="endDate"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {dateRange !== 'custom' && (
            <div className={styles.dateRangeDisplay}>
              {formatDate(startDate)} - {formatDate(endDate)}
            </div>
          )}
        </div>

        {/* Key Statistics */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Revenue</p>
              <p className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11M5 11H19L20 21H4L5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Orders</p>
              <p className={styles.statValue}>{stats.totalOrders}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 7H6C4.89543 7 4 7.89543 4 9V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V9C20 7.89543 19.1046 7 18 7H15M9 7C9 8.10457 9.89543 9 11 9H13C14.1046 9 15 8.10457 15 7M9 7C9 5.89543 9.89543 5 11 5H13C14.1046 5 15 5.89543 15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Average Order Value</p>
              <p className={styles.statValue}>{formatCurrency(stats.averageOrderValue)}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 9H21V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Profit</p>
              <p className={styles.statValue}>{formatCurrency(stats.totalProfit)}</p>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        {stats.dailyRevenue.length > 0 && (
          <div className={styles.chartCard}>
            <h2 className={styles.cardTitle}>Revenue Trend (Last 7 Days)</h2>
            <div className={styles.chart} style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.dailyRevenue.map(([date, revenue]) => ({ date, revenue }))}
                  margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(v) => `₱${Number(v).toFixed(0)}`}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 12px 30px rgba(2, 6, 23, 0.12)',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#667eea" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className={styles.contentGrid}>
          {/* Top Selling Products */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Top Selling Products</h2>
            {stats.topProducts.length > 0 ? (
              <div className={styles.topProductsList}>
                {stats.topProducts.map((product, index) => (
                  <div key={index} className={styles.productItem}>
                    <div className={styles.productRank}>#{index + 1}</div>
                    <div className={styles.productInfo}>
                      <h4 className={styles.productName}>{product.name}</h4>
                      <p className={styles.productStats}>
                        {product.quantity} sold • {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No sales data available for this period</p>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Payment Methods</h2>
            {Object.keys(stats.paymentMethods).length > 0 ? (
              <div className={styles.paymentMethodsList}>
                {Object.entries(stats.paymentMethods)
                  .sort(([, a], [, b]) => b - a)
                  .map(([method, amount]) => {
                    const percentage = stats.totalRevenue > 0 
                      ? (amount / stats.totalRevenue) * 100 
                      : 0
                    return (
                      <div key={method} className={styles.paymentMethodItem}>
                        <div className={styles.paymentMethodHeader}>
                          <span className={styles.paymentMethodName}>
                            {method.charAt(0).toUpperCase() + method.slice(1)}
                          </span>
                          <span className={styles.paymentMethodAmount}>
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className={styles.paymentMethodBar}>
                          <div
                            className={styles.paymentMethodBarFill}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className={styles.paymentMethodPercentage}>
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No payment data available for this period</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

