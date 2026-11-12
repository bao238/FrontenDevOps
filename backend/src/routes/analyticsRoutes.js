const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { asyncHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

router.get('/summary', asyncHandler(analyticsController.getAnalyticsSummary));

module.exports = router;
