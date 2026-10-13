const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
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
