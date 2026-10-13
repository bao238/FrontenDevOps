const mongoose = require('mongoose');

// Bảng Orders (Đơn hàng)
// Khóa chính: id
// Khóa ngoại: userId (tham chiếu Users.id)
const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true }, // Khóa chính (PK)
    userId: { type: String, ref: 'User', index: true, default: null }, // Khóa ngoại (FK -> User.id)
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    customerInfo: {
      fullName: { type: String, required: true },
      phone: { type: String, default: '' },
      address: { type: String, default: '' }
    },
    items: [
      {
        product: { type: Object, required: true },
        quantity: { type: Number, default: 1 }
      }
    ],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Thanh toán khi nhận hàng (COD)' },
    status: {
      type: String,
      enum: ['Đang xử lý', 'Đang giao', 'Hoàn tất', 'Đã hủy'],
      default: 'Đang xử lý'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
