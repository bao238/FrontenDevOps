const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'staff', 'customer'], default: 'customer' },
    status: { type: String, enum: ['active', 'locked'], default: 'active' },
    password: { type: String, required: true },
    avatarUrl: { type: String, default: '/default-avatar.png' },
    address: { type: String, default: '' },
    createdAtStr: { type: String, default: () => new Date().toLocaleDateString('vi-VN') }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
