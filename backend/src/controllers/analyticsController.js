const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');
const { isDbConnected } = require('../config/db');

// Lấy toàn bộ số liệu phân tích và báo cáo doanh thu hệ thống BookStore
exports.getAnalyticsSummary = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    // 1. Lấy tất cả đơn hàng để tổng hợp chỉ số tài chính
    const orders = await Order.find().lean();
    const products = await Product.find().lean();
    const totalUsers = await User.countDocuments();
    const totalReviews = await Review.countDocuments();

    let totalRevenue = 0;
    let completedOrdersCount = 0;
    let shippingOrdersCount = 0;
    let pendingOrdersCount = 0;
    let canceledOrdersCount = 0;

    // Bản đồ thống kê doanh số theo từng đầu sách: productId => { name, imageUrl, author, quantitySold, revenue }
    const bookSalesMap = {};

    // Bản đồ doanh thu theo 7 ngày gần nhất
    const dailyRevenueMap = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyRevenueMap[dateStr] = 0;
    }

    orders.forEach((order) => {
      const orderAmount = Number(order.totalAmount) || 0;

      // Phân loại trạng thái đơn hàng
      if (order.status === 'Hoàn tất') {
        completedOrdersCount++;
        totalRevenue += orderAmount;

        // Thống kê doanh thu theo ngày đối với đơn đã hoàn tất hoặc tạo thành công
        const orderDate = order.date || (order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : null);
        if (orderDate && dailyRevenueMap[orderDate] !== undefined) {
          dailyRevenueMap[orderDate] += orderAmount;
        }

        // Tổng hợp số lượng sách bán ra
        if (Array.isArray(order.items)) {
          order.items.forEach((item) => {
            const p = item.product;
            if (p && p.id) {
              if (!bookSalesMap[p.id]) {
                bookSalesMap[p.id] = {
                  id: p.id,
                  name: p.name || 'Sách không tên',
                  author: p.author || 'Tác giả',
                  imageUrl: p.imageUrl || '',
                  category: p.category || 'Khác',
                  quantitySold: 0,
                  totalSales: 0
                };
              }
              const qty = Number(item.quantity) || 1;
              const price = Number(p.price) || 0;
              bookSalesMap[p.id].quantitySold += qty;
              bookSalesMap[p.id].totalSales += qty * price;
            }
          });
        }
      } else if (order.status === 'Đang giao') {
        shippingOrdersCount++;
      } else if (order.status === 'Đang xử lý') {
        pendingOrdersCount++;
      } else if (order.status === 'Đã hủy') {
        canceledOrdersCount++;
      }
    });

    // Sắp xếp Top 5 sách bán chạy nhất theo số lượng bán ra
    const topSellingBooks = Object.values(bookSalesMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // Chuẩn hóa dữ liệu biểu đồ doanh thu 7 ngày
    const revenueTrend = Object.keys(dailyRevenueMap).map((date) => ({
      date,
      revenue: dailyRevenueMap[date]
    }));

    // Tính giá trị đơn hàng trung bình (AOV - Average Order Value)
    const averageOrderValue = completedOrdersCount > 0 ? Math.round(totalRevenue / completedOrdersCount) : 0;

    // Đếm số sách hết hàng
    const outOfStockCount = products.filter((p) => p.inStock === false).length;

    return res.json({
      success: true,
      data: {
        financial: {
          totalRevenue,
          averageOrderValue,
          completedOrdersCount,
          totalOrdersCount: orders.length
        },
        orderStatusDistribution: {
          completed: completedOrdersCount,
          shipping: shippingOrdersCount,
          pending: pendingOrdersCount,
          canceled: canceledOrdersCount
        },
        inventory: {
          totalBooks: products.length,
          outOfStockBooks: outOfStockCount,
          totalUsers,
          totalReviews
        },
        revenueTrend,
        topSellingBooks
      }
    });
  } catch (err) {
    console.error('❌ [AnalyticsController] Lỗi phân tích số liệu:', err.message);
    return res.status(500).json({ error: 'Lỗi tổng hợp báo cáo phân tích doanh thu', message: err.message });
  }
};
