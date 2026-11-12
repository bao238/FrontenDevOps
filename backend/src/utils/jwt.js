const jwt = require('jsonwebtoken');

const DEV_FALLBACK_SECRET = 'bookstore-dev-jwt-secret-change-in-production';
const JWT_SECRET = process.env.JWT_SECRET || DEV_FALLBACK_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}-refresh`;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('⚠️ [JWT] Đang sử dụng JWT_SECRET mặc định trong môi trường production. Vui lòng cấu hình biến môi trường JWT_SECRET!');
}

/**
 * Tạo payload chuẩn gắn vào token từ thông tin người dùng.
 */
function buildTokenPayload(user) {
  return {
    sub: user.id,
    id: user.id,
    email: user.email,
    role: user.role || 'customer'
  };
}

/**
 * Ký Access Token JWT cho phiên đăng nhập.
 */
function signAccessToken(user) {
  return jwt.sign(buildTokenPayload(user), JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Ký Refresh Token JWT dùng để cấp lại Access Token khi hết hạn.
 */
function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      id: user.id,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN
    }
  );
}

/**
 * Xác thực và giải mã Access Token JWT.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Xác thực và giải mã Refresh Token JWT.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = {
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
