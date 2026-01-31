'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from './Sidebar'
import { useProducts } from '@/contexts/ProductContext'
import { getLowStockProducts } from '@/lib/stockAlerts'
import styles from './Layout.module.css'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { products } = useProducts()
  const [isLowStockOpen, setIsLowStockOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const lowStockProducts = useMemo(() => getLowStockProducts(products), [products])
  const lowStockCount = lowStockProducts.length

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
              lowStockCount > 0
                ? `${lowStockCount} products low on stock`
                : 'No low stock alerts'
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
            {lowStockCount > 0 && <span className={styles.lowStockBellBadge}>{lowStockCount}</span>}
          </button>

          {isLowStockOpen && (
            <div className={styles.lowStockBellMenu} role="dialog" aria-label="Low stock alerts">
              <div className={styles.lowStockBellMenuHeader}>
                <span className={styles.lowStockBellMenuTitle}>Low stock alerts</span>
                <span className={styles.lowStockBellMenuMeta}>
                  {lowStockCount > 0 ? `${lowStockCount}` : '0'}
                </span>
              </div>
              {lowStockCount > 0 ? (
                <div className={styles.lowStockBellMenuList}>
                  {lowStockProducts.map((p) => (
                    <div key={p.id} className={styles.lowStockBellMenuItem}>
                      <span className={styles.lowStockBellProductName}>{p.name}</span>
                      <span className={styles.lowStockBellProductStock}>{p.stock} left</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.lowStockBellEmpty}>
                  <div className={styles.lowStockBellEmptyTitle}>All good</div>
                  <div className={styles.lowStockBellEmptyText}>
                    No products are currently low on stock.
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


