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
      address: { type: String, default: '' },
      note: { type: String, default: '' }
    },
    items: [
      {
        product: { type: Object, required: true },
        quantity: { type: Number, default: 1 }
      }
    ],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Thanh toán khi nhận hàng (COD)' },
    // Trạng thái đơn hàng: hỗ trợ 4 bước mới (Chờ xác nhận -> Chờ lấy hàng -> Chờ giao hàng -> Hoàn tất/Đánh giá) và tương thích ngược
    status: {
      type: String,
      enum: ['Chờ xác nhận', 'Chờ lấy hàng', 'Chờ giao hàng', 'Hoàn tất', 'Đã hủy', 'Đang xử lý', 'Đang giao'],
      default: 'Chờ xác nhận'
    },
    isPaid: { type: Boolean, default: false },
    // Thời gian hẹn shipper đến lấy hàng (dạng chuỗi ISO hoặc ngày giờ)
    pickupTime: { type: String, default: null },
    // Đơn vị vận chuyển được chọn
    shippingCarrier: { type: String, default: 'Giao Hàng Nhanh (GHN)' },
    // Trạng thái đánh giá của khách hàng sau khi nhận hàng
    isReviewed: { type: Boolean, default: false },
    reviewRating: { type: Number, default: 0 },
    reviewComment: { type: String, default: '' },
    reviewedAt: { type: String, default: null },
    // Thời gian khách hàng bấm "Đã nhận được hàng"
    receivedAt: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
