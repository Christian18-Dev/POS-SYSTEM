import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Sale from '@/models/Sale'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/apiErrorHandler'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query: any = {}

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    const sales = await Sale.find(query)
      .populate('items.product', 'name sku price')
      .sort({ createdAt: -1 })

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
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Validate and update stock for each item
    const saleItems = []
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

      const product = await Product.findById(item.productId)

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      if (product.stock < quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`,
          },
          { status: 400 }
        )
      }

      // Update stock
      product.stock -= quantity
      await product.save()

      const itemTotal = product.price * quantity
      total += itemTotal

      saleItems.push({
        product: product._id,
        quantity: quantity,
        price: product.price,
        productName: product.name,
        productSku: product.sku,
      })
    }

    // Generate order ID
    const orderId = `ORD-${Date.now().toString(36).toUpperCase().substr(0, 6)}`

    // Create sale
    const sale = new Sale({
      orderId,
      items: saleItems,
      total,
      customerName: customerName || '',
      paymentMethod: paymentMethod || 'cash',
      status: 'completed',
    })

    await sale.save()

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
  } catch (error) {
    return handleApiError(error)
  }
}
