const mongoose = require('mongoose');

// Bảng Reviews (Đánh giá sản phẩm)
// Khóa chính: id
// Khóa ngoại: productId (tham chiếu Products.id), userId (tham chiếu Users.id)
const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true }, // Khóa chính (PK)
    productId: { type: String, required: true, ref: 'Product', index: true }, // Khóa ngoại (FK -> Product.id)
    userId: { type: String, ref: 'User', index: true, default: null }, // Khóa ngoại (FK -> User.id)
    author: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    date: { type: String, default: 'Vừa xong' },
    content: { type: String, required: true, trim: true },
    verified: { type: Boolean, default: true },
    likes: { type: Number, default: 0 },
    imageUrl: { type: String, default: null }, // Ảnh chụp sách thực tế do độc giả tải lên
    adminReply: { type: String, default: null, trim: true }, // Phản hồi từ Ban Quản Trị Nhà Sách
    repliedAt: { type: Date, default: null }, // Thời điểm Admin phản hồi nhận xét
    moderationStatus: {
      type: String,
      enum: ['approved', 'hidden', 'flagged'],
      default: 'approved',
      index: true
    } // Trạng thái kiểm duyệt: approved (Hiển thị), hidden (Đã ẩn), flagged (Báo cáo vi phạm)
  },
  { timestamps: true }
);

// Chỉ mục B-Tree tối ưu hóa sắp xếp và phân trang Server-Side tốc độ cao
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ rating: 1, createdAt: -1 });
reviewSchema.index({ moderationStatus: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
