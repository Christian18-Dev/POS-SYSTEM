import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Sale from '@/models/Sale'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/apiErrorHandler'
import mongoose from 'mongoose'
import Counter from '@/models/Counter'
import { sanitizeRegexInput, sanitizeString } from '@/lib/validation'
import { apiRateLimit, strictRateLimit } from '@/lib/rateLimit'
import InventoryMovement from '@/models/InventoryMovement'

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await apiRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    await requireAuth(request)
    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    let query: any = {}

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    if (search) {
      const sanitizedSearch = sanitizeRegexInput(sanitizeString(search, 100))
      query.$or = [
        { orderId: { $regex: sanitizedSearch, $options: 'i' } },
        { customerName: { $regex: sanitizedSearch, $options: 'i' } },
      ]
    }

    // Pagination (optional): if page/limit is omitted, keep existing behavior (return all)
    const hasPagination = pageParam !== null || limitParam !== null
    const page = Math.max(parseInt(pageParam || '1', 10) || 1, 1)
    const limitRaw = parseInt(limitParam || '25', 10) || 25
    const limit = Math.min(Math.max(limitRaw, 1), 100) // safety cap
    const skip = (page - 1) * limit

    const total = hasPagination ? await Sale.countDocuments(query) : undefined

    const findQuery = Sale.find(query)
      .populate('items.product', 'name sku price')
      .sort({ createdAt: -1 })
    const sales = hasPagination ? await findQuery.skip(skip).limit(limit) : await findQuery

    return NextResponse.json({
      success: true,
      sales: sales.map((sale) => ({
        id: sale.orderId,
        items: sale.items.map((item: any) => ({
          product: {
            id: item.product?._id?.toString() || '',
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
      })),
      ...(hasPagination && total !== undefined
        ? {
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.max(1, Math.ceil(total / limit)),
            },
          }
        : {}),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await strictRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const authUser = await requireAuth(request)
    await connectDB()

    const body = await request.json()
    const { items, customerName, paymentMethod, customerType } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      )
    }

    // Validate payment method
    if (paymentMethod && !['cash', 'card', 'other'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    const resolvedCustomerType: 'regular' | 'senior' = customerType === 'senior' ? 'senior' : 'regular'

    // Transaction: stock updates + sale creation must succeed together
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const saleItems: any[] = []
      const movementDrafts: Array<{
        product: any
        type: 'SALE'
        change: number
        stockBefore: number
        stockAfter: number
        byUserId?: string
        byEmail?: string
      }> = []
      let subtotal = 0

      for (const item of items) {
        // Validate item structure
        if (!item.productId || !item.quantity) {
          return NextResponse.json(
            { error: 'Invalid item format. Each item must have productId and quantity' },
            { status: 400 }
          )
        }

        // Validate quantity
        const quantity = parseInt(item.quantity)
        if (isNaN(quantity) || quantity <= 0 || quantity > 9999) {
          return NextResponse.json(
            { error: 'Invalid quantity. Must be between 1 and 9999' },
            { status: 400 }
          )
        }

        // Atomically decrement stock, guarded by "stock >= quantity"
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } },
          { new: true, session }
        )

        if (!updatedProduct) {
          // Differentiate "not found" vs "insufficient stock"
          const existingProduct = await Product.findById(item.productId).session(session)
          if (!existingProduct) {
            await session.abortTransaction()
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
          }

          await session.abortTransaction()
          return NextResponse.json(
            {
              error: `Insufficient stock for ${existingProduct.name}. Available: ${existingProduct.stock}, Requested: ${quantity}`,
            },
            { status: 400 }
          )
        }

        const stockAfter = updatedProduct.stock
        const stockBefore = stockAfter + quantity

        movementDrafts.push({
          product: updatedProduct._id,
          type: 'SALE',
          change: -quantity,
          stockBefore,
          stockAfter,
          byUserId: authUser.userId,
          byEmail: authUser.email,
        })

        subtotal += updatedProduct.price * quantity

        saleItems.push({
          product: updatedProduct._id,
          quantity,
          price: updatedProduct.price,
          productName: updatedProduct.name,
          productSku: updatedProduct.sku,
        })
      }

      const businessTimeZone = process.env.BUSINESS_TIME_ZONE || 'Asia/Manila'
      const now = new Date()
      const dateParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: businessTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(now)

      const yyyy = dateParts.find((p) => p.type === 'year')?.value
      const mm = dateParts.find((p) => p.type === 'month')?.value
      const dd = dateParts.find((p) => p.type === 'day')?.value

      if (!yyyy || !mm || !dd) {
        throw new Error('Failed to compute orderId date key')
      }

      const dateKey = `${yyyy}${mm}${dd}`

      const counterKey = `sales:${dateKey}`
      const counterDoc = await Counter.findOneAndUpdate(
        { key: counterKey },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session }
      )

      const orderId = `FBT-${dateKey}-${String(counterDoc.seq).padStart(4, '0')}`

      const VAT_RATE = 0.12
      const discountRate = resolvedCustomerType === 'senior' ? 0.2 : 0

      const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

      // Assumption: item prices are VAT-inclusive.
      // Regular customer: total due equals subtotal; VAT is only for reporting/breakdown.
      // Senior: VAT-exempt + 20% discount on the VAT-exempt sales base.
      const vatableSales = resolvedCustomerType === 'regular' ? subtotal / (1 + VAT_RATE) : 0
      const vatAmount = resolvedCustomerType === 'regular' ? subtotal - vatableSales : 0
      const vatExemptSales = resolvedCustomerType === 'senior' ? subtotal / (1 + VAT_RATE) : 0
      const discountAmount = resolvedCustomerType === 'senior' ? vatExemptSales * discountRate : 0

      const totalDue = resolvedCustomerType === 'senior'
        ? vatExemptSales - discountAmount
        : subtotal

      const saleTotal = round2(totalDue)

      const effectiveVatRate = resolvedCustomerType === 'regular' ? VAT_RATE : 0

      // Create sale inside the transaction
      const [sale] = await Sale.create(
        [
          {
            orderId,
            items: saleItems,
            total: saleTotal,
            customerType: resolvedCustomerType,
            subtotal: round2(subtotal),
            discountRate: discountRate || undefined,
            discountAmount: discountAmount ? round2(discountAmount) : undefined,
            vatRate: effectiveVatRate,
            vatAmount: effectiveVatRate > 0 && vatAmount ? round2(vatAmount) : 0,
            vatableSales: round2(vatableSales),
            vatExemptSales: round2(vatExemptSales),
            customerName: customerName || '',
            paymentMethod: paymentMethod || 'cash',
            status: 'completed',
          },
        ],
        { session }
      )

      if (movementDrafts.length > 0) {
        await InventoryMovement.create(
          movementDrafts.map((m) => ({
            ...m,
            note: `Order ${orderId}`,
          })),
          { session, ordered: true }
        )
      }

      await session.commitTransaction()

      return NextResponse.json({
        success: true,
        sale: {
          id: sale.orderId,
          items: sale.items.map((item: any) => ({
            product: {
              id: item.product.toString(),
              name: item.productName,
              sku: item.productSku,
              price: item.price,
            },
            quantity: item.quantity,
          })),
          total: sale.total,
          customerType: sale.customerType,
          subtotal: sale.subtotal,
          discountRate: sale.discountRate,
          discountAmount: sale.discountAmount,
          vatRate: sale.vatRate,
          vatAmount: sale.vatAmount,
          vatableSales: sale.vatableSales,
          vatExemptSales: sale.vatExemptSales,
          customerName: sale.customerName || undefined,
          paymentMethod: sale.paymentMethod,
          timestamp: sale.createdAt.toISOString(),
          status: sale.status,
        },
      })
    } finally {
      session.endSession()
    }
  } catch (error) {
    return handleApiError(error)
  }
}
