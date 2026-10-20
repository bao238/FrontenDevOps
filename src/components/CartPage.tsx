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
  ChevronRight
} from "lucide-react";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartPageProps {
  cart: CartItem[];
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
  // Format VND
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Table Top Bar */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Danh sách sản phẩm ({cart.length} mẫu mã)
                </span>
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
                  return (
                    <div
                      key={item.product.id}
                      className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          onClick={() => onSelectProduct(item.product)}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border border-slate-200 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                        />
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
                  <span>Miễn phí vận chuyển toàn quốc cho đơn từ 500.000₫</span>
                </div>
              </div>
            </div>

            {/* Service Highlights Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center space-x-3 text-xs">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900">Giao Hàng Siêu Tốc</h5>
                  <p className="text-[11px] text-slate-500">Chỉ 2H tại nội thành</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center space-x-3 text-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900">100% Chính Hãng</h5>
                  <p className="text-[11px] text-slate-500">Bảo hành 12 tháng</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center space-x-3 text-xs">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900">Đổi Trả Dễ Dàng</h5>
                  <p className="text-[11px] text-slate-500">Trong 30 ngày nếu lỗi</p>
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
                  <span>Tạm tính hàng hóa:</span>
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
                onClick={onProceedToCheckout}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Tiến Hành Đặt Hàng &amp; Thanh Toán</span>
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
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {p.discountPercent > 0 && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        -{p.discountPercent}%
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">{p.category}</span>
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 line-clamp-2 transition-colors">
                      {p.name}
                    </h4>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-600">
                    {formatVND(p.price)}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600 flex items-center space-x-0.5">
                    <span>Xem</span>
                    <ChevronRight className="w-3 h-3" />
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
