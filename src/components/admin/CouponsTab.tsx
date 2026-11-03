import React, { useState, useEffect, useMemo } from "react";
// Import createPortal để render modal trực tiếp vào body, không bị gián đoạn giao diện hoặc cắt mờ header
import { createPortal } from "react-dom";
import {
  Ticket,
  Plus,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  RotateCcw,
  Tag,
  Percent,
  Calendar,
  Layers,
  Power
} from "lucide-react";
import { api, CouponItem } from "../../services/api";

export default function CouponsTab() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // State Modal Thêm / Chỉnh sửa Coupon
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState<number | "">("");
  const [usageLimit, setUsageLimit] = useState(100);
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // State Modal Xác nhận Xóa
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Tải danh sách mã giảm giá từ MongoDB
  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCoupons();
      setCoupons(data);
    } catch (err) {
      console.error("❌ Lỗi tải danh sách coupon:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Mở modal tạo mới mã giảm giá
  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setCode("");
    setTitle("");
    setDiscountType("percent");
    setDiscountValue(10);
    setMinOrderValue(0);
    setMaxDiscount("");
    setUsageLimit(100);
    // Ngày hết hạn mặc định: 30 ngày sau
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setExpiresAt(d.toISOString().split("T")[0]);
    setIsActive(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa mã giảm giá
  const handleOpenEdit = (c: CouponItem) => {
    setEditingCoupon(c);
    setCode(c.code);
    setTitle(c.title);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinOrderValue(c.minOrderValue || 0);
    setMaxDiscount(c.maxDiscount !== undefined && c.maxDiscount !== null ? c.maxDiscount : "");
    setUsageLimit(c.usageLimit || 100);
    setExpiresAt(
      c.expiresAt ? new Date(c.expiresAt).toISOString().split("T")[0] : ""
    );
    setIsActive(c.isActive);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Xử lý lưu form thêm/sửa
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      setModalError("Vui lòng nhập đầy đủ mã code và tiêu đề khuyến mãi");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    const payload: Partial<CouponItem> = {
      code: code.trim().toUpperCase(),
      title: title.trim(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount: maxDiscount !== "" ? Number(maxDiscount) : null,
      usageLimit: Number(usageLimit) || 100,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : new Date().toISOString(),
      isActive
    };

    try {
      if (editingCoupon && editingCoupon._id) {
        const res = await api.updateCoupon(editingCoupon._id, payload);
        if (res && res.error) {
          setModalError(res.error);
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await api.createCoupon(payload);
        if (res && res.error) {
          setModalError(res.error);
          setIsSubmitting(false);
          return;
        }
      }
      setIsModalOpen(false);
      await fetchCoupons();
    } catch (err: any) {
      setModalError(err.message || "Lỗi khi lưu mã giảm giá");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bật / Tắt trạng thái mã giảm giá nhanh
  const handleToggleStatus = async (c: CouponItem) => {
    if (!c._id) return;
    try {
      await api.updateCoupon(c._id, { isActive: !c.isActive });
      setCoupons((prev) =>
        prev.map((item) =>
          item._id === c._id ? { ...item, isActive: !item.isActive } : item
        )
      );
    } catch (err) {
      console.error("❌ Lỗi chuyển trạng thái coupon:", err);
    }
  };

  // Xác nhận xóa mã giảm giá
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await api.deleteCoupon(deletingId);
      setCoupons((prev) => prev.filter((item) => item._id !== deletingId));
      setDeletingId(null);
    } catch (err) {
      console.error("❌ Lỗi xóa coupon:", err);
    }
  };

  // Lọc coupon theo tìm kiếm và trạng thái
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.isActive) ||
        (statusFilter === "inactive" && !c.isActive);
      return matchSearch && matchStatus;
    });
  }, [coupons, searchQuery, statusFilter]);

  // Định dạng hiển thị tiền VNĐ
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header & Thanh công cụ */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <Ticket className="w-5 h-5 text-blue-600" />
            <span>Quản Lý Mã Giảm Giá &amp; Khuyến Mãi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tạo mã voucher, đặt giới hạn lượt dùng và mức giảm giá áp dụng tự động cho giỏ sách
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchCoupons}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Làm mới từ MongoDB"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Mã Giảm Giá</span>
          </button>
        </div>
      </div>

      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã code hoặc tiêu đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
          >
            <option value="all">Tất cả trạng thái ({coupons.length})</option>
            <option value="active">Đang áp dụng</option>
            <option value="inactive">Tạm khóa / Hết hạn</option>
          </select>
        </div>
      </div>

      {/* Danh sách thẻ Voucher dạng Grid */}
      {isLoading && coupons.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <RotateCcw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Đang tải mã giảm giá từ MongoDB...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Chưa có mã giảm giá nào</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Không tìm thấy mã giảm giá phù hợp với điều kiện tìm kiếm của bạn. Hãy bấm nút "Thêm Mã Giảm Giá" để tạo mới.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon) => {
            const isExpired =
              coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
            const isMaxedOut =
              coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;
            const isUsable = coupon.isActive && !isExpired && !isMaxedOut;

            return (
              <div
                key={coupon._id || coupon.code}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition-all relative overflow-hidden flex flex-col justify-between ${
                  isUsable ? "border-slate-200 hover:shadow-md" : "border-slate-200/60 opacity-80 bg-slate-50/50"
                }`}
              >
                {/* Viền trạng thái màu */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isUsable ? "bg-gradient-to-r from-blue-500 to-indigo-600" : "bg-slate-300"
                  }`}
                />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-mono font-black text-sm tracking-wide">
                        <Tag className="w-3.5 h-3.5" />
                        <span>{coupon.code}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mt-2 line-clamp-1">
                        {coupon.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(coupon)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        coupon.isActive
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                          : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200"
                      }`}
                      title={coupon.isActive ? "Bấm để tạm khóa" : "Bấm để kích hoạt"}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Giá trị giảm */}
                  <div className="p-3 bg-slate-50 rounded-xl mb-4 space-y-1.5 border border-slate-100 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Mức giảm:</span>
                      <strong className="text-blue-600 font-bold text-sm">
                        {coupon.discountType === "percent"
                          ? `Giảm ${coupon.discountValue}%`
                          : `Giảm ${formatVND(coupon.discountValue)}`}
                      </strong>
                    </div>
                    {coupon.minOrderValue > 0 && (
                      <div className="flex justify-between items-center text-slate-500 text-[11px]">
                        <span>Đơn tối thiểu:</span>
                        <span>{formatVND(coupon.minOrderValue)}</span>
                      </div>
                    )}
                    {coupon.discountType === "percent" && coupon.maxDiscount && (
                      <div className="flex justify-between items-center text-slate-500 text-[11px]">
                        <span>Giảm tối đa:</span>
                        <span>{formatVND(coupon.maxDiscount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Thanh tiến độ sử dụng */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>Đã dùng:</span>
                      <span>
                        {coupon.usedCount} / {coupon.usageLimit} lượt
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (coupon.usedCount / (coupon.usageLimit || 1)) * 100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer thông tin hạn dùng & Nút thao tác */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString("vi-VN")
                        : "Vô thời hạn"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(coupon)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Chỉnh sửa voucher"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(coupon._id || null)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Xóa voucher"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL THÊM / CHỈNH SỬA VOUCHER (createPortal ra body) */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Ticket className="w-5 h-5 text-blue-600" />
                <span>{editingCoupon ? "Chỉnh Sửa Mã Giảm Giá" : "Tạo Mã Giảm Giá Mới"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã code khuyến mãi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: BOOKWORM10"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Loại giảm giá <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tiêu đề / Mô tả chương trình <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Giảm 10% cho mọt sách đam mê"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {discountType === "percent" ? "Tỷ lệ giảm (%)" : "Số tiền giảm (VNĐ)"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder={discountType === "percent" ? "10" : "50000"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Đơn hàng tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {discountType === "percent" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mức giảm tối đa (VNĐ) (Để trống nếu không giới hạn)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="VD: 50000"
                    value={maxDiscount}
                    onChange={(e) =>
                      setMaxDiscount(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tổng lượt dùng tối đa
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngày hết hạn
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="couponActive" className="font-semibold text-slate-700 cursor-pointer">
                  Kích hoạt mã giảm giá ngay sau khi lưu
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? "Đang lưu..." : "Lưu Mã Giảm Giá"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL XÁC NHẬN XÓA VOUCHER (createPortal ra body) */}
      {deletingId && createPortal(
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/70 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in-95 my-auto">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Xác Nhận Xóa Voucher?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Thao tác này sẽ xóa vĩnh viễn mã giảm giá khỏi hệ thống MongoDB. Khách hàng sẽ không thể nhập mã này nữa.
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-500/20"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
