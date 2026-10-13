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
    likes: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
