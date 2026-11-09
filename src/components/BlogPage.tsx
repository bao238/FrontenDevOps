import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  Eye,
  Heart,
  Share2,
  ArrowRight,
  Search,
  Tag,
  User,
  X,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { BlogPost, BLOG_POSTS } from "../data/blogPosts";
import { Product } from "../data/products";

interface BlogPageProps {
  products: Product[];
  onSelectBook: (product: Product) => void;
  onContinueShopping: () => void;
}

const BLOG_CATEGORIES = [
  "Tất cả",
  "Điểm Sách Bestseller",
  "Phương Pháp Đọc",
  "Công Nghệ & DevOps",
  "Thiếu Nhi & Giáo Dục"
];

export default function BlogPage({
  products,
  onSelectBook,
  onContinueShopping
}: BlogPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [readingPost, setReadingPost] = useState<BlogPost | null>(null);
  const [likedPosts, setLikedPosts] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("bookstore_liked_blogs") || "[]");
    } catch {
      return [];
    }
  });

  // Xử lý bấm like bài viết
  const handleToggleLike = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    setLikedPosts((prev) => {
      const isLiked = prev.includes(postId);
      const next = isLiked ? prev.filter((id) => id !== postId) : [...prev, postId];
      try {
        localStorage.setItem("bookstore_liked_blogs", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Lọc bài viết theo danh mục và từ khóa tìm kiếm
  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchCat =
        selectedCategory === "Tất cả" || post.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.author.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Hero Banner Chuyên Mục Góc Đọc Sách */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/80">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Góc Đọc Sách &amp; Cẩm Nang Văn Học BookStore</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Khơi Nguồn Cảm Hứng &bull; Nuôi Dưỡng Tri Thức
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Nơi hội tụ những bài viết phê bình văn học sâu sắc, cẩm nang phương pháp đọc sách hiệu quả, và góc công nghệ dành riêng cho bạn đọc đam mê khám phá thế giới tri thức.
          </p>
        </div>

        {/* Họa tiết trang trí nền */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center text-9xl">
          📖
        </div>
      </div>

      {/* 2. Thanh lọc chuyên mục & Tìm kiếm bài viết */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>{cat}</span>
              {cat === "Tất cả" ? (
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-black">
                  {BLOG_POSTS.length}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm bài viết, tác giả, chủ đề..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* 3. Lưới hiển thị các bài viết Blog */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Chưa tìm thấy bài viết phù hợp</h3>
          <p className="text-xs text-slate-500 mt-1">
            Không có bài viết nào khớp với từ khóa &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Tất cả");
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Xem tất cả bài viết
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.map((post) => {
            const isLiked = likedPosts.includes(post.id);
            const totalLikes = post.likes + (isLiked ? 1 : 0);

            return (
              <article
                key={post.id}
                onClick={() => setReadingPost(post)}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer hover:-translate-y-1"
              >
                {/* Ảnh bài viết */}
                <div className="relative h-56 overflow-hidden bg-slate-100">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20">
                    {post.category}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleToggleLike(e, post.id)}
                    className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all ${
                      isLiked
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/40"
                        : "bg-white/80 hover:bg-white text-slate-700"
                    }`}
                    title={isLiked ? "Bỏ thích" : "Yêu thích bài viết"}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-white" : ""}`} />
                  </button>
                </div>

                {/* Nội dung bài viết */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    {/* Meta info: Ngày đăng & Thời gian đọc */}
                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{post.date}</span>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{post.readTime}</span>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center space-x-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>{post.views} lượt xem</span>
                      </span>
                    </div>

                    <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Chân thẻ: Tác giả & Nút đọc tiếp */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                        {post.author[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{post.author}</p>
                        <p className="text-[10px] text-slate-400">{post.authorRole}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                      <span>Đọc tiếp</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 4. MODAL ĐỌC TOÀN VĂN BÀI VIẾT (FULL ARTICLE READER MODAL) */}
      {readingPost && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-full font-bold">
                  {readingPost.category}
                </span>
                <span className="text-xs text-slate-400">{readingPost.readTime}</span>
              </div>
              <button
                type="button"
                onClick={() => setReadingPost(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable Article */}
            <div className="p-6 sm:p-10 overflow-y-auto space-y-6">
              {/* Tiêu đề & Tác giả */}
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {readingPost.title}
                </h1>
                <div className="flex items-center space-x-3 text-xs text-slate-500 pb-4 border-b border-slate-100">
                  <span className="font-bold text-slate-800">{readingPost.author}</span>
                  <span>&bull;</span>
                  <span>{readingPost.date}</span>
                  <span>&bull;</span>
                  <span>{readingPost.views} lượt xem</span>
                </div>
              </div>

              {/* Ảnh bìa lớn */}
              <div className="rounded-2xl overflow-hidden shadow-md">
                <img
                  src={readingPost.imageUrl}
                  alt={readingPost.title}
                  className="w-full max-h-80 object-cover"
                />
              </div>

              {/* Trích dẫn nổi bật */}
              {readingPost.quote && (
                <div className="border-l-4 border-indigo-600 bg-indigo-50/70 p-4 rounded-r-2xl italic text-sm text-indigo-950 font-medium">
                  &ldquo;{readingPost.quote}&rdquo;
                </div>
              )}

              {/* Các đoạn nội dung chi tiết */}
              <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
                {readingPost.content.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {/* Tags bài viết */}
              <div className="flex flex-wrap items-center gap-1.5 pt-4 border-t border-slate-100 text-xs">
                <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
                {readingPost.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* KHỐI SÁCH ĐƯỢC GIỚI THIỆU TRONG BÀI VIẾT (RELATED BOOKS) */}
              {readingPost.relatedBookIds && readingPost.relatedBookIds.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-200 space-y-4 bg-slate-50 p-5 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-black text-sm text-slate-900 uppercase">
                      Tác Phẩm Được Nhắc Tới Trong Bài Viết Này
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {readingPost.relatedBookIds.map((bookId) => {
                      const book = products.find((p) => p.id === bookId);
                      if (!book) return null;
                      return (
                        <div
                          key={book.id}
                          className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2 hover:border-indigo-300 transition-colors"
                        >
                          <div className="flex items-center space-x-2.5">
                            <img
                              src={book.imageUrl}
                              alt={book.name}
                              className="w-10 h-14 object-cover rounded shadow-xs shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-slate-900 truncate">
                                {book.name}
                              </p>
                              <p className="text-[11px] font-bold text-red-600">
                                {book.price.toLocaleString("vi-VN")} đ
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setReadingPost(null);
                              onSelectBook(book);
                            }}
                            className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <span>Xem Sách</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Cảm ơn bạn đã đọc bài viết từ BookStore!
              </span>
              <button
                type="button"
                onClick={() => setReadingPost(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Đóng bài viết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
