const Coupon = require('../models/Coupon');

// Lấy danh sách toàn bộ mã giảm giá trong hệ thống (Dành cho Quản trị viên)
exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return res.json({
      success: true,
      count: coupons.length,
      data: coupons
    });
  } catch (err) {
    return next(err);
  }
};

// Tạo mã giảm giá mới
exports.createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      title,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      usageLimit,
      expiresAt,
      isActive
    } = req.body;

    if (!code || !title || discountValue === undefined) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ mã code, tiêu đề và giá trị giảm giá' });
    }

    const cleanCode = code.trim().toUpperCase();

    // Kiểm tra trùng lặp mã code
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ error: `Mã giảm giá "${cleanCode}" đã tồn tại trong hệ thống` });
    }

    const newCoupon = new Coupon({
      code: cleanCode,
      title: title.trim(),
      discountType: discountType || 'percent',
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      usageLimit: Number(usageLimit) || 100,
      usedCount: 0,
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    await newCoupon.save();

    return res.status(201).json({
      success: true,
      message: 'Tạo mã giảm giá mới thành công',
      data: newCoupon
    });
  } catch (err) {
    return next(err);
  }
};

// Cập nhật thông tin mã giảm giá
exports.updateCoupon = async (req, res, next) => {
  const { id } = req.params;

  try {
    const updateData = { ...req.body };
    if (updateData.code) {
      updateData.code = updateData.code.trim().toUpperCase();
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedCoupon) {
      return res.status(404).json({ error: 'Không tìm thấy mã giảm giá cần cập nhật' });
    }

    return res.json({
      success: true,
      message: 'Cập nhật mã giảm giá thành công',
      data: updatedCoupon
    });
  } catch (err) {
    return next(err);
  }
};

// Xóa mã giảm giá
exports.deleteCoupon = async (req, res, next) => {
  const { id } = req.params;

  try {
    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Không tìm thấy mã giảm giá cần xóa' });
    }

    return res.json({
      success: true,
      message: `Đã xóa mã giảm giá "${deleted.code}" thành công`
    });
  } catch (err) {
    return next(err);
  }
};

// Kiểm tra và áp dụng mã giảm giá khi khách đặt hàng
exports.applyCoupon = async (req, res, next) => {
  const { code, orderTotal } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Vui lòng cung cấp mã giảm giá' });
  }

  const cleanCode = code.trim().toUpperCase();
  const subtotal = Number(orderTotal) || 0;

  try {
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      return res.status(404).json({ error: `Mã giảm giá "${cleanCode}" không tồn tại` });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ error: `Mã giảm giá "${cleanCode}" hiện đang tạm khóa hoặc đã kết thúc` });
    }

    // Kiểm tra ngày hết hạn
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: `Mã giảm giá "${cleanCode}" đã hết hạn sử dụng` });
    }

    // Kiểm tra lượt sử dụng tối đa
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ error: `Mã giảm giá "${cleanCode}" đã đạt giới hạn lượt sử dụng` });
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (coupon.minOrderValue > 0 && subtotal < coupon.minOrderValue) {
      return res.status(400).json({
        error: `Đơn hàng tối thiểu phải từ ${coupon.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã này`
      });
    }

    // Tính toán số tiền được giảm
    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      // Loại tiền cố định (fixed)
      discountAmount = coupon.discountValue;
      if (discountAmount > subtotal) {
        discountAmount = subtotal;
      }
    }

    return res.json({
      success: true,
      message: `Áp dụng mã giảm giá "${cleanCode}" thành công!`,
      coupon: {
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount)
      }
    });
  } catch (err) {
    return next(err);
  }
};
