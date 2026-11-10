const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const { isDbConnected } = require('../config/db');

// GET /api/orders (Lay danh sach don hang, ho tro phan trang Server-Side khi du lieu lon)
exports.getOrders = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Co so du lieu MongoDB chua ket noi' });
  }

  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    if (req.query.search && req.query.search.trim()) {
      const q = req.query.search.trim();
      query.$or = [
        { id: { $regex: q, $options: 'i' } },
        { 'customerInfo.fullName': { $regex: q, $options: 'i' } },
        { 'customerInfo.phone': { $regex: q, $options: 'i' } }
      ];
    }

    const totalCount = await Order.countDocuments(query);
    const totalAllCount = await Order.countDocuments();
    const orders = await Order.find(query)
      .select('-trackingTimelineFull')
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
      data: orders
    });
  } catch (err) {
    console.error('[OrderController] Loi truy van MongoDB:', err.message);
    return res.status(500).json({ error: 'Loi truy van don hang MongoDB', message: err.message });
  }
};

// GET /api/orders/:id/items (Lấy danh sách OrderItems theo orderId)
exports.getOrderItems = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const items = await OrderItem.find({ orderId: req.params.id }).lean();
    return res.json({ source: 'mongodb', count: items.length, data: items });
  } catch (err) {
    console.error('[OrderController] Lỗi lấy chi tiết đơn hàng:', err.message);
    return res.status(500).json({ error: 'Lỗi lấy chi tiết đơn hàng', message: err.message });
  }
};

// GET /api/order-items (Lấy tất cả chi tiết đơn hàng trong bảng order_items)
exports.getAllOrderItems = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const items = await OrderItem.find().sort({ createdAt: -1 }).lean();
    return res.json({ source: 'mongodb', count: items.length, data: items });
  } catch (err) {
    console.error('[OrderController] Lỗi lấy toàn bộ order_items:', err.message);
    return res.status(500).json({ error: 'Lỗi lấy order items', message: err.message });
  }
};

// POST /api/orders (Tạo đơn hàng mới)
exports.createOrder = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  const { customerInfo, items, totalAmount, paymentMethod, userId, status, pickupTime, shippingCarrier } = req.body;
  const orderId = `ORD-${Date.now().toString().slice(-6)}`;

  const newOrder = {
    id: orderId, // Khóa chính (PK)
    userId: userId || null, // Khóa ngoại (FK -> User.id)
    date: new Date().toISOString().split('T')[0],
    customerInfo: {
      fullName: customerInfo?.fullName || 'Khách vãng lai',
      phone: customerInfo?.phone || '',
      address: customerInfo?.address || '',
      note: customerInfo?.note || ''
    },
    items: items || [],
    totalAmount: Number(totalAmount) || 0,
    paymentMethod: paymentMethod || 'Thanh toán khi nhận hàng (COD)',
    status: status || 'Chờ xác nhận',
    isPaid: Boolean(req.body.isPaid),
    pickupTime: pickupTime || null,
    shippingCarrier: shippingCarrier || 'Giao Hàng Nhanh (GHN)',
    isReviewed: false,
    reviewRating: 0,
    reviewComment: '',
    reviewedAt: null,
    receivedAt: null
  };

  try {
    // 1. Lưu bản ghi vào bảng Orders
    const created = await Order.create(newOrder);

    // 2. Lưu từng món hàng vào bảng riêng OrderItems (với Khóa ngoại orderId và productId)
    if (Array.isArray(items) && items.length > 0) {
      const orderItemDocs = items.map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`, // Khóa chính (PK)
        orderId: created.id, // Khóa ngoại (FK -> Order.id)
        productId: it.product?.id || `prod-${idx}`, // Khóa ngoại (FK -> Product.id)
        productName: it.product?.name || 'Sản phẩm',
        price: Number(it.product?.price) || 0,
        quantity: Number(it.quantity) || 1
      }));
      await OrderItem.insertMany(orderItemDocs);

      // 3. Tự động trừ số lượng sách tồn kho trong collection products
      for (const it of items) {
        if (it.product && it.product.id) {
          const qty = Number(it.quantity) || 1;
          const updatedProd = await Product.findOneAndUpdate(
            { id: it.product.id },
            { $inc: { stockQuantity: -qty } },
            { new: true }
          );
          if (updatedProd && updatedProd.stockQuantity <= 0) {
            await Product.updateOne({ id: it.product.id }, { inStock: false, stockQuantity: 0 });
          }
        }
      }
    }

    return res.status(201).json({ message: 'Tạo đơn hàng thành công trên MongoDB', data: created });
  } catch (err) {
    console.error('[OrderController] Lỗi tạo đơn hàng MongoDB:', err.message);
    return res.status(500).json({ error: 'Lỗi lưu đơn hàng vào MongoDB', message: err.message });
  }
};

// PUT /api/orders/:id/status (Cập nhật trạng thái và thông tin vận chuyển/đánh giá đơn hàng)
exports.updateOrderStatus = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const updateData = {};
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.pickupTime !== undefined) updateData.pickupTime = req.body.pickupTime;
    if (req.body.shippingCarrier !== undefined) updateData.shippingCarrier = req.body.shippingCarrier;
    if (req.body.isReviewed !== undefined) updateData.isReviewed = req.body.isReviewed;
    if (req.body.reviewRating !== undefined) updateData.reviewRating = req.body.reviewRating;
    if (req.body.reviewComment !== undefined) updateData.reviewComment = req.body.reviewComment;
    if (req.body.reviewedAt !== undefined) updateData.reviewedAt = req.body.reviewedAt;
    if (req.body.reviewImage !== undefined) updateData.reviewImage = req.body.reviewImage;
    if (req.body.receivedAt !== undefined) updateData.receivedAt = req.body.receivedAt;
    if (req.body.isPaid !== undefined) updateData.isPaid = req.body.isPaid;

    const updated = await Order.findOneAndUpdate(
      { id: req.params.id },
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    return res.json({ message: 'Cập nhật trạng thái đơn thành công trên MongoDB', data: updated });
  } catch (err) {
    console.error('[OrderController] Lỗi cập nhật trạng thái:', err.message);
    return res.status(500).json({ error: 'Lỗi cập nhật trạng thái đơn hàng', message: err.message });
  }
};

// DELETE /api/orders/:id (Xóa đơn hàng)
exports.deleteOrder = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const deleted = await Order.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng cần xóa' });
    }

    // Xóa toàn bộ OrderItems liên quan trong bảng riêng order_items
    await OrderItem.deleteMany({ orderId: req.params.id });

    return res.json({ message: 'Xóa đơn hàng và chi tiết đơn hàng thành công trên MongoDB' });
  } catch (err) {
    console.error('[OrderController] Lỗi xóa đơn hàng MongoDB:', err.message);
    return res.status(500).json({ error: 'Lỗi xóa đơn hàng', message: err.message });
  }
};
