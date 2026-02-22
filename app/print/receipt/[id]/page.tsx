'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { apiRequest } from '@/lib/api'
import { Sale } from '@/contexts/SalesContext'

export default function PrintReceiptPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <PrintReceiptContent id={params.id} />
    </ProtectedRoute>
  )
}

function PrintReceiptContent({ id }: { id: string }) {
  const router = useRouter()
  const [sale, setSale] = useState<Sale | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasPrinted, setHasPrinted] = useState(false)

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

  const getReceiptHtml = (s: Sale) => {
    const itemsHtml = s.items
      .map((item) => {
        const lineTotal = item.product.price * item.quantity
        return `
          <div class="item">
            <div class="itemHeader">
              <span class="itemName">${item.product.name}</span>
              <span class="itemPrice">₱${lineTotal.toFixed(2)}</span>
            </div>
            <div class="itemDetails">Qty: ${item.quantity} @ ₱${item.product.price.toFixed(2)}</div>
          </div>
        `
      })
      .join('')

    const hasBreakdown =
      typeof s.subtotal === 'number' ||
      typeof s.discountAmount === 'number' ||
      typeof s.vatAmount === 'number' ||
      typeof s.vatableSales === 'number' ||
      typeof s.vatExemptSales === 'number'

    const totalsHtml = hasBreakdown
      ? `
          ${typeof s.subtotal === 'number'
            ? `
          <div class="totalRow">
            <span class="totalLabel">Subtotal:</span>
            <span>${formatMoney(s.subtotal)}</span>
          </div>
          `
            : ''}

          ${typeof s.vatableSales === 'number' && s.customerType !== 'senior' && s.customerType !== 'pwd'
            ? `
          <div class="totalRow">
            <span class="totalLabel">VATable Sales:</span>
            <span>${formatMoney(s.vatableSales)}</span>
          </div>
          `
            : ''}

          ${typeof s.vatAmount === 'number' && s.customerType !== 'senior' && s.customerType !== 'pwd'
            ? `
          <div class="totalRow">
            <span class="totalLabel">VAT (12%):</span>
            <span>${formatMoney(s.vatAmount)}</span>
          </div>
          `
            : ''}

          ${typeof s.vatExemptSales === 'number' && (s.customerType === 'senior' || s.customerType === 'pwd')
            ? `
          <div class="totalRow">
            <span class="totalLabel">VAT-Exempt Sales:</span>
            <span>${formatMoney(s.vatExemptSales)}</span>
          </div>
          `
            : ''}

          ${typeof s.discountAmount === 'number' && s.discountAmount > 0
            ? `
          <div class="totalRow">
            <span class="totalLabel">${s.customerType === 'pwd' ? 'PWD Discount (20%):' : 'Senior Discount (20%):'}</span>
            <span>- ${formatMoney(s.discountAmount)}</span>
          </div>
          `
            : ''}
        `
      : `
          <div class="totalRow">
            <span class="totalLabel">Subtotal:</span>
            <span>${formatMoney(s.total)}</span>
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
            <span class="label">Invoice ID:</span>
            <span class="value">${s.id}</span>
          </div>
          <div class="infoRow">
            <span class="label">Date:</span>
            <span class="value">${formatDate(s.timestamp)}</span>
          </div>
          <div class="infoRow">
            <span class="label">Customer:</span>
            <span class="value">${s.customerName || 'Walk-in'}</span>
          </div>
          <div class="infoRow">
            <span class="label">Payment:</span>
            <span class="value">${s.paymentMethod.toUpperCase()}</span>
          </div>
        </div>

        <div class="items">
          ${itemsHtml}
        </div>

        <div class="totals">
          ${totalsHtml}
          <div class="totalRow">
            <span class="totalLabel">Total:</span>
            <span class="totalAmount">${formatMoney(s.total)}</span>
          </div>
        </div>

        <div class="footer">THIS SERVES AS YOUR INVOICE</div>
      </div>
    `
  }

  useEffect(() => {
    const fetchSale = async () => {
      setIsLoading(true)
      try {
        const data = await apiRequest<{ success: boolean; sale: Sale }>(`/api/sales/${encodeURIComponent(id)}`)
        if (data.success) {
          setSale(data.sale)
        } else {
          setSale(null)
        }
      } catch {
        setSale(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSale()
  }, [id])

  useEffect(() => {
    if (!sale) return
    if (hasPrinted) return

    setHasPrinted(true)

    const t = window.setTimeout(() => {
      window.print()
    }, 250)

    return () => window.clearTimeout(t)
  }, [sale, hasPrinted])

  return (
    <div className="printPage">
      <style>{`
        @page {
          size: 58mm auto;
          margin: 0;
        }
        :root {
          color-scheme: light;
        }
        html, body {
          height: 100%;
          background: #f8fafc;
        }

        .printPage {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .actionBar {
          position: sticky;
          top: 0;
          z-index: 10;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #e2e8f0;
        }

        .actionBarInner {
          max-width: 960px;
          margin: 0 auto;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .actionTitle {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .actionTitle h1 {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }

        .actionTitle p {
          font-size: 12px;
          color: #64748b;
          line-height: 1.2;
        }

        .actionButtons {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .btn {
          appearance: none;
          border: 1px solid transparent;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          user-select: none;
        }

        .btn:active {
          transform: translateY(1px);
        }

        .btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.25);
        }

        .btnSecondary {
          background: #ffffff;
          border-color: #e2e8f0;
          color: #0f172a;
        }

        .btnSecondary:hover {
          background: #f8fafc;
        }

        .btnPrimary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          box-shadow: 0 10px 18px rgba(102, 126, 234, 0.18);
        }

        .btnPrimary:hover {
          box-shadow: 0 14px 24px rgba(102, 126, 234, 0.26);
        }

        .content {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 18px 12px 28px;
        }

        .previewShell {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 12px 30px rgba(2, 6, 23, 0.08);
        }

        .receiptViewport {
          width: 58mm;
          margin: 0;
          padding: 6mm 4mm;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          background: #ffffff;
        }

        .receipt {
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
          font-size: 10px;
          color: #475569;
          line-height: 1.35;
        }

        @media print {
          html, body {
            background: #fff !important;
          }
          .actionBar {
            display: none !important;
          }
          .content {
            padding: 0 !important;
          }
          .previewShell {
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .receiptViewport {
            padding: 6mm 4mm;
          }
        }
      `}</style>

      <div className="actionBar">
        <div className="actionBarInner">
          <div className="actionTitle">
            <h1>Receipt Print Preview</h1>
            <p>58mm thermal printer layout</p>
          </div>
          <div className="actionButtons">
            <button className="btn btnSecondary" onClick={() => router.back()} type="button">
              Back
            </button>
            <button className="btn btnPrimary" onClick={() => window.print()} type="button">
              Print
            </button>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="previewShell">
          <div className="receiptViewport">
            {isLoading ? (
              <div>Loading…</div>
            ) : sale ? (
              <div dangerouslySetInnerHTML={{ __html: getReceiptHtml(sale) }} />
            ) : (
              <div>Receipt not found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
