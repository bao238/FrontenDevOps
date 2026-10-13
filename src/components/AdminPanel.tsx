import React, { useState, useMemo, useEffect } from "react";
import { Product, CATEGORIES, ReviewItem } from "../data/products";
import { UserAccount } from "../data/users";
import { api } from "../services/api";
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  RotateCcw,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Tag,
  Eye,
  SlidersHorizontal,
  Layers,
  ArrowLeft,
  ExternalLink,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  LogOut,
  Users,
  UserCheck,
  UserX,
  Shield,
  Lock,
  Unlock,
  Key,
  UserPlus,
  Mail,
  ShieldAlert,
  User,
  Star,
  MessageSquare,
  ThumbsUp
} from "lucide-react";

interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderRecord {
  id: string;
  date: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: string;
  status: "Đang xử lý" | "Đang giao" | "Hoàn tất" | "Đã hủy";
  customerInfo: {
    fullName: string;
    phone: string;
    address: string;
  };
}

interface AdminPanelProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onResetDefaultProducts: () => void;
  orders: OrderRecord[];
  onUpdateOrderStatus: (orderId: string, newStatus: "Đang xử lý" | "Đang giao" | "Hoàn tất" | "Đã hủy") => void;
  onDeleteOrder: (orderId: string) => void;
  onSwitchToStore: () => void;
  onAdminLogout?: () => void;
  users?: UserAccount[];
  onAddUser?: (user: UserAccount) => void;
  onUpdateUser?: (user: UserAccount) => void;
  onDeleteUser?: (userId: string) => void;
  onToggleLockUser?: (userId: string) => void;
  onResetDefaultUsers?: () => void;
}

