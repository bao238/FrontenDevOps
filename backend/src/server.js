const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { isDbConnected } = require('./config/db');
const productController = require('./controllers/productController');
const orderController = require('./controllers/orderController');
const authController = require('./controllers/authController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// 1. Healthcheck Endpoint (Cực kỳ quan trọng trong DevOps)
app.get('/api/health', (req, res) => {
  const dbStatus = isDbConnected() ? 'connected (MongoDB)' : 'disconnected';
  res.json({
    status: 'healthy',
    service: 'techstore-backend',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`
  });
});

// 2. Product & Review Routes
app.get('/api/products', productController.getProducts);
app.get('/api/products/:id', productController.getProductById);
app.get('/api/products/:id/reviews', productController.getProductReviews);
app.post('/api/products/:id/reviews', productController.addProductReview);
app.get('/api/reviews', productController.getAllReviews);
app.put('/api/reviews/:id', productController.updateReview);
app.delete('/api/reviews/:id', productController.deleteReview);
app.post('/api/products', productController.createProduct);
app.put('/api/products/:id', productController.updateProduct);
app.delete('/api/products/:id', productController.deleteProduct);

// 3. Order & OrderItem Routes
app.get('/api/orders', orderController.getOrders);
app.get('/api/orders/:id/items', orderController.getOrderItems);
app.get('/api/order-items', orderController.getAllOrderItems);
app.post('/api/orders', orderController.createOrder);
app.put('/api/orders/:id/status', orderController.updateOrderStatus);
app.delete('/api/orders/:id', orderController.deleteOrder);

// 4. Auth & User Routes
app.post('/api/auth/login', authController.login);
app.post('/api/auth/register', authController.register);
app.get('/api/users', authController.getUsers);
app.post('/api/users', authController.register);
app.put('/api/users/:id', authController.updateUser);
app.put('/api/users/:id/status', authController.toggleUserStatus);
app.delete('/api/users/:id', authController.deleteUser);

// Khởi chạy server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Backend] TechStore API Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📡 [Healthcheck] http://localhost:${PORT}/api/health`);
  console.log(`📦 [Products API] http://localhost:${PORT}/api/products`);
});
