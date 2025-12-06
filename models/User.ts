import mongoose, { Schema, Document, Model } from 'mongoose'

export type UserRole = 'admin' | 'staff'

export interface IUser extends Document {
  email: string
  password: string
  name: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'staff'],
      default: 'staff',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
