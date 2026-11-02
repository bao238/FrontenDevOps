import React from "react";
import {
  Heart,
  X,
  ShoppingCart,
  Trash2,
  BookOpen,
  ArrowRight,
  Star
} from "lucide-react";
import { Product } from "../data/products";

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onRemoveFromWishlist: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export default function WishlistModal({
  isOpen,
  onClose,
  wishlist,
  onRemoveFromWishlist,
  onAddToCart,
  onSelectProduct
}: WishlistModalProps) {
  if (!isOpen) return null;

  // Định dạng hiển thị tiền VNĐ
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8 max-h-[85vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Heart className="w-6 h-6 fill-rose-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Danh Sách Sách Yêu Thích ({wishlist.length})
              </h3>
              <p className="text-xs text-slate-400">
                Các tác phẩm bạn đã lưu để đọc và mua sau
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung danh sách */}
        <div className="mt-4 overflow-y-auto flex-1 pr-1 space-y-3">
          {wishlist.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">
                Chưa có cuốn sách yêu thích nào
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Bấm vào biểu tượng trái tim trên bất kỳ cuốn sách nào để lưu lại tác phẩm bạn quan tâm.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold inline-flex items-center space-x-2 shadow-md shadow-rose-500/20 transition-all"
              >
                <span>Khám phá sách hay ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            wishlist.map((book) => (
              <div
                key={book.id}
                className="p-3.5 sm:p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div
                  onClick={() => {
                    onSelectProduct(book);
                    onClose();
                  }}
                  className="flex items-center space-x-3.5 cursor-pointer flex-1"
                >
                  <img
                    src={book.imageUrl}
                    alt={book.name}
                    className="w-14 h-20 object-cover rounded-xl shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {book.category}
                    </span>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm mt-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {book.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">{book.author || "Tác giả"}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <strong className="text-blue-600 font-bold text-xs sm:text-sm">
                        {formatVND(book.price)}
                      </strong>
                      {book.originalPrice > book.price && (
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatVND(book.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                  <button
                    onClick={() => onAddToCart(book)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Thêm Giỏ</span>
                  </button>
                  <button
                    onClick={() => onRemoveFromWishlist(book.id)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Xóa khỏi yêu thích"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {wishlist.length > 0 && (
          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-400">
              Đang lưu trữ {wishlist.length} cuốn sách
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
