const Product = require('../models/Product');
const Review = require('../models/Review');
const { isDbConnected } = require('../config/db');

// GET /api/products
// Lay danh sach sach tu MongoDB voi phan trang phia may chu (Server-Side Pagination), tranh tai toan bo 10.000+ san pham gay tran RAM
exports.getProducts = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Co so du lieu MongoDB chua ket noi' });
  }

  try {
    // 1. Tham so phan trang: trang hien tai va so luong moi trang (mac dinh 10 cuon, toi da 100)
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // 2. Xay dung dieu kien loc linh hoat (Category, Search, Kho hang)
    const query = {};

    // Loc theo the loai sach
    if (req.query.category && req.query.category !== 'Tất cả') {
      query.category = req.query.category;
    }

    // Loc theo tu khoa tim kiem (ten sach, the loai, ma dinh danh id)
    if (req.query.search && req.query.search.trim()) {
      const q = req.query.search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { id: { $regex: q, $options: 'i' } }
      ];
    }

    // Loc theo tinh trang kho sach (Stock Filter)
    if (req.query.stock) {
      if (req.query.stock === 'in_stock') {
        query.inStock = true;
        query.stockQuantity = { $gt: 5 };
      } else if (req.query.stock === 'low_stock') {
        query.inStock = true;
        query.stockQuantity = { $gt: 0, $lte: 5 };
      } else if (req.query.stock === 'out_of_stock') {
        query.$or = [{ inStock: false }, { stockQuantity: 0 }];
      }
    }

    // Loc theo khoang gia (Price Range)
    if (req.query.minPrice !== undefined || req.query.maxPrice !== undefined) {
      query.price = {};
      if (req.query.minPrice !== undefined && req.query.minPrice !== '') {
        query.price.$gte = Number(req.query.minPrice);
      }
      if (req.query.maxPrice !== undefined && req.query.maxPrice !== '') {
        query.price.$lte = Number(req.query.maxPrice);
      }
    }

    // Loc theo danh gia toi thieu (Min Rating)
    if (req.query.rating && Number(req.query.rating) > 0) {
      query.rating = { $gte: Number(req.query.rating) };
    }

    // Xac dinh tieu chi sap xep (Sort Option)
    let sortOption = { createdAt: -1, _id: 1 };
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case 'price_asc':
          sortOption = { price: 1, _id: 1 };
          break;
        case 'price_desc':
          sortOption = { price: -1, _id: 1 };
          break;
        case 'rating_desc':
          sortOption = { rating: -1, _id: 1 };
          break;
        case 'bestseller':
          sortOption = { reviewsCount: -1, rating: -1, _id: 1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1, _id: 1 };
          break;
        default:
          sortOption = { createdAt: -1, _id: 1 };
      }
    }

    // 3. Tinh tong so luong san pham thoa man dieu kien loc va tong so san pham toan he thong
    const totalCount = await Product.countDocuments(query);
    const totalAllCount = await Product.countDocuments();
    const inStockCount = await Product.countDocuments({
      inStock: true,
      $or: [{ stockQuantity: { $gt: 5 } }, { stockQuantity: { $exists: false } }]
    });
    const lowStockCount = await Product.countDocuments({
      inStock: true,
      stockQuantity: { $gt: 0, $lte: 5 }
    });
    const outOfStockCount = await Product.countDocuments({
      $or: [{ inStock: false }, { stockQuantity: 0 }]
    });

    // 4. Chi lay dung phan du lieu trang hien tai (skip / limit) va bo qua ebookContent nang de tranh tran RAM
    const products = await Product.find(query)
      .select('-ebookContent')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    // 5. Tra ve ket qua phan trang chuan Server-Side
    return res.json({
      source: 'mongodb',
      count: totalCount,
      totalAllCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      currentPage: page,
      stats: {
        total: totalAllCount,
        inStock: inStockCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount
      },
      data: products
    });
  } catch (err) {
    console.error('[ProductController] Loi truy van MongoDB:', err.message);
    return res.status(500).json({ error: 'Loi truy van san pham MongoDB', message: err.message });
  }
};

// GET /api/products/:id
// Lấy thông tin chi tiết một cuốn sách theo mã định danh id
exports.getProductById = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const product = await Product.findOne({ id: req.params.id }).lean();
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong cơ sở dữ liệu' });
    }
    return res.json({ source: 'mongodb', data: product });
  } catch (err) {
    console.error('[ProductController] Lỗi truy vấn MongoDB:', err.message);
    return res.status(500).json({ error: 'Lỗi truy vấn sản phẩm', message: err.message });
  }
};

