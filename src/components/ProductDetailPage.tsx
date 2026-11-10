import React, { useState, useEffect } from "react";
import { Product, ReviewItem } from "../data/products";
import { UserProfile, OrderRecord } from "../App";
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
  ChevronRight,
  Camera,
  Image,
  X,
  Filter
} from "lucide-react";

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onBuyNow: (product: Product, quantity?: number) => void;
  onBack: () => void;
  onSelectRelatedProduct: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isWishlisted?: boolean;
  currentUser?: UserProfile | null;
  userOrders?: OrderRecord[];
}

export default function ProductDetailPage({
  product,
  allProducts,
  onAddToCart,
  onBuyNow,
  onBack,
  onSelectRelatedProduct,
  onToggleWishlist,
  isWishlisted = false,
  currentUser,
  userOrders = []
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
  const [reviewImage, setReviewImage] = useState<string>("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Bộ lọc đánh giá theo số sao hoặc có ảnh
  const [reviewFilter, setReviewFilter] = useState<"all" | 5 | 4 | 3 | "has_photo">("all");

  // 1. Kiểm tra xem người dùng đã mua và nhận sách này trong đơn hàng chưa
  const userReceivedOrder = userOrders?.find(
    (ord) =>
      (ord.status === "Hoàn tất" || Boolean(ord.receivedAt)) &&
      ord.items.some((it) => it.product.id === product.id)
  );

  // 2. Kiểm tra xem người dùng đã từng gửi đánh giá cho sản phẩm này chưa
  const hasUserReviewed = reviews.some(
    (r) =>
      (currentUser && r.userId && r.userId === currentUser.id) ||
      (currentUser && r.author && r.author.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
  ) || Boolean(userReceivedOrder?.isReviewed);

  // Xử lý tải ảnh chụp trang sách thực tế từ máy tính
  const handleReviewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Vui lòng chọn ảnh có kích thước dưới 5MB!");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Xử lý bấm thích nhận xét (Hữu ích)
  const handleToggleLikeReview = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const isLiked = Boolean(r.userLiked);
          return {
            ...r,
            userLiked: !isLiked,
            likes: isLiked ? Math.max(0, (r.likes || 1) - 1) : (r.likes || 0) + 1,
          };
        }
        return r;
      })
    );
  };

  // Tính toán số sao trung bình thực tế từ danh sách nhận xét (nếu có 0 đánh giá thì trả về 0)
  const hasReviews = reviews.length > 0;
  const currentRating = hasReviews
    ? Number((reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1))
    : 0;

  // Lọc danh sách nhận xét theo tiêu chí
  const filteredReviewsList = reviews.filter((r) => {
    if (reviewFilter === "all") return true;
    if (reviewFilter === 5) return r.rating === 5;
    if (reviewFilter === 4) return r.rating === 4;
    if (reviewFilter === 3) return r.rating <= 3;
    if (reviewFilter === "has_photo") return Boolean(r.imageUrl);
    return true;
  });

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
    const authorName = currentUser?.name || reviewerName.trim();
    if (!authorName || !reviewContent.trim() || isSubmittingReview) return;

    setIsSubmittingReview(true);
    try {
      const res = await api.addProductReview(product.id, {
        author: authorName,
        rating: reviewRating,
        content: reviewContent.trim(),
        imageUrl: reviewImage || undefined,
        userId: currentUser?.id
      });

      if (res && res.data) {
        setReviews((prev) => [res.data, ...prev]);
      } else {
        const newRev: ReviewItem = {
          id: "rev-" + Date.now(),
          author: authorName,
          rating: reviewRating,
          date: "Vừa xong",
          content: reviewContent.trim(),
          verified: true,
          likes: 0,
          imageUrl: reviewImage || undefined,
          userId: currentUser?.id
        };
        setReviews((prev) => [newRev, ...prev]);
      }

      // Nếu người dùng có đơn hàng tương ứng, đánh dấu luôn đơn hàng là đã đánh giá
      if (userReceivedOrder) {
        api.updateOrderStatus(userReceivedOrder.id, "Hoàn tất", {
          isReviewed: true,
          reviewRating,
          reviewComment: reviewContent.trim(),
          reviewImage: reviewImage || undefined,
          reviewedAt: new Date().toLocaleDateString("vi-VN"),
        }).catch(console.error);
      }

      setReviewContent("");
      setReviewImage("");
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 5000);
    } catch (err) {
      console.error("Lỗi khi thêm đánh giá:", err);
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
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 shadow-xl shadow-slate-200/50 group">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Hiệu ứng gáy sách chiều sâu 3D */}
            <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/30 via-black/10 to-transparent pointer-events-none z-10" />

            {product.discountPercent > 0 && (
              <div className="absolute top-4 left-4 z-20 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-lg shadow-red-600/30 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Tiết kiệm {product.discountPercent}%</span>
              </div>
            )}
            <div className="absolute top-4 right-4 z-20 flex space-x-2">
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
              <div className="absolute inset-0 z-30 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-sm font-bold">
                Sách tạm hết hàng
              </div>
            )}
          </div>

          {/* Value Assurance Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-center space-y-1">
              <ShieldCheck className="w-5 h-5 text-blue-600 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">100% Sách Thật</p>
              <p className="text-[10px] text-slate-400">Chuẩn NXB 100%</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-center space-y-1">
              <RotateCcw className="w-5 h-5 text-emerald-600 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">Đổi Trả 7 Ngày</p>
              <p className="text-[10px] text-slate-400">Lỗi in ấn đổi ngay</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-center space-y-1">
              <Truck className="w-5 h-5 text-purple-600 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">Giao Toàn Quốc</p>
              <p className="text-[10px] text-slate-400">Đóng gói 3 lớp xốp</p>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Overview & Action Buttons */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
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
                  {product.inStock
                    ? product.stockQuantity && product.stockQuantity <= 5
                      ? `⚡ Chỉ còn ${product.stockQuantity} cuốn cuối cùng!`
                      : `Còn hàng (${product.stockQuantity || 25} cuốn)`
                    : "Tạm hết hàng"}
                </span>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Author & Publication Information */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100">
              <span className="flex items-center space-x-1">
                <span className="text-slate-400">Tác giả:</span>
                <span className="font-bold text-slate-900">{product.author || "Nhiều tác giả"}</span>
              </span>
              {product.publisher && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center space-x-1">
                    <span className="text-slate-400">NXB:</span>
                    <span className="font-semibold text-slate-800">{product.publisher}</span>
                  </span>
                </>
              )}
              {product.publicationYear && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center space-x-1">
                    <span className="text-slate-400">Năm XB:</span>
                    <span className="font-semibold text-slate-800">{product.publicationYear}</span>
                  </span>
                </>
              )}
              {product.pages && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center space-x-1">
                    <span className="text-slate-400">Số trang:</span>
                    <span className="font-semibold text-slate-800">{product.pages} trang</span>
                  </span>
                </>
              )}
            </div>

            {/* Star Ratings Summary */}
            <div className="flex items-center space-x-3 text-xs pb-2 border-b border-slate-100">
              {hasReviews ? (
                <div className="flex items-center space-x-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{currentRating}</span>
                </div>
              ) : (
                <span className="text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                  Chưa có đánh giá
                </span>
              )}
              <span className="text-slate-300">&bull;</span>
              <button
                onClick={() => setActiveTab("reviews")}
                className="text-blue-600 font-semibold hover:underline"
              >
                {hasReviews ? `${reviews.length} đánh giá thực tế` : "Viết đánh giá đầu tiên"}
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
                <span>Đặc quyền độc giả tại BookStore:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li>Tặng kèm Bookmark độc quyền &amp; hỗ trợ bọc sách plastic chống bám bẩn miễn phí.</li>
                <li>Cam kết 100% sách thật chuẩn Nhà Xuất Bản, bồi hoàn 200% nếu phát hiện sách lậu.</li>
                <li>Áp dụng mã voucher <strong className="text-blue-600 font-mono">BOOKWORM10</strong> hoặc <strong className="text-blue-600 font-mono">DEVOPS10</strong> giảm thêm 10% khi đặt hàng.</li>
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
            Thông Tin Tác Phẩm
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
              <h4 className="font-bold text-blue-900">Lý do bạn nên sở hữu cuốn sách này:</h4>
              <ul className="space-y-1.5 text-blue-800 list-disc list-inside">
                <li>Tác phẩm được xuất bản chính thức, bản quyền chuẩn, chất lượng giấy in cao cấp chống lóa mắt.</li>
                <li>Đóng gói 3 lớp chống sốc, bảo vệ mép bìa và gáy sách nguyên vẹn khi giao hàng.</li>
                <li>Được đông đảo độc giả và giới phê bình đánh giá cao về giá trị tri thức và cảm xúc nhân văn.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: THÔNG TIN CHI TIẾT TÁC PHẨM */}
        {activeTab === "specs" && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Bảng Thông Tin Chi Tiết Tác Phẩm
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
              {hasReviews ? (
                <div className="text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start space-x-2">
                    <span className="text-4xl font-black text-slate-900">{currentRating}</span>
                    <div className="space-y-1">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= Math.round(currentRating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400">Dựa trên {reviews.length} đánh giá thực tế</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start space-x-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-800">
                      Chưa có đánh giá nào
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Sản phẩm này hiện chưa có nhận xét từ độc giả. Hãy là người đầu tiên chia sẻ cảm nghĩ!
                  </p>
                </div>
              )}

              <div className="text-center shrink-0">
                <p className="text-xs font-bold text-slate-700 mb-1">
                  {hasReviews ? "Bạn đã trải nghiệm sản phẩm này?" : "Bạn đã đọc cuốn sách này?"}
                </p>
                <a
                  href="#write-review"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors inline-block"
                >
                  {hasReviews ? "Viết Đánh Giá Của Bạn" : "Viết Đánh Giá Đầu Tiên"}
                </a>
              </div>
            </div>

            {/* Reviews List & Filter Bar */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm">
                  Tất cả nhận xét ({reviews.length})
                </h4>

                {/* Thanh lọc nhận xét theo tiêu chí */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center">
                    <Filter className="w-3 h-3 mr-1" /> Lọc:
                  </span>
                  <button
                    type="button"
                    onClick={() => setReviewFilter("all")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      reviewFilter === "all"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewFilter(5)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      reviewFilter === 5
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    5 ⭐ ({reviews.filter((r) => r.rating === 5).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewFilter(4)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      reviewFilter === 4
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    4 ⭐ ({reviews.filter((r) => r.rating === 4).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewFilter(3)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      reviewFilter === 3
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    ≤ 3 ⭐ ({reviews.filter((r) => r.rating <= 3).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewFilter("has_photo")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center space-x-1 ${
                      reviewFilter === "has_photo"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Camera className="w-3 h-3" />
                    <span>Có ảnh ({reviews.filter((r) => Boolean(r.imageUrl)).length})</span>
                  </button>
                </div>
              </div>

              {!hasReviews ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-2">
                  <Star className="w-8 h-8 text-slate-200 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">Chưa có nhận xét nào</p>
                  <p className="max-w-sm mx-auto text-slate-500">
                    Hãy gửi đánh giá đầu tiên của bạn ở biểu mẫu bên dưới để giúp các độc giả khác có thêm thông tin tham khảo nhé!
                  </p>
                </div>
              ) : filteredReviewsList.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  Không có nhận xét nào phù hợp với bộ lọc đã chọn.
                </div>
              ) : (
                <div className="space-y-3">
                {filteredReviewsList.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs space-y-2.5 transition-shadow hover:shadow-xs"
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
                            <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] inline-flex items-center">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
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

                    {/* Hiển thị ảnh chụp sách thực tế nếu có */}
                    {rev.imageUrl && (
                      <div className="pt-1">
                        <img
                          src={rev.imageUrl}
                          alt="Ảnh thực tế từ độc giả"
                          className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(rev.imageUrl, "_blank")}
                        />
                        <p className="text-[10px] text-slate-400 mt-1 italic">
                          (Ảnh chụp sản phẩm thực tế từ người mua)
                        </p>
                      </div>
                    )}

                    {/* Nút bấm Hữu ích tương tác */}
                    <div className="flex items-center space-x-4 text-[11px] pt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleLikeReview(rev.id)}
                        className={`flex items-center space-x-1.5 transition-colors cursor-pointer px-2.5 py-1 rounded-lg border ${
                          rev.userLiked
                            ? "bg-blue-50 border-blue-200 text-blue-600 font-bold"
                            : "bg-white border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-50"
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${rev.userLiked ? "fill-blue-600" : ""}`} />
                        <span>Hữu ích ({rev.likes})</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>

            {/* Write a Review Form - Luôn mở form để độc giả có thể gửi đánh giá bất kỳ lúc nào */}
            <div id="write-review" className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Gửi Đánh Giá Của Bạn</span>
                </h4>
                {userReceivedOrder ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>✓ Đã mua và nhận hàng</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold border border-blue-200">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Đánh giá từ độc giả</span>
                  </span>
                )}
              </div>

              {/* Thông báo tình trạng xác thực */}
              {userReceivedOrder ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Bạn đã nhận cuốn sách này qua đơn hàng <strong>#{userReceivedOrder.id}</strong>. Nhận xét của bạn sẽ tự động được đồng bộ và gắn huy hiệu <strong>✓ Đã mua hàng tại BookStore</strong>!
                  </span>
                </div>
              ) : hasUserReviewed ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Bạn đã gửi nhận xét cho tác phẩm này. Bạn vẫn có thể tiếp tục chia sẻ thêm cảm nhận hoặc cập nhật phản hồi mới bên dưới!
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Chia sẻ cảm nhận chân thực của bạn về nội dung, chất lượng in ấn để cộng đồng bạn đọc BookStore cùng tham khảo!
                  </span>
                </div>
              )}

              {reviewSuccess && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Cảm ơn bạn! Đánh giá của bạn đã được đăng thành công.</span>
                </div>
              )}

              <form onSubmit={handleAddReview} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {currentUser ? (
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Người gửi đánh giá
                          </label>
                          <div className="flex items-center space-x-2.5 px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl">
                            <img
                              src={currentUser.avatarUrl || "/default-avatar.png"}
                              alt={currentUser.name}
                              className="w-6 h-6 rounded-full object-cover border border-slate-200"
                            />
                            <span className="font-bold text-slate-800 text-xs">{currentUser.name}</span>
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full ml-auto">
                              Tài khoản của bạn
                            </span>
                          </div>
                        </div>
                      ) : (
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
                      )}

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
                              className="p-1 hover:scale-110 transition-transform cursor-pointer"
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
                        placeholder="Chia sẻ cảm nhận về nội dung sách, chất lượng in ấn, tốc độ giao hàng..."
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Tải ảnh chụp thực tế */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Đính kèm ảnh chụp sách thực tế (Tùy chọn)
                      </label>
                      {reviewImage ? (
                        <div className="flex items-center space-x-3 p-2 bg-white rounded-xl border border-slate-200">
                          <img
                            src={reviewImage}
                            alt="Ảnh đính kèm"
                            className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                          />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-slate-800">Ảnh đã tải lên</p>
                            <p className="text-[10px] text-slate-400">Ảnh sẽ hiển thị cùng nhận xét của bạn</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReviewImage("")}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa ảnh"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer text-slate-700 font-semibold transition-colors">
                          <Camera className="w-4 h-4 text-blue-600" />
                          <span>Chọn ảnh từ máy tính (Dưới 5MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleReviewImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmittingReview ? "Đang gửi..." : "Gửi Nhận Xét"}</span>
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
                Tác Phẩm Cùng Thể Loại Độc Giả Cũng Yêu Thích
              </h3>
              <p className="text-xs text-slate-500">Khám phá thêm các tựa sách thuộc thể loại {product.category} đặc sắc khác</p>
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
                className="bg-white rounded-3xl border border-slate-200 p-3.5 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-50 relative shadow-inner">
                  <img
                    src={rel.imageUrl}
                    alt={rel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Hiệu ứng gáy sách 3D */}
                  <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 via-black/5 to-transparent pointer-events-none" />
                  {rel.discountPercent > 0 && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                      -{rel.discountPercent}%
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded block w-fit mb-1">
                    {rel.category}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                    {rel.name}
                  </h4>
                  {rel.author && (
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      Tác giả: <span className="text-slate-700">{rel.author}</span>
                    </p>
                  )}
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
