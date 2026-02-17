import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import { requireAdmin, requireAuth } from '@/lib/auth'
import { sanitizeRegexInput, sanitizeString, validatePrice, validateStock } from '@/lib/validation'
import { handleApiError } from '@/lib/apiErrorHandler'
import { apiRateLimit, strictRateLimit } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  try {
    // Apply generic API rate limiting
    const rateLimitResponse = await apiRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    await requireAuth(request)
    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    let query: any = {}

    if (search) {
      // Sanitize regex input to prevent injection
      const sanitizedSearch = sanitizeRegexInput(sanitizeString(search, 100))
      query.$or = [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { sku: { $regex: sanitizedSearch, $options: 'i' } },
        { category: { $regex: sanitizedSearch, $options: 'i' } },
        { description: { $regex: sanitizedSearch, $options: 'i' } },
      ]
    }

    if (category) {
      query.category = sanitizeString(category, 50)
    }

    // Pagination (optional): if page/limit is omitted, keep existing behavior (return all)
    const hasPagination = pageParam !== null || limitParam !== null
    const page = Math.max(parseInt(pageParam || '1', 10) || 1, 1)
    const limitRaw = parseInt(limitParam || '24', 10) || 24
    const limit = Math.min(Math.max(limitRaw, 1), 100) // safety cap
    const skip = (page - 1) * limit

    const total = hasPagination ? await Product.countDocuments(query) : undefined

    const findQuery = Product.find(query).sort({ createdAt: -1 })
    const products = hasPagination ? await findQuery.skip(skip).limit(limit) : await findQuery

    return NextResponse.json({
      success: true,
      products: products.map((product) => ({
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        cost: (product as any).cost,
        stock: product.stock,
        category: product.category,
        sku: product.sku,
        image: product.image,
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
    // Stricter rate limit for write operations
    const rateLimitResponse = await strictRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    await requireAdmin(request)
    await connectDB()

    const body = await request.json()
    const { name, description, price, cost, stock, category, sku, image } = body

    // Validation
    if (!name || !price || stock === undefined || !category || !sku) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Sanitize and validate inputs
    const sanitizedName = sanitizeString(name, 200)
    const sanitizedDescription = sanitizeString(description || '', 1000)
    const sanitizedCategory = sanitizeString(category, 50)
    const sanitizedSku = sanitizeString(sku, 50).toUpperCase()
    const sanitizedImage = sanitizeString(image || '', 500)

    if (!validatePrice(price)) {
      return NextResponse.json(
        { error: 'Invalid price. Must be a number between 0 and 999999.99' },
        { status: 400 }
      )
    }

    if (cost !== undefined && !validatePrice(cost)) {
      return NextResponse.json(
        { error: 'Invalid cost. Must be a number between 0 and 999999.99' },
        { status: 400 }
      )
    }

    if (!validateStock(stock)) {
      return NextResponse.json(
        { error: 'Invalid stock. Must be a number between 0 and 999999' },
        { status: 400 }
      )
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: sanitizedSku })
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists' },
        { status: 400 }
      )
    }

    const product = new Product({
      name: sanitizedName,
      description: sanitizedDescription,
      price: parseFloat(price),
      cost: cost === undefined ? 0 : parseFloat(cost),
      stock: parseInt(stock),
      category: sanitizedCategory,
      sku: sanitizedSku,
      image: sanitizedImage,
    })

    await product.save()

    return NextResponse.json({
      success: true,
      product: {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        cost: (product as any).cost,
        stock: product.stock,
        category: product.category,
        sku: product.sku,
        image: product.image,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
