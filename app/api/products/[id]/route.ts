import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import { requireAuth } from '@/lib/auth'
import { sanitizeString, validatePrice, validateStock } from '@/lib/validation'
import { handleApiError } from '@/lib/apiErrorHandler'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    await connectDB()

    const product = await Product.findById(params.id)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

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
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    await connectDB()

    const body = await request.json()
    const { name, description, price, stock, category, sku, image } = body

    const product = await Product.findById(params.id)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Sanitize and validate inputs
    if (name !== undefined) {
      product.name = sanitizeString(name, 200)
    }
    if (description !== undefined) {
      product.description = sanitizeString(description, 1000)
    }
    if (price !== undefined) {
      if (!validatePrice(price)) {
        return NextResponse.json(
          { error: 'Invalid price. Must be a number between 0 and 999999.99' },
          { status: 400 }
        )
      }
      product.price = parseFloat(price)
    }
    if (stock !== undefined) {
      if (!validateStock(stock)) {
        return NextResponse.json(
          { error: 'Invalid stock. Must be a number between 0 and 999999' },
          { status: 400 }
        )
      }
      product.stock = parseInt(stock)
    }
    if (category !== undefined) {
      product.category = sanitizeString(category, 50)
    }
    if (sku !== undefined) {
      const sanitizedSku = sanitizeString(sku, 50).toUpperCase()
      // If SKU is being changed, check if new SKU already exists
      if (sanitizedSku !== product.sku) {
        const existingProduct = await Product.findOne({ sku: sanitizedSku })
        if (existingProduct) {
          return NextResponse.json(
            { error: 'Product with this SKU already exists' },
            { status: 400 }
          )
        }
      }
      product.sku = sanitizedSku
    }
    if (image !== undefined) {
      product.image = sanitizeString(image, 500)
    }

    await product.save()

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
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request)
    await connectDB()

    const product = await Product.findByIdAndDelete(params.id)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
