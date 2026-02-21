import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import InventoryMovement from '@/models/InventoryMovement'
import { requireAdmin } from '@/lib/auth'
import { sanitizeString } from '@/lib/validation'
import { handleApiError } from '@/lib/apiErrorHandler'
import { strictRateLimit } from '@/lib/rateLimit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; batchId: string }> }
) {
  try {
    const rateLimitResponse = await strictRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const authUser = await requireAdmin(request)
    await connectDB()

    const { id, batchId } = await params

    const body = await request.json().catch(() => ({}))
    const noteRaw = body?.note
    const note = sanitizeString(noteRaw || `Expired batch write-off: ${batchId}`, 500)

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const product = await Product.findById(id).session(session)
      if (!product) {
        await session.abortTransaction()
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      ;(product as any).batches = Array.isArray((product as any).batches) ? (product as any).batches : []

      const batches: any[] = (product as any).batches
      const target = batches.find((b: any) => String(b?._id) === String(batchId))

      if (!target) {
        await session.abortTransaction()
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
      }

      const qtyBefore = typeof target.quantity === 'number' ? target.quantity : 0
      if (qtyBefore <= 0) {
        await session.abortTransaction()
        return NextResponse.json({ error: 'Batch quantity is already 0' }, { status: 400 })
      }

      const stockBefore = product.stock
      const removeQty = qtyBefore
      const stockAfter = Math.max(0, stockBefore - removeQty)

      target.quantity = 0
      product.stock = stockAfter

      const nextExpiry = (product as any).batches
        .filter((b: any) => b && typeof b.quantity === 'number' && b.quantity > 0 && b.expirationDate)
        .map((b: any) => new Date(b.expirationDate))
        .filter((d: Date) => !Number.isNaN(d.getTime()))
        .sort((a: Date, b: Date) => a.getTime() - b.getTime())[0]

      ;(product as any).expirationDate = nextExpiry || null

      await product.save({ session })

      await InventoryMovement.create(
        [
          {
            product: product._id,
            type: 'EXPIRED',
            change: -removeQty,
            stockBefore,
            stockAfter,
            byUserId: authUser.userId,
            byEmail: authUser.email,
            note,
          },
        ],
        { session }
      )

      await session.commitTransaction()

      return NextResponse.json({
        success: true,
        removed: removeQty,
        product: {
          id: product._id.toString(),
          name: product.name,
          brand: (product as any).brand,
          description: product.description,
          price: product.price,
          cost: (product as any).cost,
          stock: product.stock,
          category: product.category,
          sku: product.sku,
          image: product.image,
          expirationDate: (product as any).expirationDate ? new Date((product as any).expirationDate).toISOString() : null,
          batches: Array.isArray((product as any).batches)
            ? (product as any).batches.map((b: any) => ({
                id: b?._id?.toString?.() || '',
                quantity: typeof b?.quantity === 'number' ? b.quantity : 0,
                manufacturingDate: b?.manufacturingDate ? new Date(b.manufacturingDate).toISOString() : null,
                expirationDate: b?.expirationDate ? new Date(b.expirationDate).toISOString() : null,
                receivedAt: b?.receivedAt ? new Date(b.receivedAt).toISOString() : null,
              }))
            : [],
        },
      })
    } finally {
      session.endSession()
    }
  } catch (error) {
    return handleApiError(error)
  }
}
