import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICounter extends Document {
  key: string
  seq: number
}

const CounterSchema: Schema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    seq: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
)

const Counter: Model<ICounter> =
  mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema)

export default Counter
