import React, { useState, useEffect, useMemo, useCallback } from "react";
// Import createPortal để render modal trực tiếp vào body, không bị gián đoạn giao diện
import { createPortal } from "react-dom";
import {
  Bell,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Eye,
  RefreshCw,
  ExternalLink,
  Users,
  User,
  Tag,
  Package,
  Star,
  Info,
  Megaphone,
  Ticket,
  Calendar,
  Sparkles
} from "lucide-react";
import { api, CouponItem } from "../../services/api";
import { UserAccount } from "../../data/users";
import {
  NotificationItem,
  NotificationType,
  NotificationStats
} from "../../types/notification";
import AdminPagination from "./AdminPagination";

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
 * Lấy cấu hình giao diện biểu tượng và màu sắc theo từng loại thông báo
 */
function getTypeBadgeConfig(type: NotificationType) {
  switch (type) {
    case "order":
      return {
        label: "Đơn hàng",
        icon: <Package className="w-3.5 h-3.5" />,
        badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
        bgLight: "bg-blue-50"
      };
    case "coupon":
      return {
        label: "Khuyến mãi",
        icon: <Tag className="w-3.5 h-3.5" />,
        badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
        bgLight: "bg-amber-50"
      };
    case "review":
      return {
        label: "Đánh giá",
        icon: <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />,
        badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
        bgLight: "bg-yellow-50"
      };
    case "system":
    default:
      return {
        label: "Hệ thống",
        icon: <Info className="w-3.5 h-3.5" />,
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
        bgLight: "bg-slate-50"
      };
  }
}

