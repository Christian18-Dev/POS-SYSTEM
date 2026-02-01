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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = await strictRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const authUser = await requireAdmin(request)
    await connectDB()

    const { id } = await params
    const body = await request.json()

    const quantityRaw = body?.quantity
    const noteRaw = body?.note

    const quantity = parseInt(quantityRaw, 10)
    if (isNaN(quantity) || quantity <= 0 || quantity > 999999) {
      return NextResponse.json(
        { error: 'Invalid quantity. Must be between 1 and 999999' },
        { status: 400 }
      )
    }

    const note = sanitizeString(noteRaw || '', 500)

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const product = await Product.findById(id).session(session)
      if (!product) {
        await session.abortTransaction()
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      const stockBefore = product.stock
      const stockAfter = stockBefore + quantity

      product.stock = stockAfter
      await product.save({ session })

      await InventoryMovement.create(
        [
          {
            product: product._id,
            type: 'RESTOCK',
            change: quantity,
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
        product: {
          id: product._id.toString(),
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.category,
          sku: product.sku,
          image: product.image,
        },
      })
    } finally {
      session.endSession()
    }
  } catch (error) {
    return handleApiError(error)
  }
}
