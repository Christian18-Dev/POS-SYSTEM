'use client'

import { useRef } from 'react'
import { Sale } from '@/contexts/SalesContext'
import styles from './Receipt.module.css'

interface ReceiptProps {
  sale: Sale
  onPrint?: () => void
  hidePrintButton?: boolean
}

export default function Receipt({ sale, onPrint, hidePrintButton }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  const formatMoney = (n: number) => `₱${n.toFixed(2)}`

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

  const getPrintableReceiptHtml = () => {
    const itemsHtml = sale.items
      .map((item) => {
        const lineTotal = item.product.price * item.quantity
        return `
          <div class="item">
            <div class="itemHeader">
              <span class="itemName">${item.product.name}</span>
              <span class="itemPrice">${formatMoney(lineTotal)}</span>
            </div>
            <div class="itemDetails">Qty: ${item.quantity} @ ${formatMoney(item.product.price)}</div>
          </div>
        `
      })
      .join('')

    const hasBreakdown =
      typeof sale.subtotal === 'number' ||
      typeof sale.discountAmount === 'number' ||
      typeof sale.vatAmount === 'number' ||
      typeof sale.vatableSales === 'number' ||
      typeof sale.vatExemptSales === 'number'

    const totalsHtml = hasBreakdown
      ? `
          ${typeof sale.subtotal === 'number'
            ? `
          <div class="totalRow">
            <span class="totalLabel">Subtotal:</span>
            <span>${formatMoney(sale.subtotal)}</span>
          </div>
          `
            : ''}

          ${typeof sale.vatableSales === 'number' && sale.customerType !== 'senior' && sale.customerType !== 'pwd'
            ? `
          <div class="totalRow">
            <span class="totalLabel">VATable Sales:</span>
            <span>${formatMoney(sale.vatableSales)}</span>
          </div>
          `
            : ''}

          ${typeof sale.vatAmount === 'number' && sale.customerType !== 'senior' && sale.customerType !== 'pwd'
            ? `
          <div class="totalRow">
            <span class="totalLabel">VAT (12%):</span>
            <span>${formatMoney(sale.vatAmount)}</span>
          </div>
          `
            : ''}

          ${typeof sale.vatExemptSales === 'number' && (sale.customerType === 'senior' || sale.customerType === 'pwd')
            ? `
          <div class="totalRow">
            <span class="totalLabel">VAT-Exempt Sales:</span>
            <span>${formatMoney(sale.vatExemptSales)}</span>
          </div>
          `
            : ''}

          ${typeof sale.discountAmount === 'number' && sale.discountAmount > 0
            ? `
          <div class="totalRow">
            <span class="totalLabel">${sale.customerType === 'pwd' ? 'PWD Discount (20%):' : 'Senior Discount (20%):'}</span>
            <span>- ${formatMoney(sale.discountAmount)}</span>
          </div>
          `
            : ''}
        `
      : `
          <div class="totalRow">
            <span class="totalLabel">Subtotal:</span>
            <span>${formatMoney(sale.total)}</span>
          </div>
        `

    return `
      <div class="receipt">
        <div class="header">
          <img class="storeLogo" src="/FarmaciaLogo.png" alt="Farmacia Logo" />
          <div class="storeInfo">
            <div>243-D Kabatuhan Road, Deparo, Barangay 168, District 1, Caloocan City</div>
            <div>(+63) 947 406 8136</div>
          </div>
        </div>

        <div class="orderInfo">
          <div class="infoRow">
            <span class="label">Order ID:</span>
            <span class="value">${sale.id}</span>
          </div>
          <div class="infoRow">
            <span class="label">Date:</span>
            <span class="value">${formatDate(sale.timestamp)}</span>
          </div>
          <div class="infoRow">
            <span class="label">Customer:</span>
            <span class="value">${sale.customerName || 'Walk-in'}</span>
          </div>
          <div class="infoRow">
            <span class="label">Payment:</span>
            <span class="value">${sale.paymentMethod.toUpperCase()}</span>
          </div>
        </div>

        <div class="items">
          ${itemsHtml}
        </div>

        <div class="totals">
          ${totalsHtml}
          <div class="totalRow">
            <span class="totalLabel">Total:</span>
            <span class="totalAmount">${formatMoney(sale.total)}</span>
          </div>
        </div>

        <div class="footer">THIS SERVES AS YOUR INVOICE</div>
      </div>
    `
  }

  const getPrintableCss = () => {
    return `
      @page {
        size: 58mm auto;
        margin: 0;
      }
      :root { color-scheme: light; }
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        background: #ffffff;
      }
      body {
        font-family: 'Courier New', monospace;
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }
      .receiptViewport {
        width: 58mm;
        margin: 0 auto;
        padding: 6mm 4mm;
        font-size: 12px;
        background: #ffffff;
      }
      .header {
        text-align: center;
        margin-bottom: 14px;
        border-bottom: 2px dashed #000;
        padding-bottom: 10px;
      }
      .storeName {
        font-size: 16px;
        font-weight: 800;
        letter-spacing: 0.4px;
        margin-bottom: 4px;
      }

      .storeLogo {
        display: block;
        max-width: 120px;
        width: 100%;
        max-height: 60px;
        height: auto;
        margin: 0 auto 8px;
        object-fit: contain;
      }
      .storeInfo {
        font-size: 10px;
        color: #475569;
        line-height: 1.35;
      }
      .orderInfo {
        margin: 10px 0 12px;
        font-size: 11px;
      }
      .infoRow {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 5px;
      }
      .label {
        font-weight: 700;
        color: #0f172a;
        white-space: nowrap;
      }

      .value {
        text-align: right;
        overflow-wrap: anywhere;
      }
      .items {
        margin: 10px 0 12px;
        border-top: 1px dashed #000;
        border-bottom: 1px dashed #000;
        padding: 10px 0;
      }
      .item {
        margin-bottom: 10px;
      }
      .item:last-child {
        margin-bottom: 0;
      }
      .itemHeader {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 3px;
      }
      .itemName {
        font-weight: 700;
        color: #0f172a;
        flex: 1;
      }
      .itemPrice {
        font-weight: 700;
        color: #0f172a;
        white-space: nowrap;
      }
      .itemDetails {
        font-size: 10px;
        color: #475569;
        padding-left: 8px;
      }
      .totals {
        margin-top: 10px;
      }
      .totalRow {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
        font-size: 11px;
      }
      .totalLabel {
        font-weight: 700;
        color: #0f172a;
      }
      .totalAmount {
        font-weight: 900;
        font-size: 13px;
      }

      .footer {
        text-align: center;
        margin-top: 14px;
        padding-top: 10px;
        border-top: 2px dashed #000;
        font-size: 9px;
        color: #475569;
        line-height: 1.35;
        letter-spacing: 0.2px;
      }
    `.trim()
  }

  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    }

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.style.opacity = '0'
    iframe.setAttribute('aria-hidden', 'true')

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Receipt ${sale.id}</title>
    <style>${getPrintableCss()}</style>
  </head>
  <body>
    <div class="receiptViewport">
      ${getPrintableReceiptHtml()}
    </div>
  </body>