const SAMPLE_IMAGES = [
  { label: "Laptop", url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80" },
  { label: "iPhone", url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80" },
  { label: "Tai nghe", url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80" },
  { label: "Bàn phím", url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80" },
  { label: "Đồng hồ", url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80" },
  { label: "Màn hình", url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80" },
];

export default function AdminPanel({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onResetDefaultProducts,
  orders,
  onUpdateOrderStatus,
  onDeleteOrder,
  onSwitchToStore,
  onAdminLogout,
  users = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToggleLockUser,
  onResetDefaultUsers,
}: AdminPanelProps) {
  const [adminTab, setAdminTab] = useState<"products" | "orders" | "users" | "reviews">("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  // Reviews Management State (MongoDB)
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | "all">("all");
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Tải danh sách đánh giá từ MongoDB
  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const data = await api.getAllReviews();
      setReviewsList(data);
    } catch (err) {
      console.error("Lỗi khi tải đánh giá từ MongoDB:", err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Xóa đánh giá trên MongoDB
  const handleDeleteReview = async (reviewId: string) => {
    try {
      await api.deleteReview(reviewId);
      setReviewsList((prev) => prev.filter((r) => r.id !== reviewId));
      setDeletingReviewId(null);
    } catch (err) {
      console.error("Lỗi khi xóa đánh giá:", err);
    }
  };

  // Lọc đánh giá
  const filteredReviews = useMemo(() => {
    return reviewsList.filter((rev) => {
      const q = reviewSearchQuery.toLowerCase();
      const matchSearch =
        rev.author.toLowerCase().includes(q) ||
        rev.content.toLowerCase().includes(q) ||
        (rev.productId && rev.productId.toLowerCase().includes(q));
      const matchRating = reviewRatingFilter === "all" || rev.rating === reviewRatingFilter;
      return matchSearch && matchRating;
    });
  }, [reviewsList, reviewSearchQuery, reviewRatingFilter]);

  // Thống kê đánh giá
  const reviewStats = useMemo(() => {
    const total = reviewsList.length;
    const fiveStar = reviewsList.filter((r) => r.rating === 5).length;
    const avg =
      total > 0
        ? (reviewsList.reduce((acc, cur) => acc + (cur.rating || 5), 0) / total).toFixed(1)
        : "5.0";
    return { total, fiveStar, avg };
  }, [reviewsList]);

  // User Management State
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "admin" | "staff" | "customer">("all");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "locked">("all");

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userFormName, setUserFormName] = useState("");
  const [userFormEmail, setUserFormEmail] = useState("");
  const [userFormPhone, setUserFormPhone] = useState("");
  const [userFormPassword, setUserFormPassword] = useState("");
  const [userFormRole, setUserFormRole] = useState<"admin" | "staff" | "customer">("customer");
  const [userFormStatus, setUserFormStatus] = useState<"active" | "locked">("active");
  const [userFormAddress, setUserFormAddress] = useState("");
  const [userFormAvatar, setUserFormAvatar] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Điện thoại");
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number>(0);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formInStock, setFormInStock] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formSpecs, setFormSpecs] = useState<{ [key: string]: string }>({
    "Bảo hành": "12 tháng chính hãng",
    "Tình trạng": "Mới 100% nguyên seal",
  });
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecVal, setNewSpecVal] = useState("");

  // Delete Confirmation State
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Format VND
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Filtered Products for Admin Table
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCat =
        selectedCategory === "Tất cả" || item.category === selectedCategory;
      const matchQuery =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Statistics
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== "Đã hủy")
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  const inStockCount = products.filter((p) => p.inStock).length;
  const outOfStockCount = products.filter((p) => !p.inStock).length;

  // Filtered Users for Admin Table
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.address && u.address.toLowerCase().includes(q));
      const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
      const matchStatus = userStatusFilter === "all" || u.status === userStatusFilter;
      return matchQuery && matchRole && matchStatus;
    });
  }, [users, userSearchQuery, userRoleFilter, userStatusFilter]);

  const userStats = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter((u) => u.role === "admin").length;
    const staffCount = users.filter((u) => u.role === "staff").length;
    const customerCount = users.filter((u) => u.role === "customer").length;
    const lockedCount = users.filter((u) => u.status === "locked").length;
    return { total, adminCount, staffCount, customerCount, lockedCount };
  }, [users]);

  // Open Create User Modal
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserFormName("");
    setUserFormEmail("");
    setUserFormPhone("");
    setUserFormPassword("123456");
    setUserFormRole("customer");
    setUserFormStatus("active");
    setUserFormAddress("");
    setUserFormAvatar("/images/default-avatar.png");
    setIsUserModalOpen(true);
  };

  // Open Edit User Modal
  const handleOpenEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setUserFormName(user.name);
    setUserFormEmail(user.email);
    setUserFormPhone(user.phone);
    setUserFormPassword(user.password || "");
    setUserFormRole(user.role);
    setUserFormStatus(user.status);
    setUserFormAddress(user.address || "");
    setUserFormAvatar(user.avatarUrl || "/images/default-avatar.png");
    setIsUserModalOpen(true);
  };

  // Submit User Form (Create or Edit)
  const handleSubmitUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = userFormName.trim();
    const cleanEmail = userFormEmail.trim();
    const cleanPhone = userFormPhone.trim();
    let cleanAvatar = userFormAvatar.trim();
    if (!cleanAvatar) {
      cleanAvatar = "/images/default-avatar.png";
    }

    if (!cleanName) {
      alert("Vui lòng nhập Họ và tên!");
      return;
    }
    if (!cleanEmail) {
      alert("Vui lòng nhập Email đăng nhập!");
      return;
    }

    // 1. Kiểm tra Số điện thoại bắt buộc và đúng 10 số
    const phoneRegex = /^0\d{9}$/;
    if (!cleanPhone) {
      alert("Số điện thoại là bắt buộc, vui lòng nhập đủ 10 số!");
      return;
    }
    if (!phoneRegex.test(cleanPhone)) {
      alert("Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 chữ số bắt đầu bằng số 0 (Ví dụ: 0905123456).");
      return;
    }

    // 2. Kiểm tra trùng Email
    const isEmailDuplicate = users.some(
      (u) => u.email.toLowerCase() === cleanEmail.toLowerCase() && (!editingUser || u.id !== editingUser.id)
    );
    if (isEmailDuplicate) {
      alert(`Email "${cleanEmail}" đã tồn tại trong hệ thống! Vui lòng chọn email khác.`);
      return;
    }

    // 3. Kiểm tra trùng Tên người dùng
    const isNameDuplicate = users.some(
      (u) => u.name.trim().toLowerCase() === cleanName.toLowerCase() && (!editingUser || u.id !== editingUser.id)
    );
    if (isNameDuplicate) {
      alert(`Tên người dùng "${cleanName}" đã tồn tại trong hệ thống! Vui lòng nhập tên khác.`);
      return;
    }

    if (editingUser) {
      if (onUpdateUser) {
        onUpdateUser({
          ...editingUser,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          password: userFormPassword.trim() || editingUser.password,
          role: userFormRole,
          status: userFormStatus,
          address: userFormAddress.trim(),
          avatarUrl: cleanAvatar,
        });
      }
    } else {
      if (onAddUser) {
        onAddUser({
          id: "usr-" + Date.now(),
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          password: userFormPassword.trim() || "123456",
          role: userFormRole,
          status: userFormStatus,
          address: userFormAddress.trim(),
          avatarUrl: cleanAvatar,
          createdAt: new Date().toLocaleDateString("vi-VN"),
        });
      }
    }
    setIsUserModalOpen(false);
  };

  // Confirm Delete User
  const handleConfirmDeleteUser = () => {
    if (deletingUserId && onDeleteUser) {
      onDeleteUser(deletingUserId);
      setDeletingUserId(null);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategory("Điện thoại");
    setFormPrice(10000000);
    setFormOriginalPrice(12000000);
    setFormImageUrl(SAMPLE_IMAGES[0].url);
    setFormDescription("Sản phẩm công nghệ chính hãng mới nhất tại DinhBao Store.");
    setFormInStock(true);
    setFormFeatured(false);
    setFormSpecs({
      "Bảo hành": "12 tháng chính hãng",
      "Tình trạng": "Mới 100% nguyên seal",
    });
    setNewSpecKey("");
    setNewSpecVal("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormPrice(product.price);
    setFormOriginalPrice(product.originalPrice || product.price);
    setFormImageUrl(product.imageUrl);
    setFormDescription(product.description);
    setFormInStock(product.inStock);
    setFormFeatured(Boolean(product.featured));
    setFormSpecs(product.specs || {});
    setNewSpecKey("");
    setNewSpecVal("");
    setIsModalOpen(true);
  };

  // Save Add/Edit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formPrice <= 0) {
      alert("Vui lòng nhập tên sản phẩm và giá hợp lệ!");
      return;
    }

    const discountPercent =
      formOriginalPrice > formPrice
        ? Math.round(((formOriginalPrice - formPrice) / formOriginalPrice) * 100)
        : 0;

    if (editingProduct) {
      // Update
      const updated: Product = {
        ...editingProduct,
        name: formName.trim(),
        category: formCategory,
        price: formPrice,
        originalPrice: formOriginalPrice,
        discountPercent,
        imageUrl: formImageUrl || SAMPLE_IMAGES[0].url,
        description: formDescription,
        inStock: formInStock,
        featured: formFeatured,
        specs: formSpecs,
      };
      onUpdateProduct(updated);
    } else {
      // Create
      const newProduct: Product = {
        id: "prod-" + Date.now(),
        name: formName.trim(),
        category: formCategory,
        price: formPrice,
        originalPrice: formOriginalPrice,
        discountPercent,
        rating: 5.0,
        reviewsCount: 1,
        imageUrl: formImageUrl || SAMPLE_IMAGES[0].url,
        description: formDescription,
        inStock: formInStock,
        featured: formFeatured,
        specs: formSpecs,
      };
      onAddProduct(newProduct);
    }

    setIsModalOpen(false);
  };

  // Add Specification row
  const handleAddSpec = () => {
    if (!newSpecKey.trim() || !newSpecVal.trim()) return;
    setFormSpecs((prev) => ({
      ...prev,
      [newSpecKey.trim()]: newSpecVal.trim(),
    }));
    setNewSpecKey("");
    setNewSpecVal("");
  };

  // Remove Specification row
  const handleRemoveSpec = (keyToRemove: string) => {
    setFormSpecs((prev) => {
      const copy = { ...prev };
      delete copy[keyToRemove];
      return copy;
    });
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (deletingProductId) {
      onDeleteProduct(deletingProductId);
      setDeletingProductId(null);
    }
  };

  // Quick toggle in-stock
  const handleToggleStock = (product: Product) => {
    onUpdateProduct({
      ...product,
      inStock: !product.inStock,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner & Return to Storefront */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-blue-400 bg-blue-950/80 px-3 py-1 rounded-full border border-blue-800 mb-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Hệ Thống Quản Trị Cửa Hàng (Admin Panel)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Quản Lý Sản Phẩm &amp; Đơn Hàng DinhBao
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            CRUD sản phẩm, thay đổi trạng thái tồn kho, xử lý đơn hàng và lưu dữ liệu trên MongoDB.
          </p>
        </div>

        <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-2xl text-xs text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Hệ thống hoạt động bình thường</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng sản phẩm</p>
            <h3 className="text-2xl font-black text-slate-900">{products.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Đang còn hàng</p>
            <h3 className="text-2xl font-black text-emerald-600">{inStockCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tạm hết hàng</p>
            <h3 className="text-2xl font-black text-red-600">{outOfStockCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Doanh thu đơn</p>
            <h3 className="text-lg sm:text-xl font-black text-purple-600 truncate">
              {formatVND(totalRevenue)}
            </h3>
          </div>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setAdminTab("products")}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center space-x-2 ${
              adminTab === "products"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Quản Lý Sản Phẩm ({products.length})</span>
          </button>
          <button
            onClick={() => setAdminTab("orders")}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center space-x-2 ${
              adminTab === "orders"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Đơn Hàng Khách Đặt ({orders.length})</span>
          </button>
          <button
            onClick={() => setAdminTab("users")}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center space-x-2 ${
              adminTab === "users"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quản Lý Người Dùng ({users.length})</span>
          </button>
          <button
            onClick={() => setAdminTab("reviews")}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center space-x-2 ${
              adminTab === "reviews"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Quản Lý Đánh Giá ({reviewsList.length})</span>
          </button>
        </div>

        {adminTab === "products" && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (window.confirm("Bạn có chắc muốn khôi phục về danh sách sản phẩm mẫu ban đầu không?")) {
                  onResetDefaultProducts();
                }
              }}
              className="text-xs text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-red-50 flex items-center space-x-1 transition-colors"
              title="Khôi phục dữ liệu gốc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Khôi phục mặc định</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Sản Phẩm</span>
            </button>
          </div>
        )}

        {adminTab === "users" && (
          <div className="flex items-center space-x-2">
            {onResetDefaultUsers && (
              <button
                onClick={() => {
                  if (window.confirm("Bạn có chắc muốn khôi phục về danh sách tài khoản người dùng mặc định ban đầu không?")) {
                    onResetDefaultUsers();
                  }
                }}
                className="text-xs text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-red-50 flex items-center space-x-1 transition-colors"
                title="Khôi phục tài khoản mặc định"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Khôi phục mặc định</span>
              </button>
            )}
            <button
              onClick={handleOpenCreateUser}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm Người Dùng</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: PRODUCT CRUD TABLE */}
      {adminTab === "products" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm sản phẩm theo tên, danh mục, ID..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <span className="text-xs text-slate-500 font-medium">Danh mục:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ảnh &amp; Tên sản phẩm</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4">Giá bán</th>
                  <th className="py-3 px-4">Giá gốc</th>
                  <th className="py-3 px-4 text-center">Trạng thái kho</th>
                  <th className="py-3 px-4 text-right">Thao tác (CRUD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Không tìm thấy sản phẩm nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold text-slate-900 truncate">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {p.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-bold text-red-600">
                        {formatVND(p.price)}
                      </td>

                      {/* Original Price */}
                      <td className="py-3 px-4 text-slate-400 line-through">
                        {formatVND(p.originalPrice)}
                      </td>

                      {/* In Stock toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStock(p)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                            p.inStock
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                          title="Bấm để chuyển trạng thái Còn/Hết"
                        >
                          {p.inStock ? "Còn hàng" : "Hết hàng"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa sản phẩm"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProductId(p.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS MANAGEMENT */}
      {adminTab === "orders" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Danh Sách Đơn Hàng Đã Đặt ({orders.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">Dữ liệu lưu tự động MongoDB Container</span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <ShoppingBag className="w-12 h-12 stroke-1 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600 text-sm">Chưa có đơn hàng nào</p>
              <p className="text-xs text-slate-400">
                Khi khách hàng đặt hàng ở trang Cửa Hàng, đơn hàng sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold font-mono text-blue-600 text-sm">
                        #{ord.id}
                      </span>
                      <span className="text-slate-500 text-xs">
                        Ngày đặt: {ord.date}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 font-medium">Trạng thái:</span>
                      <select
                        value={ord.status}
                        onChange={(e) =>
                          onUpdateOrderStatus(
                            ord.id,
                            e.target.value as "Đang xử lý" | "Đang giao" | "Hoàn tất" | "Đã hủy"
                          )
                        }
                        className={`font-bold px-2.5 py-1 rounded-lg border text-xs focus:outline-none cursor-pointer ${
                          ord.status === "Hoàn tất"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : ord.status === "Đang giao"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : ord.status === "Đã hủy"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}
                      >
                        <option value="Đang xử lý">Đang xử lý</option>
                        <option value="Đang giao">Đang giao</option>
                        <option value="Hoàn tất">Hoàn tất</option>
                        <option value="Đã hủy">Đã hủy</option>
                      </select>

                      <button
                        onClick={() => {
                          if (window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) {
                            onDeleteOrder(ord.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors ml-2"
                        title="Xóa đơn hàng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Khách hàng:</span>
                      <strong className="text-slate-800 font-bold">{ord.customerInfo.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Số điện thoại:</span>
                      <strong className="text-slate-800 font-bold">{ord.customerInfo.phone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Địa chỉ giao:</span>
                      <span className="text-slate-700">{ord.customerInfo.address}</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-slate-200/50">
                    {ord.items.map((it) => (
                      <div key={it.product.id} className="py-2 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <img
                            src={it.product.imageUrl}
                            alt={it.product.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <span className="text-slate-800 font-medium">
                            {it.product.name} <strong className="text-blue-600">x{it.quantity}</strong>
                          </span>
                        </div>
                        <span className="font-semibold text-slate-800">
                          {formatVND(it.product.price * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total & Payment method */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
                    <span className="text-slate-500">
                      Hình thức: <strong className="text-slate-800 uppercase">{ord.paymentMethod}</strong>
                    </span>
                    <div className="text-right">
                      <span className="text-slate-500 mr-2">Tổng thanh toán:</span>
                      <span className="font-extrabold text-red-600 text-sm">
                        {formatVND(ord.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT (QUẢN LÝ NGƯỜI DÙNG) */}
      {adminTab === "users" && (
        <div className="space-y-6">
          {/* User Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Tổng người dùng</p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">{userStats.total}</h3>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Quản trị & Nhân viên</p>
                <h3 className="text-xl sm:text-2xl font-black text-purple-600">
                  {userStats.adminCount + userStats.staffCount}
                </h3>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Khách hàng</p>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-600">{userStats.customerCount}</h3>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Tài khoản bị khóa</p>
                <h3 className="text-xl sm:text-2xl font-black text-red-600">{userStats.lockedCount}</h3>
              </div>
            </div>
          </div>

          {/* User Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, SĐT..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-400 font-medium">Vai trò:</span>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as any)}
                    className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                    <option value="staff">Nhân viên (Staff)</option>
                    <option value="customer">Khách hàng (Customer)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-400 font-medium">Trạng thái:</span>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value as any)}
                    className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="locked">Bị khóa</option>
                  </select>
                </div>

                {(userSearchQuery || userRoleFilter !== "all" || userStatusFilter !== "all") && (
                  <button
                    onClick={() => {
                      setUserSearchQuery("");
                      setUserRoleFilter("all");
                      setUserStatusFilter("all");
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1"
                  >
                    Đặt lại lọc
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">Không tìm thấy người dùng nào</h4>
                <p className="text-xs text-slate-400">
                  Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc phân loại.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Người Dùng</th>
                      <th className="py-3 px-3">Liên Hệ</th>
                      <th className="py-3 px-3">Vai Trò</th>
                      <th className="py-3 px-3">Trạng Thái</th>
                      <th className="py-3 px-3">Ngày Tạo</th>
                      <th className="py-3 px-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Avatar & Name */}
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-3">
                            <img
                              src={user.avatarUrl || "/default-avatar.png"}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                <span>{user.name}</span>
                                {user.role === "admin" && (
                                  <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {user.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Email & Phone */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1 text-slate-700">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-medium">{user.email}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{user.phone}</span>
                            </div>
                            {user.address && (
                              <div className="flex items-center space-x-1 text-slate-400 text-[10px] truncate max-w-xs">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{user.address}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3 px-3">
                          {user.role === "admin" && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                              <Shield className="w-3 h-3" />
                              <span>Quản trị viên</span>
                            </span>
                          )}
                          {user.role === "staff" && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                              <UserCheck className="w-3 h-3" />
                              <span>Nhân viên</span>
                            </span>
                          )}
                          {user.role === "customer" && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <User className="w-3 h-3" />
                              <span>Khách hàng</span>
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3">
                          {user.status === "active" ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>Đang hoạt động</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <Lock className="w-3 h-3" />
                              <span>Đã bị khóa</span>
                            </span>
                          )}
                        </td>

                        {/* Created At */}
                        <td className="py-3 px-3 text-slate-500 font-medium">
                          {user.createdAt || "N/A"}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {/* Toggle Lock */}
                            <button
                              type="button"
                              onClick={() => onToggleLockUser && onToggleLockUser(user.id)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                user.status === "active"
                                  ? "text-slate-500 hover:text-amber-600 hover:bg-amber-50 border-slate-200"
                                  : "text-red-600 hover:text-emerald-600 hover:bg-emerald-50 border-red-200"
                              }`}
                              title={user.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                            >
                              {user.status === "active" ? (
                                <Lock className="w-3.5 h-3.5" />
                              ) : (
                                <Unlock className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(user)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeletingUserId(user.id)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: REVIEWS MANAGEMENT (QUẢN LÝ ĐÁNH GIÁ SẢN PHẨM MONGODB) */}
      {adminTab === "reviews" && (
        <div className="space-y-6">
          {/* Review Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Tổng số đánh giá</p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">{reviewStats.total}</h3>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Đánh giá 5 sao</p>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-600">{reviewStats.fiveStar}</h3>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Điểm trung bình</p>
                <h3 className="text-xl sm:text-2xl font-black text-blue-600">{reviewStats.avg} / 5</h3>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Cơ sở dữ liệu</p>
                <h3 className="text-base sm:text-lg font-black text-purple-600">MongoDB Reviews</h3>
              </div>
            </div>
          </div>

          {/* Review Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo người đánh giá, nội dung hoặc mã sản phẩm..."
                  value={reviewSearchQuery}
                  onChange={(e) => setReviewSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={reviewRatingFilter}
                  onChange={(e) =>
                    setReviewRatingFilter(e.target.value === "all" ? "all" : Number(e.target.value))
                  }
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                >
                  <option value="all">Tất cả số sao</option>
                  <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
                  <option value="4">⭐⭐⭐⭐ (4 sao)</option>
                  <option value="3">⭐⭐⭐ (3 sao)</option>
                  <option value="2">⭐⭐ (2 sao)</option>
                  <option value="1">⭐ (1 sao)</option>
                </select>

                <button
                  type="button"
                  onClick={fetchReviews}
                  disabled={isLoadingReviews}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                  title="Làm mới dữ liệu từ MongoDB"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoadingReviews ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Làm mới</span>
                </button>
              </div>
            </div>

            {/* Reviews List */}
            {isLoadingReviews ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Đang tải đánh giá từ MongoDB...
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <MessageSquare className="w-12 h-12 stroke-1 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600 text-sm">Không có đánh giá nào phù hợp</p>
                <p className="text-xs text-slate-400">
                  Các đánh giá của khách hàng trên trang chi tiết sản phẩm sẽ xuất hiện ở đây.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Mã &amp; Ngày</th>
                      <th className="py-3 px-4">Sản Phẩm (Mã FK)</th>
                      <th className="py-3 px-4">Người Đánh Giá</th>
                      <th className="py-3 px-4">Số Sao</th>
                      <th className="py-3 px-4">Nội Dung Nhận Xét</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredReviews.map((rev) => {
                      const relatedProduct = products.find((p) => p.id === rev.productId);
                      return (
                        <tr key={rev.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs">
                            <span className="font-bold text-slate-900">{rev.id}</span>
                            <div className="text-[11px] text-slate-400">{rev.date}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 line-clamp-1">
                              {relatedProduct ? relatedProduct.name : rev.productId || "Chưa gắn mã"}
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              FK: {rev.productId || "None"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{rev.author}</div>
                            {rev.userId && (
                              <div className="text-[10px] font-mono text-slate-400">
                                FK: {rev.userId}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= rev.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-200"
                                  }`}
                                />
                              ))}
                              <span className="font-bold text-xs ml-1 text-slate-700">
                                {rev.rating}/5
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                            <p className="text-xs text-slate-600 leading-relaxed italic">
                              "{rev.content}"
                            </p>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setDeletingReviewId(rev.id)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Xóa đánh giá khỏi MongoDB"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRM DELETE REVIEW MODAL */}
      {deletingReviewId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Xóa Đánh Giá Này?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Hành động này sẽ xóa vĩnh viễn đánh giá khỏi collection <strong>reviews</strong> trên MongoDB và tự động tính lại điểm số trung bình của sản phẩm.
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReviewId(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleDeleteReview(deletingReviewId)}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md shadow-red-500/20"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Laptop Dell XPS 15 9530..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Danh mục *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.filter((c) => c !== "Tất cả").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Trạng thái kho hàng
                  </label>
                  <div className="flex items-center space-x-4 pt-2">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="inStock"
                        checked={formInStock}
                        onChange={() => setFormInStock(true)}
                        className="text-blue-600"
                      />
                      <span className="font-semibold text-emerald-600">Còn hàng</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="inStock"
                        checked={!formInStock}
                        onChange={() => setFormInStock(false)}
                        className="text-blue-600"
                      />
                      <span className="font-semibold text-red-600">Hết hàng</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Price & Original Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Giá bán (VNĐ) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={10000}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">{formatVND(formPrice)}</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Giá gốc niêm yết (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">{formatVND(formOriginalPrice)}</p>
                </div>
              </div>

              {/* Image URL & Quick Sample Picker */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đường dẫn hình ảnh (Image URL) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[11px] text-slate-400">Chọn ảnh mẫu nhanh:</span>
                  {SAMPLE_IMAGES.map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => setFormImageUrl(sample.url)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-medium text-slate-700 border"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mô tả sản phẩm
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mô tả các đặc điểm nổi bật của thiết bị..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Specifications Manager */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="block font-bold text-slate-800">
                  Thông số kỹ thuật:
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {Object.entries(formSpecs).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg border">
                      <span className="text-slate-600 font-semibold">{key}: <span className="text-slate-900 font-normal">{val}</span></span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(key)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2 pt-1">
                  <input
                    type="text"
                    placeholder="Tên thông số (VD: RAM)"
                    value={newSpecKey}
                    onChange={(e) => setNewSpecKey(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Giá trị (VD: 16GB DDR5)"
                    value={newSpecVal}
                    onChange={(e) => setNewSpecVal(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700"
                  >
                    Thêm
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingProduct ? "Lưu Thay Đổi" : "Tạo Sản Phẩm Mới"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa sản phẩm?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Thao tác này sẽ xóa vĩnh viễn sản phẩm khỏi hệ thống và cửa hàng. Bạn có chắc chắn không?
            </p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setDeletingProductId(null)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingUser ? "Chỉnh Sửa Thông Tin Người Dùng" : "Thêm Tài Khoản Người Dùng Mới"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingUser ? `Cập nhật dữ liệu tài khoản ID: ${editingUser.id}` : "Tạo tài khoản mới và cấp quyền đăng nhập"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUserForm} className="space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn Bảo"
                  value={userFormName}
                  onChange={(e) => setUserFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email đăng nhập *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={userFormEmail}
                    onChange={(e) => setUserFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại (10 số) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="Ví dụ: 0905123456"
                    value={userFormPhone}
                    onChange={(e) => setUserFormPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Bắt buộc nhập đúng 10 chữ số.</p>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mật khẩu đăng nhập
                </label>
                <input
                  type="text"
                  placeholder="Nhập mật khẩu (Mặc định: 123456)"
                  value={userFormPassword}
                  onChange={(e) => setUserFormPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Để trống sẽ giữ nguyên mật khẩu cũ nếu đang sửa.</p>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vai trò (Phân quyền) *
                  </label>
                  <select
                    value={userFormRole}
                    onChange={(e) => setUserFormRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="customer">Khách Hàng (Customer)</option>
                    <option value="staff">Nhân Viên (Staff)</option>
                    <option value="admin">Quản Trị Viên (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Trạng thái tài khoản *
                  </label>
                  <select
                    value={userFormStatus}
                    onChange={(e) => setUserFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="active">🟢 Đang hoạt động (Active)</option>
                    <option value="locked">🔴 Khóa tài khoản (Locked)</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Địa chỉ liên hệ
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hải Châu, Đà Nẵng"
                  value={userFormAddress}
                  onChange={(e) => setUserFormAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đường dẫn ảnh đại diện (Avatar URL)
                </label>
                <div className="flex items-center space-x-3 mb-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <img
                    src={userFormAvatar || "/images/default-avatar.png"}
                    alt="Avatar Preview"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/default-avatar.png";
                    }}
                  />
                  <div>
                    <p className="text-[11px] font-medium text-slate-700">Ảnh đại diện xem trước</p>
                    <p className="text-[10px] text-slate-400">Để trống sẽ tự động lưu Avatar mặc định (/images/default-avatar.png)</p>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Để trống sẽ dùng /images/default-avatar.png hoặc dán link ảnh"
                  value={userFormAvatar}
                  onChange={(e) => setUserFormAvatar(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingUser ? "Lưu Thông Tin" : "Tạo Tài Khoản"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {deletingUserId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <UserX className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa người dùng?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Thao tác này sẽ xóa vĩnh viễn tài khoản người dùng khỏi hệ thống. Tài khoản này sẽ không thể đăng nhập được nữa.
            </p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setDeletingUserId(null)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
