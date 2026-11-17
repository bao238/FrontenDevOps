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
  Image as ImageIcon,
  RotateCcw,
  Link as LinkIcon
} from "lucide-react";
import { UserProfile, OrderRecord } from "../App";
import { OrderTabKey } from "./MyOrdersPage";
import { api } from "../services/api";

interface ProfilePageProps {
  currentUser: UserProfile | null;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<{ success: boolean; message?: string } | void> | void;
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
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState("");

  // Tham chiếu thẻ input file ẩn để tải ảnh đại diện từ máy tính
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Hàm nén ảnh tự động bằng HTML5 Canvas để tối ưu dung lượng và bộ nhớ
  const compressImage = (file: File, maxWidth = 350, maxHeight = 350, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let width = img.width;
        let height = img.height;

        // Giữ nguyên tỉ lệ khung hình khi resize
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Không thể khởi tạo Canvas 2D context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };
      img.src = objectUrl;
    });
  };

  // Xử lý đọc và nén file ảnh khi độc giả tải ảnh từ thiết bị
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

    // Tự động nén ảnh qua Canvas để dung lượng chỉ còn ~30-50KB
    compressImage(file)
      .then((compressedBase64) => {
        setAvatarUrl(compressedBase64);
      })
      .catch(() => {
        // Dự phòng đọc trực tiếp bằng FileReader nếu Canvas không được hỗ trợ
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
      });

    // Xóa value để có thể chọn lại file ảnh cùng tên nếu muốn
    e.target.value = "";
  };

  // Xử lý áp dụng URL ảnh trực tuyến
  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setAvatarUploadError(null);
    setAvatarUrl(customUrl.trim());
    setCustomUrl("");
    setShowUrlInput(false);
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
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setProfileError("Vui lòng nhập đầy đủ họ và tên cùng địa chỉ email.");
      return;
    }

    setProfileError(null);
    setIsSavingInfo(true);

    try {
      const res = await onUpdateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
      });

      if (res && (res as any).success === false) {
        setProfileError((res as any).message || "Cập nhật thông tin thất bại!");
      } else {
        setIsSavedSuccess(true);
        setTimeout(() => setIsSavedSuccess(false), 3500);
      }
    } catch (err: any) {
      setProfileError(err?.message || "Đã xảy ra lỗi khi lưu thông tin.");
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Đổi mật khẩu thực tế vào MongoDB thông qua API
  const handleChangePassword = async (e: React.FormEvent) => {
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

    try {
      await api.changePassword({ oldPassword, newPassword });
      setPasswordMessage(null);
      setPasswordSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordMessage(err?.message || "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.");
    }
  };

  // TRƯỜNG HỢP CHƯA ĐĂNG NHẬP
  if (!currentUser) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center space-x-2 text-xs text-slate-500 pb-2 border-b border-slate-200">
          <button onClick={onContinueShopping} className="hover:text-blue-600 transition-colors">
            Trang chủ
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
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
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-lg transition-all transform hover:-translate-y-0.5"
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
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-10 shadow-md border border-blue-900/40">
        {/* Glow ambient */}
        

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
            {/* Avatar lớn kèm click đổi ảnh nhanh */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer"
              title="Nhấp để tải ảnh đại diện mới từ thiết bị"
            >
              <img
                src={avatarUrl || currentUser.avatarUrl || "/default-avatar.png"}
                alt={currentUser.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white/20 shadow-md transition-all"
              />
              {/* Lớp phủ đổi ảnh khi hover */}
              <div className="absolute inset-0 rounded-3xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white space-y-1">
                <Camera className="w-6 h-6" />
                <span className="text-xs font-bold">Đổi ảnh</span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-md border border-white/30 transition-colors">
                <Camera className="w-4 h-4" />
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

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 pt-1">
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

      {/* 3 Thẻ Đặc Quyền & Trạng Thái Thành Viên Cao Cấp (Đã loại bỏ Đơn mua & Đơn hàng theo yêu cầu) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Thẻ 1: Hạng thành viên & Điểm tích lũy */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Hạng Thành Viên</span>
              <span className="text-base sm:text-lg font-black text-amber-600">Thẻ Vàng (180 Điểm)</span>
            </div>
          </div>
          <span className="text-xs bg-amber-100 text-amber-900 font-black px-2.5 py-1 rounded-full shrink-0">
            Giảm 5%
          </span>
        </div>

        {/* Thẻ 2: Trạng thái bảo mật */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Bảo Mật Tài Khoản</span>
              <span className="text-base sm:text-lg font-black text-emerald-700">Đã Xác Thực 100%</span>
            </div>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-900 font-black px-2.5 py-1 rounded-full shrink-0">
            An Toàn
          </span>
        </div>

        {/* Thẻ 3: Quyền lợi độc giả */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Đặc Quyền Độc Giả</span>
              <span className="text-base sm:text-lg font-black text-blue-700">Freeship từ 250k</span>
            </div>
          </div>
          <span className="text-xs bg-blue-100 text-blue-900 font-black px-2.5 py-1 rounded-full shrink-0">
            Book Club
          </span>
        </div>
      </div>

      {/* Tabs Chức Năng Hồ Sơ */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs - Giao diện phẳng loại bỏ lồng thẻ NESTED CARDS */}
        <div className="flex border-b border-slate-200 px-6 pt-4 gap-4 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab("info")}
            className={`pb-3.5 text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap border-b-2 cursor-pointer ${
              activeSubTab === "info"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông Tin Cá Nhân</span>
          </button>

          <button
            onClick={() => setActiveSubTab("security")}
            className={`pb-3.5 text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap border-b-2 cursor-pointer ${
              activeSubTab === "security"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Đổi Mật Khẩu &amp; Bảo Mật</span>
          </button>

          <button
            onClick={() => setActiveSubTab("rewards")}
            className={`pb-3.5 text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap border-b-2 cursor-pointer ${
              activeSubTab === "rewards"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
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

            {profileError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-center space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

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
                  <span className="text-xs text-slate-600 font-medium">
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
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{avatarUploadError}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {/* Nút tải ảnh đại diện từ thiết bị */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 rounded-2xl border-2 border-dashed border-blue-400 hover:border-blue-600 bg-blue-50/60 hover:bg-blue-100/70 flex flex-col items-center justify-center text-blue-600 transition-all  group cursor-pointer shadow-2xs shrink-0"
                    title="Tải ảnh đại diện từ thiết bị của bạn"
                  >
                    <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-xs font-bold mt-0.5">Tải lên</span>
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
                      className={`w-12 h-12 rounded-2xl object-cover cursor-pointer border-2 transition-all  shrink-0 ${
                        avatarUrl === url
                          ? "border-blue-600 ring-2 ring-blue-500/30 scale-105"
                          : "border-slate-200 opacity-70 hover:opacity-100"
                      }`}
                    />
                  ))}

                  {/* Nút đặt lại ảnh đại diện mặc định hệ thống */}
                  {avatarUrl && avatarUrl !== "/default-avatar.png" && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarUploadError(null);
                        setAvatarUrl("/default-avatar.png");
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-medium cursor-pointer shrink-0 ml-1"
                      title="Quay về ảnh đại diện hệ thống mặc định"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Mặc định</span>
                    </button>
                  )}

                  {/* Nút bật/tắt dán URL ảnh trực tuyến */}
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs text-blue-600 hover:text-blue-700 bg-blue-50/70 hover:bg-blue-100 rounded-xl transition-colors font-medium cursor-pointer shrink-0 ml-1"
                    title="Nhập đường link URL ảnh trực tiếp từ internet"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Dán URL ảnh</span>
                  </button>
                </div>

                {/* Khung nhập URL ảnh trực tuyến */}
                {showUrlInput && (
                  <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in">
                    <input
                      type="url"
                      placeholder="Dán đường dẫn ảnh: https://example.com/avatar.jpg"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyCustomUrl();
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shrink-0 shadow-xs"
                    >
                      Áp dụng
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(false)}
                      className="px-3 py-2 text-slate-500 hover:text-slate-600 text-xs font-semibold"
                    >
                      Đóng
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ và tên độc giả *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Email dùng để nhận thông báo đơn hàng và đăng nhập vào BookStore.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Địa chỉ nhận hàng mặc định
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
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
                  disabled={isSavingInfo}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingInfo ? "Đang lưu thay đổi..." : "Lưu Thay Đổi Hồ Sơ"}</span>
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
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
