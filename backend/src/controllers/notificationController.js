const crypto = require('crypto');
const Notification = require('../models/Notification');
const { AppError } = require('../middlewares/errorMiddleware');

/**
 * Hàm trợ giúp nội bộ để sinh thông báo mẫu ban đầu cho tài khoản mới.
 * Giúp giao diện thông báo luôn có dữ liệu sống động, trực quan.
 */
async function seedDefaultNotificationsForUser(userId) {
  if (!userId) return;

  const defaultItems = [
    {
      id: `notif-welcome-${userId}`,
      userId: userId,
      title: 'Chào mừng bạn đến với BookStore!',
      message: 'Cảm ơn bạn đã tham gia cộng đồng yêu sách BookStore. Khám phá hàng ngàn tựa sách hay cùng nhiều ưu đãi hấp dẫn ngay hôm nay!',
      type: 'system',
      link: '/products',
      isRead: false,
      metadata: { welcome: true }
    },
    {
      id: `notif-coupon-${userId}`,
      userId: userId,
      title: 'Tặng bạn Mã Giảm Giá 15% Đơn Đầu Tiên',
      message: 'Nhập mã BANMOI15 tại bước thanh toán để được giảm ngay 15% cho đơn hàng đầu tiên (tối đa 50.000đ).',
      type: 'coupon',
      link: '/products',
      isRead: false,
      metadata: { couponCode: 'BANMOI15', discount: '15%' }
    },
    {
      id: `notif-tip-${userId}`,
      userId: userId,
      title: 'Giao hàng siêu tốc toàn quốc',
      message: 'Đơn hàng từ 250.000đ sẽ được miễn phí vận chuyển tiêu chuẩn. Theo dõi trạng thái đơn hàng của bạn dễ dàng tại mục Đơn hàng.',
      type: 'order',
      link: '/orders',
      isRead: true,
      metadata: { tip: true }
    }
  ];

  try {
    for (const item of defaultItems) {
      const exists = await Notification.findOne({ id: item.id });
      if (!exists) {
        await Notification.create(item);
      }
    }
  } catch (error) {
    // Bỏ qua lỗi seed nếu có xung đột để không chặn tiến trình chính
    console.warn('Lỗi khi nạp thông báo mẫu ban đầu:', error.message);
  }
}

/**
 * Lấy danh sách thông báo của người dùng kèm phân trang và lọc trạng thái.
 * GET /api/notifications
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const unreadOnly = req.query.unreadOnly === 'true';
    const typeFilter = req.query.type;

    // Xây dựng điều kiện lọc theo người dùng
    const query = {};

    if (req.user && req.user.id) {
      // Người dùng đã đăng nhập: lấy thông báo riêng hoặc thông báo toàn hệ thống
      query.$or = [{ userId: req.user.id }, { userId: null }];

      // Kiểm tra nếu người dùng chưa có thông báo nào thì tự động tạo thông báo chào mừng
      const countForUser = await Notification.countDocuments({ userId: req.user.id });
      if (countForUser === 0) {
        await seedDefaultNotificationsForUser(req.user.id);
      }
    } else {
      // Khách vãng lai: chỉ lấy thông báo công khai toàn hệ thống
      query.userId = null;
    }

    if (unreadOnly) {
      query.isRead = false;
    }

    if (typeFilter && ['order', 'coupon', 'review', 'system'].includes(typeFilter)) {
      query.type = typeFilter;
    }

    // Truy vấn dữ liệu với chỉ mục B-Tree đã đánh
    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({
        ...(req.user && req.user.id
          ? { $or: [{ userId: req.user.id }, { userId: null }] }
          : { userId: null }),
        isRead: false
      }),
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Đánh dấu một thông báo cụ thể là đã đọc.
 * PATCH /api/notifications/:id/read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ id });

    if (!notification) {
      return next(new AppError('Không tìm thấy thông báo tương ứng', 404));
    }

    // Kiểm tra quyền: chỉ chính chủ hoặc quản trị viên được đánh dấu
    if (
      notification.userId &&
      req.user &&
      notification.userId !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(new AppError('Bạn không có quyền thao tác trên thông báo này', 403));
    }

    notification.isRead = true;
    await notification.save();

    return res.json({
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc',
      data: notification
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Đánh dấu toàn bộ thông báo của người dùng là đã đọc.
 * PATCH /api/notifications/read-all
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next(new AppError('Yêu cầu đăng nhập để thực hiện thao tác này', 401));
    }

    const result = await Notification.updateMany(
      {
        $or: [{ userId: req.user.id }, { userId: null }],
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );

    return res.json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc',
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Xóa một thông báo khỏi hệ thống.
 * DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ id });

    if (!notification) {
      return next(new AppError('Không tìm thấy thông báo cần xóa', 404));
    }

    // Kiểm tra quyền sở hữu
    if (
      notification.userId &&
      req.user &&
      notification.userId !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(new AppError('Bạn không có quyền xóa thông báo này', 403));
    }

    await Notification.deleteOne({ id });

    return res.json({
      success: true,
      message: 'Xóa thông báo thành công'
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Tạo thông báo mới (Dành cho Quản trị viên hoặc gọi qua API nội bộ).
 * POST /api/notifications
 */
exports.createNotification = async (req, res, next) => {
  try {
    const { userId, title, message, type, link, metadata } = req.body;

    if (!title || !message) {
      return next(new AppError('Vui lòng cung cấp tiêu đề và nội dung thông báo', 400));
    }

    const newNotification = await Notification.create({
      id: `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId: userId || null,
      title: title.trim(),
      message: message.trim(),
      type: type || 'system',
      link: link || null,
      isRead: false,
      metadata: metadata || {}
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo thông báo thành công',
      data: newNotification
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Hàm trợ giúp nội bộ để các Controller khác (như orderController) có thể kích hoạt thông báo tự động.
 */
exports.createInternalNotification = async ({ userId, title, message, type = 'system', link = null, metadata = {} }) => {
  try {
    if (!title || !message) return null;

    const notif = await Notification.create({
      id: `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId: userId || null,
      title: title.trim(),
      message: message.trim(),
      type,
      link,
      isRead: false,
      metadata
    });
    return notif;
  } catch (error) {
    console.warn('Lỗi khi tạo thông báo nội bộ:', error.message);
    return null;
  }
};
