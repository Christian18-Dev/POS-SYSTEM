import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IProductBatch {
  quantity: number
  manufacturingDate?: Date | null
  expirationDate: Date
  receivedAt: Date
}

export interface IProduct extends Document {
  name: string
  brand?: string
  description: string
  price: number
  cost?: number
  stock: number
  category: string
  sku: string
  image?: string
  manufacturingDate?: Date | null
  expirationDate?: Date
  batches?: IProductBatch[]
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
    brand: {
      type: String,
      default: '',
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
    cost: {
      type: Number,
      min: 0,
      default: 0,
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
    manufacturingDate: {
      type: Date,
      default: null,
    },
    expirationDate: {
      type: Date,
      default: null,
    },
    batches: {
      type: [
        {
          quantity: {
            type: Number,
            required: true,
            min: 0,
          },
          manufacturingDate: {
            type: Date,
            default: null,
          },
          expirationDate: {
            type: Date,
            required: true,
          },
          receivedAt: {
            type: Date,
            required: true,
            default: () => new Date(),
          },
        },
      ],
      default: [],
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
