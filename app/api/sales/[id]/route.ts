import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Sale from '@/models/Sale'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/apiErrorHandler'
import { apiRateLimit } from '@/lib/rateLimit'
import { sanitizeString } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = await apiRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    await requireAuth(request)
    await connectDB()

    const { id } = await params

    const orderId = sanitizeString(id, 100).toUpperCase()

    const sale = await Sale.findOne({ orderId })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      sale: {
        id: sale.orderId,
        items: sale.items.map((item: any) => ({
          product: {
            id: item.product?.toString?.() || '',
            name: item.productName,
            sku: item.productSku,
            price: item.price,
          },
          quantity: item.quantity,
        })),
        total: sale.total,
        customerType: (sale as any).customerType,
        subtotal: (sale as any).subtotal,
        discountRate: (sale as any).discountRate,
        discountAmount: (sale as any).discountAmount,
        vatRate: (sale as any).vatRate,
        vatAmount: (sale as any).vatAmount,
        vatableSales: (sale as any).vatableSales,
        vatExemptSales: (sale as any).vatExemptSales,
        customerName: sale.customerName || undefined,
        paymentMethod: sale.paymentMethod,
        timestamp: sale.createdAt.toISOString(),
        status: sale.status,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
