'use client'

import { useState } from 'react'
import { Sale } from '@/contexts/SalesContext'
import { bluetoothPrinterService, type BluetoothPrinter } from '@/lib/bluetoothPrinter'

interface BluetoothPrinterProps {
  sale: Sale
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

export default function BluetoothPrinter({ sale, onSuccess, onError }: BluetoothPrinterProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [connectedPrinter, setConnectedPrinter] = useState<BluetoothPrinter | null>(null)

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

  const connectPrinter = async () => {
    setIsConnecting(true)
    try {
      const printer = await bluetoothPrinterService.requestPrinter()
      if (!printer) {
        throw new Error('No printer selected')
      }

      const connected = await bluetoothPrinterService.connect()
      if (!connected) {
        throw new Error('Failed to connect to printer')
      }

      setConnectedPrinter(printer)
      onSuccess?.('Printer connected successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to printer'
      onError?.(errorMessage)
    } finally {
      setIsConnecting(false)
    }
  }

  const printReceipt = async () => {
    if (!bluetoothPrinterService.isConnected()) {
      onError?.('Please connect to a printer first')
      return
    }

    setIsPrinting(true)
    try {
      const subtotalForPrint = sale.subtotal || sale.total
      const isVatExemptCustomer = sale.customerType === 'senior' || sale.customerType === 'pwd'
      const isDiscount20Customer = sale.customerType === 'discount20'
      const isRegularCustomer = sale.customerType === 'regular'

      const vatableFallback = isRegularCustomer ? Math.round((subtotalForPrint / 1.12 + Number.EPSILON) * 100) / 100 : undefined
      const vatableSalesForPrint =
        isRegularCustomer
          ? typeof sale.vatableSales === 'number' && sale.vatableSales > 0
            ? sale.vatableSales
            : vatableFallback
          : undefined

      const vatExemptFallback = isVatExemptCustomer ? Math.round((subtotalForPrint / 1.12 + Number.EPSILON) * 100) / 100 : undefined
      const vatExemptSalesForPrint =
        typeof sale.vatExemptSales === 'number' && Math.abs(sale.vatExemptSales - subtotalForPrint) > 0.01
          ? sale.vatExemptSales
          : vatExemptFallback

      const discountFallback = isVatExemptCustomer
        ? typeof vatExemptSalesForPrint === 'number'
          ? Math.round((vatExemptSalesForPrint * 0.2 + Number.EPSILON) * 100) / 100
          : undefined
        : isDiscount20Customer
          ? Math.round((subtotalForPrint * 0.2 + Number.EPSILON) * 100) / 100
          : undefined
      const discountAmountForPrint =
        typeof sale.discountAmount === 'number' && sale.discountAmount > 0
          ? sale.discountAmount
          : discountFallback

      await bluetoothPrinterService.printReceipt({
        logoUrl: '/Logo.png',
        logoMaxWidthPx: 240,
        storeAddress: '243-D Kabatuhan Road, Deparo, Barangay 168, District 1, Caloocan City',
        storePhone: '(+63) 947 406 8136',
        invoiceId: sale.id,
        date: formatDate(sale.timestamp),
        customerName: sale.customerName || 'Walk-in',
        paymentMethod: sale.paymentMethod,
        cashReceived: sale.cashReceived,
        changeDue: sale.changeDue,
        items: sale.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        })),
        subtotal: subtotalForPrint,
        tax: sale.vatAmount,
        vatableSales: vatableSalesForPrint,
        vatExemptSales: vatExemptSalesForPrint,
        discountAmount: discountAmountForPrint,
        discountLabel:
          sale.customerType === 'pwd'
            ? 'PWD Discount (20%):'
            : sale.customerType === 'senior'
              ? 'Senior Discount (20%):'
              : sale.customerType === 'discount20'
                ? 'Discount (20%):'
                : 'Discount:',
        total: sale.total
      })

      onSuccess?.('Receipt printed successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to print receipt'
      onError?.(errorMessage)
    } finally {
      setIsPrinting(false)
    }
  }

  const disconnectPrinter = async () => {
    try {
      await bluetoothPrinterService.disconnect()
      setConnectedPrinter(null)
      onSuccess?.('Printer disconnected')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect printer'
      onError?.(errorMessage)
    }
  }

  return (
    <div className="bluetooth-printer">
      <div className="printer-status">
        <h3>Bluetooth Thermal Printer</h3>
        <div className="status-indicator">
          <span className={`status-dot ${bluetoothPrinterService.isConnected() ? 'connected' : 'disconnected'}`}></span>
          <span>
            {bluetoothPrinterService.isConnected() 
              ? `Connected to ${connectedPrinter?.name || 'Printer'}` 
              : 'Not connected'}
          </span>
        </div>
      </div>

      <div className="printer-controls">
        {!bluetoothPrinterService.isConnected() ? (
          <button
            onClick={connectPrinter}
            disabled={isConnecting}
            className="btn btn-primary"
          >
            {isConnecting ? 'Connecting...' : 'Connect Printer'}
          </button>
        ) : (
          <div className="connected-controls">
            <button
              onClick={printReceipt}
              disabled={isPrinting}
              className="btn btn-primary"
            >
              {isPrinting ? 'Printing...' : 'Print Receipt'}
            </button>
            <button
              onClick={disconnectPrinter}
              className="btn btn-secondary"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .bluetooth-printer {
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
        }

        .printer-status h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #64748b;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.connected {
          background: #10b981;
        }

        .status-dot.disconnected {
          background: #ef4444;
        }

        .printer-controls {
          margin-top: 12px;
        }

        .connected-controls {
          display: flex;
          gap: 8px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #4b5563;
        }
      `}</style>
    </div>
  )
}