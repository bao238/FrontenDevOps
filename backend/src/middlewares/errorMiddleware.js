/**
 * Lớp lỗi nghiệp vụ tùy chỉnh (Operational Error) dùng cho xử lý ngoại lệ tập trung.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bọc các controller bất đồng bộ để tự động chuyển lỗi về ErrorMiddleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Middleware xử lý 404 khi không có route nào khớp với request.
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Không tìm thấy đường dẫn API: ${req.method} ${req.originalUrl}`, 404));
};

/**
 * Chuẩn hóa các lỗi phổ biến từ Express, JSON parser và Mongoose/MongoDB.
 */
function normalizeError(err) {
  // Lỗi cú pháp JSON trong request body
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400 && 'body' in err)) {
    return new AppError('Dữ liệu JSON gửi lên không hợp lệ', 400);
  }

  // Lỗi vượt quá giới hạn dung lượng payload (25MB)
  if (err.type === 'entity.too.large') {
    return new AppError('Dung lượng dữ liệu gửi lên vượt quá giới hạn cho phép (25MB)', 413);
  }

  // Lỗi sai định dạng ObjectId / kiểu dữ liệu trong Mongoose
  if (err.name === 'CastError') {
    return new AppError(`Giá trị không hợp lệ cho trường "${err.path}": ${err.value}`, 400);
  }

  // Lỗi validation của Mongoose Schema
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((item) => item.message);
    return new AppError(details.length > 0 ? details.join('; ') : 'Dữ liệu đầu vào không hợp lệ', 400);
  }

  // Lỗi trùng khóa duy nhất trong MongoDB (Duplicate Key E11000)
  if (err.code === 11000) {
    const duplicatedFields = Object.keys(err.keyValue || {});
    const fieldText = duplicatedFields.length > 0 ? duplicatedFields.join(', ') : 'ID/Email';
    return new AppError(`Dữ liệu bị trùng lặp (${fieldText}) trong hệ thống`, 400);
  }

  // Lỗi xác thực JWT (jsonwebtoken)
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Token xác thực không hợp lệ', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return new AppError('Phiên đăng nhập (Token) đã hết hạn, vui lòng đăng nhập lại', 401);
  }
  if (err.name === 'NotBeforeError') {
    return new AppError('Token xác thực chưa có hiệu lực', 401);
  }

  return err;
}

/**
 * Middleware xử lý ngoại lệ tập trung cho toàn bộ Express server.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const normalized = normalizeError(err);
  const statusCode = normalized.statusCode || (Number.isInteger(normalized.status) ? normalized.status : 500);
  const message = normalized.message || 'Lỗi máy chủ nội bộ';

  console.error(
    `❌ [ErrorMiddleware] ${statusCode} | ${req.method} ${req.originalUrl} | ${message}`
  );

  const responsePayload = {
    success: false,
    statusCode,
    error: message,
    message
  };

  if (process.env.NODE_ENV === 'development' && normalized.stack) {
    responsePayload.stack = normalized.stack;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = {
  AppError,
  asyncHandler,
  notFoundHandler,
  errorHandler
};
