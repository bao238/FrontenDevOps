import React, { useState } from "react";
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
  Heart,
  Sparkles,
  ArrowRight,
  LogOut,
  Camera,
  Gift,
  BookOpen,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { UserProfile } from "../App";

interface ProfilePageProps {
  currentUser: UserProfile | null;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  ordersCount: number;
  wishlistCount: number;
  onNavigateToOrders: () => void;
  onNavigateToWishlist: () => void;
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
  ordersCount,
  wishlistCount,
  onNavigateToOrders,
  onNavigateToWishlist,
  onOpenAuth,
  onLogout,
  onContinueShopping,
}: ProfilePageProps) {
  // Tab con trong trang hồ sơ
  const [activeSubTab, setActiveSubTab] = useState<"info" | "security" | "rewards">("info");

  // Form State thông tin cá nhân
  const [name, setName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [address, setAddress] = useState(currentUser?.address || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Form State đổi mật khẩu
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Lưu thông tin cá nhân
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdateProfile({
      name: name.trim(),
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

      {/* 3 Thẻ Chỉ Số Nhanh (Clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Đơn hàng */}
        <div
          onClick={onNavigateToOrders}
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs text-slate-400 font-medium">Đơn hàng của bạn</span>
              <span className="text-xl font-black text-slate-900">{ordersCount} đơn</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </div>

        {/* Sách yêu thích */}
        <div
          onClick={onNavigateToWishlist}
          className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group flex items-center justify-between"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Heart className="w-6 h-6 fill-rose-500" />
            </div>
            <div>
              <span className="block text-xs text-slate-400 font-medium">Sách yêu thích</span>
              <span className="text-xl font-black text-slate-900">{wishlistCount} cuốn</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
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
              {/* Chọn Avatar Mẫu */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  Chọn ảnh đại diện phong cách độc giả:
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {PRESET_AVATARS.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Avatar ${idx + 1}`}
                      onClick={() => setAvatarUrl(url)}
                      className={`w-12 h-12 rounded-2xl object-cover cursor-pointer border-2 transition-all hover:scale-105 ${
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
                  Địa chỉ email (Dùng để đăng nhập)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-xs font-mono cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Email là định danh tài khoản cố định, không thể thay đổi.</p>
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
