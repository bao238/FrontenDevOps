const express = require('express');
const cors = require('cors');
require('dotenv').config();

require('./config/db');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middlewares tiếp nhận CORS và JSON payload dung lượng lớn (phục vụ upload ảnh base64 trực tiếp từ máy tính)
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Gắn toàn bộ API Routes tập trung dưới tiền tố /api
app.use('/api', apiRoutes);

// Middleware xử lý đường dẫn không tồn tại (404 Handler) & xử lý ngoại lệ tập trung (ErrorMiddleware)
app.use(notFoundHandler);
app.use(errorHandler);

// Chỉ tự động listen khi chạy trực tiếp bằng Node (giúp import app cho test dễ dàng)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Backend] BookStore API Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📡 [Healthcheck] http://localhost:${PORT}/api/health`);
    console.log(`📊 [Analytics API] http://localhost:${PORT}/api/analytics/summary`);
    console.log(`🎟️ [Coupons API] http://localhost:${PORT}/api/coupons`);
    console.log(`📂 [Categories API] http://localhost:${PORT}/api/categories`);
    console.log(`📚 [Books API] http://localhost:${PORT}/api/products`);
  });
}

module.exports = app;
