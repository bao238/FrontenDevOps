const mongoose = require('mongoose');

// Schema con cho các đánh giá nhúng (Embedded Reviews)
const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    author: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    date: { type: String, default: 'Vừa xong' },
    content: { type: String, required: true },
    verified: { type: Boolean, default: true },
    likes: { type: Number, default: 0 }
  },
  { _id: false }
);

// Mongoose Schema cho Bảng Sách (BookStore Products)
const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    reviewsCount: { type: Number, default: 0 },
    imageUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    // Các thuộc tính chuyên biệt cho Nhà Sách (BookStore)
    author: { type: String, default: '', index: true },
    publisher: { type: String, default: '' },
    publicationYear: { type: Number, default: 2024 },
    pages: { type: Number, default: 0 },
    isbn: { type: String, default: '' },
    // Bảng thông số linh hoạt phục vụ hiển thị động
    specs: { type: Object, default: {} },
    inStock: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    reviews: { type: [reviewSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
