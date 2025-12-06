'use client'

import { useRef } from 'react'
import { Sale } from '@/contexts/SalesContext'
import styles from './Receipt.module.css'

interface ReceiptProps {
  sale: Sale
  onPrint?: () => void
}

export default function Receipt({ sale, onPrint }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const receiptContent = receiptRef.current?.innerHTML || ''
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${sale.id}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
            }
            .receipt {
              background: white;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px dashed #000;
              padding-bottom: 15px;
            }
            .storeName {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .storeInfo {
              font-size: 10px;
              color: #666;
              line-height: 1.4;
            }
            .orderInfo {
              margin-bottom: 15px;
              font-size: 11px;
            }
            .infoRow {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .label {
              font-weight: bold;
            }
            .items {
              margin-bottom: 15px;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 10px 0;
            }
            .item {
              margin-bottom: 10px;
            }
            .itemHeader {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .itemName {
              font-weight: bold;
              flex: 1;
            }
            .itemPrice {
              font-weight: bold;
            }
            .itemDetails {
              font-size: 10px;
              color: #666;
              margin-left: 10px;
            }
            .totals {
              margin-bottom: 15px;
            }
            .totalRow {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 11px;
            }
            .totalLabel {
              font-weight: bold;
            }
            .totalAmount {
              font-weight: bold;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 2px dashed #000;
              font-size: 10px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
              }
              .receipt {
                padding: 15px;
              }
            }
          </style>
        </head>
        <body>
          ${receiptContent}
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
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

  return (
    <div className={styles.receiptContainer}>
      <div ref={receiptRef} className={styles.receipt}>
        <div className={styles.header}>
          <div className={styles.storeName}>POS SYSTEM</div>
          <div className={styles.storeInfo}>
            <div>123 Business Street</div>
            <div>City, Country 12345</div>
            <div>Tel: (123) 456-7890</div>
          </div>
        </div>

        <div className={styles.orderInfo}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Order ID:</span>
            <span>{sale.id}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Date:</span>
            <span>{formatDate(sale.timestamp)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Customer:</span>
            <span>{sale.customerName || 'Walk-in'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Payment:</span>
            <span>{sale.paymentMethod.toUpperCase()}</span>
          </div>
        </div>

        <div className={styles.items}>
          {sale.items.map((item, index) => (
            <div key={index} className={styles.item}>
              <div className={styles.itemHeader}>
                <span className={styles.itemName}>{item.product.name}</span>
                <span className={styles.itemPrice}>
                  ₱{(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
              <div className={styles.itemDetails}>
                {item.quantity} × ₱{item.product.price.toFixed(2)} • SKU: {item.product.sku}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Subtotal:</span>
            <span>₱{sale.total.toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total:</span>
            <span className={styles.totalAmount}>₱{sale.total.toFixed(2)}</span>
          </div>
        </div>

        <div className={styles.footer}>
          <div>Thank you for your business!</div>
          <div style={{ marginTop: '5px' }}>Have a great day!</div>
        </div>
      </div>

      <div className={styles.printButtonContainer}>
        <button onClick={handlePrint} className={styles.printButton}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 5V2.5C5 2.22386 5.22386 2 5.5 2H14.5C14.7761 2 15 2.22386 15 2.5V5M5 5H3.5C2.67157 5 2 5.67157 2 6.5V14.5C2 15.3284 2.67157 16 3.5 16H5M5 5H15M15 5H16.5C17.3284 5 18 5.67157 18 6.5V14.5C18 15.3284 17.3284 16 16.5 16H15M5 16V18.5C5 18.7761 5.22386 19 5.5 19H14.5C14.7761 19 15 18.7761 15 18.5V16M5 16H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Print Receipt
        </button>
      </div>
    </div>
  )
}

