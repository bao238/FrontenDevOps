import React, { useState, useMemo, useEffect } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShoppingBag,
  MapPin,
  User,
  Star,
  Printer,
  QrCode,
  Calendar,
  AlertCircle,
  Send,
  Sparkles,
  ThumbsUp,
  X
} from "lucide-react";
import { Product } from "../data/products";
import { UserProfile, OrderRecord } from "../App";

// 4 Icon chuẩn nét vẽ vector tương đồng 100% với Hình 2 (Shopee)
// 1. Icon Ví / Hóa đơn - Chờ xác nhận
const ConfirmIcon = ({ className = "w-8 h-8 sm:w-9 sm:h-9" }: { className?: string }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Thân ví */}
    <rect x="8" y="16" width="32" height="24" rx="2" />
    {/* Tờ hóa đơn vát góc nhô lên */}
    <path d="M14 16V10a1.5 1.5 0 0 1 1.5-1.5h15l5.5 5.5v2" />
    {/* Khuy bấm / ngăn ví */}
    <rect x="25" y="24" width="15" height="8" rx="1.5" />
    <circle cx="28.5" cy="28" r="1" fill="currentColor" />
  </svg>
);

// 2. Icon Hộp carton dán băng keo - Chờ lấy hàng
const PickupBoxIcon = ({ className = "w-8 h-8 sm:w-9 sm:h-9" }: { className?: string }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Thùng carton */}
    <path d="M9 16h30v22H9z" />
    {/* Mép gấp hộp phía trên */}
    <path d="M9 16l4-6h22l4 6" />
    {/* Dải băng dính chữ T ở giữa */}
    <path d="M24 10v28" />
    <path d="M18 24h12" />
  </svg>
);

// 3. Icon Xe tải vận chuyển - Chờ giao hàng
const ShippingTruckIcon = ({ className = "w-8 h-8 sm:w-9 sm:h-9" }: { className?: string }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Thùng chở hàng */}
    <path d="M6 14h24v20H6z" />
    {/* Cabin xe */}
    <path d="M30 20h8l4 6v8h-12z" />
    {/* Ô cửa sổ cabin */}
    <path d="M30 22h7l3 4h-10z" />
    {/* 2 Bánh xe */}
    <circle cx="14" cy="35" r="3.5" />
    <circle cx="36" cy="35" r="3.5" />
    {/* Gầm xe */}
    <path d="M6 34h4.5M17.5 34h15M39.5 34H42" />
  </svg>
);

// 4. Icon Ngôi sao trong vòng tròn - Đánh giá
const ReviewStarIcon = ({ className = "w-8 h-8 sm:w-9 sm:h-9" }: { className?: string }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Vòng tròn bên ngoài */}
    <circle cx="24" cy="24" r="18" />
    {/* Ngôi sao 5 cánh bên trong */}
    <path
      d="M24 13l3.2 6.5 7.2 1-5.2 5.1 1.2 7.2-6.4-3.4-6.4 3.4 1.2-7.2-5.2-5.1 7.2-1z"
      fill="none"
    />
  </svg>
);

// Hàm kiểm tra đơn hàng đã thanh toán thành công hay chưa
const isOrderPaid = (order: OrderRecord): boolean => {
  return Boolean(order.isPaid || order.status === "Hoàn tất");
};

// Loại tab lọc đơn mua hàng
export type OrderTabKey = "Chờ xác nhận" | "Chờ lấy hàng" | "Chờ giao hàng" | "Đánh giá" | "all";

interface MyOrdersPageProps {
  orders: OrderRecord[];
  currentUser: UserProfile | null;
  onContinueShopping: () => void;
  onTrackOrder?: (order: OrderRecord) => void;
  onReorder: (order: OrderRecord) => void;
  onOpenAuth: () => void;
  onPrintInvoice?: (order: OrderRecord) => void;
  // Callback mở modal thanh toán lại khi đơn hàng chưa thanh toán
  onPayOrder?: (order: OrderRecord) => void;
  // Callback khi người nhận xác nhận đã nhận hàng
  onConfirmReceived?: (orderId: string) => void;
  // Callback khi khách hàng gửi đánh giá cho đơn hàng
  onReviewOrder?: (orderId: string, rating: number, comment: string) => void;
  // Cho phép chuyển ngay đơn từ "Chờ lấy hàng" sang "Chờ giao hàng" để test nhanh
  onTriggerPickup?: (orderId: string) => void;
  // Tab ban đầu được chỉ định từ ProfilePage hoặc bên ngoài
  initialTab?: OrderTabKey;
}

