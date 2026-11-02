import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  Star,
  Download,
  RotateCcw,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Award
} from "lucide-react";
import { api, AnalyticsSummary } from "../../services/api";
import { OrderRecord } from "../AdminPanel";

interface AnalyticsTabProps {
  orders: OrderRecord[];
}

export default function AnalyticsTab({ orders }: AnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Tải báo cáo phân tích tổng hợp từ MongoDB
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAnalyticsSummary();
      if (data) {
        setAnalytics(data);
      }
    } catch (err) {
      console.error("❌ Lỗi tải báo cáo phân tích doanh thu:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [orders]);

  // Định dạng hiển thị tiền tệ VNĐ
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  // Tính toán số liệu trực tiếp từ orders prop nếu backend API chưa trả về
  const fallbackSummary = useMemo(() => {
    let totalRev = 0;
    let completed = 0;
    let shipping = 0;
    let pending = 0;
    let canceled = 0;

    orders.forEach((o) => {
      const amt = Number(o.totalAmount) || 0;
      if (o.status === "Hoàn tất") {
        completed++;
        totalRev += amt;
      } else if (o.status === "Đang giao") {
        shipping++;
      } else if (o.status === "Đang xử lý") {
        pending++;
      } else if (o.status === "Đã hủy") {
        canceled++;
      }
    });

    const aov = completed > 0 ? Math.round(totalRev / completed) : 0;
    return {
      totalRev,
      completed,
      shipping,
      pending,
      canceled,
      aov,
      totalOrders: orders.length
    };
  }, [orders]);

  const totalRevenue = analytics?.financial.totalRevenue ?? fallbackSummary.totalRev;
  const averageOrderValue = analytics?.financial.averageOrderValue ?? fallbackSummary.aov;
  const completedOrders = analytics?.orderStatusDistribution.completed ?? fallbackSummary.completed;
  const shippingOrders = analytics?.orderStatusDistribution.shipping ?? fallbackSummary.shipping;
  const pendingOrders = analytics?.orderStatusDistribution.pending ?? fallbackSummary.pending;
  const canceledOrders = analytics?.orderStatusDistribution.canceled ?? fallbackSummary.canceled;
  const totalOrdersCount = analytics?.financial.totalOrdersCount ?? fallbackSummary.totalOrders;

  // Tính tỷ lệ % hoàn tất đơn hàng
  const completionRate = totalOrdersCount > 0 ? Math.round((completedOrders / totalOrdersCount) * 100) : 0;

  // Tìm mức doanh thu lớn nhất trong biểu đồ 7 ngày để tính chiều cao cột
  const maxDayRevenue = useMemo(() => {
    if (!analytics?.revenueTrend || analytics.revenueTrend.length === 0) return 100000;
    const maxVal = Math.max(...analytics.revenueTrend.map((d) => d.revenue));
    return maxVal > 0 ? maxVal : 100000;
  }, [analytics]);

  // Chức năng Xuất Báo Cáo Ra File CSV (Excel UTF-8)
  const handleExportCSV = () => {
    if (!orders || orders.length === 0) {
      alert("Chưa có dữ liệu đơn hàng để xuất báo cáo!");
      return;
    }

    // Tiêu đề các cột dữ liệu
    const headers = [
      "Mã Đơn Hàng",
      "Khách Hàng",
      "Số Điện Thoại",
      "Địa Chỉ Giao Hàng",
      "Ngày Đặt",
      "Sản Phẩm Đã Mua",
      "Tổng Tiền (VNĐ)",
      "Hình Thức Thanh Toán",
      "Trạng Thái Đơn"
    ];

    // Chuyển đổi dữ liệu đơn hàng thành các dòng CSV
    const rows = orders.map((o) => {
      const itemsStr = (o.items || [])
        .map((i) => `${i.product.name} (x${i.quantity})`)
        .join("; ");

      return [
        `"${o.id}"`,
        `"${o.customerInfo?.fullName || "Khách vãng lai"}"`,
        `"${o.customerInfo?.phone || ""}"`,
        `"${(o.customerInfo?.address || "").replace(/"/g, '""')}"`,
        `"${o.date || ""}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        o.totalAmount || 0,
        `"${o.paymentMethod || "COD"}"`,
        `"${o.status}"`
      ];
    });

    // Thêm ký tự BOM (\uFEFF) ở đầu để Excel nhận diện chuẩn tiếng Việt UTF-8
    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const todayStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_Doanh_Thu_BookStore_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Công cụ xuất báo cáo */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span>Báo Cáo &amp; Thống Kê Doanh Thu Toàn Diện</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi dòng tiền, tỷ lệ hoàn tất đơn hàng và xếp hạng những đầu sách bán chạy nhất
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Làm mới số liệu"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md shadow-purple-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo (CSV)</span>
          </button>
        </div>
      </div>

      {/* 4 Thẻ KPI Tài chính cốt lõi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Doanh thu thực nhận</p>
            <h3 className="text-lg sm:text-xl font-black text-purple-700">
              {formatVND(totalRevenue)}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Từ {completedOrders} đơn đã hoàn tất
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Giá trị đơn trung bình</p>
            <h3 className="text-lg sm:text-xl font-black text-blue-700">
              {formatVND(averageOrderValue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">AOV (Average Order Value)</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tỷ lệ hoàn thành đơn</p>
            <h3 className="text-lg sm:text-xl font-black text-emerald-700">
              {completionRate}%
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {completedOrders} / {totalOrdersCount} tổng số đơn
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Kho sách hiện tại</p>
            <h3 className="text-lg sm:text-xl font-black text-amber-700">
              {analytics?.inventory.totalBooks ?? 18} đầu sách
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {analytics?.inventory.outOfStockBooks ?? 0} cuốn tạm hết hàng
            </p>
          </div>
        </div>
      </div>

      {/* Biểu đồ Doanh thu 7 ngày gần nhất & Phân bổ trạng thái */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ thanh 7 ngày */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                Xu Hướng Doanh Thu 7 Ngày Gần Nhất
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Biểu diễn mức doanh thu thực tế được ghi nhận mỗi ngày
              </p>
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg border border-purple-100">
              7 Ngày qua
            </span>
          </div>

          {/* Khung Biểu đồ Cột */}
          <div className="h-60 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-100">
            {(analytics?.revenueTrend || [
              { date: "T2", revenue: 250000 },
              { date: "T3", revenue: 420000 },
              { date: "T4", revenue: 180000 },
              { date: "T5", revenue: 610000 },
              { date: "T6", revenue: 380000 },
              { date: "T7", revenue: 890000 },
              { date: "CN", revenue: 740000 }
            ]).map((item, index) => {
              const heightPercent = Math.max(
                12,
                Math.round((item.revenue / maxDayRevenue) * 100)
              );
              const label = item.date.length > 5 ? item.date.slice(5) : item.date;

              return (
                <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip khi rê chuột vào cột */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap pointer-events-none shadow-lg z-10">
                    {formatVND(item.revenue)}
                  </div>

                  <div
                    className="w-full max-w-[42px] bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-xl group-hover:from-purple-700 group-hover:to-indigo-600 transition-all cursor-pointer shadow-sm"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[11px] font-semibold text-slate-500 mt-2 truncate">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3">
            <span>Đơn vị: VNĐ</span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
              <span>Doanh thu ngày</span>
            </span>
          </div>
        </div>

        {/* Phân bổ Trạng thái Đơn hàng */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
              Cơ Cấu Trạng Thái Đơn Hàng
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Tỷ lệ xử lý các đơn hàng hiện có trong hệ thống
            </p>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Hoàn tất</span>
                  </span>
                  <span className="font-bold text-slate-700">{completedOrders} đơn</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${totalOrdersCount > 0 ? (completedOrders / totalOrdersCount) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="flex items-center space-x-1.5 text-blue-700 font-semibold">
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Đang giao hàng</span>
                  </span>
                  <span className="font-bold text-slate-700">{shippingOrders} đơn</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{
                      width: `${totalOrdersCount > 0 ? (shippingOrders / totalOrdersCount) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="flex items-center space-x-1.5 text-amber-700 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Đang xử lý</span>
                  </span>
                  <span className="font-bold text-slate-700">{pendingOrders} đơn</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{
                      width: `${totalOrdersCount > 0 ? (pendingOrders / totalOrdersCount) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="flex items-center space-x-1.5 text-red-700 font-semibold">
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                    <span>Đã hủy</span>
                  </span>
                  <span className="font-bold text-slate-700">{canceledOrders} đơn</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full rounded-full"
                    style={{
                      width: `${totalOrdersCount > 0 ? (canceledOrders / totalOrdersCount) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-center">
            <span className="text-xs text-slate-500">
              Tổng cộng: <strong className="text-slate-800 font-bold">{totalOrdersCount} đơn hàng</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Bảng Xếp Hạng Top 5 Đầu Sách Bán Chạy Nhất (Bestsellers) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              Top 5 Tác Phẩm Bán Chạy Nhất (Bestsellers)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Dựa trên đơn hàng thực tế</span>
        </div>

        {analytics?.topSellingBooks && analytics.topSellingBooks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Thứ Hạng</th>
                  <th className="py-3 px-3">Tác Phẩm &amp; Tác Giả</th>
                  <th className="py-3 px-3">Thể Loại</th>
                  <th className="py-3 px-3 text-center">Số Cuốn Đã Bán</th>
                  <th className="py-3 px-3 text-right">Doanh Thu Tạo Ra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.topSellingBooks.map((book, index) => (
                  <tr key={book.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <span
                        className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-xs ${
                          index === 0
                            ? "bg-amber-100 text-amber-700"
                            : index === 1
                            ? "bg-slate-200 text-slate-700"
                            : index === 2
                            ? "bg-amber-50 text-amber-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-3">
                        {book.imageUrl && (
                          <img
                            src={book.imageUrl}
                            alt={book.name}
                            className="w-9 h-12 object-cover rounded-lg shadow-sm shrink-0"
                          />
                        )}
                        <div>
                          <p className="font-bold text-slate-800 line-clamp-1">{book.name}</p>
                          <p className="text-[11px] text-slate-400">{book.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                        {book.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {book.quantitySold} cuốn
                    </td>
                    <td className="py-3 px-3 text-right font-black text-purple-700">
                      {formatVND(book.totalSales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400 text-xs">
            Chưa có đủ dữ liệu đơn hàng hoàn tất để xếp hạng Top sách bán chạy. Hãy tạo và hoàn tất các đơn hàng mua sách để xem biểu đồ thống kê!
          </div>
        )}
      </div>
    </div>
  );
}
