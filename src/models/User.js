import mongoose from 'mongoose';

const userCollection = 'users';

const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    dni: { type: String, required: true, unique: true, trim: true, maxLength: 8 },
    phone: { type: String, default: '' },
    city: { type: String, default: 'Lima' },
    password: { type: String, required: true },
    role: { type: String, enum: ['usuario', 'organizador', 'admin'], default: 'usuario' }
  },
  { timestamps: true, versionKey: false }
);

export const User = mongoose.model(userCollection, userSchema);

export default User;
