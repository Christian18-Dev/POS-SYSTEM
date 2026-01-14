import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Sale from '@/models/Sale'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/apiErrorHandler'
import mongoose from 'mongoose'
import { randomUUID } from 'crypto'
import { sanitizeRegexInput, sanitizeString } from '@/lib/validation'
import { apiRateLimit, strictRateLimit } from '@/lib/rateLimit'

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

    await requireAuth(request)
    await connectDB()

    const body = await request.json()
    const { items, customerName, paymentMethod } = body

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

    // Transaction: stock updates + sale creation must succeed together
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const saleItems: any[] = []
      let total = 0

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

        total += updatedProduct.price * quantity

        saleItems.push({
          product: updatedProduct._id,
          quantity,
          price: updatedProduct.price,
          productName: updatedProduct.name,
          productSku: updatedProduct.sku,
        })
      }

      // Generate order ID (lower collision risk than timestamp-based IDs)
      const orderId = `ORD-${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`

      // Create sale inside the transaction
      const [sale] = await Sale.create(
        [
          {
            orderId,
            items: saleItems,
            total,
            customerName: customerName || '',
            paymentMethod: paymentMethod || 'cash',
            status: 'completed',
          },
        ],
        { session }
      )

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
