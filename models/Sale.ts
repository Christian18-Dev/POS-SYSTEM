import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICartItem {
  product: mongoose.Types.ObjectId
  quantity: number
  price: number // Store price at time of sale
  productName: string // Store name at time of sale
  productSku: string // Store SKU at time of sale
}

export interface ISale extends Document {
  orderId: string
  items: ICartItem[]
  total: number
  customerType?: 'regular' | 'senior' | 'pwd'
  subtotal?: number
  discountRate?: number
  discountAmount?: number
  vatRate?: number
  vatAmount?: number
  vatableSales?: number
  vatExemptSales?: number
  customerName?: string
  paymentMethod: 'cash' | 'card' | 'other'
  status: 'completed' | 'pending' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

const CartItemSchema: Schema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    productName: {
      type: String,
      required: true,
    },
    productSku: {
      type: String,
      required: true,
    },
  },
  { _id: false }
)

const SaleSchema: Schema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    items: {
      type: [CartItemSchema],
      required: true,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    customerType: {
      type: String,
      enum: ['regular', 'senior', 'pwd'],
      default: 'regular',
    },
    subtotal: {
      type: Number,
      min: 0,
    },
    discountRate: {
      type: Number,
      min: 0,
      max: 1,
    },
    discountAmount: {
      type: Number,
      min: 0,
    },
    vatRate: {
      type: Number,
      min: 0,
      max: 1,
    },
    vatAmount: {
      type: Number,
      min: 0,
    },
    vatableSales: {
      type: Number,
      min: 0,
    },
    vatExemptSales: {
      type: Number,
      min: 0,
    },
    customerName: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'other'],
      default: 'cash',
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'cancelled'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
SaleSchema.index({ createdAt: -1 })
SaleSchema.index({ customerName: 'text' })

const Sale: Model<ISale> = mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema)

export default Sale