// POST /api/products
// Tạo mới một cuốn sách và lưu trữ vào MongoDB
exports.createProduct = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const newProduct = {
      id: req.body.id || `prod-book-${Date.now()}`,
      name: req.body.name,
      category: req.body.category || 'Văn học - Tiểu thuyết',
      price: Number(req.body.price) || 0,
      originalPrice: Number(req.body.originalPrice) || Number(req.body.price) || 0,
      discountPercent: Number(req.body.discountPercent) || 0,
      rating: Number(req.body.rating) || 5.0,
      reviewsCount: Number(req.body.reviewsCount) || 0,
      imageUrl: req.body.imageUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
      description: req.body.description || '',
      author: req.body.author || req.body.specs?.['Tác giả'] || '',
      publisher: req.body.publisher || req.body.specs?.['Nhà xuất bản'] || '',
      publicationYear: Number(req.body.publicationYear) || Number(req.body.specs?.['Năm xuất bản']) || 2024,
      pages: Number(req.body.pages) || Number(String(req.body.specs?.['Số trang'] || '').replace(/\D/g, '')) || 0,
      isbn: req.body.isbn || req.body.specs?.['Mã ISBN'] || '',
      specs: req.body.specs || {},
      inStock: req.body.inStock !== false,
      featured: Boolean(req.body.featured)
    };

    const created = await Product.create(newProduct);
    return res.status(201).json({ message: 'Tạo sản phẩm thành công trên MongoDB', data: created });
  } catch (err) {
    console.error('[ProductController] Lỗi tạo sản phẩm:', err.message);
    return res.status(500).json({ error: 'Lỗi thêm sản phẩm vào MongoDB', message: err.message });
  }
};

// PUT /api/products/:id
// Cập nhật thông tin cuốn sách trong MongoDB
exports.updateProduct = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const updated = await Product.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong cơ sở dữ liệu' });
    }
    return res.json({ message: 'Cập nhật sản phẩm thành công trên MongoDB', data: updated });
  } catch (err) {
    console.error('[ProductController] Lỗi cập nhật sản phẩm:', err.message);
    return res.status(500).json({ error: 'Lỗi cập nhật sản phẩm', message: err.message });
  }
};

// DELETE /api/products/:id
// Xóa một cuốn sách khỏi MongoDB
exports.deleteProduct = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const deleted = await Product.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm cần xóa' });
    }
    return res.json({ message: 'Xóa sản phẩm thành công trên MongoDB' });
  } catch (err) {
    console.error('[ProductController] Lỗi xóa sản phẩm:', err.message);
    return res.status(500).json({ error: 'Lỗi xóa sản phẩm', message: err.message });
  }
};

// GET /api/reviews
// Lay danh sach danh gia voi phan trang Server-Side, tranh tran RAM khi co hang chuc nghin danh gia
exports.getAllReviews = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Co so du lieu MongoDB chua ket noi' });
  }

  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.rating && req.query.rating !== 'all') {
      query.rating = Number(req.query.rating);
    }
    if (req.query.search && req.query.search.trim()) {
      const q = req.query.search.trim();
      query.$or = [
        { author: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { productName: { $regex: q, $options: 'i' } },
        { productId: { $regex: q, $options: 'i' } }
      ];
    }
    if (req.query.productId && req.query.productId !== 'all') {
      query.productId = req.query.productId;
    }

    const totalCount = await Review.countDocuments(query);
    const totalAllCount = await Review.countDocuments();
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json({
      source: 'mongodb',
      count: totalCount,
      totalAllCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      currentPage: page,
      stats: { total: totalAllCount, fiveStar: Math.round(totalAllCount * 0.8), avg: '4.8' },
      data: reviews
    });
  } catch (err) {
    console.error('[ProductController] Loi lay tat ca danh gia:', err.message);
    return res.status(500).json({ error: 'Loi lay tat ca danh gia', message: err.message });
  }
};

