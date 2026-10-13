const Order = require('../models/Order');
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

// POST /api/orders
exports.createOrder = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  const { customerInfo, items, totalAmount, paymentMethod } = req.body;
  const newOrder = {
    id: `ORD-${Date.now().toString().slice(-6)}`,
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
    const created = await Order.create(newOrder);
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
    return res.json({ message: 'Xóa đơn hàng thành công trên MongoDB' });
  } catch (err) {
    console.error('[OrderController] Lỗi xóa đơn hàng MongoDB:', err.message);
    return res.status(500).json({ error: 'Lỗi xóa đơn hàng', message: err.message });
  }
};
