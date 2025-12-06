import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IProduct extends Document {
  name: string
  description: string
  price: number
  stock: number
  category: string
  sku: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster searches
ProductSchema.index({ name: 'text', description: 'text', category: 'text', sku: 'text' })

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)

export default Product
