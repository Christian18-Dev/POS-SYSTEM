import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import InventoryMovement from '@/models/InventoryMovement'
import { requireAuth } from '@/lib/auth'
import { sanitizeString } from '@/lib/validation'
import { handleApiError } from '@/lib/apiErrorHandler'
import { apiRateLimit } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await apiRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    await requireAuth(request)
    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    const type = searchParams.get('type')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    const page = Math.max(parseInt(pageParam || '1', 10) || 1, 1)
    const limitRaw = parseInt(limitParam || '25', 10) || 25
    const limit = Math.min(Math.max(limitRaw, 1), 100)
    const skip = (page - 1) * limit

    const query: any = {}

    if (productId) {
      query.product = sanitizeString(productId, 100)
    }

    if (type) {
      query.type = sanitizeString(type, 20)
    }

    const total = await InventoryMovement.countDocuments(query)

    const movements = await InventoryMovement.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    return NextResponse.json({
      success: true,
      movements: movements.map((m) => ({
        id: m._id.toString(),
        productId: m.product?.toString() || '',
        type: m.type,
        change: m.change,
        stockBefore: m.stockBefore,
        stockAfter: m.stockAfter,
        byUserId: m.byUserId?.toString() || undefined,
        byEmail: m.byEmail || undefined,
        note: m.note || undefined,
        timestamp: m.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
