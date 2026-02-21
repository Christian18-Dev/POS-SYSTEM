import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export type InventoryMovementType = 'RESTOCK' | 'SALE' | 'ADJUSTMENT' | 'EXPIRED'

export interface IInventoryMovement extends Document {
  product: Types.ObjectId
  type: InventoryMovementType
  change: number
  stockBefore: number
  stockAfter: number
  byUserId?: Types.ObjectId
  byEmail?: string
  note?: string
  createdAt: Date
  updatedAt: Date
}

const InventoryMovementSchema: Schema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['RESTOCK', 'SALE', 'ADJUSTMENT', 'EXPIRED'],
      required: true,
      index: true,
    },
    change: {
      type: Number,
      required: true,
    },
    stockBefore: {
      type: Number,
      required: true,
      min: 0,
    },
    stockAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    byUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    byEmail: {
      type: String,
      default: '',
    },
    note: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

if (process.env.NODE_ENV !== 'production' && mongoose.models.InventoryMovement) {
  delete mongoose.models.InventoryMovement
}

const InventoryMovement: Model<IInventoryMovement> =
  mongoose.models.InventoryMovement ||
  mongoose.model<IInventoryMovement>('InventoryMovement', InventoryMovementSchema)

export default InventoryMovement
