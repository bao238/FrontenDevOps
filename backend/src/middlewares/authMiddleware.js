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
 * Middleware xác thực JWT bắt buộc: kiểm tra token hợp lệ và gắn req.user.
 */
const authenticateJWT = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return next(new AppError('Vui lòng đăng nhập và cung cấp Bearer Token hợp lệ', 401));
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findOne({ id: decoded.id || decoded.sub })
      .select('-password')
      .lean();

    if (!user) {
      return next(new AppError('Tài khoản gắn với token không còn tồn tại', 401));
    }

    if (user.status === 'locked') {
      return next(new AppError('Tài khoản của bạn đã bị tạm khóa', 403));
    }

    req.user = user;
    req.tokenPayload = decoded;
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Middleware phân quyền theo vai trò (admin, staff, customer).
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

module.exports = {
  extractBearerToken,
  authenticateJWT,
  requireRoles
};
