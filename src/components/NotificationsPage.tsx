import React, { useState, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Package,
  Tag,
  Star,
  Info,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle,
  Inbox,
  LogIn,
  ShieldAlert
} from "lucide-react";
import {
  NotificationItem,
  NotificationType,
  NotificationFilter
} from "../types/notification";

interface NotificationsPageProps {
  // Danh sách thông báo đầy đủ
  notifications: NotificationItem[];
  // Số lượng thông báo chưa đọc
  unreadCount: number;
  // Người dùng hiện tại (nếu có)
  currentUser?: any;
  // Mở modal đăng nhập
  onOpenAuthModal?: () => void;
  // Đánh dấu 1 thông báo là đã đọc
  onMarkAsRead: (id: string) => void;
  // Đánh dấu tất cả là đã đọc
  onMarkAllAsRead: () => void;
  // Xóa thông báo khỏi danh sách
  onDeleteNotification: (id: string) => void;
  // Xóa toàn bộ thông báo
  onDeleteAllNotifications?: () => void;
  // Điều hướng người dùng tới trang Đơn hàng
  onNavigateToOrders?: (orderId?: string) => void;
  // Điều hướng người dùng tới trang Cửa hàng / Sản phẩm
  onNavigateToProducts?: () => void;
  // Làm mới lại dữ liệu từ Server
  onRefresh?: () => void;
}

/**
 * Định dạng thời gian hiển thị thân thiện bằng tiếng Việt
 */
function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return "Vừa xong";
  }
}

/**
 * Trả về cấu hình hiển thị tương ứng với loại thông báo
 */
