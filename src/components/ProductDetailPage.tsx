import React, { useState, useEffect } from "react";
import { Product, ReviewItem } from "../data/products";
import { api } from "../services/api";
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  Share2,
  Heart,
  Minus,
  Plus,
  Send,
  MessageSquare,
  ThumbsUp,
  Tag,
  Clock,
  Sparkles,
  ChevronRight
} from "lucide-react";

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onBuyNow: (product: Product, quantity?: number) => void;
  onBack: () => void;
  onSelectRelatedProduct: (product: Product) => void;
}

export default function ProductDetailPage({
  product,
  allProducts,
  onAddToCart,
  onBuyNow,
  onBack,
  onSelectRelatedProduct,
}: ProductDetailPageProps) {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "desc" | "reviews">("desc");
  const [isLiked, setIsLiked] = useState(false);
  const [copyNotification, setCopyNotification] = useState(false);

  // Reviews state lấy từ MongoDB
  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    return product.reviews || [];
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Tải đánh giá thực tế từ MongoDB khi xem sản phẩm
  useEffect(() => {
    if (product?.id) {
      api.getProductReviews(product.id).then((data) => {
        if (data && data.length > 0) {
          setReviews(data);
        }
      });
    }
  }, [product?.id]);

  // Review Form state
  const [reviewerName, setReviewerName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Format VND
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Related products (same category, excluding current)
  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Handle Review submission lưu trực tiếp vào MongoDB
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewContent.trim() || isSubmittingReview) return;

    setIsSubmittingReview(true);
    try {
      const res = await api.addProductReview(product.id, {
        author: reviewerName.trim(),
        rating: reviewRating,
        content: reviewContent.trim()
      });

      if (res && res.data) {
        setReviews(res.data);
      } else {
        const newRev: ReviewItem = {
          id: "rev-" + Date.now(),
          author: reviewerName.trim(),
          rating: reviewRating,
          date: "Vừa xong",
          content: reviewContent.trim(),
          verified: true,
          likes: 0
        };
        setReviews((prev) => [newRev, ...prev]);
      }

      setReviewerName("");
      setReviewContent("");
      setReviewRating(5);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (err) {
      console.error("Lỗi khi gửi đánh giá lên MongoDB:", err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Share link
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopyNotification(true);
      setTimeout(() => setCopyNotification(false), 2500);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Breadcrumbs & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-500 overflow-x-auto whitespace-nowrap">
          <button
            onClick={onBack}
            className="hover:text-blue-600 transition-colors font-medium"
          >
            Trang chủ
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-500">{product.category}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-bold truncate max-w-xs sm:max-w-sm">
            {product.name}
          </span>
        </div>

        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          <span>Quay lại danh sách sản phẩm</span>
        </button>
      </div>

      {/* Main Product Showcase (2 Columns) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Big Product Image & Badges */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner group">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {product.discountPercent > 0 && (
              <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-lg shadow-red-600/30 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Tiết kiệm {product.discountPercent}%</span>
              </div>
            )}
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2.5 rounded-2xl backdrop-blur-md transition-all shadow-md ${
                  isLiked
                    ? "bg-red-500 text-white"
                    : "bg-white/80 hover:bg-white text-slate-700"
                }`}
                title="Thêm vào yêu thích"
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-white" : ""}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2.5 rounded-2xl bg-white/80 hover:bg-white text-slate-700 backdrop-blur-md transition-all shadow-md relative"
                title="Chia sẻ sản phẩm"
              >
                <Share2 className="w-4 h-4" />
                {copyNotification && (
                  <span className="absolute -bottom-8 right-0 bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                    Đã copy link!
                  </span>
                )}
              </button>
            </div>

            {!product.inStock && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-sm font-bold">
                Sản phẩm tạm hết hàng
              </div>
            )}
          </div>

          {/* Value Assurance Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-center space-y-1">
              <ShieldCheck className="w-5 h-5 text-blue-600 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">100% Chính Hãng</p>
              <p className="text-[10px] text-slate-400">Bảo hành 12 tháng</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-center space-y-1">
              <RotateCcw className="w-5 h-5 text-emerald-600 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">Đổi Trả 30 Ngày</p>
              <p className="text-[10px] text-slate-400">1 đổi 1 miễn phí</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-center space-y-1">
              <Truck className="w-5 h-5 text-purple-600 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">Giao Hỏa Tốc</p>
              <p className="text-[10px] text-slate-400">Nhận trong 2 giờ</p>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Overview & Action Buttons */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category & Status */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                {product.category}
              </span>
              <div className="flex items-center space-x-1.5 text-xs">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    product.inStock ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                  }`}
                ></span>
                <span className={`font-bold ${product.inStock ? "text-emerald-700" : "text-red-700"}`}>
                  {product.inStock ? "Còn hàng tại DinhBao Store" : "Tạm hết hàng"}
                </span>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Star Ratings Summary */}
            <div className="flex items-center space-x-3 text-xs pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{product.rating}</span>
              </div>
              <span className="text-slate-300">&bull;</span>
              <button
                onClick={() => setActiveTab("reviews")}
                className="text-blue-600 font-semibold hover:underline"
              >
                {reviews.length} đánh giá thực tế
              </button>
              <span className="text-slate-300">&bull;</span>
              <span className="text-slate-500">Mã SP: <strong className="font-mono text-slate-700">{product.id}</strong></span>
            </div>

            {/* Price Box */}
            <div className="bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl sm:text-4xl font-black text-red-600">
                  {formatVND(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-sm sm:text-base text-slate-400 line-through">
                    {formatVND(product.originalPrice)}
                  </span>
                )}
              </div>
              {product.originalPrice > product.price && (
                <p className="text-xs text-emerald-700 font-semibold">
                  Tiết kiệm: {formatVND(product.originalPrice - product.price)} khi mua ngay hôm nay!
                </p>
              )}
            </div>

            {/* Short Highlights */}
            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
              <p className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Đặc quyền khi mua tại DinhBao:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li>Tặng kèm gói vệ sinh máy &amp; tra keo tản nhiệt trọn đời.</li>
                <li>Hỗ trợ cài đặt phần mềm, hệ điều hành miễn phí theo yêu cầu.</li>
                <li>Áp dụng mã voucher <strong className="text-blue-600 font-mono">DINHBAO10</strong> giảm thêm 10% khi đặt hàng.</li>
              </ul>
            </div>

            {/* Quantity Selector */}
            {product.inStock && (
              <div className="flex items-center space-x-4 pt-2">
                <span className="text-xs font-bold text-slate-700">Số lượng:</span>
                <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-xs">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-l-xl transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-xs font-black text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-r-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs text-slate-400">
                  Tổng tiền: <strong className="text-red-600 font-bold">{formatVND(product.price * quantity)}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Action CTA Buttons */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onAddToCart(product, quantity)}
                disabled={!product.inStock}
                className={`py-3.5 px-4 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 ${
                  product.inStock
                    ? "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20 hover:scale-[1.01]"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Thêm Vào Giỏ Hàng</span>
              </button>

              <button
                onClick={() => onBuyNow(product, quantity)}
                disabled={!product.inStock}
                className={`py-3.5 px-4 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 ${
                  product.inStock
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:scale-[1.01]"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Mua Ngay (Giao Tận Nơi)</span>
              </button>
            </div>

            <p className="text-[11px] text-center text-slate-400 flex items-center justify-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Giao hàng toàn quốc &bull; Kiểm tra hàng trước khi thanh toán</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Section: Detailed Description, Specs, Reviews */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 space-x-4 sm:space-x-8 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab("desc")}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === "desc"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Mô Tả Chi Tiết &amp; Đánh Giá
          </button>
          <button
            onClick={() => setActiveTab("specs")}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === "specs"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Thông Số Kỹ Thuật
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`pb-3 border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "reviews"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Đánh Giá Khách Hàng</span>
            <span className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-full font-bold">
              {reviews.length}
            </span>
          </button>
        </div>

        {/* TAB 1: MÔ TẢ CHI TIẾT */}
        {activeTab === "desc" && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Giới thiệu về {product.name}
            </h3>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
            <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 space-y-2 mt-4 text-xs">
              <h4 className="font-bold text-blue-900">Lý do bạn nên sở hữu thiết bị này:</h4>
              <ul className="space-y-1.5 text-blue-800 list-disc list-inside">
                <li>Sản phẩm được tuyển chọn kỹ lưỡng, đảm bảo tiêu chuẩn cao nhất về thẩm mỹ và hiệu năng.</li>
                <li>Chế độ hậu mãi độc quyền: Hỗ trợ kỹ thuật 24/7 từ chuyên viên DinhBao Store.</li>
                <li>Đầy đủ phụ kiện chính hãng nguyên hộp, sách hướng dẫn và tem bảo hành.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: THÔNG SỐ KỸ THUẬT */}
        {activeTab === "specs" && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Bảng Thông Số Kỹ Thuật Chi Tiết
            </h3>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-200">
                  {Object.entries(product.specs).map(([key, val], idx) => (
                    <tr
                      key={key}
                      className={idx % 2 === 0 ? "bg-slate-50/60" : "bg-white"}
                    >
                      <td className="py-3 px-4 font-bold text-slate-700 w-1/3 sm:w-1/4">
                        {key}
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-medium">
                        {val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ĐÁNH GIÁ & NHẬN XÉT CỦA KHÁCH HÀNG */}
        {activeTab === "reviews" && (
          <div className="space-y-8 animate-in fade-in">
            {/* Reviews Overview Banner */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <span className="text-4xl font-black text-slate-900">{product.rating}</span>
                  <div className="space-y-1">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">Dựa trên {reviews.length} đánh giá</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs font-bold text-slate-700 mb-1">Bạn đã trải nghiệm sản phẩm này?</p>
                <a
                  href="#write-review"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors inline-block"
                >
                  Viết Đánh Giá Của Bạn
                </a>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">
                Tất cả nhận xét ({reviews.length})
              </h4>
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img
                          src="/default-avatar.png"
                          alt={rev.author}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900">{rev.author}</span>
                          {rev.verified && (
                            <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              Đã mua hàng
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400">{rev.date}</span>
                    </div>

                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-slate-700 leading-relaxed">
                      {rev.content}
                    </p>

                    <div className="flex items-center space-x-4 text-[11px] text-slate-400 pt-1">
                      <button className="flex items-center space-x-1 hover:text-blue-600">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Hữu ích ({rev.likes})</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Write a Review Form */}
            <div id="write-review" className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Gửi Đánh Giá Của Bạn</span>
              </h4>

              {reviewSuccess && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Cảm ơn bạn! Đánh giá của bạn đã được đăng thành công.</span>
                </div>
              )}

              <form onSubmit={handleAddReview} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Họ và tên của bạn *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Số sao đánh giá *
                    </label>
                    <div className="flex items-center space-x-2 pt-1.5">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setReviewRating(num)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              num <= reviewRating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="font-bold text-slate-700 ml-2">
                        {reviewRating} / 5 sao
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nội dung nhận xét chi tiết *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Chia sẻ cảm nhận về chất lượng sản phẩm, đóng gói, tốc độ giao hàng..."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingReview ? "Đang gửi lên MongoDB..." : "Gửi Nhận Xét"}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Related Products Carousel / Grid */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Sản Phẩm Cùng Danh Mục
              </h3>
              <p className="text-xs text-slate-500">Khám phá thêm các thiết bị {product.category} khác</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.map((rel) => (
              <div
                key={rel.id}
                onClick={() => {
                  onSelectRelatedProduct(rel);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 relative">
                  <img
                    src={rel.imageUrl}
                    alt={rel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {rel.discountPercent > 0 && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      -{rel.discountPercent}%
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {rel.name}
                  </h4>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="font-black text-red-600 text-sm">
                      {formatVND(rel.price)}
                    </span>
                    {rel.originalPrice > rel.price && (
                      <span className="text-[11px] text-slate-400 line-through">
                        {formatVND(rel.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
