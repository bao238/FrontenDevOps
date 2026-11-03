import React, { useState, useEffect, useMemo } from "react";
// Import createPortal để đưa modal ra khỏi container space-y, bao phủ toàn vẹn màn hình
import { createPortal } from "react-dom";
import {
  Folder,
  Plus,
  Edit3,
  Trash2,
  Search,
  RotateCcw,
  BookOpen,
  TrendingUp,
  Sparkles,
  Laptop,
  Compass,
  Heart,
  Layers,
  Save,
  X,
  AlertCircle,
  Tag
} from "lucide-react";
import { api, CategoryItem } from "../../services/api";

const ICON_OPTIONS = [
  { label: "Sách mở (BookOpen)", value: "BookOpen" },
  { label: "Kinh tế / Phát triển (TrendingUp)", value: "TrendingUp" },
  { label: "Tỏa sáng / Kỹ năng (Sparkles)", value: "Sparkles" },
  { label: "Công nghệ / Máy tính (Laptop)", value: "Laptop" },
  { label: "La bàn / Khoa học (Compass)", value: "Compass" },
  { label: "Trái tim / Thiếu nhi (Heart)", value: "Heart" }
];

export default function CategoriesTab() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("BookOpen");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Modal Delete
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);

  // Tải danh sách thể loại từ MongoDB
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("❌ Lỗi tải danh mục thể loại:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Mở modal tạo mới
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setIcon("BookOpen");
    setDisplayOrder(categories.length + 1);
    setIsActive(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setIcon(cat.icon || "BookOpen");
    setDisplayOrder(cat.displayOrder || 1);
    setIsActive(cat.isActive);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Lưu thể loại sách
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError("Tên thể loại sách không được để trống");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    const payload: Partial<CategoryItem> = {
      name: name.trim(),
      description: description.trim(),
      icon,
      displayOrder: Number(displayOrder) || 1,
      isActive
    };

    try {
      if (editingCategory && editingCategory._id) {
        const res = await api.updateCategory(editingCategory._id, payload);
        if (res && res.error) {
          setModalError(res.error);
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await api.createCategory(payload);
        if (res && res.error) {
          setModalError(res.error);
          setIsSubmitting(false);
          return;
        }
      }
      setIsModalOpen(false);
      await fetchCategories();
    } catch (err: any) {
      setModalError(err.message || "Lỗi khi lưu thể loại sách");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xác nhận xóa thể loại sách
  const handleConfirmDelete = async () => {
    if (!deletingCategory || !deletingCategory._id) return;
    try {
      const res = await api.deleteCategory(deletingCategory._id);
      if (res && res.error) {
        alert(res.error);
        return;
      }
      setCategories((prev) => prev.filter((c) => c._id !== deletingCategory._id));
      setDeletingCategory(null);
    } catch (err: any) {
      alert("Lỗi khi xóa thể loại: " + err.message);
    }
  };

  // Lọc theo từ khóa
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });
  }, [categories, searchQuery]);

  // Hàm hiển thị icon theo tên
  const renderCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case "TrendingUp":
        return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case "Sparkles":
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case "Laptop":
        return <Laptop className="w-5 h-5 text-blue-600" />;
      case "Compass":
        return <Compass className="w-5 h-5 text-indigo-600" />;
      case "Heart":
        return <Heart className="w-5 h-5 text-rose-500" />;
      default:
        return <BookOpen className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Công cụ */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <Folder className="w-5 h-5 text-indigo-600" />
            <span>Quản Lý Thể Loại Sách (Categories)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Định nghĩa các chuyên mục sách lưu trong MongoDB, tự động hiển thị ra bộ lọc trang chủ
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchCategories}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Làm mới từ MongoDB"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Thể Loại Sách</span>
          </button>
        </div>
      </div>

      {/* Tìm kiếm */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên thể loại hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Tổng số: <strong className="text-indigo-600 font-bold">{categories.length} thể loại</strong>
        </span>
      </div>

      {/* Grid danh mục thể loại */}
      {isLoading && categories.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <RotateCcw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Đang tải danh mục từ MongoDB...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Chưa có thể loại nào</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Không tìm thấy thể loại nào phù hợp. Bấm "Thêm Thể Loại Sách" để tạo danh mục đầu tiên.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat._id || cat.slug}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    {renderCategoryIcon(cat.icon)}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Chỉnh sửa thể loại"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingCategory(cat)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Xóa thể loại"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-800">{cat.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {cat.description || "Chưa có mô tả cho thể loại này."}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  📚 {cat.bookCount ?? 0} cuốn sách
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Thứ tự: #{cat.displayOrder ?? 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL THÊM / SỬA THỂ LOẠI (Render qua createPortal vào body) */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Folder className="w-5 h-5 text-indigo-600" />
                <span>{editingCategory ? "Chỉnh Sửa Thể Loại" : "Thêm Thể Loại Sách Mới"}</span>
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
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên thể loại sách <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tâm Lý Học - Triết Học"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Biểu tượng đại diện (Icon)
                </label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  min="1"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mô tả chi tiết thể loại
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả tóm tắt về loại sách này..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? "Đang lưu..." : "Lưu Thể Loại"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL XÁC NHẬN XÓA (Render qua createPortal vào body) */}
      {deletingCategory && createPortal(
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/70 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in-95 my-auto">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Xóa Thể Loại Sách?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa thể loại <strong>"{deletingCategory.name}"</strong>?
                {deletingCategory.bookCount && deletingCategory.bookCount > 0 ? (
                  <span className="block mt-2 text-red-500 font-bold">
                    ⚠️ Cảnh báo: Hiện đang có {deletingCategory.bookCount} cuốn sách thuộc thể loại này!
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
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