export default function NotificationsTab() {
  // Trạng thái dữ liệu danh sách thông báo và phân trang
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Bộ lọc và tìm kiếm
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [targetFilter, setTargetFilter] = useState<"all" | "broadcast" | "specific">("all");

  // Chỉ số thống kê KPI
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    coupon: 0,
    order: 0,
    system: 0,
    review: 0,
    broadcast: 0
  });

  // State danh sách mã giảm giá và người dùng phục vụ cho việc tạo thông báo
  const [availableCoupons, setAvailableCoupons] = useState<CouponItem[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserAccount[]>([]);

  // State Modal Tạo Thông Báo Mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createType, setCreateType] = useState<NotificationType>("coupon");
  const [createTitle, setCreateTitle] = useState<string>("");
  const [createMessage, setCreateMessage] = useState<string>("");
  const [createTarget, setCreateTarget] = useState<"broadcast" | "specific">("broadcast");
  const [createUserId, setCreateUserId] = useState<string>("");
  const [createLink, setCreateLink] = useState<string>("/products");
  const [selectedCouponCode, setSelectedCouponCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // State Modal Xem Chi Tiết
  const [viewingNotification, setViewingNotification] = useState<NotificationItem | null>(null);

  // State Modal Xác Nhận Xóa
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Thông báo phản hồi thao tác thành công (Toast / Alert)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Xử lý Debounce cho ô tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Tải thống kê KPI thông báo
  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getNotificationStats();
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.warn("⚠️ Không thể tải thống kê thông báo:", err);
    }
  }, []);

  // Tải danh sách thông báo quản trị từ Server
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminNotifications({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
        type: typeFilter,
        target: targetFilter
      });
      if (res && res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
        if (res.pagination) {
          setTotalItems(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error("❌ Lỗi tải danh sách thông báo quản trị:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, typeFilter, targetFilter]);

  // Nạp danh sách mã giảm giá và danh sách người dùng để hỗ trợ form tạo thông báo
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const [couponsData, usersRes] = await Promise.all([
        api.getCoupons(),
        api.getUsers({ limit: 100 })
      ]);
      setAvailableCoupons(couponsData || []);
      if (usersRes && Array.isArray(usersRes.data)) {
        setAvailableUsers(usersRes.data);
      }
    } catch (err) {
      console.warn("⚠️ Lỗi tải dữ liệu bổ trợ:", err);
    }
  }, []);

  // Kích hoạt nạp dữ liệu ban đầu và khi thay đổi bộ lọc
  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [fetchNotifications, fetchStats]);

  useEffect(() => {
    fetchAuxiliaryData();
  }, [fetchAuxiliaryData]);

  // Thiết lập kênh Real-time BroadcastChannel để đồng bộ tức thì với các tab khác
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("bookstore_notifications_sync");
      channel.onmessage = (event) => {
        if (
          event.data?.type === "NOTIFICATION_CREATED" ||
          event.data?.type === "NOTIFICATION_DELETED" ||
          event.data?.type === "ORDER_CREATED"
        ) {
          fetchNotifications();
          fetchStats();
        }
      };
    } catch {
      // Bỏ qua nếu trình duyệt không hỗ trợ BroadcastChannel
    }
    return () => {
      if (channel) channel.close();
    };
  }, [fetchNotifications, fetchStats]);

  // Tự động tắt thông báo thành công sau 4 giây
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  // Phát tín hiệu Real-time qua BroadcastChannel
  const broadcastSync = (type: string) => {
    try {
      const channel = new BroadcastChannel("bookstore_notifications_sync");
      channel.postMessage({ type });
      channel.close();
    } catch {
      // ignore
    }
  };

  // Mở modal tạo thông báo mới
  const handleOpenCreateModal = (type: NotificationType = "coupon") => {
    setCreateType(type);
    setCreateTitle(
      type === "coupon"
        ? "Ưu Đãi Đặc Quyền: Mã Giảm Giá Đang Chờ Bạn!"
        : type === "system"
        ? "Thông Báo Quan Trọng Từ Ban Quản Trị"
        : ""
    );
    setCreateMessage("");
    setCreateTarget("broadcast");
    setCreateUserId("");
    setCreateLink(type === "coupon" ? "/products" : "/");
    setSelectedCouponCode("");
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  // Xử lý khi Admin chọn nhanh một mã giảm giá trong form tạo thông báo
  const handleSelectCoupon = (code: string) => {
    setSelectedCouponCode(code);
    const found = availableCoupons.find((c) => c.code === code);
    if (found) {
      const discountText =
        found.discountType === "percent"
          ? `${found.discountValue}%`
          : `${Number(found.discountValue).toLocaleString("vi-VN")}đ`;

      setCreateTitle(`Ưu Đãi Đặc Biệt: Tặng Mã Giảm ${discountText}!`);
      setCreateMessage(
        `Nhập ngay mã "${found.code}" tại bước thanh toán để được giảm ngay ${discountText} cho đơn hàng sách của bạn (${found.title}). Số lượng có hạn, đặt sách ngay hôm nay!`
      );
      setCreateLink("/products");
    }
  };

  // Gửi tạo thông báo mới
  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      setCreateError("Vui lòng nhập tiêu đề thông báo");
      return;
    }
    if (!createMessage.trim()) {
      setCreateError("Vui lòng nhập nội dung chi tiết thông báo");
      return;
    }
    if (createTarget === "specific" && !createUserId.trim()) {
      setCreateError("Vui lòng chọn hoặc nhập mã người nhận cụ thể");
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    try {
      const metadata: Record<string, any> = {
        createdByAdmin: true,
        source: "admin_manual_broadcast"
      };

      if (selectedCouponCode) {
        metadata.couponCode = selectedCouponCode;
      }

      const result = await api.createNotification({
        title: createTitle.trim(),
        message: createMessage.trim(),
        type: createType,
        link: createLink.trim() || null,
        userId: createTarget === "broadcast" ? null : createUserId.trim(),
        metadata
      });

      if (result) {
        setIsCreateModalOpen(false);
        setActionSuccess("Đã phát hành thông báo thành công đến toàn hệ thống!");
        fetchNotifications();
        fetchStats();
        broadcastSync("NOTIFICATION_CREATED");
      } else {
        setCreateError("Không thể tạo thông báo. Vui lòng kiểm tra lại kết nối API.");
      }
    } catch (err: any) {
      setCreateError(err.message || "Đã xảy ra lỗi khi tạo thông báo");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xác nhận xóa một thông báo
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const ok = await api.deleteNotification(deletingId);
      if (ok) {
        setDeletingId(null);
        setActionSuccess("Đã xóa thông báo thành công khỏi hệ thống!");
        fetchNotifications();
        fetchStats();
        broadcastSync("NOTIFICATION_DELETED");
      } else {
        alert("Xóa thông báo không thành công.");
      }
    } catch (err) {
      alert("Đã xảy ra lỗi khi xóa thông báo.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Thông báo kết quả thao tác thành công (Toast notification) */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-sm shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. CỤM 4 THẺ THỐNG KÊ KPI THÔNG BÁO THU NHỎ GỌN GÀNG */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Thẻ 1: Tổng số thông báo */}
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between min-w-0">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng Thông Báo
            </p>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {stats.total.toLocaleString("vi-VN")}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Đang lưu trữ trên hệ thống
            </p>
          </div>
          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        </div>

        {/* Thẻ 2: Thông báo Ưu đãi & Khuyến mãi */}
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between min-w-0">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ưu Đãi &amp; Khuyến Mãi
            </p>
            <h3 className="text-base sm:text-lg font-black text-amber-600 mt-0.5">
              {stats.coupon.toLocaleString("vi-VN")}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Mã giảm giá &amp; sự kiện sale
            </p>
          </div>
          <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4" />
          </div>
        </div>

        {/* Thẻ 3: Thông báo Tiến độ Đơn hàng tự động */}
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between min-w-0">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tiến Độ Đơn Hàng
            </p>
            <h3 className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">
              {stats.order.toLocaleString("vi-VN")}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Tự động theo vòng đời đơn
            </p>
          </div>
          <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
        </div>

        {/* Thẻ 4: Thông báo Phát sóng Toàn sàn */}
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between min-w-0">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Phát Sóng Toàn Sàn
            </p>
            <h3 className="text-base sm:text-lg font-black text-indigo-700 mt-0.5">
              {stats.broadcast.toLocaleString("vi-VN")}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Hiển thị đến tất cả độc giả
            </p>
          </div>
          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. THANH CÔNG CỤ TÌM KIẾM, LỌC VÀ NÚT TẠO THÔNG BÁO MỚI */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Ô tìm kiếm từ khóa */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, nội dung hoặc mã người nhận..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Cụm bộ lọc: Phân loại & Đối tượng nhận */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Lọc loại thông báo */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">Tất cả phân loại</option>
              <option value="coupon">Ưu đãi & Khuyến mãi</option>
              <option value="order">Đơn hàng tự động</option>
              <option value="system">Thông báo hệ thống</option>
              <option value="review">Phản hồi đánh giá</option>
            </select>

            {/* Lọc đối tượng nhận */}
            <select
              value={targetFilter}
              onChange={(e) => {
                setTargetFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">Tất cả đối tượng</option>
              <option value="broadcast">Phát sóng toàn sàn</option>
              <option value="specific">Người dùng cụ thể</option>
            </select>

            {/* Nút Làm mới dữ liệu */}
            <button
              onClick={() => {
                fetchNotifications();
                fetchStats();
              }}
              disabled={isLoading}
              title="Làm mới danh sách"
              className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            {/* Nút Tạo thông báo mới (Mở Modal) */}
            <button
              onClick={() => handleOpenCreateModal("coupon")}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md transition-all hover:shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Thông Báo Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. BẢNG DANH SÁCH THÔNG BÁO QUẢN TRỊ TỐI ƯU CÂN ĐỐI */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-[130px]">Loại</th>
                <th className="py-3 px-4 min-w-[280px]">Tiêu đề &amp; Nội dung</th>
                <th className="py-3 px-4 w-[160px]">Đối tượng nhận</th>
                <th className="py-3 px-4 w-[130px]">Liên kết</th>
                <th className="py-3 px-4 w-[140px]">Thời gian tạo</th>
                <th className="py-3 px-4 w-[90px] text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading && notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="font-medium">Đang tải danh sách thông báo từ hệ thống...</span>
                    </div>
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                      <div className="w-14 h-14 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-500">
                        <Bell className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-700">Chưa có thông báo nào</h4>
                      <p className="text-xs text-slate-500">
                        Không tìm thấy thông báo phù hợp với bộ lọc hiện tại. Bạn có thể nhấn nút "Tạo Thông Báo Mới" để phát hành thông báo ưu đãi cho khách hàng.
                      </p>
                      <button
                        onClick={() => handleOpenCreateModal("coupon")}
                        className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tạo thông báo ngay</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                notifications.map((item) => {
                  const badge = getTypeBadgeConfig(item.type);
                  const isBroadcast = !item.userId;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Cột 1: Phân loại */}
                      <td className="py-3 px-4 whitespace-nowrap align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.badgeClass}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>

                      {/* Cột 2: Tiêu đề & Nội dung tóm tắt - Bố cục thông thoáng, không bị bẻ gãy chữ */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          <span className="font-bold text-slate-900 text-sm leading-tight">
                            {item.title}
                          </span>
                          {item.metadata?.couponCode && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-mono font-bold border border-amber-200 shrink-0">
                              <Ticket className="w-3 h-3" />
                              {item.metadata.couponCode}
                            </span>
                          )}
                          {item.metadata?.forAdmin && (
                            <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200 shrink-0">
                              Cảnh báo Admin
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 text-xs font-normal line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      </td>

                      {/* Cột 3: Đối tượng nhận */}
                      <td className="py-3 px-4 whitespace-nowrap align-middle">
                        {isBroadcast ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            Toàn sàn (Tất cả)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            {item.userId}
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Liên kết điều hướng - Nhãn thân thiện */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 align-middle">
                        {item.link ? (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline cursor-pointer">
                            <span>
                              {item.link.startsWith("/admin")
                                ? "Quản Trị"
                                : item.link.startsWith("/orders")
                                ? "Đơn Hàng"
                                : item.link.startsWith("/products")
                                ? "Cửa Hàng"
                                : item.link}
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Không có</span>
                        )}
                      </td>

                      {/* Cột 5: Thời gian tạo */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-xs align-middle">
                        {formatDateTime(item.createdAt)}
                      </td>

                      {/* Cột 6: Thao tác */}
                      <td className="py-3 px-4 whitespace-nowrap text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Nút Xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => setViewingNotification(item)}
                            title="Xem chi tiết thông báo"
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Nút Xóa thông báo */}
                          <button
                            type="button"
                            onClick={() => setDeletingId(item.id)}
                            title="Xóa thông báo này"
                            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG CHUẨN ADMIN */}
        {totalItems > 0 && (
          <div className="px-6 py-4">
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              itemLabel="thông báo"
              onPageChange={(page) => setCurrentPage(page)}
              onPerPageChange={(perPage) => {
                setItemsPerPage(perPage);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* 4. MODAL TẠO THÔNG BÁO MỚI (VỚI LIVE PREVIEW VÀ CHỌN NHANH MÃ COUPON) */}
      {isCreateModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-lg border border-slate-200 overflow-hidden my-8">
              {/* Header Modal */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">Phát Hành Thông Báo Mới</h3>
                    <p className="text-xs text-blue-100">
                      Tạo thông báo ưu đãi, sự kiện hoặc tin tức gửi đến khách hàng
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-xl transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Nội dung Modal */}
              <form onSubmit={handleCreateNotification} className="p-6 space-y-6">
                {createError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{createError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cột trái: Cấu hình thông báo */}
                  <div className="space-y-4">
                    {/* Chọn Loại thông báo */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Phân loại thông báo <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCreateType("coupon")}
                          className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            createType === "coupon"
                              ? "bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-400/20"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <Tag className="w-4 h-4 text-amber-600" />
                          <span>Ưu đãi & Sale</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreateType("system")}
                          className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            createType === "system"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-400/20"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <Info className="w-4 h-4 text-indigo-600" />
                          <span>Hệ thống</span>
                        </button>
                      </div>
                    </div>

                    {/* Chọn nhanh mã giảm giá nếu loại là coupon */}
                    {createType === "coupon" && availableCoupons.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                          <span>Chọn mã giảm giá liên kết</span>
                          <span className="text-xs font-normal text-amber-600 font-semibold">Tự động điền nội dung</span>
                        </label>
                        <select
                          value={selectedCouponCode}
                          onChange={(e) => handleSelectCoupon(e.target.value)}
                          className="w-full text-xs bg-amber-50/50 border border-amber-200 rounded-2xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                          <option value="">-- Chọn một mã ưu đãi có sẵn --</option>
                          {availableCoupons.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} - Giảm {c.discountType === "percent" ? `${c.discountValue}%` : `${c.discountValue.toLocaleString()}đ`} ({c.title})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Đối tượng nhận thông báo */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Phạm vi người nhận <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCreateTarget("broadcast");
                            setCreateUserId("");
                          }}
                          className={`p-2 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            createTarget === "broadcast"
                              ? "bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/20"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Toàn sàn (Tất cả)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreateTarget("specific")}
                          className={`p-2 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            createTarget === "specific"
                              ? "bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/20"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Chọn người nhận</span>
                        </button>
                      </div>

                      {/* Chọn hoặc nhập mã người nhận cụ thể */}
                      {createTarget === "specific" && (
                        <div className="mt-2 space-y-2">
                          <select
                            value={createUserId}
                            onChange={(e) => setCreateUserId(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          >
                            <option value="">-- Chọn người dùng từ hệ thống --</option>
                            {availableUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.email || u.id})
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Hoặc gõ trực tiếp ID tài khoản..."
                            value={createUserId}
                            onChange={(e) => setCreateUserId(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-slate-800 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Đường dẫn điều hướng */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Đường dẫn khi nhấp vào (Link)
                      </label>
                      <input
                        type="text"
                        placeholder="vd: /products hoặc /orders"
                        value={createLink}
                        onChange={(e) => setCreateLink(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <div className="flex gap-1.5 mt-1.5">
                        {["/products", "/coupons", "/orders"].map((quickLink) => (
                          <button
                            key={quickLink}
                            type="button"
                            onClick={() => setCreateLink(quickLink)}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-mono transition-colors"
                          >
                            {quickLink}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Tiêu đề, Nội dung & Live Preview */}
                  <div className="space-y-4">
                    {/* Tiêu đề thông báo */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Tiêu đề thông báo <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập tiêu đề ngắn gọn, thu hút..."
                        value={createTitle}
                        onChange={(e) => setCreateTitle(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Nội dung thông báo */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nội dung chi tiết <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Soạn nội dung thông báo đầy đủ, chi tiết ưu đãi hoặc thông tin cần truyền tải..."
                        value={createMessage}
                        onChange={(e) => setCreateMessage(e.target.value)}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Thẻ xem trước trực tiếp (Live Preview Card) */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Xem trước giao diện (Live Preview)</span>
                      </div>
                      <div className="p-3.5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                              getTypeBadgeConfig(createType).badgeClass
                            }`}
                          >
                            {getTypeBadgeConfig(createType).icon}
                            {getTypeBadgeConfig(createType).label}
                          </span>
                          <span className="text-xs text-slate-500">Vừa xong</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                          {createTitle || "Tiêu đề thông báo của bạn sẽ xuất hiện ở đây"}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {createMessage ||
                            "Nội dung mô tả chi tiết thông báo sẽ được hiển thị cho khách hàng tại thanh chuông thông báo..."}
                        </p>
                        {createLink && (
                          <div className="pt-1 flex items-center gap-1 text-xs text-blue-600 font-medium">
                            <span>Bấm để xem:</span>
                            <span className="font-mono">{createLink}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Modal Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang phát hành...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Phát Hành Thông Báo</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* 5. MODAL XEM CHI TIẾT THÔNG BÁO */}
      {viewingNotification &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">Chi Tiết Thông Báo</h3>
                    <p className="text-xs font-mono text-slate-500">ID: {viewingNotification.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingNotification(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-xl transition-colors text-slate-500 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Phân loại & Trạng thái</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        getTypeBadgeConfig(viewingNotification.type).badgeClass
                      }`}
                    >
                      {getTypeBadgeConfig(viewingNotification.type).icon}
                      {getTypeBadgeConfig(viewingNotification.type).label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                      {viewingNotification.isRead ? "Đã đọc" : "Chưa đọc"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Tiêu đề</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{viewingNotification.title}</h4>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Nội dung thông báo</span>
                  <p className="mt-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 leading-relaxed whitespace-pre-line">
                    {viewingNotification.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Đối tượng nhận</span>
                    <p className="mt-0.5 font-bold text-slate-800">
                      {!viewingNotification.userId ? "Toàn sàn (Tất cả khách hàng)" : viewingNotification.userId}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Thời gian phát hành</span>
                    <p className="mt-0.5 text-slate-700">{formatDateTime(viewingNotification.createdAt)}</p>
                  </div>
                </div>

                {viewingNotification.link && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Đường dẫn điều hướng</span>
                    <p className="mt-0.5 font-mono text-blue-600">{viewingNotification.link}</p>
                  </div>
                )}

                {viewingNotification.metadata && Object.keys(viewingNotification.metadata).length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Dữ liệu đính kèm (Metadata)</span>
                    <pre className="mt-1 p-2.5 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto">
                      {JSON.stringify(viewingNotification.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setViewingNotification(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 6. MODAL XÁC NHẬN XÓA THÔNG BÁO */}
      {deletingId &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-lg border border-slate-200 p-6 space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-black text-slate-800">Xóa Thông Báo Này?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hành động này sẽ xóa vĩnh viễn thông báo khỏi cơ sở dữ liệu và người dùng sẽ không còn nhìn thấy thông báo này nữa.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 transition-all disabled:opacity-50"
                >
                  {isDeleting ? "Đang xóa..." : "Xác Nhận Xóa"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
