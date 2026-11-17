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
        icon: <Info className="w-5 h-5 text-indigo-600" />,
        bgColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
        badgeBg: "bg-indigo-100 text-indigo-700",
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
      {/* Modal xác nhận xóa tất cả thông báo an toàn */}
      {isConfirmDeleteAllOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-lg border border-slate-200 space-y-5 text-center animate-in zoom-in-95 duration-200">
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
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                Bạn chưa đăng nhập vào hệ thống
              </h4>
              <p className="text-xs text-amber-700">
                Đăng nhập tài khoản để nhận thông báo cập nhật tiến độ đơn hàng và ưu đãi dành riêng cho bạn.
              </p>
            </div>
          </div>
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center space-x-1.5 flex-shrink-0 cursor-pointer active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng Nhập Ngay</span>
            </button>
          )}
        </div>
      )}

      {/* KHỐI HEADER TRUNG TÂM THÔNG BÁO GỌN GÀNG - THIẾT KẾ CHUẨN CARD HÌNH ẢNH 2 (NHỎ GỌN, TINH TẾ) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-3.5 sm:p-4.5 transition-all">
        {/* Header khối Thông Báo: Trái là Tiêu đề & Badge mới, Phải là các nút thao tác nhanh */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Thông báo</span>
            </h2>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-xs font-black rounded-full shadow-sm ">
                {unreadCount} mới
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5 text-xs font-semibold">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-blue-600 hover:text-blue-700 transition-colors flex items-center space-x-1 cursor-pointer"
                title="Đánh dấu tất cả thông báo là đã đọc"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đã đọc tất cả</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteAllOpen(true)}
                className="text-slate-500 hover:text-rose-600 transition-colors flex items-center space-x-1 cursor-pointer"
                title="Xóa tất cả thông báo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xóa tất cả</span>
              </button>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className="text-slate-500 hover:text-slate-700 transition-colors flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                title="Làm mới danh sách thông báo"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{isRefreshing ? "Đang tải..." : "Làm mới"}</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Ô trạng thái phân loại chuẩn hình ảnh 2: Tất cả | Chưa đọc | Đơn hàng | Khuyến mãi (Giao diện nhỏ gọn) */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3 pt-3 sm:pt-3.5">
          {/* Ô 1: Tất cả */}
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`group relative flex flex-col items-center justify-center py-2 px-1.5 sm:py-2.5 sm:px-2 rounded-xl transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-blue-50/70 ring-2 ring-blue-400/70"
                : "hover:bg-slate-50"
            }`}
          >
            <div className="relative">
              <Bell
                className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                  activeFilter === "all" ? "text-blue-600" : "text-slate-800"
                }`}
              />
              {stats.total > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-4.5 px-1 bg-slate-600 text-white text-xs font-black rounded-full flex items-center justify-center border border-white shadow-sm">
                  {stats.total}
                </span>
              )}
            </div>
            <span
              className={`mt-1.5 text-xs font-bold text-center leading-tight ${
                activeFilter === "all" ? "text-blue-700" : "text-slate-800"
              }`}
            >
              Tất cả
            </span>
          </button>

          {/* Ô 2: Chưa đọc (badge đỏ đếm thông báo chưa xem) */}
          <button
            type="button"
            onClick={() => setActiveFilter("unread")}
            className={`group relative flex flex-col items-center justify-center py-2 px-1.5 sm:py-2.5 sm:px-2 rounded-xl transition-all cursor-pointer ${
              activeFilter === "unread"
                ? "bg-rose-50/70 ring-2 ring-rose-400/70"
                : "hover:bg-slate-50"
            }`}
          >
            <div className="relative">
              <Inbox
                className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                  activeFilter === "unread" ? "text-rose-600" : "text-slate-800"
                }`}
              />
              {stats.unread > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-4.5 px-1 bg-[#ee4d2d] text-white text-xs font-black rounded-full flex items-center justify-center border border-white shadow-sm ">
                  {stats.unread}
                </span>
              )}
            </div>
            <span
              className={`mt-1.5 text-xs font-bold text-center leading-tight ${
                activeFilter === "unread" ? "text-rose-700" : "text-slate-800"
              }`}
            >
              Chưa đọc
            </span>
          </button>

          {/* Ô 3: Đơn hàng */}
          <button
            type="button"
            onClick={() => setActiveFilter("order")}
            className={`group relative flex flex-col items-center justify-center py-2 px-1.5 sm:py-2.5 sm:px-2 rounded-xl transition-all cursor-pointer ${
              activeFilter === "order"
                ? "bg-emerald-50/70 ring-2 ring-emerald-400/70"
                : "hover:bg-slate-50"
            }`}
          >
            <div className="relative">
              <Package
                className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                  activeFilter === "order" ? "text-emerald-600" : "text-slate-800"
                }`}
              />
              {stats.order > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-4.5 px-1 bg-emerald-600 text-white text-xs font-black rounded-full flex items-center justify-center border border-white shadow-sm">
                  {stats.order}
                </span>
              )}
            </div>
            <span
              className={`mt-1.5 text-xs font-bold text-center leading-tight ${
                activeFilter === "order" ? "text-emerald-700" : "text-slate-800"
              }`}
            >
              Đơn hàng
            </span>
          </button>

          {/* Ô 4: Khuyến mãi */}
          <button
            type="button"
            onClick={() => setActiveFilter("coupon")}
            className={`group relative flex flex-col items-center justify-center py-2 px-1.5 sm:py-2.5 sm:px-2 rounded-xl transition-all cursor-pointer ${
              activeFilter === "coupon"
                ? "bg-amber-50/70 ring-2 ring-amber-400/70"
                : "hover:bg-slate-50"
            }`}
          >
            <div className="relative">
              <Tag
                className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                  activeFilter === "coupon" ? "text-amber-600" : "text-slate-800"
                }`}
              />
              {stats.coupon > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-4.5 px-1 bg-amber-500 text-white text-xs font-black rounded-full flex items-center justify-center border border-white shadow-sm">
                  {stats.coupon}
                </span>
              )}
            </div>
            <span
              className={`mt-1.5 text-xs font-bold text-center leading-tight ${
                activeFilter === "coupon" ? "text-amber-700" : "text-slate-800"
              }`}
            >
              Khuyến mãi
            </span>
          </button>
        </div>

        {/* Hàng dưới cùng: Hiển thị số lượng thông báo bên trái và ô tìm kiếm bên phải (giống hệt hàng dưới của hình ảnh 2) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3.5 mt-3.5 border-t border-slate-100">
          <div className="text-xs sm:text-xs font-semibold text-slate-500">
            Hiển thị tất cả thông báo ({filteredNotifications.length} / {notifications.length} thông báo)
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn, tiêu đề, nội dung..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 4. Danh Sách Thẻ Thông Báo - Thiết Kế Lưới Gióng Hàng Chuẩn Tuyệt Đối */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-3xl flex items-center justify-center mx-auto">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {!currentUser ? "Vui lòng đăng nhập" : "Không tìm thấy thông báo nào"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              {!currentUser
                ? "Vui lòng đăng nhập tài khoản để xem thông báo cập nhật tiến độ đơn hàng và các ưu đãi dành riêng cho bạn."
                : searchQuery
                ? "Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc phân loại khác."
                : "Hộp thư thông báo hiện đang trống."}
            </p>
            {!currentUser && onOpenAuthModal && (
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
                onClick={() => handleItemAction(item)}
                className={`bg-white rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative overflow-hidden group cursor-pointer ${
                  !item.isRead
                    ? "border-blue-200/90 bg-gradient-to-r from-blue-50/30 via-white to-white ring-1 ring-blue-500/10 hover:border-blue-400/80"
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                {/* Dải màu nhấn tinh tế bên trái cho thông báo chưa đọc */}
                {!item.isRead && (
                  <div className="absolute left-0 top-2.5 bottom-2.5 w-1.5 bg-blue-600 rounded-r-full" />
                )}

                {/* Phần thân thông báo */}
                <div className="flex items-start space-x-3 flex-1 min-w-0 pl-1">
                  {/* Icon phân loại */}
                  <div
                    className={`w-10 h-10 rounded-2xl border flex-shrink-0 flex items-center justify-center ${config.bgColor}`}
                  >
                    {config.icon}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-bold ${config.badgeBg}`}
                      >
                        {config.label}
                      </span>
                      {!item.isRead && (
                        <span className="px-1.5 py-0.5 rounded-md text-xs font-extrabold bg-blue-600 text-white ">
                          Mới
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>

                    <h3
                      className={`text-xs sm:text-sm leading-snug max-w-prose ${
                        !item.isRead
                          ? "font-extrabold text-slate-900"
                          : "font-bold text-slate-800"
                      }`}
                    >
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-prose">
                      {item.message}
                    </p>
                  </div>
                </div>

                {/* Cột các nút hành động bên phải - CỐ ĐỊNH KÍCH THƯỚC GIÓNG HÀNG THẲNG TẮP (Nút Xem + Nút Thùng Rác) */}
                <div className="flex items-center justify-end space-x-2.5 w-full sm:w-[175px] flex-shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* 1. Nút hành động chính: Chiều rộng cố định chuẩn 130px, bấm vào đọc và điều hướng */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemAction(item);
                    }}
                    className="w-[130px] min-w-[130px] px-3 py-1.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer group-hover:bg-blue-600"
                  >
                    <span className="truncate">{config.actionText}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </button>

                  {/* 2. Ô cố định kích thước cho nút Xóa thông báo (34x34px), ngăn nổi bọt sự kiện */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNotification(item.id);
                    }}
                    className="w-[34px] h-[34px] flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100 flex-shrink-0 cursor-pointer active:scale-95"
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
