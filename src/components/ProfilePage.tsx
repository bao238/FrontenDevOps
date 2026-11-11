import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Award,
  Lock,
  Save,
  CheckCircle2,
  Package,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  LogOut,
  Camera,
  Gift,
  BookOpen,
  ChevronRight,
  AlertCircle,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { UserProfile, OrderRecord } from "../App";
import { OrderTabKey } from "./MyOrdersPage";

// 4 Icon chuẩn nét vẽ vector tương đồng 100% với Hình 2 (Shopee)
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
    <rect x="8" y="16" width="32" height="24" rx="2" />
    <path d="M14 16V10a1.5 1.5 0 0 1 1.5-1.5h15l5.5 5.5v2" />
    <rect x="25" y="24" width="15" height="8" rx="1.5" />
    <circle cx="28.5" cy="28" r="1" fill="currentColor" />
  </svg>
);

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
    <path d="M9 16h30v22H9z" />
    <path d="M9 16l4-6h22l4 6" />
    <path d="M24 10v28" />
    <path d="M18 24h12" />
  </svg>
);

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
    <path d="M6 14h24v20H6z" />
    <path d="M30 20h8l4 6v8h-12z" />
    <path d="M30 22h7l3 4h-10z" />
    <circle cx="14" cy="35" r="3.5" />
    <circle cx="36" cy="35" r="3.5" />
    <path d="M6 34h4.5M17.5 34h15M39.5 34H42" />
  </svg>
);

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
    <circle cx="24" cy="24" r="18" />
    <path
      d="M24 13l3.2 6.5 7.2 1-5.2 5.1 1.2 7.2-6.4-3.4-6.4 3.4 1.2-7.2-5.2-5.1 7.2-1z"
      fill="none"
    />
  </svg>
);

interface ProfilePageProps {
  currentUser: UserProfile | null;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  orders?: OrderRecord[];
  ordersCount: number;
  wishlistCount?: number;
  onNavigateToOrders: (tab?: OrderTabKey) => void;
  onNavigateToWishlist?: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onContinueShopping: () => void;
}

// 4 Avatar mẫu phong cách độc giả tri thức
const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
];

