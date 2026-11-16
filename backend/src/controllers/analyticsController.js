const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');

// Lấy toàn bộ số liệu phân tích và báo cáo doanh thu hệ thống BookStore trực tiếp từ MongoDB (Aggregation)
exports.getAnalyticsSummary = async (req, res, next) => {
  try {
    // 1. Tổng hợp song song các chỉ số tổng quan với hiệu năng cao O(1)
    const [
      totalOrders,
      completedOrdersCount,
      shippingOrdersCount,
      pendingOrdersCount,
      canceledOrdersCount,
      totalUsers,
      totalReviews,
      totalBooks,
      outOfStockCount,
      revenueAgg,
      topBooksAgg,
      vipUsersAgg,
      categorySalesAgg,
      trendAgg
    ] = await Promise.all([
      // Đếm số đơn hàng theo từng trạng thái
      Order.countDocuments(),
      Order.countDocuments({ status: 'Hoàn tất' }),
      Order.countDocuments({ status: { $in: ['Chờ giao hàng', 'Đang giao'] } }),
      Order.countDocuments({ status: { $in: ['Chờ xác nhận', 'Chờ lấy hàng', 'Đang xử lý'] } }),
      Order.countDocuments({ status: 'Đã hủy' }),
      // Đếm người dùng, đánh giá, sách và sách hết hàng
      User.countDocuments(),
      Review.countDocuments(),
      Product.countDocuments(),
      Product.countDocuments({ $or: [{ inStock: false }, { stockQuantity: 0 }] }),
      // Tổng doanh thu từ các đơn hàng không bị hủy
      Order.aggregate([
        { $match: { status: { $ne: 'Đã hủy' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // 3. Top 5 Sách Bán Chạy nhất tính thực tế từ mảng items trong các đơn hàng MongoDB
      Order.aggregate([
        { $match: { status: { $ne: 'Đã hủy' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: { $ifNull: ['$items.product.id', '$items.product._id'] },
            name: { $first: '$items.product.name' },
            category: { $first: '$items.product.category' },
            author: { $first: '$items.product.author' },
            imageUrl: { $first: '$items.product.imageUrl' },
            price: { $first: '$items.product.price' },
            quantitySold: { $sum: '$items.quantity' },
            totalSales: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$items.quantity', 1] },
                  { $ifNull: ['$items.product.price', 0] }
                ]
              }
            }
          }
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { quantitySold: -1, totalSales: -1 } },
        { $limit: 5 }
      ]),
      // 4. Top 5 Khách hàng VIP theo tổng chi tiêu thực tế từ các đơn hàng (lấy cả customerInfo.phone lẫn customerPhone)
      Order.aggregate([
        { $match: { status: { $ne: 'Đã hủy' } } },
        {
          $group: {
            _id: {
              $ifNull: ['$customerInfo.phone', '$customerPhone']
            },
            customerName: {
              $first: { $ifNull: ['$customerInfo.fullName', '$customerName'] }
            },
            totalSpent: { $sum: '$totalAmount' },
            ordersCount: { $sum: 1 }
          }
        },
        { $match: { _id: { $ne: null, $ne: '' } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 }
      ]),
      // 5. Cơ cấu doanh số thực tế theo nhóm danh mục sách
      Order.aggregate([
        { $match: { status: { $ne: 'Đã hủy' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: { $ifNull: ['$items.product.category', 'Khác'] },
            revenue: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$items.quantity', 1] },
                  { $ifNull: ['$items.product.price', 0] }
                ]
              }
            },
            quantity: { $sum: '$items.quantity' }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]),
      // 6. Xu hướng doanh thu theo ngày từ dữ liệu đơn hàng
      Order.aggregate([
        { $match: { status: { $ne: 'Đã hủy' } } },
        {
          $group: {
            _id: {
              $ifNull: [
                '$date',
                { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
              ]
            },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { _id: -1 } },
        { $limit: 7 }
      ])
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const averageOrderValue = completedOrdersCount > 0 ? Math.round(totalRevenue / completedOrdersCount) : 0;

    // Chuẩn hóa danh sách Top 5 sách bán chạy kèm thông tin ảnh và tác giả
    const topProductIds = topBooksAgg.map(b => b._id);
    const dbProducts = await Product.find({ id: { $in: topProductIds } }).lean();
    const dbProductMap = new Map(dbProducts.map(p => [p.id, p]));

    const topSellingBooks = topBooksAgg.map(b => {
      const p = dbProductMap.get(b._id);
      return {
        id: b._id,
        name: b.name || p?.name || 'Sách BookStore',
        author: b.author || p?.author || p?.specs?.['Tác giả'] || 'Nhiều tác giả',
        imageUrl: b.imageUrl || p?.imageUrl || '',
        category: b.category || p?.category || 'Văn học - Tiểu thuyết',
        quantitySold: b.quantitySold || 0,
        totalSales: b.totalSales || 0
      };
    });

    // Chuẩn hóa Top 5 Khách hàng VIP
    const vipCustomers = vipUsersAgg.map((u, i) => ({
      rank: i + 1,
      name: u.customerName || `Khách hàng VIP #${i + 1}`,
      phone: u._id,
      totalSpent: u.totalSpent,
      ordersCount: u.ordersCount
    }));

    // Chuẩn hóa Cơ cấu doanh số theo nhóm danh mục
    const totalCatRevenue = categorySalesAgg.reduce((sum, c) => sum + c.revenue, 0) || totalRevenue || 1;
    const categorySales = categorySalesAgg.map(c => ({
      name: c._id || 'Khác',
      percentage: Number(((c.revenue / totalCatRevenue) * 100).toFixed(1)),
      revenue: c.revenue
    }));

    // Chuẩn hóa Xu hướng doanh thu 7 ngày
    const revenueTrend = (trendAgg || []).reverse().map(t => ({
      date: t._id,
      revenue: t.revenue
    }));

    return res.json({
      success: true,
      data: {
        financial: {
          totalRevenue,
          averageOrderValue,
          completedOrdersCount,
          totalOrdersCount: totalOrders
        },
        orderStatusDistribution: {
          completed: completedOrdersCount,
          shipping: shippingOrdersCount,
          pending: pendingOrdersCount,
          canceled: canceledOrdersCount
        },
        inventory: {
          totalBooks,
          outOfStockBooks: outOfStockCount,
          totalUsers,
          totalReviews
        },
        revenueTrend,
        topSellingBooks,
        vipCustomers,
        categorySales
      }
    });
  } catch (err) {
    return next(err);
  }
};
