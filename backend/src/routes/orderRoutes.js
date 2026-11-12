const express = require('express');
const orderController = require('../controllers/orderController');
const {
  authMiddleware,
  optionalAuth,
  requireAdmin
} = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

router.post('/', optionalAuth, asyncHandler(orderController.createOrder));
router.get('/', authMiddleware, asyncHandler(orderController.getOrders));
router.get('/:id/items', authMiddleware, asyncHandler(orderController.getOrderItems));
router.put('/:id/status', authMiddleware, asyncHandler(orderController.updateOrderStatus));
router.delete('/:id', authMiddleware, requireAdmin, asyncHandler(orderController.deleteOrder));

module.exports = router;