function getTypeConfig(type: NotificationType) {
  switch (type) {
    case "order":
      return {
        label: "Đơn hàng",
        icon: <Package className="w-5 h-5 text-blue-600" />,
        bgColor: "bg-blue-50 text-blue-700 border-blue-200",
        badgeBg: "bg-blue-100 text-blue-700",
        actionText: "Xem đơn hàng"
      };
    case "coupon":
      return {
        label: "Khuyến mãi",
        icon: <Tag className="w-5 h-5 text-amber-600" />,
        bgColor: "bg-amber-50 text-amber-700 border-amber-200",
        badgeBg: "bg-amber-100 text-amber-700",
        actionText: "Dùng ưu đãi"
      };
    case "review":
      return {
        label: "Đánh giá",
        icon: <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />,
        bgColor: "bg-yellow-50 text-yellow-700 border-yellow-200",
        badgeBg: "bg-yellow-100 text-yellow-800",
        actionText: "Xem đánh giá"
      };
    case "system":
    default:
      return {
        label: "Hệ thống",
        icon: <Info className="w-5 h-5 text-purple-600" />,
        bgColor: "bg-purple-50 text-purple-700 border-purple-200",
        badgeBg: "bg-purple-100 text-purple-700",
        actionText: "Khám phá ngay"
      };
  }
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  unreadCount,
  currentUser,
  onOpenAuthModal,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onDeleteAllNotifications,
  onNavigateToOrders,
  onNavigateToProducts,
  onRefresh
}) => {
  // Bộ lọc phân loại đang chọn
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  // Từ khóa tìm kiếm trong thông báo
  const [searchQuery, setSearchQuery] = useState<string>("");
  // Trạng thái đang tải lại dữ liệu
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  // Trạng thái modal xác nhận xóa tất cả thông báo
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState<boolean>(false);

  // Thống kê nhanh số lượng theo danh mục
  const stats = useMemo(() => {
    return {
      total: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      order: notifications.filter((n) => n.type === "order").length,
      coupon: notifications.filter((n) => n.type === "coupon").length
    };
  }, [notifications]);

  // Lọc thông báo theo bộ lọc và từ khóa tìm kiếm
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // 1. Lọc theo tab phân loại
      if (activeFilter === "unread" && item.isRead) return false;
      if (
        activeFilter !== "all" &&
        activeFilter !== "unread" &&
        item.type !== activeFilter
      ) {
        return false;
      }

      // 2. Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchMsg = item.message.toLowerCase().includes(query);
        return matchTitle || matchMsg;
      }

      return true;
    });
  }, [notifications, activeFilter, searchQuery]);

  // Xử lý khi nhấn nút làm mới
  const handleRefreshClick = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Xử lý khi người dùng nhấn vào nút hành động của thông báo
  const handleItemAction = (item: NotificationItem) => {
    if (!item.isRead) {
      onMarkAsRead(item.id);
    }

    if (item.type === "order" && onNavigateToOrders) {
      onNavigateToOrders(item.metadata?.orderId);
    } else if (item.type === "coupon" && onNavigateToProducts) {
      onNavigateToProducts();
    } else if (onNavigateToProducts) {
      onNavigateToProducts();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Trang Thông Báo */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100 border border-white/20">
            <Bell className="w-3.5 h-3.5" />
            <span>Hộp thư thông báo BookStore</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Trung Tâm Thông Báo
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
            {currentUser
              ? `Xin chào ${currentUser.name}! Cập nhật tình trạng đơn hàng thời gian thực, nhận voucher độc quyền và các tin tức mới nhất.`
              : "Theo dõi các tin tức ưu đãi, khuyến mãi sách hấp dẫn và thông báo mới nhất từ BookStore."}
          </p>
        </div>

        {/* Nút hành động nhanh trên banner */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Đã đọc tất cả</span>
            </button>
          )}

          {notifications.length > 0 && onDeleteAllNotifications && (
            <button
              onClick={() => setIsConfirmDeleteAllOpen(true)}
              className="px-4 py-2.5 bg-rose-500/90 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center space-x-2 active:scale-95 cursor-pointer border border-rose-400/30"
              title="Xóa tất cả thông báo"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa tất cả</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-2xl border border-white/20 transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Làm mới thông báo"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>{isRefreshing ? "Đang tải..." : "Làm mới"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal xác nhận xóa tất cả thông báo an toàn */}
      {isConfirmDeleteAllOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-5 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Xác nhận xóa tất cả?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Toàn bộ <strong className="text-slate-800">{notifications.length}</strong> thông báo trong danh sách sẽ bị xóa vĩnh viễn khỏi hệ thống. Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteAllOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmDeleteAllOpen(false);
                  if (onDeleteAllNotifications) {
                    onDeleteAllNotifications();
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-500/25 cursor-pointer active:scale-95"
              >
                Đồng ý xóa hết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner nhắc đăng nhập nếu là khách vãng lai */}
      {!currentUser && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                Bạn đang xem thông báo chung của hệ thống
              </h4>
              <p className="text-xs text-amber-700">
                Đăng nhập tài khoản để nhận thông báo cập nhật đơn hàng riêng và ưu đãi dành riêng cho bạn.
              </p>
            </div>
          </div>
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center space-x-1.5 flex-shrink-0 cursor-pointer active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng Nhập Ngay</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Thẻ Thống Kê Tổng Quan (KPI Badges) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold flex-shrink-0">
            <Bell className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Tổng thông báo
            </p>
            <p className="text-lg font-black text-slate-800">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Chưa đọc
            </p>
            <p className="text-lg font-black text-blue-600">{stats.unread}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Đơn hàng
            </p>
            <p className="text-lg font-black text-slate-800">{stats.order}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
            <Tag className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Khuyến mãi
            </p>
            <p className="text-lg font-black text-slate-800">{stats.coupon}</p>
          </div>
        </div>
      </div>

      {/* 3. Thanh Lọc Danh Mục & Ô Tìm Kiếm */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Bộ nút phân loại */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: "all", label: "Tất cả", count: stats.total },
            { id: "unread", label: "Chưa đọc", count: stats.unread },
            { id: "order", label: "Đơn hàng", count: stats.order },
            { id: "coupon", label: "Ưu đãi", count: stats.coupon },
            { id: "system", label: "Hệ thống" }
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as NotificationFilter)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? "bg-white text-blue-700"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Ô tìm kiếm thông báo */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, nội dung..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* 4. Danh Sách Thẻ Thông Báo - Thiết Kế Lưới Gióng Hàng Chuẩn Tuyệt Đối */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Không tìm thấy thông báo nào
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              {activeFilter === "order" && !currentUser
                ? "Vui lòng đăng nhập để xem thông báo cập nhật các đơn hàng của bạn."
                : searchQuery
                ? "Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc phân loại khác."
                : "Hộp thư thông báo hiện đang trống."}
            </p>
            {activeFilter === "order" && !currentUser && onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập Ngay</span>
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const config = getTypeConfig(item.type);
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group ${
                  !item.isRead
                    ? "border-blue-200/90 bg-gradient-to-r from-blue-50/30 via-white to-white ring-1 ring-blue-500/10"
                    : "border-slate-200/80"
                }`}
              >
                {/* Dải màu nhấn tinh tế bên trái cho thông báo chưa đọc */}
                {!item.isRead && (
                  <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-blue-600 rounded-r-full" />
                )}

                {/* Phần thân thông báo */}
                <div className="flex items-start space-x-3.5 flex-1 min-w-0 pl-1">
                  {/* Icon phân loại */}
                  <div
                    className={`w-11 h-11 rounded-2xl border flex-shrink-0 flex items-center justify-center ${config.bgColor}`}
                  >
                    {config.icon}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${config.badgeBg}`}
                      >
                        {config.label}
                      </span>
                      {!item.isRead && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-600 text-white animate-pulse">
                          Mới
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>

                    <h4
                      className={`text-sm sm:text-base leading-snug ${
                        !item.isRead
                          ? "font-extrabold text-slate-900"
                          : "font-bold text-slate-800"
                      }`}
                    >
                      {item.title}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>

                {/* Cột các nút hành động bên phải - CỐ ĐỊNH KÍCH THƯỚC GIÓNG HÀNG THẲNG TẮP (KHÔNG THỤT THÒ) */}
                <div className="flex items-center justify-end space-x-2 w-full sm:w-[240px] flex-shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* 1. Nút hành động chính: Chiều rộng cố định chuẩn 135px */}
                  <button
                    onClick={() => handleItemAction(item)}
                    className="w-[135px] min-w-[135px] px-3 py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer group-hover:bg-blue-600"
                  >
                    <span className="truncate">{config.actionText}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </button>

                  {/* 2. Ô cố định kích thước cho nút Đánh dấu đã đọc / Trạng thái đã đọc (36x36px) */}
                  <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                    {!item.isRead ? (
                      <button
                        onClick={() => onMarkAsRead(item.id)}
                        className="w-9 h-9 flex items-center justify-center text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl transition-all border border-blue-200 hover:border-blue-600 shadow-sm cursor-pointer active:scale-95"
                        title="Đánh dấu đã đọc"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    ) : (
                      <span
                        className="w-9 h-9 flex items-center justify-center text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100/80"
                        title="Đã đọc"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-500 opacity-80" />
                      </span>
                    )}
                  </div>

                  {/* 3. Ô cố định kích thước cho nút Xóa thông báo (36x36px) */}
                  <button
                    onClick={() => onDeleteNotification(item.id)}
                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100 flex-shrink-0 cursor-pointer active:scale-95"
                    title="Xóa thông báo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
