'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useProducts } from '@/contexts/ProductContext'
import { useSales } from '@/contexts/SalesContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import styles from './dashboard.module.css'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <DashboardContent />
      </Layout>
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user } = useAuth()
  const { products } = useProducts()
  const { sales, getTotalSales, getTotalOrders } = useSales()

  // Calculate today's sales
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todaySales = sales
    .filter((sale) => new Date(sale.timestamp) >= today)
    .reduce((sum, sale) => sum + sale.total, 0)

  // Get recent orders (last 5)
  const recentOrders = sales.slice(0, 5).map((sale) => ({
    id: sale.id,
    customer: sale.customerName || 'Walk-in Customer',
    amount: `₱${sale.total.toFixed(2)}`,
    status: sale.status,
    time: getTimeAgo(new Date(sale.timestamp)),
  }))

  function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds} sec ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  const stats = [
    {
      title: 'Today\'s Sales',
      value: `₱${todaySales.toFixed(2)}`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Total Orders',
      value: getTotalOrders().toString(),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11M5 11H19L20 21H4L5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Active Products',
      value: products.length.toString(),
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 21V11C16 9.89543 15.1046 9 14 9H10C8.89543 9 8 9.89543 8 11V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Total Revenue',
      value: `₱${getTotalSales().toFixed(2)}`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ]

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>Dashboard</h1>
            <p className={styles.headerSubtitle}>Welcome back, {user?.name || 'User'}!</p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statCard}>
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statContent}>
                <p className={styles.statTitle}>{stat.title}</p>
                <p className={styles.statValue}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Recent Orders</h2>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className={styles.orderId}>{order.id}</td>
                        <td>{order.customer}</td>
                        <td className={styles.amount}>{order.amount}</td>
                        <td>
                          <span className={`${styles.status} ${styles[order.status]}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className={styles.time}>{order.time}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                        No orders yet. Start making sales!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Quick Actions</h2>
            </div>
            <div className={styles.quickActions}>
              <Link href="/sales" className={styles.actionButton}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>New Sale</span>
              </Link>
              <Link href="/products" className={styles.actionButton}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 21V11C16 9.89543 15.1046 9 14 9H10C8.89543 9 8 9.89543 8 11V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Products</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

