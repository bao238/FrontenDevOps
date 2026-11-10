import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Giao diện thuộc tính của thanh điều hướng phân trang trong Admin
 */
export interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

/**
 * Component phân trang chuẩn cho tất cả các bảng quản trị nội bộ BookStore
 * Đảm bảo hiển thị chuẩn 10 mục / trang theo đúng yêu cầu đề bài
 */
export default function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  itemLabel,
  onPageChange,
  onPerPageChange,
}: AdminPaginationProps) {
  // Tính chỉ số đầu và cuối của danh sách mục đang hiển thị trên trang hiện tại
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
      <div className="flex flex-wrap items-center gap-2">
        <span>
          Hiển thị{" "}
          <strong className="text-slate-900 font-bold">
            {startItem} - {endItem}
          </strong>{" "}
          trên tổng số{" "}
          <strong className="text-slate-900 font-bold">{totalItems}</strong>{" "}
          {itemLabel}
        </span>
        {onPerPageChange && (
          <>
            <span className="text-slate-300 hidden sm:inline">&bull;</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400">Xem mỗi trang:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => onPerPageChange(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
              >
                <option value={10}>10 {itemLabel} / trang</option>
                <option value={20}>20 {itemLabel} / trang</option>
                <option value={50}>50 {itemLabel} / trang</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Cụm nút bấm chuyển trang (Chỉ hiển thị khi có từ 2 trang trở lên) */}
      {totalPages > 1 && (
        <div className="flex items-center space-x-1.5">
          {/* Nút Quay lại trang trước */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border transition-all ${
              currentPage === 1
                ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 shadow-xs cursor-pointer"
            }`}
            title="Trang trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Trước</span>
          </button>

          {/* Danh sách số trang */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                      : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {page}
                </button>
              );
            }
            if (
              (page === currentPage - 2 && page > 1) ||
              (page === currentPage + 2 && page < totalPages)
            ) {
              return (
                <span key={page} className="px-1 text-slate-400">
                  &hellip;
                </span>
              );
            }
            return null;
          })}

          {/* Nút Chuyển sang trang sau */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border transition-all ${
              currentPage === totalPages
                ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 shadow-xs cursor-pointer"
            }`}
            title="Trang sau"
          >
            <span>Sau</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
