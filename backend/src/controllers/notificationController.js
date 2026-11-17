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
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const unreadOnly = req.query.unreadOnly === 'true';
    const typeFilter = req.query.type;

    // Xây dựng điều kiện lọc bảo mật theo danh tính người dùng (User Scoping)
    // Loại trừ toàn bộ các thông báo giả lập kiểm thử (notif-bulk-)
    const query = {
      id: { $not: /^notif-bulk-/ }
    };

    if (req.user && req.user.id) {
      // Người dùng đã đăng nhập: Lấy thông báo cá nhân của chính mình HOẶC thông báo hệ thống/khuyến mãi chung thực tế
      query.$or = [
        { userId: req.user.id },
        { userId: null, type: { $in: ['system', 'coupon'] } }
      ];

      // Kiểm tra nếu người dùng chưa có thông báo nào thì tự động tạo thông báo chào mừng
      const countForUser = await Notification.countDocuments({
        userId: req.user.id,
        id: { $not: /^notif-bulk-/ }
      });
      if (countForUser === 0) {
        await seedDefaultNotificationsForUser(req.user.id);
      }
    } else {
      // Khách vãng lai (Chưa đăng nhập): Tuyệt đối KHÔNG hiển thị thông báo đơn hàng hoặc đánh giá cá nhân!
      // Chỉ cho phép xem thông báo khuyến mãi và hệ thống chung thực tế (nếu có)
      query.userId = null;
      query.type = { $in: ['system', 'coupon'] };
    }

    if (unreadOnly) {
      query.isRead = false;
    }

    if (typeFilter && ['order', 'coupon', 'review', 'system'].includes(typeFilter)) {
      if (!req.user && (typeFilter === 'order' || typeFilter === 'review')) {
        // Khách chưa đăng nhập yêu cầu xem thông báo đơn hàng/đánh giá -> Trả về danh sách rỗng 0 kết quả
        return res.json({
          success: true,
          data: [],
          unreadCount: 0,
          pagination: { page, limit, total: 0, totalPages: 1 }
        });
      }
      query.type = typeFilter;
    }

    // Truy vấn dữ liệu chưa đọc đồng bộ chính xác với bộ lọc phạm vi
    const unreadScopeQuery = {
      ...query,
      isRead: false
    };

    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments(unreadScopeQuery),
      Notification.find(query)
        .select('-metadata.payloadContent')
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
        id: { $not: /^notif-bulk-/ },
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

    // Kiểm tra quyền sở hữu: Người dùng chỉ được xóa thông báo của chính mình, Admin/Staff có quyền xóa mọi thông báo
    const isStaffOrAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'staff');
    if (
      notification.userId &&
      req.user &&
      notification.userId !== req.user.id &&
      !isStaffOrAdmin
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
 * Xóa toàn bộ thông báo thuộc phạm vi của người dùng hoặc phiên hiện tại.
 * DELETE /api/notifications/clear-all
 */
exports.deleteAllNotifications = async (req, res, next) => {
  try {
    const query = {};
    if (req.user && req.user.id) {
      if (req.user.role === 'admin' || req.user.role === 'staff') {
        // Admin/Staff xóa thông báo cá nhân hoặc thông báo chung
        query.$or = [{ userId: req.user.id }, { userId: null }];
      } else {
        query.userId = req.user.id;
      }
    } else {
      // Khách vãng lai: Xóa các thông báo hiển thị cho phiên khách
      query.userId = null;
    }

    const result = await Notification.deleteMany(query);

    return res.json({
      success: true,
      message: 'Đã xóa toàn bộ thông báo thành công',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Lấy danh sách toàn bộ thông báo dành cho Quản trị viên (Hỗ trợ phân trang, lọc và tìm kiếm).
 * GET /api/notifications/admin
 */
exports.getAdminNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, type, target } = req.query;
    // Điều kiện truy vấn cơ bản: Bỏ qua các bản ghi giả lập thử nghiệm
    const query = {
      id: { $not: /^notif-bulk-/ }
    };

    // Bộ lọc theo loại thông báo: order (đơn hàng), coupon (khuyến mãi), review (đánh giá), system (hệ thống)
    if (type && type !== 'all' && ['order', 'coupon', 'review', 'system'].includes(type)) {
      query.type = type;
    }

    // Bộ lọc theo đối tượng nhận thông báo (target)
    if (target === 'broadcast') {
      // Thông báo phát sóng toàn sàn (userId là null)
      query.userId = null;
    } else if (target === 'specific') {
      // Thông báo gửi đích danh cho từng tài khoản khách hàng
      query.userId = { $ne: null };
    }

    // Tìm kiếm tương đối theo từ khóa trong tiêu đề, nội dung hoặc mã người nhận
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { message: regex },
        { userId: regex }
      ];
    }

    // Thực hiện đếm tổng số bản ghi và truy vấn dữ liệu phân trang đồng thời
    const [total, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return res.json({
      success: true,
      data: notifications,
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
 * Thống kê tổng hợp số liệu thông báo cho Quản trị viên (KPI Cards).
 * GET /api/notifications/stats
 */
exports.getNotificationStats = async (req, res, next) => {
  try {
    const baseQuery = { id: { $not: /^notif-bulk-/ } };

    // Thống kê đồng thời các chỉ số thông báo theo loại và phạm vi
    const [total, couponCount, orderCount, systemCount, reviewCount, broadcastCount] = await Promise.all([
      Notification.countDocuments(baseQuery),
      Notification.countDocuments({ ...baseQuery, type: 'coupon' }),
      Notification.countDocuments({ ...baseQuery, type: 'order' }),
      Notification.countDocuments({ ...baseQuery, type: 'system' }),
      Notification.countDocuments({ ...baseQuery, type: 'review' }),
      Notification.countDocuments({ ...baseQuery, userId: null })
    ]);

    return res.json({
      success: true,
      data: {
        total,
        coupon: couponCount,
        order: orderCount,
        system: systemCount,
        review: reviewCount,
        broadcast: broadcastCount
      }
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Tạo thông báo mới (Dành cho Quản trị viên tự tạo hoặc gọi qua API nội bộ).
 * POST /api/notifications
 */
exports.createNotification = async (req, res, next) => {
  try {
    const { userId, title, message, type, link, metadata } = req.body;

    // Kiểm tra tính hợp lệ của dữ liệu đầu vào bắt buộc
    if (!title || !message) {
      return next(new AppError('Vui lòng cung cấp tiêu đề và nội dung thông báo', 400));
    }

    // Khởi tạo bản ghi thông báo mới trong cơ sở dữ liệu MongoDB
    const newNotification = await Notification.create({
      id: `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId: userId || null, // null biểu thị thông báo toàn sàn (broadcast)
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
 * Hàm trợ giúp nội bộ để các Controller khác (như orderController, productController) kích hoạt thông báo tự động.
 */
exports.createInternalNotification = async ({ userId, title, message, type = 'system', link = null, metadata = {} }) => {
  try {
    if (!title || !message) return null;

    // Tự động sinh ID duy nhất và lưu thông báo
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
    // Ghi log cảnh báo nhưng không làm gián đoạn luồng xử lý chính
    console.warn('Lỗi khi tạo thông báo nội bộ:', error.message);
    return null;
  }
};
