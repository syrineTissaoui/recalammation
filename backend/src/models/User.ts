import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type Role = 'AGENT' | 'CADRE';

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  role: Role;
  comparePassword(pw: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, unique: true, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['AGENT', 'CADRE'], default: 'AGENT', required: true }
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = function (pw: string) {
  return bcrypt.compare(pw, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
