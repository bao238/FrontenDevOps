import React from "react";
import { Product } from "../data/products";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Tag,
  CreditCard,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Bookmark
} from "lucide-react";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartPageProps {
  cart: CartItem[];
  // Quản lý trạng thái tick chọn sản phẩm riêng trong giỏ hàng
  selectedProductIds?: string[];
  onToggleSelectProduct?: (productId: string) => void;
  onToggleSelectAll?: () => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onContinueShopping: () => void;
  onProceedToCheckout: () => void;
  onSelectProduct: (product: Product) => void;
  suggestedProducts: Product[];
  promoCode: string;
  setPromoCode: (code: string) => void;
  appliedDiscount: number;
  onApplyCoupon: (e: React.FormEvent) => void;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
}

export default function CartPage({
  cart,
  selectedProductIds,
  onToggleSelectProduct,
  onToggleSelectAll,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onContinueShopping,
  onProceedToCheckout,
  onSelectProduct,
  suggestedProducts,
  promoCode,
  setPromoCode,
  appliedDiscount,
  onApplyCoupon,
  subtotal,
  discountAmount,
  shippingFee,
  totalAmount,
}: CartPageProps) {
  // Danh sách ID các sản phẩm được chọn (mặc định chọn tất cả nếu chưa truyền)
  const activeSelectedIds = selectedProductIds ?? cart.map((i) => i.product.id);
  const isAllSelected = cart.length > 0 && activeSelectedIds.length === cart.length;
  // Format VND
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Ngưỡng Miễn Phí Vận Chuyển toàn quốc: 250.000₫
  const FREE_SHIPPING_THRESHOLD = 250000;
  const shippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const remainingForFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumbs & Back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <button
            onClick={onContinueShopping}
            className="hover:text-blue-600 transition-colors flex items-center space-x-1 font-medium"
          >
            <span>Trang chủ</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-900">Giỏ hàng của bạn</span>
        </div>

        <button
          onClick={onContinueShopping}
          className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-4 py-2 rounded-xl transition-all self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tiếp tục mua sắm</span>
        </button>
      </div>

      {/* Page Title & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-2">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Trang Quản Lý Đơn Mua Sắm</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Giỏ Hàng Của Bạn
          </h1>
        </div>
        <span className="text-xs sm:text-sm font-semibold text-slate-500">
          Hiện có <strong className="text-blue-600 font-bold">{totalItemsCount}</strong> sản phẩm trong giỏ
        </span>
      </div>

      {/* EMPTY CART STATE */}
      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-14 text-center shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-50 to-indigo-100 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Giỏ sách của bạn hiện đang trống!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Bạn chưa chọn cuốn sách nào vào giỏ. Hãy khám phá hàng ngàn tựa sách hấp dẫn chuẩn Nhà xuất bản với ưu đãi đặc biệt tại BookStore.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onContinueShopping}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Khám Phá Tủ Sách Ngay</span>
            </button>
          </div>
        </div>
      ) : (
        /* CART CONTENT WITH ITEMS */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: CART ITEMS LIST (8 COLS) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Thanh tiến trình Miễn Phí Vận Chuyển (Freeship Progress Bar) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      shippingProgress >= 100
                        ? "bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-500/20"
                        : "bg-blue-100 text-blue-600 shadow-sm shadow-blue-500/20"
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                  </div>
                  {shippingProgress >= 100 ? (
                    <span className="text-emerald-700 font-bold">
                      🎉 Tuyệt vời! Bạn đã đủ điều kiện được <strong className="text-emerald-800">Miễn Phí Vận Chuyển</strong> toàn quốc!
                    </span>
                  ) : (
                    <span className="text-slate-700">
                      Mua thêm <strong className="text-blue-600 font-bold">{formatVND(remainingForFreeShip)}</strong> để được <strong className="text-emerald-600 font-bold">Freeship toàn quốc</strong>!
                    </span>
                  )}
                </div>
                <span
                  className={`font-mono text-xs sm:text-sm font-black px-2 py-0.5 rounded-lg ${
                    shippingProgress >= 100
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {shippingProgress}%
                </span>
              </div>

              {/* Progress track */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    shippingProgress >= 100
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : "bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600"
                  }`}
                  style={{ width: `${shippingProgress}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Table Top Bar với Checkbox Chọn Tất Cả */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-800 select-none group">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() => onToggleSelectAll && onToggleSelectAll()}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                  />
                  <span className="uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                    Chọn tất cả ({activeSelectedIds.length}/{cart.length} sản phẩm muốn mua)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ sản phẩm khỏi giỏ hàng?")) {
                      onClearCart();
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center space-x-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa tất cả</span>
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {cart.map((item) => {
                  const lineTotal = item.product.price * item.quantity;
                  const isChecked = activeSelectedIds.includes(item.product.id);
                  return (
                    <div
                      key={item.product.id}
                      className={`p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                        isChecked ? "bg-white hover:bg-slate-50/50" : "bg-slate-50/40 opacity-75 hover:opacity-90"
                      }`}
                    >
                      {/* Checkbox & Product Thumbnail & Details */}
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                        {/* Checkbox chọn riêng cuốn sách này để mua trước */}
                        <div className="shrink-0 flex items-center pr-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggleSelectProduct && onToggleSelectProduct(item.product.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                            title={isChecked ? "Bỏ chọn (mua sau)" : "Tick chọn để thanh toán trước"}
                          />
                        </div>

                        {/* Bìa sách tỷ lệ 3:4 với hiệu ứng gáy sách 3D */}
                        <div
                          onClick={() => onSelectProduct(item.product)}
                          className="relative aspect-[3/4] w-16 sm:w-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 cursor-pointer hover:opacity-90 transition-opacity bg-slate-100 shadow-sm"
                        >
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Hiệu ứng gáy sách chiều sâu */}
                          <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/25 via-black/5 to-transparent pointer-events-none" />
                        </div>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {item.product.category}
                          </span>
                          <h4
                            onClick={() => onSelectProduct(item.product)}
                            className="font-bold text-sm text-slate-900 truncate hover:text-blue-600 cursor-pointer transition-colors"
                            title={item.product.name}
                          >
                            {item.product.name}
                          </h4>
                          {item.product.author && (
                            <p className="text-[11px] text-slate-500 font-medium truncate">
                              Tác giả: <span className="text-slate-700 font-semibold">{item.product.author}</span>
                            </p>
                          )}
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="font-extrabold text-blue-600">
                              {formatVND(item.product.price)}
                            </span>
                            {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                              <span className="line-through text-slate-400 text-[11px]">
                                {formatVND(item.product.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity & Subtotal & Delete */}
                      <div className="flex items-center justify-between sm:justify-end space-x-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
                            title="Giảm số lượng"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
                            title="Tăng số lượng"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right min-w-[100px]">
                          <span className="block text-[10px] text-slate-400">Thành tiền</span>
                          <span className="font-black text-slate-900 text-sm sm:text-base">
                            {formatVND(lineTotal)}
                          </span>
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => onRemoveFromCart(item.product.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Xóa khỏi giỏ hàng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="p-4 sm:p-5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={onContinueShopping}
                  className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Chọn thêm sản phẩm khác</span>
                </button>

                <div className="flex items-center space-x-2 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Miễn phí vận chuyển toàn quốc cho đơn từ 250.000₫</span>
                </div>
              </div>
            </div>

            {/* Service Highlights Card chuẩn Nhà Sách BookStore */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center space-x-3 text-xs">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900">Giao Toàn Quốc Siêu Tốc</h5>
                  <p className="text-[11px] text-slate-500">Đóng gói 3 lớp xốp chống móp</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center space-x-3 text-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900">100% Sách Thật Chuẩn NXB</h5>
                  <p className="text-[11px] text-slate-500">Tặng kèm bookmark độc quyền</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center space-x-3 text-xs">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900">Đổi Trả Sách 7 Ngày</h5>
                  <p className="text-[11px] text-slate-500">Lỗi in ấn đổi mới 100%</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY (4 COLS) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50 space-y-6">
              <h3 className="font-black text-lg text-slate-900 border-b border-slate-100 pb-3">
                Tóm Tắt Đơn Hàng
              </h3>

              {/* Coupon Code Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Mã ưu đãi / Giảm giá
                </label>
                <form onSubmit={onApplyCoupon} className="flex space-x-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="VD: BOOKWORM10 hoặc DEVOPS10"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Áp dụng
                  </button>
                </form>

                {/* Quick Coupon Hint Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400">Mã gợi ý:</span>
                  <button
                    type="button"
                    onClick={() => setPromoCode("BOOKWORM10")}
                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-bold border border-blue-200 transition-colors"
                  >
                    BOOKWORM10 (-10%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoCode("DEVOPS10")}
                    className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold border border-indigo-200 transition-colors"
                  >
                    DEVOPS10 (-10%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoCode("FREESHIP")}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold border border-emerald-200 transition-colors"
                  >
                    FREESHIP
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-xs border-t border-slate-100 pt-4">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính ({activeSelectedIds.length} cuốn đã chọn):</span>
                  <span className="font-semibold text-slate-900">{formatVND(subtotal)}</span>
                </div>

                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span className="flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Giảm giá khuyến mãi ({Math.round(appliedDiscount * 100)}%):</span>
                    </span>
                    <span>-{formatVND(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển:</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold">Miễn phí</span>
                    ) : (
                      formatVND(shippingFee)
                    )}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="block text-sm font-black text-slate-900">Tổng thanh toán</span>
                    <span className="text-[10px] text-slate-400">Đã bao gồm thuế VAT (nếu có)</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-blue-600">
                    {formatVND(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={() => {
                  if (activeSelectedIds.length === 0) {
                    alert("Vui lòng tick chọn ít nhất 1 cuốn sách để tiến hành đặt hàng!");
                    return;
                  }
                  onProceedToCheckout();
                }}
                disabled={activeSelectedIds.length === 0}
                className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-xl transition-all flex items-center justify-center space-x-2 ${
                  activeSelectedIds.length === 0
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 transform hover:-translate-y-0.5 cursor-pointer"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {activeSelectedIds.length === 0
                    ? "Vui Lòng Chọn Sách Để Mua"
                    : `Tiến Hành Đặt Hàng (${activeSelectedIds.length} cuốn đã chọn)`}
                </span>
              </button>

              <p className="text-center text-[11px] text-slate-400 flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Giao dịch an toàn &amp; Bảo mật tuyệt đối</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUGGESTED PRODUCTS SECTION */}
      {suggestedProducts.length > 0 && (
        <div className="pt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Gợi Ý Tác Phẩm Bestseller Có Thể Bạn Sẽ Thích
              </h3>
              <p className="text-xs text-slate-500">
                Các đầu sách được độc giả yêu thích và đặt mua nhiều nhất tại BookStore
              </p>
            </div>
            <button
              onClick={onContinueShopping}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {suggestedProducts.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className="bg-white rounded-3xl p-3.5 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Hiệu ứng gáy sách 3D */}
                    <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 via-black/5 to-transparent pointer-events-none" />
                    {p.discountPercent > 0 && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                        -{p.discountPercent}%
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded block w-fit mb-1">
                      {p.category}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 line-clamp-2 transition-colors leading-snug">
                      {p.name}
                    </h4>
                    {p.author && (
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        Tác giả: <span className="text-slate-700">{p.author}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-black text-xs text-red-600">
                    {formatVND(p.price)}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-600 flex items-center space-x-0.5 transition-colors">
                    <span>Xem sách</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
