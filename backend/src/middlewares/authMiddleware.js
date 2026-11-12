const User = require('../models/User');
const { verifyAccessToken } = require('../utils/jwt');
const { AppError } = require('./errorMiddleware');

/**
 * Trích xuất Bearer token từ header Authorization.
 */
function extractBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  return token || null;
}

/**
 * Nạp thông tin người dùng hợp lệ từ decoded JWT payload.
 */
async function loadAuthenticatedUser(decoded) {
  const user = await User.findOne({ id: decoded.id || decoded.sub })
    .select('-password')
    .lean();

  if (!user) {
    throw new AppError('Tài khoản gắn với token không còn tồn tại', 401);
  }

  if (user.status === 'locked') {
    throw new AppError('Tài khoản của bạn đã bị tạm khóa', 403);
  }

  return user;
}

/**
 * Middleware xác thực JWT bắt buộc: kiểm tra Bearer Token và gắn req.user.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return next(new AppError('Vui lòng đăng nhập và cung cấp Bearer Token hợp lệ', 401));
    }

    const decoded = verifyAccessToken(token);
    req.user = await loadAuthenticatedUser(decoded);
    req.tokenPayload = decoded;
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Middleware xác thực tùy chọn: nếu có Bearer Token thì xác thực và gắn req.user,
 * nếu không có token vẫn cho đi tiếp như khách vãng lai.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return next();
    }

    const decoded = verifyAccessToken(token);
    req.user = await loadAuthenticatedUser(decoded);
    req.tokenPayload = decoded;
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Middleware phân quyền theo danh sách vai trò cho phép.
 */
const requireRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Chưa xác thực người dùng', 401));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('Bạn không có quyền thực hiện thao tác này', 403));
  }
  return next();
};

/**
 * Chỉ cho phép Quản trị viên (admin).
 */
const requireAdmin = requireRoles('admin');

/**
 * Cho phép Nhân viên (staff) hoặc Quản trị viên (admin) truy cập các route quản trị nội bộ.
 */
const requireStaff = requireRoles('admin', 'staff');

/**
 * Cho phép chính chủ tài khoản thao tác trên hồ sơ của mình hoặc Quản trị viên (admin).
 */
const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Chưa xác thực người dùng', 401));
  }

  const target = (req.params.id || '').trim().toLowerCase();
  const isOwner =
    req.user.id.toLowerCase() === target ||
    (req.user.email && req.user.email.toLowerCase() === target) ||
    (req.body?.id && req.body.id === req.user.id);

  if (req.user.role === 'admin' || isOwner) {
    return next();
  }

  return next(new AppError('Bạn không có quyền chỉnh sửa tài khoản của người khác', 403));
};

module.exports = {
  extractBearerToken,
  authMiddleware,
  authenticateJWT: authMiddleware,
  optionalAuth,
  requireRoles,
  requireAdmin,
  requireStaff,
  requireSelfOrAdmin
};