export default function MyOrdersPage({
  orders,
  currentUser,
  onContinueShopping,
  onTrackOrder,
  onReorder,
  onOpenAuth,
  onPrintInvoice,
  onPayOrder,
  onConfirmReceived,
  onReviewOrder,
  onTriggerPickup,
  initialTab = "all",
}: MyOrdersPageProps) {
  // Trạng thái tab đang chọn trong khối 4 ô "Đơn mua" (mặc định ban đầu theo initialTab hoặc "all")
  const [selectedTab, setSelectedTab] = useState<OrderTabKey>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // State Modal Đánh Giá Sách
  const [reviewingOrder, setReviewingOrder] = useState<OrderRecord | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // Định dạng hiển thị tiền VNĐ
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Tính số lượng badge cho từng ô theo đúng yêu cầu đề bài:
  // 1. Chờ xác nhận: Đơn mới đặt chờ admin xác nhận
  const pendingConfirmCount = useMemo(() => {
    return orders.filter(
      (o) => o.status === "Chờ xác nhận" || (o.status === "Đang xử lý" && !o.pickupTime)
    ).length;
  }, [orders]);

  // 2. Chờ lấy hàng: Đã được admin xác nhận và hẹn giờ lấy hàng cho ship
  const pendingPickupCount = useMemo(() => {
    return orders.filter((o) => o.status === "Chờ lấy hàng").length;
  }, [orders]);

  // 3. Chờ giao hàng: Đơn đang trên đường vận chuyển tới tay người nhận
  const pendingShippingCount = useMemo(() => {
    return orders.filter(
      (o) => o.status === "Chờ giao hàng" || (o.status === "Đang giao" && !o.receivedAt)
    ).length;
  }, [orders]);

  // 4. Đánh giá: Đơn đã nhận hàng nhưng CHƯA đánh giá. Đánh giá rồi thì KHÔNG hiện số nữa!
  const pendingReviewCount = useMemo(() => {
    return orders.filter(
      (o) => (o.status === "Hoàn tất" || Boolean(o.receivedAt)) && !o.isReviewed
    ).length;
  }, [orders]);

  // Lọc danh sách đơn hàng theo tab đang chọn và từ khóa tìm kiếm
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // 1. Lọc theo 4 ô Đơn mua hoặc Xem tất cả lịch sử
      let matchTab = true;
      if (selectedTab === "Chờ xác nhận") {
        matchTab =
          ord.status === "Chờ xác nhận" ||
          (ord.status === "Đang xử lý" && !ord.pickupTime);
      } else if (selectedTab === "Chờ lấy hàng") {
        matchTab = ord.status === "Chờ lấy hàng";
      } else if (selectedTab === "Chờ giao hàng") {
        matchTab =
          ord.status === "Chờ giao hàng" ||
          (ord.status === "Đang giao" && !ord.receivedAt);
      } else if (selectedTab === "Đánh giá") {
        // Tab Đánh giá hiển thị các đơn đã nhận hàng (bao gồm cả chưa đánh giá và đã đánh giá)
        matchTab = ord.status === "Hoàn tất" || Boolean(ord.receivedAt);
      }

      // 2. Lọc theo từ khóa tìm kiếm
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        ord.id.toLowerCase().includes(q) ||
        ord.customerInfo?.fullName?.toLowerCase().includes(q) ||
        ord.customerInfo?.phone?.includes(q) ||
        ord.items.some((item) => item.product.name.toLowerCase().includes(q));

      return matchTab && matchQuery;
    });
  }, [orders, selectedTab, searchQuery]);

  // Phân trang danh sách đơn hàng cho người dùng
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage, setOrdersPerPage] = useState<number>(5);

  // Tự động chuyển về trang 1 khi đổi bộ lọc tab hoặc từ khóa tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));

  // Đảm bảo không ở trang vượt quá tổng số trang hiện có
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Danh sách đơn hàng tương ứng theo trang hiện tại
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(startIndex, startIndex + ordersPerPage);
  }, [filteredOrders, currentPage, ordersPerPage]);

  // Xử lý gửi đánh giá đơn hàng
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingOrder) return;

    if (onReviewOrder) {
      onReviewOrder(
        reviewingOrder.id,
        reviewRating,
        reviewComment.trim() || "Sách đẹp, đóng gói rất cẩn thận, phục vụ tuyệt vời!"
      );
    }

    setReviewSuccessMsg("Đánh giá đơn hàng thành công! Cảm ơn bạn đã để lại nhận xét.");
    setTimeout(() => {
      setReviewSuccessMsg(null);
      setReviewingOrder(null);
      setReviewRating(5);
      setReviewComment("");
    }, 1500);
  };

  // Mở modal đánh giá
  const handleOpenReviewModal = (ord: OrderRecord) => {
    setReviewingOrder(ord);
    setReviewRating(ord.reviewRating || 5);
    setReviewComment(ord.reviewComment || "");
  };

  // Trợ giúp huy hiệu trạng thái của từng đơn hàng
  const getOrderStatusInfo = (ord: OrderRecord) => {
    if (ord.status === "Chờ xác nhận" || (ord.status === "Đang xử lý" && !ord.pickupTime)) {
      return {
        label: "Chờ xác nhận",
        desc: "Đang chờ admin xác nhận đơn và điều phối lịch lấy hàng",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
        dotColor: "bg-amber-500",
        icon: Clock,
      };
    }
    if (ord.status === "Chờ lấy hàng") {
      return {
        label: "Chờ lấy hàng",
        desc: ord.pickupTime
          ? `Admin đã hẹn shipper lấy hàng lúc ${new Date(ord.pickupTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày ${new Date(ord.pickupTime).toLocaleDateString("vi-VN")}`
          : "Đã xác nhận, đang chờ shipper đến lấy hàng",
        badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
        dotColor: "bg-purple-500",
        icon: Package,
      };
    }
    if (ord.status === "Chờ giao hàng" || (ord.status === "Đang giao" && !ord.receivedAt)) {
      return {
        label: "Chờ giao hàng",
        desc: "Đơn hàng đang trên đường giao tận nơi tới bạn",
        badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
        dotColor: "bg-blue-500",
        icon: Truck,
      };
    }
    if (ord.status === "Hoàn tất" || ord.receivedAt) {
      if (ord.isReviewed) {
        return {
          label: "Đã hoàn tất & Đã đánh giá",
          desc: "Đơn hàng đã giao thành công và bạn đã gửi đánh giá",
          badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dotColor: "bg-emerald-500",
          icon: CheckCircle2,
        };
      }
      return {
        label: "Đã nhận hàng • Chờ đánh giá",
        desc: "Bạn đã nhận hàng thành công, hãy để lại đánh giá nhé!",
        badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
        dotColor: "bg-teal-500",
        icon: Star,
      };
    }
    if (ord.status === "Đã hủy") {
      return {
        label: "Đã hủy đơn",
        desc: "Đơn hàng này đã bị hủy bỏ",
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
        dotColor: "bg-rose-500",
        icon: XCircle,
      };
    }
    return {
      label: ord.status,
      desc: "",
      badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
      dotColor: "bg-slate-500",
      icon: Package,
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
          className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-4 py-2 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tiếp tục chọn sách</span>
        </button>
      </div>

      {/* KHỐI "ĐƠN MUA" GỘP THÀNH 1 Ô DUY NHẤT VỚI 4 Ô CHỨC NĂNG (GIỐNG HÌNH ẢNH THỨ 2) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-5 sm:p-6 transition-all">
        {/* Header khối Đơn mua: Trái là 'Đơn mua', Phải là 'Xem lịch sử mua hàng >' */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Đơn mua</span>
          </h2>

          <button
            type="button"
            onClick={() => setSelectedTab("all")}
            className={`text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1 cursor-pointer group ${
              selectedTab === "all"
                ? "text-blue-600 font-bold"
                : "text-slate-500 hover:text-blue-600"
            }`}
          >
            <span>Xem lịch sử mua hàng</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 4 Ô trạng thái chuẩn hình ảnh 2: Chờ xác nhận | Chờ lấy hàng | Chờ giao hàng | Đánh giá */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 pt-5">
          {/* Ô 1: Chờ xác nhận */}
          <button
            type="button"
            onClick={() => setSelectedTab("Chờ xác nhận")}
            className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all cursor-pointer ${
              selectedTab === "Chờ xác nhận"
                ? "bg-amber-50/70 ring-2 ring-amber-400/70"
                : "hover:bg-slate-50"
            }`}
          >
            <div className="relative">
              <ConfirmIcon
                className={`w-9 h-9 sm:w-10 sm:h-10 transition-transform group-hover:scale-105 ${
                  selectedTab === "Chờ xác nhận" ? "text-amber-600" : "text-slate-800"
                }`}
              />
              {/* Badge số trên đầu ô Chờ xác nhận (nếu > 0) */}
              {pendingConfirmCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[20px] h-5 px-1.5 bg-[#ee4d2d] text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                  {pendingConfirmCount}
                </span>
              )}
            </div>
            <span
              className={`mt-2 text-xs sm:text-sm font-bold text-center leading-tight ${
                selectedTab === "Chờ xác nhận" ? "text-amber-700" : "text-slate-800"
              }`}
            >
              Chờ xác nhận
            </span>
          </button>

          {/* Ô 2: Chờ lấy hàng */}
          <button
            type="button"
            onClick={() => setSelectedTab("Chờ lấy hàng")}
            className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all cursor-pointer ${
              selectedTab === "Chờ lấy hàng"
                ? "bg-purple-50/70 ring-2 ring-purple-400/70"
                : "hover:bg-slate-50"
            }`}
          >
            <div className="relative">
              <PickupBoxIcon
                className={`w-9 h-9 sm:w-10 sm:h-10 transition-transform group-hover:scale-105 ${
                  selectedTab === "Chờ lấy hàng" ? "text-purple-600" : "text-slate-800"
                }`}
              />
              {/* Badge số trên đầu ô Chờ lấy hàng (nếu > 0) */}
              {pendingPickupCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[20px] h-5 px-1.5 bg-[#ee4d2d] text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {pendingPickupCount}
                </span>
              )}
            </div>
            <span
              className={`mt-2 text-xs sm:text-sm font-bold text-center leading-tight ${
                selectedTab === "Chờ lấy hàng" ? "text-purple-700" : "text-slate-800"
              }`}
            >
              Chờ lấy hàng
            </span>
          </button>

          {/* Ô 3: Chờ giao hàng */}
          <button
            type="button"
            onClick={() => setSelectedTab("Chờ giao hàng")}
            className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all cursor-pointer ${
              selectedTab === "Chờ giao hàng"
                ? "bg-blue-50/70 ring-2 ring-blue-400/70"
                : "hover:bg-slate-50"
            }`}
          >
            <div className="relative">
              <ShippingTruckIcon
                className={`w-9 h-9 sm:w-10 sm:h-10 transition-transform group-hover:scale-105 ${
                  selectedTab === "Chờ giao hàng" ? "text-blue-600" : "text-slate-800"
                }`}
              />
              {/* Badge số trên đầu ô Chờ giao hàng (nếu > 0) - Đúng chuẩn như số 1 đỏ trong Hình 2 */}
              {pendingShippingCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[20px] h-5 px-1.5 bg-[#ee4d2d] text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {pendingShippingCount}
                </span>
              )}
            </div>
            <span
              className={`mt-2 text-xs sm:text-sm font-bold text-center leading-tight ${
                selectedTab === "Chờ giao hàng" ? "text-blue-700" : "text-slate-800"
              }`}
            >
              Chờ giao hàng
            </span>
          </button>

          {/* Ô 4: Đánh giá */}
          <button
            type="button"
            onClick={() => setSelectedTab("Đánh giá")}
            className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all cursor-pointer ${
              selectedTab === "Đánh giá"
                ? "bg-amber-50/70 ring-2 ring-amber-400/70"
                : "hover:bg-slate-50"
            }`}
          >
            <div className="relative">
              <ReviewStarIcon
                className={`w-9 h-9 sm:w-10 sm:h-10 transition-transform group-hover:scale-105 ${
                  selectedTab === "Đánh giá" ? "text-amber-600" : "text-slate-800"
                }`}
              />
              {/* Badge số trên đầu ô Đánh giá: CHỈ HIỆN KHI CHƯA ĐÁNH GIÁ, ĐÁNH GIÁ RỒI THÌ KO HIỆN NỮA */}
              {pendingReviewCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[20px] h-5 px-1.5 bg-[#ee4d2d] text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                  {pendingReviewCount}
                </span>
              )}
            </div>
            <span
              className={`mt-2 text-xs sm:text-sm font-bold text-center leading-tight ${
                selectedTab === "Đánh giá" ? "text-amber-700" : "text-slate-800"
              }`}
            >
              Đánh giá
            </span>
          </button>
        </div>

        {/* Thanh trạng thái chọn và ô tìm kiếm */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-semibold text-slate-500">
            {selectedTab === "all" ? (
              <span>Hiển thị tất cả lịch sử mua hàng ({orders.length} đơn)</span>
            ) : selectedTab === "Chờ xác nhận" ? (
              <span>Đang lọc: Đơn chờ admin xác nhận ({pendingConfirmCount} đơn)</span>
            ) : selectedTab === "Chờ lấy hàng" ? (
              <span>Đang lọc: Đơn chờ shipper đến lấy ({pendingPickupCount} đơn)</span>
            ) : selectedTab === "Chờ giao hàng" ? (
              <span>Đang lọc: Đơn đang giao tận nơi ({pendingShippingCount} đơn)</span>
            ) : (
              <span>
                Đang lọc: Đơn đã nhận &amp; Đánh giá ({pendingReviewCount} đơn chưa đánh giá)
              </span>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn, tên sách, SĐT..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* DANH SÁCH CÁC THẺ ĐƠN HÀNG (ĐÃ GỘP GỌN GÀNG, BỎ THANH TIẾN TRÌNH CỒNG KỀNH TRÊN TỪNG ĐƠN) */}
      {!currentUser ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm space-y-5 max-w-lg mx-auto animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Package className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Bạn chưa đăng nhập tài khoản
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Vui lòng đăng nhập để theo dõi hành trình đơn hàng, xem trạng thái giao nhận và quản lý các đơn mua sắm của bạn.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Đăng nhập ngay
            </button>
            <button
              type="button"
              onClick={onContinueShopping}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Tiếp tục chọn sách
            </button>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 sm:p-14 text-center shadow-sm space-y-4 max-w-xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10 stroke-1" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {searchQuery || selectedTab !== "all"
                ? `Không có đơn hàng nào ở mục "${selectedTab}"`
                : "Bạn chưa có đơn mua hàng nào"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedTab !== "all"
                ? "Bạn có thể bấm vào 'Xem lịch sử mua hàng' để xem toàn bộ danh sách đơn đã đặt."
                : "Khám phá hàng ngàn tựa sách Bestseller với nhiều ưu đãi độc quyền tại BookStore ngay hôm nay."}
            </p>
          </div>
          <div>
            {searchQuery || selectedTab !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedTab("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Xem Tất Cả Đơn Hàng
              </button>
            ) : (
              <button
                type="button"
                onClick={onContinueShopping}
                className="px-6 py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all cursor-pointer"
              >
                Khám Phá Sách Ngay
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {paginatedOrders.map((ord) => {
            const statusInfo = getOrderStatusInfo(ord);
            const StatusIcon = statusInfo.icon;
            const isShipping =
              ord.status === "Chờ giao hàng" || (ord.status === "Đang giao" && !ord.receivedAt);
            const isPickup = ord.status === "Chờ lấy hàng";
            const isCompleted = ord.status === "Hoàn tất" || Boolean(ord.receivedAt);
            const isPaid = isOrderPaid(ord);

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
                      Thanh toán: <strong className="text-slate-700">{ord.paymentMethod}</strong>
                    </span>
                  </div>

                  {/* Badge Trạng Thái Đơn & Thanh Toán */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {/* Badge Thanh Toán */}
                    {isPaid ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã thanh toán</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Chờ thanh toán</span>
                      </span>
                    )}

                    {/* Badge Trạng Thái Theo 4 Bước */}
                    <span
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeBg}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor} animate-pulse`} />
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>
                </div>

                {/* Banner Thông Báo Vận Chuyển / Hẹn Giờ Riêng Biệt Cho Từng Bước */}
                {isPickup && ord.pickupTime && (
                  <div className="px-4 sm:px-6 py-2.5 bg-purple-50/80 border-b border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-purple-900">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>
                        <strong>Lịch lấy hàng shipper:</strong> {new Date(ord.pickupTime).toLocaleString("vi-VN")} (Đơn vị: {ord.shippingCarrier || "Giao Hàng Nhanh (GHN)"})
                      </span>
                    </div>

                    {/* Nút test chuyển nhanh sang chờ giao hàng nếu không muốn chờ timer */}
                    {onTriggerPickup && (
                      <button
                        type="button"
                        onClick={() => onTriggerPickup(ord.id)}
                        className="text-[11px] font-bold text-purple-700 bg-white hover:bg-purple-100 border border-purple-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                        title="Chuyển ngay sang trạng thái Chờ Giao Hàng để kiểm tra"
                      >
                        ⚡ Shipper Lấy Sớm (Test Ngay)
                      </button>
                    )}
                  </div>
                )}

                {/* Danh Sách Tác Phẩm Trong Đơn Hàng */}
                <div className="p-4 sm:p-6 divide-y divide-slate-100">
                  {ord.items.map((item) => (
                    <div
                      key={item.product.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        {/* Bìa sách có gáy */}
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

                {/* Thông Tin Người Nhận & Hành Động Theo Trạng Thái */}
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

                    {/* Hiển thị nhận xét đánh giá nếu đơn này đã được đánh giá */}
                    {ord.isReviewed && (
                      <div className="mt-2 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 text-xs">
                        <div className="flex items-center space-x-1 font-bold">
                          <span className="text-amber-500">{"★".repeat(ord.reviewRating || 5)}</span>
                          <span>({ord.reviewRating || 5}/5 sao)</span>
                          <span className="text-slate-400 font-normal">&bull; Đã đánh giá vào {ord.reviewedAt || ord.date}</span>
                        </div>
                        {ord.reviewComment && (
                          <p className="text-[11px] text-amber-800 mt-1 italic">
                            "{ord.reviewComment}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tổng tiền & Cụm Nút Hành Động */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200">
                    <div className="text-left sm:text-right">
                      <span className="block text-[10px] text-slate-400">Tổng thanh toán:</span>
                      <span className="text-base sm:text-lg font-black text-red-600">
                        {formatVND(ord.totalAmount)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* 1. NÚT XÁC NHẬN ĐÃ NHẬN HÀNG (Ở PHẦN CHỜ GIAO HÀNG) */}
                      {isShipping && onConfirmReceived && (
                        <button
                          type="button"
                          onClick={() => onConfirmReceived(ord.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1.5 cursor-pointer transform hover:-translate-y-0.5"
                          title="Bấm để xác nhận bạn đã nhận được gói sách thành công"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Đã Nhận Được Hàng</span>
                        </button>
                      )}

                      {/* 2. NÚT ĐÁNH GIÁ (Ở PHẦN HOÀN TẤT / ĐÃ NHẬN HÀNG) */}
                      {isCompleted && !ord.isReviewed && (
                        <button
                          type="button"
                          onClick={() => handleOpenReviewModal(ord)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 transition-all flex items-center space-x-1.5 cursor-pointer transform hover:-translate-y-0.5 animate-pulse"
                          title="Đánh giá chất lượng sách và dịch vụ"
                        >
                          <Star className="w-4 h-4 fill-white" />
                          <span>Đánh Giá Ngay</span>
                        </button>
                      )}

                      {/* Nút Xem lại Đánh giá (khi đã đánh giá) */}
                      {isCompleted && ord.isReviewed && (
                        <button
                          type="button"
                          onClick={() => handleOpenReviewModal(ord)}
                          className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Xem Đánh Giá</span>
                        </button>
                      )}

                      {/* Nút Thanh Toán Ngay nếu chưa thanh toán */}
                      {!isPaid && ord.status !== "Đã hủy" && onPayOrder && (
                        <button
                          type="button"
                          onClick={() => onPayOrder(ord)}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Thanh Toán Ngay</span>
                        </button>
                      )}

                      {/* Nút In Hóa Đơn */}
                      {onPrintInvoice && isPaid && (
                        <button
                          type="button"
                          onClick={() => onPrintInvoice(ord)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
                          title="In hóa đơn bán lẻ"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>In Hóa Đơn</span>
                        </button>
                      )}

                      {/* Nút Mua lại đơn này */}
                      <button
                        type="button"
                        onClick={() => onReorder(ord)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Mua Lại</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        {/* PHÂN TRANG DANH SÁCH ĐƠN HÀNG CỦA KHÁCH */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Hiển thị{" "}
              <strong className="text-slate-900 font-bold">
                {filteredOrders.length === 0
                  ? 0
                  : (currentPage - 1) * ordersPerPage + 1}{" "}
                -{" "}
                {Math.min(
                  currentPage * ordersPerPage,
                  filteredOrders.length
                )}
              </strong>{" "}
              trên tổng số{" "}
              <strong className="text-slate-900 font-bold">
                {filteredOrders.length}
              </strong>{" "}
              đơn hàng
            </span>
            <span className="text-slate-300 hidden sm:inline">&bull;</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Xem mỗi trang:</span>
              <select
                value={ordersPerPage}
                onChange={(e) => {
                  setOrdersPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value={5}>5 đơn / trang</option>
                <option value={10}>10 đơn / trang</option>
                <option value={20}>20 đơn / trang</option>
              </select>
            </div>
          </div>

          {/* Điều hướng chuyển trang */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => {
                  const newPage = Math.max(1, currentPage - 1);
                  setCurrentPage(newPage);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border transition-all ${
                  currentPage === 1
                    ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 shadow-xs cursor-pointer"
                }`}
                title="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === page
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                          : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                if (
                  (page === currentPage - 2 && page > 1) ||
                  (page === currentPage + 2 && page < totalPages)
                ) {
                  return (
                    <span key={page} className="px-1 text-slate-400">
                      &hellip;
                    </span>
                  );
                }
                return null;
              })}

              <button
                type="button"
                onClick={() => {
                  const newPage = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(newPage);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border transition-all ${
                  currentPage === totalPages
                    ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 shadow-xs cursor-pointer"
                }`}
                title="Trang sau"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* MODAL ĐÁNH GIÁ SẢN PHẨM & DỊCH VỤ */}
      {reviewingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Đánh Giá Đơn Hàng #{reviewingOrder.id}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Chia sẻ cảm nhận về tác phẩm sách &amp; chất lượng dịch vụ
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReviewingOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thông báo thành công */}
            {reviewSuccessMsg ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900">{reviewSuccessMsg}</h4>
                <p className="text-xs text-slate-500">
                  Đơn hàng đã được ghi nhận đánh giá và số lượng chờ đánh giá đã được cập nhật.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 pt-4 text-xs">
                {/* Danh sách sách trong đơn */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 block">Sản phẩm đánh giá:</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {reviewingOrder.items.map((it) => (
                      <div key={it.product.id} className="flex items-center space-x-2">
                        <img
                          src={it.product.imageUrl}
                          alt={it.product.name}
                          className="w-8 h-10 object-cover rounded border border-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate">{it.product.name}</p>
                          <p className="text-[10px] text-slate-400">{it.product.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chọn số sao tương tác */}
                <div className="text-center py-2 space-y-2">
                  <span className="block text-xs font-bold text-slate-700">
                    Chất lượng tác phẩm &amp; dịch vụ giao nhận:
                  </span>
                  <div className="flex items-center justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 ${
                            star <= reviewRating
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="inline-block text-xs font-bold text-amber-600 bg-amber-50 px-3 py-0.5 rounded-full">
                    {reviewRating === 5 && "⭐ Tuyệt vời - Rất hài lòng"}
                    {reviewRating === 4 && "⭐ Tốt - Hài lòng"}
                    {reviewRating === 3 && "⭐ Bình thường - Tạm được"}
                    {reviewRating === 2 && "⭐ Chưa hài lòng"}
                    {reviewRating === 1 && "⭐ Rất không hài lòng"}
                  </span>
                </div>

                {/* Gợi ý nhận xét nhanh */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-500 font-medium block">Chọn nhanh đánh giá:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Sách đóng gói rất cẩn thận",
                      "Nội dung hay & ý nghĩa",
                      "Giao hàng nhanh",
                      "Sách mới 100%",
                      "Dịch vụ tuyệt vời",
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setReviewComment((prev) => (prev ? `${prev}, ${tag}` : tag))
                        }
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Khung nhập nhận xét chi tiết */}
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">
                    Lời nhận xét của bạn:
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Viết cảm nhận của bạn về cuốn sách, chất lượng in ấn, thời gian giao hàng..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Nút hành động */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewingOrder(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi Đánh Giá</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
