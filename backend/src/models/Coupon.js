const mongoose = require('mongoose');

// Mongoose Schema cho Bảng Mã Giảm Giá (Coupons / Vouchers)
// Quản lý mã khuyến mãi cho hệ thống Nhà Sách BookStore
const couponSchema = new mongoose.Schema(
  {
    // Mã giảm giá duy nhất (ví dụ: BOOKWORM10, DEVOPS10, TRIAN50K)
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    // Tiêu đề hoặc mô tả ngắn về chương trình khuyến mãi
    title: {
      type: String,
      required: true,
      trim: true
    },
    // Loại giảm giá: 'percent' (theo tỷ lệ phần trăm) hoặc 'fixed' (số tiền cố định VND)
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
      default: 'percent'
    },
    // Giá trị giảm: 10 = 10% (nếu percent) hoặc 50000 = 50,000đ (nếu fixed)
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    // Giá trị đơn hàng tối thiểu để được áp dụng mã (VND)
    minOrderValue: {
      type: Number,
      default: 0
    },
    // Mức giảm tối đa (áp dụng cho loại percent để giới hạn số tiền giảm)
    maxDiscount: {
      type: Number,
      default: null
    },
    // Tổng số lượt sử dụng tối đa cho phép
    usageLimit: {
      type: Number,
      default: 100
    },
    // Số lượt thực tế khách đã áp dụng thành công
    usedCount: {
      type: Number,
      default: 0
    },
    // Ngày hết hạn của mã giảm giá
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Mặc định 30 ngày tới
    },
    // Trạng thái kích hoạt: true (đang áp dụng), false (tạm dừng)
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Coupon', couponSchema);