export default function ProfilePage({
  currentUser,
  onUpdateProfile,
  orders = [],
  ordersCount,
  wishlistCount = 0,
  onNavigateToOrders,
  onNavigateToWishlist,
  onOpenAuth,
  onLogout,
  onContinueShopping,
}: ProfilePageProps) {
  // Tính số lượng badge cho 4 ô theo đúng yêu cầu đề bài
  const pendingConfirmCount = orders.filter(
    (o) => o.status === "Chờ xác nhận" || (o.status === "Đang xử lý" && !o.pickupTime)
  ).length;

  const pendingPickupCount = orders.filter((o) => o.status === "Chờ lấy hàng").length;

  const pendingShippingCount = orders.filter(
    (o) => o.status === "Chờ giao hàng" || (o.status === "Đang giao" && !o.receivedAt)
  ).length;

  const pendingReviewCount = orders.filter(
    (o) => (o.status === "Hoàn tất" || Boolean(o.receivedAt)) && !o.isReviewed
  ).length;
  // Tab con trong trang hồ sơ
  const [activeSubTab, setActiveSubTab] = useState<"info" | "security" | "rewards">("info");

  // Form State thông tin cá nhân
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [address, setAddress] = useState(currentUser?.address || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Tham chiếu thẻ input file ẩn để tải ảnh đại diện từ máy tính
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Xử lý đọc file ảnh khi độc giả tải ảnh từ thiết bị
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng ảnh hợp lệ
    if (!file.type.startsWith("image/")) {
      setAvatarUploadError("Vui lòng chọn tệp định dạng hình ảnh hợp lệ (PNG, JPG, WEBP).");
      return;
    }

    // Giới hạn dung lượng tối đa 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setAvatarUploadError("Dung lượng hình ảnh vượt quá 5MB. Vui lòng chọn ảnh nhẹ hơn.");
      return;
    }

    setAvatarUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.onerror = () => {
      setAvatarUploadError("Không thể đọc tệp hình ảnh. Vui lòng thử lại.");
    };
    reader.readAsDataURL(file);

    // Xóa value để có thể chọn lại file ảnh cùng tên nếu muốn
    e.target.value = "";
  };

  // Tự động đồng bộ form khi thông tin currentUser được cập nhật
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
      setAddress(currentUser.address || "");
      setAvatarUrl(currentUser.avatarUrl || "");
    }
  }, [currentUser]);

  // Form State đổi mật khẩu
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Lưu thông tin cá nhân
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    onUpdateProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
    });

    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 3000);
  };

  // Đổi mật khẩu
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setPasswordMessage("Vui lòng điền đầy đủ mật khẩu cũ và mới.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    // Giả lập cập nhật mật khẩu thành công
    setPasswordMessage(null);
    setPasswordSuccess(true);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSuccess(false), 4000);
  };

  // TRƯỜNG HỢP CHƯA ĐĂNG NHẬP
  if (!currentUser) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center space-x-2 text-xs text-slate-500 pb-2 border-b border-slate-200">
          <button onClick={onContinueShopping} className="hover:text-blue-600 transition-colors">
            Trang chủ
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-900">Hồ sơ người dùng</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-14 text-center shadow-sm space-y-6 max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <User className="w-10 h-10 stroke-1" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Bạn Chưa Đăng Nhập Tài Khoản
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Vui lòng đăng nhập hoặc tạo tài khoản mới để xem thông tin hồ sơ, quản lý đơn hàng và tích lũy điểm thưởng độc giả tại BookStore.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Đăng Nhập Ngay
            </button>
            <button
              onClick={onContinueShopping}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs sm:text-sm transition-colors"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <button onClick={onContinueShopping} className="hover:text-blue-600 transition-colors font-medium">
            Trang chủ
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-900">Hồ sơ cá nhân</span>
        </div>

        <button
          onClick={onContinueShopping}
          className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-4 py-2 rounded-xl transition-all self-start sm:self-auto"
        >
          <BookOpen className="w-4 h-4" />
          <span>Tiếp tục mua sách</span>
        </button>
      </div>

      {/* Hero Card: Tổng Quan Tài Khoản Độc Giả */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-10 shadow-xl border border-blue-900/40">
        {/* Glow ambient */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
            {/* Avatar */}
            <div className="relative group">
              <img
                src={currentUser.avatarUrl || avatarUrl || "/default-avatar.png"}
                alt={currentUser.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white/20 shadow-2xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-md border border-white/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Thông tin chính */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {currentUser.name}
                </h1>
                <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full shadow-sm">
                  {currentUser.role === "admin" ? "Quản Trị Viên" : "Độc Giả Thân Thiết"}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 flex items-center justify-center sm:justify-start space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentUser.email}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-400 pt-1">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Thành viên từ: {currentUser.memberSince || "2026"}</span>
                </span>
                <span>&bull;</span>
                <span className="text-emerald-400 font-bold">Tài khoản đã xác thực 100%</span>
              </div>
            </div>
          </div>

          {/* Nút Đăng Xuất */}
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-white/10 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 self-center md:self-start"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* KHỐI ĐƠN MUA GỘP 4 Ô CHUẨN GIAO DIỆN HÌNH ẢNH 2 (SHOPEE STYLE) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 transition-all">
        {/* Header khối Đơn mua */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Đơn mua
          </h3>
          <button
            type="button"
            onClick={() => onNavigateToOrders("all")}
            className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors flex items-center space-x-1 cursor-pointer group"
          >
            <span>Xem lịch sử mua hàng</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 4 Ô trạng thái chuẩn hình ảnh 2 */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 pt-5">
          {/* Ô 1: Chờ xác nhận */}
          <button
            type="button"
            onClick={() => onNavigateToOrders("Chờ xác nhận")}
            className="group relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div className="relative">
              <ConfirmIcon className="w-8 h-8 sm:w-9 sm:h-9 text-slate-800 transition-transform group-hover:scale-105" />
              {pendingConfirmCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[20px] h-5 px-1.5 bg-[#ee4d2d] text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                  {pendingConfirmCount}
                </span>
              )}
            </div>
            <span className="mt-2 text-xs sm:text-sm font-bold text-slate-800 text-center leading-tight">
              Chờ xác nhận
            </span>
          </button>

          {/* Ô 2: Chờ lấy hàng */}
          <button
            type="button"
            onClick={() => onNavigateToOrders("Chờ lấy hàng")}
            className="group relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div className="relative">
              <PickupBoxIcon className="w-8 h-8 sm:w-9 sm:h-9 text-slate-800 transition-transform group-hover:scale-105" />
              {pendingPickupCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[20px] h-5 px-1.5 bg-[#ee4d2d] text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {pendingPickupCount}
                </span>
              )}
            </div>
            <span className="mt-2 text-xs sm:text-sm font-bold text-slate-800 text-center leading-tight">
              Chờ lấy hàng
            </span>
          </button>

          {/* Ô 3: Chờ giao hàng (hiện badge đỏ nếu > 0 như ảnh 2) */}
          <button
            type="button"
            onClick={() => onNavigateToOrders("Chờ giao hàng")}
            className="group relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div className="relative">
              <ShippingTruckIcon className="w-8 h-8 sm:w-9 sm:h-9 text-slate-800 transition-transform group-hover:scale-105" />
              {pendingShippingCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[20px] h-5 px-1.5 bg-[#ee4d2d] text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {pendingShippingCount}
                </span>
              )}
            </div>
            <span className="mt-2 text-xs sm:text-sm font-bold text-slate-800 text-center leading-tight">
              Chờ giao hàng
            </span>
          </button>

          {/* Ô 4: Đánh giá (chỉ hiện số khi chưa đánh giá, đánh giá rồi thì ko hiện nữa) */}
          <button
            type="button"
            onClick={() => onNavigateToOrders("Đánh giá")}
            className="group relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div className="relative">
              <ReviewStarIcon className="w-8 h-8 sm:w-9 sm:h-9 text-slate-800 transition-transform group-hover:scale-105" />
              {pendingReviewCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[20px] h-5 px-1.5 bg-[#ee4d2d] text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                  {pendingReviewCount}
                </span>
              )}
            </div>
            <span className="mt-2 text-xs sm:text-sm font-bold text-slate-800 text-center leading-tight">
              Đánh giá
            </span>
          </button>
        </div>
      </div>

      {/* 2 Thẻ Chỉ Số Nhanh (Đơn hàng của tôi & Điểm thưởng) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Đơn hàng của tôi (thay thế cho Sách yêu thích) */}
        <div
          onClick={() => onNavigateToOrders("all")}
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs text-slate-400 font-medium">Đơn hàng của tôi</span>
              <span className="text-xl font-black text-slate-900">{ordersCount} đơn</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
        </div>


        {/* Điểm thưởng & Hạng thẻ */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs text-slate-400 font-medium">Điểm tích lũy</span>
              <span className="text-xl font-black text-amber-600">180 Điểm (Thẻ Vàng)</span>
            </div>
          </div>
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
            Giảm 5%
          </span>
        </div>
      </div>

      {/* Tabs Chức Năng Hồ Sơ */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 p-2 sm:p-3 bg-slate-50/70 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab("info")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeSubTab === "info"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông Tin Cá Nhân</span>
          </button>

          <button
            onClick={() => setActiveSubTab("security")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeSubTab === "security"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Đổi Mật Khẩu &amp; Bảo Mật</span>
          </button>

          <button
            onClick={() => setActiveSubTab("rewards")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeSubTab === "rewards"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Đặc Quyền Thành Viên</span>
          </button>
        </div>

        {/* NỘI DUNG TAB 1: THÔNG TIN CÁ NHÂN */}
        {activeSubTab === "info" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Cập Nhật Thông Tin Cá Nhân
              </h3>
              <p className="text-xs text-slate-500">
                Thông tin này sẽ được dùng để tự động điền khi bạn đặt mua sách tại BookStore
              </p>
            </div>

            {isSavedSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cập nhật thông tin hồ sơ thành công! Dữ liệu đã được lưu an toàn.</span>
              </div>
            )}

            <form onSubmit={handleSaveInfo} className="space-y-5 text-xs">
              {/* Chọn Avatar Mẫu hoặc Tải Ảnh Từ Máy Tính */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">
                    Ảnh đại diện hồ sơ độc giả:
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Hỗ trợ tải ảnh từ máy tính (PNG, JPG, WEBP) hoặc chọn mẫu có sẵn
                  </span>
                </div>

                {/* Thẻ input ẩn để chọn tệp từ máy tính */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="hidden"
                />

                {avatarUploadError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{avatarUploadError}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {/* Nút tải ảnh đại diện từ thiết bị */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 rounded-2xl border-2 border-dashed border-blue-400 hover:border-blue-600 bg-blue-50/60 hover:bg-blue-100/70 flex flex-col items-center justify-center text-blue-600 transition-all hover:scale-105 group cursor-pointer shadow-2xs shrink-0"
                    title="Tải ảnh đại diện từ thiết bị của bạn"
                  >
                    <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-[9px] font-bold mt-0.5">Tải lên</span>
                  </button>

                  {/* 4 Avatar mẫu chuẩn phong cách tri thức */}
                  {PRESET_AVATARS.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Avatar ${idx + 1}`}
                      onClick={() => {
                        setAvatarUploadError(null);
                        setAvatarUrl(url);
                      }}
                      className={`w-12 h-12 rounded-2xl object-cover cursor-pointer border-2 transition-all hover:scale-105 shrink-0 ${
                        avatarUrl === url
                          ? "border-blue-600 ring-2 ring-blue-500/30 scale-105"
                          : "border-slate-200 opacity-70 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ và tên độc giả *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại nhận sách
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Địa chỉ email (Dùng để đăng nhập) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Email dùng để nhận thông báo đơn hàng và đăng nhập vào BookStore.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Địa chỉ nhận hàng mặc định
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Thay Đổi Hồ Sơ</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* NỘI DUNG TAB 2: ĐỔI MẬT KHẨU */}
        {activeSubTab === "security" && (
          <div className="p-6 sm:p-8 space-y-6 max-w-lg">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Bảo Mật &amp; Đổi Mật Khẩu
              </h3>
              <p className="text-xs text-slate-500">
                Để bảo vệ tài khoản, vui lòng đặt mật khẩu mạnh tối thiểu 6 ký tự
              </p>
            </div>

            {passwordMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{passwordMessage}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mật khẩu hiện tại *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mật khẩu mới *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Xác nhận mật khẩu mới *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center space-x-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Cập Nhật Mật Khẩu</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* NỘI DUNG TAB 3: ĐẶC QUYỀN THÀNH VIÊN */}
        {activeSubTab === "rewards" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Chương Trình Độc Giả Thân Thiết (BookStore Club)
              </h3>
              <p className="text-xs text-slate-500">
                Tích lũy điểm khi mua sách để nâng hạng thành viên và nhận các đặc quyền cao cấp
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/60 space-y-2">
                <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
                  <Award className="w-5 h-5 text-amber-600" />
                  <span>Hạng Vàng (Hiện tại)</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Đã đạt mốc 150 điểm. Giảm thêm 5% cho tất cả đơn hàng &amp; miễn phí giao hàng cho đơn từ 200.000₫.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 opacity-80">
                <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span>Hạng Kim Cương (Cần 300 điểm)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Giảm thêm 10% trọn đời, tặng bookmark mạ vàng độc quyền và ưu tiên giao sách hỏa tốc 2H.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                  <Gift className="w-5 h-5 text-emerald-600" />
                  <span>Đặc Quyền Sinh Nhật</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tặng voucher giảm 20% và 1 cuốn sách Bestseller tự chọn trong tháng sinh nhật của bạn.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
