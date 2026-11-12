const express = require('express');
const couponController = require('../controllers/couponController');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

router.get('/', asyncHandler(couponController.getCoupons));
router.post('/', asyncHandler(couponController.createCoupon));
router.post('/apply', asyncHandler(couponController.applyCoupon));
router.put('/:id', asyncHandler(couponController.updateCoupon));
router.delete('/:id', asyncHandler(couponController.deleteCoupon));

module.exports = router;
