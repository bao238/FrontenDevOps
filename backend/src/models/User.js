const mongoose = require('mongoose');
const { hashPassword, isBcryptHash, verifyPassword } = require('../utils/password');

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

// Tự động băm mật khẩu bằng bcryptjs (Hash + Salt) trước khi lưu document mới hoặc đổi mật khẩu
userSchema.pre('save', async function hashUserPassword() {
  if (!this.isModified('password') || !this.password || isBcryptHash(this.password)) {
    return;
  }
  this.password = await hashPassword(this.password);
});

userSchema.methods.comparePassword = async function comparePassword(plainPassword) {
  return verifyPassword(plainPassword, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
