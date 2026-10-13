const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const { isDbConnected } = require('../config/db');

// GET /api/orders
exports.getOrders = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    return res.json({ source: 'mongodb', count: orders.length, data: orders });
  } catch (err) {
    console.error('[OrderController] Lỗi truy vấn MongoDB:', err.message);
    return res.status(500).json({ error: 'Lỗi truy vấn đơn hàng MongoDB', message: err.message });
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

// POST /api/orders
exports.createOrder = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  const { customerInfo, items, totalAmount, paymentMethod, userId } = req.body;
  const orderId = `ORD-${Date.now().toString().slice(-6)}`;

  const newOrder = {
    id: orderId, // Khóa chính (PK)
    userId: userId || null, // Khóa ngoại (FK -> User.id)
    date: new Date().toISOString().split('T')[0],
    customerInfo: {
      fullName: customerInfo?.fullName || 'Khách vãng lai',
      phone: customerInfo?.phone || '',
      address: customerInfo?.address || ''
    },
    items: items || [],
    totalAmount: Number(totalAmount) || 0,
    paymentMethod: paymentMethod || 'Thanh toán khi nhận hàng (COD)',
    status: 'Đang xử lý'
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
    }

    return res.status(201).json({ message: 'Tạo đơn hàng thành công trên MongoDB', data: created });
  } catch (err) {
    console.error('[OrderController] Lỗi tạo đơn hàng MongoDB:', err.message);
    return res.status(500).json({ error: 'Lỗi lưu đơn hàng vào MongoDB', message: err.message });
  }
};

// PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const updated = await Order.findOneAndUpdate(
      { id: req.params.id },
      { $set: { status: req.body.status } },
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

// DELETE /api/orders/:id
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
