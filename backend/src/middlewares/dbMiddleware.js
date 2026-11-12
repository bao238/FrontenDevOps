const { isDbConnected } = require('../config/db');
const { AppError } = require('./errorMiddleware');

/**
 * Middleware kiểm tra trạng thái kết nối MongoDB trước khi thực thi các route nghiệp vụ.
 */
const requireDbConnection = (req, res, next) => {
  if (!isDbConnected()) {
    return next(new AppError('Cơ sở dữ liệu MongoDB chưa kết nối', 503));
  }
  return next();
};

module.exports = {
  requireDbConnection
};
