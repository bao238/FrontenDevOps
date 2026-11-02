const mongoose = require('mongoose');

// Mongoose Schema cho Bảng Thể Loại Sách (BookStore Categories)
// Cho phép quản trị viên thêm, sửa, xóa danh mục sách động thay vì gán tĩnh trong mã nguồn
const categorySchema = new mongoose.Schema(
  {
    // Tên thể loại sách duy nhất (ví dụ: 'Văn học - Tiểu thuyết', 'Kinh tế - Kinh doanh')
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    // Đường dẫn tĩnh định danh thể loại (slug URL)
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    // Mô tả chi tiết về thể loại sách
    description: {
      type: String,
      default: ''
    },
    // Tên biểu tượng minh họa (Icon name tương thích với Lucide React)
    icon: {
      type: String,
      default: 'BookOpen'
    },
    // Thứ tự hiển thị ưu tiên trên thanh điều hướng
    displayOrder: {
      type: Number,
      default: 0
    },
    // Trạng thái kích hoạt thể loại
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Category', categorySchema);