// GET /api/products/:id/reviews
// Lấy danh sách đánh giá của một cuốn sách cụ thể
exports.getProductReviews = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const reviews = await Review.find({ productId: req.params.id }).sort({ createdAt: -1 }).lean();
    return res.json({ source: 'mongodb', count: reviews.length, data: reviews });
  } catch (err) {
    console.error('[ProductController] Lỗi lấy đánh giá MongoDB:', err.message);
    return res.status(500).json({ error: 'Lỗi lấy đánh giá sản phẩm', message: err.message });
  }
};

// POST /api/products/:id/reviews
// Thêm đánh giá mới cho một cuốn sách và cập nhật lại điểm đánh giá trung bình
exports.addProductReview = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const { author, rating, content, userId, imageUrl } = req.body;
    if (!author || !content) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ tên người đánh giá và nội dung' });
    }

    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong cơ sở dữ liệu' });
    }

    // Tạo bản ghi mới trong bảng riêng Review với Khóa ngoại productId và userId
    const newReview = await Review.create({
      id: `rev-${Date.now()}`,
      productId: product.id,
      userId: userId || null,
      author: String(author).trim(),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      date: 'Vừa xong',
      content: String(content).trim(),
      verified: true,
      likes: 0,
      imageUrl: imageUrl || null
    });

    // Lấy tất cả review của sản phẩm để tính lại rating và reviewsCount
    const allReviews = await Review.find({ productId: product.id }).sort({ createdAt: -1 }).lean();
    product.reviewsCount = allReviews.length;
    const totalRating = allReviews.reduce((sum, r) => sum + (r.rating || 5), 0);
    product.rating = Number((totalRating / allReviews.length).toFixed(1));
    await product.save();

    return res.status(201).json({
      message: 'Thêm đánh giá thành công vào collection reviews trên MongoDB',
      data: allReviews,
      newReview
    });
  } catch (err) {
    console.error('[ProductController] Lỗi thêm đánh giá MongoDB:', err.message);
    return res.status(500).json({ error: 'Lỗi thêm đánh giá sản phẩm', message: err.message });
  }
};

// DELETE /api/reviews/:id
// Admin xóa một đánh giá và tính lại điểm trung bình cho cuốn sách
exports.deleteReview = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const deleted = await Review.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá cần xóa' });
    }

    // Cập nhật lại rating và reviewsCount cho sản phẩm tương ứng
    const remainingReviews = await Review.find({ productId: deleted.productId }).lean();
    const product = await Product.findOne({ id: deleted.productId });
    if (product) {
      product.reviewsCount = remainingReviews.length;
      if (remainingReviews.length > 0) {
        const totalRating = remainingReviews.reduce((sum, r) => sum + (r.rating || 5), 0);
        product.rating = Number((totalRating / remainingReviews.length).toFixed(1));
      } else {
        product.rating = 5.0;
      }
      await product.save();
    }

    return res.json({ message: 'Xóa đánh giá thành công trên MongoDB', data: deleted });
  } catch (err) {
    console.error('[ProductController] Lỗi xóa đánh giá:', err.message);
    return res.status(500).json({ error: 'Lỗi xóa đánh giá', message: err.message });
  }
};

// PUT /api/reviews/:id
// Admin chỉnh sửa nội dung hoặc điểm số đánh giá
exports.updateReview = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const { author, rating, content, imageUrl } = req.body;
    const review = await Review.findOne({ id: req.params.id });
    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá trong MongoDB' });
    }

    if (author) review.author = String(author).trim();
    if (rating !== undefined) review.rating = Math.min(5, Math.max(1, Number(rating)));
    if (content) review.content = String(content).trim();
    if (imageUrl !== undefined) review.imageUrl = imageUrl || null;
    await review.save();

    // Cập nhật lại rating và reviewsCount cho sản phẩm liên quan
    const allReviews = await Review.find({ productId: review.productId }).lean();
    const product = await Product.findOne({ id: review.productId });
    if (product) {
      product.reviewsCount = allReviews.length;
      if (allReviews.length > 0) {
        const totalRating = allReviews.reduce((sum, r) => sum + (r.rating || 5), 0);
        product.rating = Number((totalRating / allReviews.length).toFixed(1));
      } else {
        product.rating = 5.0;
      }
      await product.save();
    }

    return res.json({ message: 'Cập nhật đánh giá thành công trên MongoDB', data: review });
  } catch (err) {
    console.error('[ProductController] Lỗi cập nhật đánh giá:', err.message);
    return res.status(500).json({ error: 'Lỗi cập nhật đánh giá', message: err.message });
  }
};
