const Product = require('../models/Product');
const Review = require('../models/Review');
const { isDbConnected } = require('../config/db');

// GET /api/products
// Lấy danh sách toàn bộ sách từ MongoDB, sắp xếp theo thời gian mới nhất
exports.getProducts = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return res.json({ source: 'mongodb', count: products.length, data: products });
  } catch (err) {
    console.error('[ProductController] Lỗi truy vấn MongoDB:', err.message);
    return res.status(500).json({ error: 'Lỗi truy vấn sản phẩm MongoDB', message: err.message });
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
// Lấy danh sách toàn bộ đánh giá trong hệ thống
exports.getAllReviews = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    return res.json({ source: 'mongodb', count: reviews.length, data: reviews });
  } catch (err) {
    console.error('[ProductController] Lỗi lấy tất cả đánh giá:', err.message);
    return res.status(500).json({ error: 'Lỗi lấy tất cả đánh giá', message: err.message });
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
    const { author, rating, content, userId } = req.body;
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
      likes: 0
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
    const { author, rating, content } = req.body;
    const review = await Review.findOne({ id: req.params.id });
    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá trong MongoDB' });
    }

    if (author) review.author = String(author).trim();
    if (rating !== undefined) review.rating = Math.min(5, Math.max(1, Number(rating)));
    if (content) review.content = String(content).trim();
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
