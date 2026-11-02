import React, { useState, useMemo } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  ArrowLeft,
  ChevronRight,
  RotateCcw,
  ShoppingBag,
  ExternalLink,
  MapPin,
  Phone,
  User,
  CreditCard,
  Sparkles,
  BookOpen,
  Filter
} from "lucide-react";
import { Product } from "../data/products";
import { UserProfile, OrderRecord } from "../App";

interface MyOrdersPageProps {
  orders: OrderRecord[];
  currentUser: UserProfile | null;
  onContinueShopping: () => void;
  onTrackOrder: (order: OrderRecord) => void;
  onReorder: (order: OrderRecord) => void;
  onOpenAuth: () => void;
}

export default function MyOrdersPage({
  orders,
  currentUser,
  onContinueShopping,
  onTrackOrder,
  onReorder,
  onOpenAuth
}: MyOrdersPageProps) {
  // Trạng thái bộ lọc đơn hàng
  const [selectedStatus, setSelectedStatus] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Định dạng hiển thị tiền VNĐ
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Thống kê nhanh đơn hàng
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const processing = orders.filter((o) => o.status === "Đang xử lý").length;
    const shipping = orders.filter((o) => o.status === "Đang giao").length;
    const completed = orders.filter((o) => o.status === "Hoàn tất").length;
    const totalSpent = orders
      .filter((o) => o.status !== "Đã hủy")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return { totalOrders, processing, shipping, completed, totalSpent };
  }, [orders]);

  // Lọc danh sách đơn hàng theo trạng thái & từ khóa tìm kiếm
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Lọc theo trạng thái
      const matchStatus =
        selectedStatus === "Tất cả" || ord.status === selectedStatus;

      // Lọc theo từ khóa tìm kiếm (Mã đơn, Tên người nhận, SĐT hoặc Tên cuốn sách)
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        ord.id.toLowerCase().includes(q) ||
        ord.customerInfo?.fullName?.toLowerCase().includes(q) ||
        ord.customerInfo?.phone?.includes(q) ||
        ord.items.some((item) => item.product.name.toLowerCase().includes(q));

      return matchStatus && matchQuery;
    });
  }, [orders, selectedStatus, searchQuery]);

  // Trợ giúp tạo màu sắc tương ứng cho trạng thái đơn hàng
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Đang xử lý":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500",
          icon: Clock,
          label: "Đang Xử Lý & Đóng Gói",
        };
      case "Đang giao":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-500",
          icon: Truck,
          label: "Đang Giao Tận Nơi",
        };
      case "Hoàn tất":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
          icon: CheckCircle2,
          label: "Giao Hàng Thành Công",
        };
      case "Đã hủy":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          dot: "bg-rose-500",
          icon: XCircle,
          label: "Đã Hủy Đơn Hàng",
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          dot: "bg-slate-500",
          icon: Package,
          label: status,
        };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumbs & Nút Tiếp tục mua sắm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <button
            onClick={onContinueShopping}
            className="hover:text-blue-600 transition-colors font-medium"
          >
            Trang chủ
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-900">Đơn hàng của tôi</span>
        </div>

        <button
          onClick={onContinueShopping}
          className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-4 py-2 rounded-xl transition-all self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tiếp tục chọn sách</span>
        </button>
      </div>

      {/* Header Trang & Chỉ Số Đơn Hàng */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>Trang Quản Lý Đơn Hàng Cá Nhân</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Lịch Sử &amp; Theo Dõi Đơn Hàng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi lộ trình vận chuyển, xem lại tác phẩm đã mua và đặt lại đơn hàng chỉ với 1 click
          </p>
        </div>

        {currentUser ? (
          <div className="flex items-center space-x-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <img
              src={currentUser.avatarUrl || "/default-avatar.png"}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            <div>
              <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
              <p className="text-[11px] text-slate-400 font-mono">{currentUser.email}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Đăng nhập để đồng bộ đơn</span>
          </button>
        )}
      </div>

      {/* 4 Thẻ Thống Kê Nhanh (Order Analytics Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 font-medium">Tổng số đơn</span>
            <span className="text-lg sm:text-xl font-black text-slate-900">{stats.totalOrders} đơn</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 font-medium">Đang xử lý</span>
            <span className="text-lg sm:text-xl font-black text-amber-600">{stats.processing} đơn</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 font-medium">Đang vận chuyển</span>
            <span className="text-lg sm:text-xl font-black text-blue-600">{stats.shipping} đơn</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 font-medium">Tổng tiền đã chi</span>
            <span className="text-base sm:text-lg font-black text-emerald-600 truncate">
              {formatVND(stats.totalSpent)}
            </span>
          </div>
        </div>
      </div>

      {/* Bộ Lọc Trạng Thái & Ô Tìm Kiếm Đơn Hàng */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {["Tất cả", "Đang xử lý", "Đang giao", "Hoàn tất", "Đã hủy"].map((st) => {
            const count =
              st === "Tất cả"
                ? orders.length
                : orders.filter((o) => o.status === st).length;

            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  selectedStatus === st
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{st}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    selectedStatus === st
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn, tên sách, SĐT..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* DANH SÁCH CÁC THẺ ĐƠN HÀNG */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 sm:p-14 text-center shadow-sm space-y-4 max-w-xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10 stroke-1" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              {searchQuery || selectedStatus !== "Tất cả"
                ? "Không tìm thấy đơn hàng phù hợp"
                : "Bạn chưa có đơn mua hàng nào"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedStatus !== "Tất cả"
                ? "Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc trạng thái."
                : "Khám phá hàng ngàn tựa sách Bestseller với nhiều ưu đãi độc quyền tại BookStore ngay hôm nay."}
            </p>
          </div>
          <div>
            {searchQuery || selectedStatus !== "Tất cả" ? (
              <button
                onClick={() => {
                  setSelectedStatus("Tất cả");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Xóa Bộ Lọc
              </button>
            ) : (
              <button
                onClick={onContinueShopping}
                className="px-6 py-3 bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all transform hover:-translate-y-0.5 inline-flex items-center space-x-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Khám Phá Tủ Sách Ngay</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((ord) => {
            const badge = getStatusBadge(ord.status);
            const StatusIcon = badge.icon;

            return (
              <div
                key={ord.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header Thẻ Đơn Hàng */}
                <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono font-black text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                      #{ord.id}
                    </span>
                    <span className="text-xs text-slate-400">
                      Ngày đặt: <strong className="text-slate-700">{ord.date}</strong>
                    </span>
                    <span className="text-slate-300 hidden sm:inline">&bull;</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Phương thức: <strong className="text-slate-700">{ord.paymentMethod}</strong>
                    </span>
                  </div>

                  {/* Badge Trạng Thái */}
                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>

                {/* Danh Sách Tác Phẩm Trong Đơn Hàng */}
                <div className="p-4 sm:p-6 divide-y divide-slate-100">
                  {ord.items.map((item) => (
                    <div
                      key={item.product.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        {/* Bìa sách 3:4 có gáy sách */}
                        <div className="relative aspect-[3/4] w-14 sm:w-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />
                        </div>

                        <div className="min-w-0 space-y-1">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {item.product.category}
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {item.product.name}
                          </h4>
                          {item.product.author && (
                            <p className="text-[11px] text-slate-400 truncate">
                              Tác giả: <span className="text-slate-600 font-medium">{item.product.author}</span>
                            </p>
                          )}
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-slate-500 font-medium">
                              {formatVND(item.product.price)} x {item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-black text-slate-900">
                          {formatVND(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Thông Tin Người Nhận & Thanh Toán */}
                <div className="p-4 sm:p-5 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Địa chỉ giao hàng */}
                  <div className="text-xs text-slate-600 space-y-1 flex-1">
                    <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>{ord.customerInfo.fullName} &bull; {ord.customerInfo.phone}</span>
                    </div>
                    <div className="flex items-start space-x-1.5 text-slate-500 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{ord.customerInfo.address}</span>
                    </div>
                  </div>

                  {/* Tổng tiền & Nút hành động */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200">
                    <div className="text-left sm:text-right">
                      <span className="block text-[10px] text-slate-400">Tổng thanh toán:</span>
                      <span className="text-base sm:text-lg font-black text-red-600">
                        {formatVND(ord.totalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Nút Tra cứu hành trình đơn */}
                      <button
                        onClick={() => onTrackOrder(ord)}
                        className="px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Tra Cứu Lộ Trình</span>
                      </button>

                      {/* Nút Mua lại đơn này */}
                      <button
                        onClick={() => onReorder(ord)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Mua Lại Đơn Này</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
