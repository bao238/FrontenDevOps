const Category = require('../models/Category');
const Product = require('../models/Product');

// Hàm hỗ trợ tạo slug chuẩn từ chuỗi tiếng Việt có dấu
function generateSlug(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

// Lấy danh sách tất cả thể loại sách kèm số lượng đầu sách tương ứng
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1, createdAt: 1 }).lean();

    // Tính toán số lượng sách thực tế trong từng thể loại
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const bookCount = await Product.countDocuments({ category: cat.name });
        return {
          ...cat,
          bookCount
        };
      })
    );

    return res.json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount
    });
  } catch (err) {
    return next(err);
  }
};

// Tạo thể loại sách mới
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, displayOrder, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên thể loại sách không được để trống' });
    }

    const cleanName = name.trim();
    const slug = generateSlug(cleanName);

    // Kiểm tra trùng lặp tên thể loại
    const existing = await Category.findOne({
      $or: [{ name: cleanName }, { slug }]
    });

    if (existing) {
      return res.status(400).json({ error: `Thể loại sách "${cleanName}" đã tồn tại` });
    }

    const newCategory = new Category({
      name: cleanName,
      slug,
      description: (description || '').trim(),
      icon: icon || 'BookOpen',
      displayOrder: Number(displayOrder) || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    await newCategory.save();

    return res.status(201).json({
      success: true,
      message: 'Tạo thể loại sách mới thành công',
      data: {
        ...newCategory.toObject(),
        bookCount: 0
      }
    });
  } catch (err) {
    return next(err);
  }
};

// Cập nhật thông tin thể loại sách
exports.updateCategory = async (req, res, next) => {
  const { id } = req.params;

  try {
    const { name, description, icon, displayOrder, isActive } = req.body;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ error: 'Không tìm thấy thể loại sách cần cập nhật' });
    }

    const oldName = category.name;

    if (name && name.trim()) {
      category.name = name.trim();
      category.slug = generateSlug(category.name);
    }
    if (description !== undefined) category.description = description.trim();
    if (icon !== undefined) category.icon = icon;
    if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    // Nếu tên thể loại bị đổi, tự động cập nhật tên thể loại cho các sách thuộc thể loại này
    if (name && name.trim() !== oldName) {
      await Product.updateMany({ category: oldName }, { category: category.name });
      console.log(`🔄 [CategoryController] Đã cập nhật thể loại từ "${oldName}" sang "${category.name}" cho các sản phẩm liên quan`);
    }

    const bookCount = await Product.countDocuments({ category: category.name });

    return res.json({
      success: true,
      message: 'Cập nhật thể loại sách thành công',
      data: {
        ...category.toObject(),
        bookCount
      }
    });
  } catch (err) {
    return next(err);
  }
};

// Xóa thể loại sách
exports.deleteCategory = async (req, res, next) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Không tìm thấy thể loại sách cần xóa' });
    }

    // Kiểm tra xem có đầu sách nào đang thuộc thể loại này không
    const bookCount = await Product.countDocuments({ category: category.name });
    if (bookCount > 0) {
      return res.status(400).json({
        error: `Không thể xóa vì đang có ${bookCount} cuốn sách thuộc thể loại "${category.name}". Vui lòng chuyển thể loại cho các sách này trước khi xóa!`
      });
    }

    await Category.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: `Đã xóa thể loại "${category.name}" thành công`
    });
  } catch (err) {
    return next(err);
  }
};
