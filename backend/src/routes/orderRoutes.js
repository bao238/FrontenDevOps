const express = require('express');
const orderController = require('../controllers/orderController');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

router.get('/', asyncHandler(orderController.getOrders));
router.get('/:id/items', asyncHandler(orderController.getOrderItems));
router.post('/', asyncHandler(orderController.createOrder));
router.put('/:id/status', asyncHandler(orderController.updateOrderStatus));
router.delete('/:id', asyncHandler(orderController.deleteOrder));

module.exports = router;