</html>`

    iframe.srcdoc = html
    document.body.appendChild(iframe)

    const cleanup = () => {
      try {
        iframe.remove()
      } catch {
        // ignore
      }
    }

    iframe.onload = () => {
      const w = iframe.contentWindow
      if (!w) {
        cleanup()
        return
      }

      w.focus()
      w.print()

      window.setTimeout(() => {
        cleanup()
      }, 1000)
    }
  }

  return (
    <div className={styles.receiptContainer}>
      <div ref={receiptRef} className={styles.receipt}>
        <div className={styles.header}>
          <img className={styles.storeLogo} src="/FarmaciaLogo.png" alt="Farmacia Logo" />
          <div className={styles.storeInfo}>
            <div>243-D Kabatuhan Road, Deparo, Barangay 168, District 1, Caloocan City</div>
            <div>(+63) 947 406 8136</div>
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
                  {formatMoney(item.product.price * item.quantity)}
                </span>
              </div>
              <div className={styles.itemDetails}>
                Qty: {item.quantity} @ {formatMoney(item.product.price)}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.totals}>
          {typeof sale.subtotal === 'number' && (
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Subtotal:</span>
              <span>{formatMoney(sale.subtotal)}</span>
            </div>
          )}

          {sale.customerType !== 'senior' && sale.customerType !== 'pwd' && typeof sale.vatableSales === 'number' && (
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>VATable Sales:</span>
              <span>{formatMoney(sale.vatableSales)}</span>
            </div>
          )}

          {sale.customerType !== 'senior' && sale.customerType !== 'pwd' && typeof sale.vatAmount === 'number' && (
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>VAT (12%):</span>
              <span>{formatMoney(sale.vatAmount)}</span>
            </div>
          )}

          {(sale.customerType === 'senior' || sale.customerType === 'pwd') && typeof sale.vatExemptSales === 'number' && (
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>VAT-Exempt Sales:</span>
              <span>{formatMoney(sale.vatExemptSales)}</span>
            </div>
          )}

          {typeof sale.discountAmount === 'number' && sale.discountAmount > 0 && (
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>
                {sale.customerType === 'pwd' ? 'PWD Discount (20%):' : 'Senior Discount (20%):'}
              </span>
              <span>- {formatMoney(sale.discountAmount)}</span>
            </div>
          )}

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total:</span>
            <span className={styles.totalAmount}>{formatMoney(sale.total)}</span>
          </div>
        </div>

        <div className={styles.footer}>THIS SERVES AS YOUR INVOICE</div>
      </div>

      {!hidePrintButton && (
        <div className={styles.printButtonContainer}>
          <button onClick={handlePrint} className={styles.printButton}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 5V2.5C5 2.22386 5.22386 2 5.5 2H14.5C14.7761 2 15 2.22386 15 2.5V5M5 5H3.5C2.67157 5 2 5.67157 2 6.5V14.5C2 15.3284 2.67157 16 3.5 16H5M5 5H15M15 5H16.5C17.3284 5 18 5.67157 18 6.5V14.5C18 15.3284 17.3284 16 16.5 16H15M5 16V18.5C5 18.7761 5.22386 19 5.5 19H14.5C14.7761 19 15 18.7761 15 18.5V16M5 16H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Print Receipt
          </button>
        </div>
      )}
    </div>
  )
}

