'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './Sidebar'
import { useProducts } from '@/contexts/ProductContext'
import { getLowStockProducts } from '@/lib/stockAlerts'
import { getExpiringSoonBatches } from '@/lib/expirationAlerts'
import styles from './Layout.module.css'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { products } = useProducts()
  const [isLowStockOpen, setIsLowStockOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const lowStockProducts = useMemo(() => getLowStockProducts(products), [products])
  const lowStockCount = lowStockProducts.length

  const expiringSoonBatches = useMemo(() => getExpiringSoonBatches(products), [products])
  const expiringSoonCount = expiringSoonBatches.length

  const notificationCount = lowStockCount + expiringSoonCount

  useEffect(() => {
    if (!isLowStockOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLowStockOpen(false)
      }
    }

    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const el = dropdownRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) {
        setIsLowStockOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [isLowStockOpen])

  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.lowStockBellWrap}>
        <div className={styles.lowStockDropdown} ref={dropdownRef}>
          <button
            type="button"
            className={styles.lowStockBellButton}
            onClick={() => setIsLowStockOpen((v) => !v)}
            aria-label={
              notificationCount > 0
                ? `${notificationCount} notifications`
                : 'No notifications'
            }
            aria-expanded={isLowStockOpen}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {notificationCount > 0 && <span className={styles.lowStockBellBadge}>{notificationCount}</span>}
          </button>

          {isLowStockOpen && (
            <div className={styles.lowStockBellMenu} role="dialog" aria-label="Notifications">
              <div className={styles.lowStockBellMenuHeader}>
                <span className={styles.lowStockBellMenuTitle}>Notifications</span>
                <span className={styles.lowStockBellMenuMeta}>
                  {notificationCount > 0 ? `${notificationCount}` : '0'}
                </span>
              </div>

              {notificationCount > 0 ? (
                <div className={styles.lowStockBellMenuList}>
                  <div className={styles.notificationSectionHeader}>
                    <span className={styles.notificationSectionTitle}>Low stock</span>
                    <span className={styles.notificationSectionMeta}>{lowStockCount}</span>
                  </div>
                  {lowStockCount > 0 ? (
                    lowStockProducts.map((p) => (
                      <div key={`low-${p.id}`} className={styles.lowStockBellMenuItem}>
                        <span className={styles.lowStockBellProductName}>{p.name}</span>
                        <span className={styles.lowStockBellProductStock}>{p.stock} left</span>
                      </div>
                    ))
                  ) : (
                    <div className={styles.notificationSectionEmpty}>No low stock items.</div>
                  )}

                  <div className={styles.notificationSectionDivider} />

                  <div className={styles.notificationSectionHeader}>
                    <span className={styles.notificationSectionTitle}>Expiring</span>
                    <span className={`${styles.notificationSectionMeta} ${styles.expiringSoonMeta}`}>{expiringSoonCount}</span>
                  </div>
                  {expiringSoonCount > 0 ? (
                    expiringSoonBatches.map((b) => (
                      <div key={`exp-${b.productId}-${b.batchId}`} className={styles.lowStockBellMenuItem}>
                        <span className={styles.lowStockBellProductName}>{b.productName}</span>
                        <span className={styles.expiringSoonProductDate}>
                          {b.expirationDate ? String(b.expirationDate).slice(0, 10) : ''}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className={styles.notificationSectionEmpty}>No expiring items.</div>
                  )}
                </div>
              ) : (
                <div className={styles.lowStockBellEmpty}>
                  <div className={styles.lowStockBellEmptyTitle}>All good</div>
                  <div className={styles.lowStockBellEmptyText}>
                    No notifications right now.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <main className={styles.main}>{children}</main>
    </div>
  )
}


