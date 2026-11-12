import React, { useRef, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Package,
  Tag,
  Star,
  Info,
  ArrowRight,
  X
} from "lucide-react";
import { NotificationItem, NotificationType } from "../types/notification";

interface NotificationDropdownProps {
  // Trạng thái hiển thị mở/đóng của dropdown
  isOpen: boolean;
  // Hàm đóng dropdown
  onClose: () => void;
  // Danh sách các thông báo hiển thị
  notifications: NotificationItem[];
  // Số lượng thông báo chưa đọc
  unreadCount: number;
  // Thao tác đánh dấu 1 thông báo là đã đọc
  onMarkAsRead: (id: string) => void;
  // Thao tác đánh dấu toàn bộ là đã đọc
  onMarkAllAsRead: () => void;
  // Thao tác khi nhấp vào 1 thông báo cụ thể
  onSelectNotification: (item: NotificationItem) => void;
  // Thao tác chuyển hướng tới trang danh sách thông báo đầy đủ
  onViewAll: () => void;
}

/**
 * Hàm định dạng thời gian tương đối bằng tiếng Việt
 */
function formatTimeAgo(isoDate: string): string {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return new Date(isoDate).toLocaleDateString("vi-VN");
  } catch {
    return "Vừa xong";
  }
}

/**
 * Trả về Icon và màu sắc tương ứng cho từng phân loại thông báo
 */
function getNotificationBadge(type: NotificationType) {
  switch (type) {
    case "order":
      return {
        icon: <Package className="w-4 h-4 text-blue-600" />,
        bgColor: "bg-blue-50 border-blue-200"
      };
    case "coupon":
      return {
        icon: <Tag className="w-4 h-4 text-amber-600" />,
        bgColor: "bg-amber-50 border-amber-200"
      };
    case "review":
      return {
        icon: <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />,
        bgColor: "bg-yellow-50 border-yellow-200"
      };
    case "system":
    default:
      return {
        icon: <Info className="w-4 h-4 text-purple-600" />,
        bgColor: "bg-purple-50 border-purple-200"
      };
  }
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification,
  onViewAll
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lắng nghe sự kiện click bên ngoài để tự động đóng dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Lấy tối đa 6 thông báo mới nhất để hiển thị nhanh
  const previewItems = notifications.slice(0, 6);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header của Dropdown */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Thông báo</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">
              {unreadCount} mới
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors flex items-center space-x-1"
              title="Đánh dấu tất cả là đã đọc"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đã đọc tất cả</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
            title="Đóng menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Danh sách các thông báo */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {previewItems.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Chưa có thông báo nào</p>
            <p className="text-xs text-slate-400">
              Các thông tin cập nhật về đơn hàng và ưu đãi sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          previewItems.map((item) => {
            const badge = getNotificationBadge(item.type);
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.isRead) {
                    onMarkAsRead(item.id);
                  }
                  onSelectNotification(item);
                }}
                className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start space-x-3 relative ${
                  !item.isRead ? "bg-blue-50/30" : ""
                }`}
              >
                {/* Icon phân loại */}
                <div
                  className={`w-9 h-9 rounded-xl border flex-shrink-0 flex items-center justify-center ${badge.bgColor}`}
                >
                  {badge.icon}
                </div>

                {/* Nội dung thông báo */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <p
                      className={`text-xs truncate ${
                        !item.isRead
                          ? "font-bold text-slate-900"
                          : "font-medium text-slate-700"
                      }`}
                    >
                      {item.title}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formatTimeAgo(item.createdAt)}
                  </p>
                </div>

                {/* Chấm tròn báo trạng thái chưa đọc */}
                {!item.isRead && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Dropdown: Xem tất cả thông báo */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
        <button
          onClick={() => {
            onClose();
            onViewAll();
          }}
          className="w-full py-2 px-3 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center space-x-1.5"
        >
          <span>Xem toàn bộ thông báo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
