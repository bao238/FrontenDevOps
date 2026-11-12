const mongoose = require('mongoose');

// Bảng Notifications (Thông báo người dùng)
// Khóa chính: id (UUID hoặc chuỗi định danh duy nhất)
// Khóa ngoại: userId (tham chiếu Users.id hoặc Users._id)
const notificationSchema = new mongoose.Schema(
  {
    // Mã định danh duy nhất của thông báo
    id: { type: String, required: true, unique: true, index: true },
    // Mã người dùng nhận thông báo (null nếu là thông báo chung cho toàn hệ thống)
    userId: { type: String, ref: 'User', index: true, default: null },
    // Tiêu đề thông báo ngắn gọn
    title: { type: String, required: true, trim: true },
    // Nội dung chi tiết của thông báo
    message: { type: String, required: true, trim: true },
    // Phân loại thông báo: order (Đơn hàng), coupon (Khuyến mãi), review (Đánh giá), system (Hệ thống)
    type: {
      type: String,
      enum: ['order', 'coupon', 'review', 'system'],
      default: 'system',
      index: true
    },
    // Đường dẫn hoặc mục tiêu điều hướng khi người dùng nhấp vào thông báo
    link: { type: String, default: null },
    // Trạng thái đã đọc hay chưa (false: chưa đọc, true: đã đọc)
    isRead: { type: Boolean, default: false, index: true },
    // Dữ liệu mở rộng đính kèm (ví dụ: orderId, couponCode, rating,...)
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// Chỉ mục tổng hợp B-Tree tối ưu hóa cho truy vấn danh sách thông báo theo người dùng và trạng thái
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
