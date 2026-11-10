import React, { useState, useMemo, useEffect } from "react";
// Import createPortal để render modal trực tiếp ra document.body, tránh lỗi cắt ngang header do stacking context hoặc space-y
import { createPortal } from "react-dom";
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
  ChevronLeft,
  ChevronRight,
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
  ThumbsUp,
  Ticket,
  BarChart3,
  Folder,
  Upload,
  Link2,
  AlertTriangle,
  Printer,
  Clock,
  Check
} from "lucide-react";
import CouponsTab from "./admin/CouponsTab";
import AnalyticsTab from "./admin/AnalyticsTab";
import CategoriesTab from "./admin/CategoriesTab";
import AdminPagination from "./admin/AdminPagination";
import InvoiceModal from "./InvoiceModal";

interface CartItem {
  product: Product;
  quantity: number;
}

export type AdminOrderStatus =
  | "Chờ xác nhận"
  | "Chờ lấy hàng"
  | "Chờ giao hàng"
  | "Hoàn tất"
  | "Đã hủy"
  | "Đang xử lý"
  | "Đang giao";

export interface OrderRecord {
  id: string;
  date: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: string;
  status: AdminOrderStatus;
  customerInfo: {
    fullName: string;
    phone: string;
    address: string;
    note?: string;
  };
  isPaid?: boolean;
  pickupTime?: string;
  shippingCarrier?: string;
  isReviewed?: boolean;
  reviewRating?: number;
  reviewComment?: string;
  reviewedAt?: string;
  receivedAt?: string;
}

interface AdminPanelProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onResetDefaultProducts: () => void;
  orders: OrderRecord[];
  onUpdateOrderStatus: (orderId: string, newStatus: AdminOrderStatus, extraData?: any) => void;
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
  { label: "Văn học", url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80" },
  { label: "Kinh tế", url: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80" },
  { label: "Kỹ năng", url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80" },
  { label: "Lập trình", url: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80" },
  { label: "Khoa học", url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80" },
  { label: "Thiếu nhi", url: "https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=800&q=80" },
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
  const [adminTab, setAdminTab] = useState<
    "products" | "orders" | "users" | "reviews" | "coupons" | "analytics" | "categories"
  >("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  // Quản lý Bộ lọc Kho sách (Stock Filter: Tất cả, Còn hàng, Sắp hết <=5, Hết hàng)
  const [selectedStockFilter, setSelectedStockFilter] = useState<
    "all" | "in_stock" | "low_stock" | "out_of_stock"
  >("all");

  // Reviews Management State (MongoDB)
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | "all">("all");
  const [selectedProductReviewFilter, setSelectedProductReviewFilter] = useState<string>("all");
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Edit Review Modal State
  const [isEditReviewModalOpen, setIsEditReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [editReviewAuthor, setEditReviewAuthor] = useState("");
  const [editReviewRating, setEditReviewRating] = useState(5);
  const [editReviewContent, setEditReviewContent] = useState("");
  const [isSavingReview, setIsSavingReview] = useState(false);
  // Modal In Hóa Đơn trong Admin
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<OrderRecord | null>(null);

  // Quản lý Modal Hẹn Giờ Lấy Hàng Cho Shipper & Bộ Lọc Đơn Hàng trong Admin
  const [pickupModalOrder, setPickupModalOrder] = useState<OrderRecord | null>(null);
  const [pickupDateTime, setPickupDateTime] = useState<string>("");
  const [pickupCarrier, setPickupCarrier] = useState<string>("Giao Hàng Nhanh (GHN)");
  const [adminOrderFilter, setAdminOrderFilter] = useState<
    "all" | "Chờ xác nhận" | "Chờ lấy hàng" | "Chờ giao hàng" | "Hoàn tất" | "Đã hủy"
  >("all");
  // Phân trang danh sách đơn hàng trong Admin
  const [adminOrderPage, setAdminOrderPage] = useState<number>(1);
  const [adminOrdersPerPage, setAdminOrdersPerPage] = useState<number>(10);

  // Lọc danh sách đơn hàng theo trạng thái
  const filteredAdminOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (adminOrderFilter === "Chờ xác nhận") {
        return ord.status === "Chờ xác nhận" || (ord.status === "Đang xử lý" && !ord.pickupTime);
      }
      if (adminOrderFilter === "Chờ lấy hàng") {
        return ord.status === "Chờ lấy hàng";
      }
      if (adminOrderFilter === "Chờ giao hàng") {
        return ord.status === "Chờ giao hàng" || (ord.status === "Đang giao" && !ord.receivedAt);
      }
      if (adminOrderFilter === "Hoàn tất") {
        return ord.status === "Hoàn tất" || Boolean(ord.receivedAt);
      }
      if (adminOrderFilter === "Đã hủy") {
        return ord.status === "Đã hủy";
      }
      return true;
    });
  }, [orders, adminOrderFilter]);

  // Tự động chuyển về trang 1 khi đổi bộ lọc trạng thái
  useEffect(() => {
    setAdminOrderPage(1);
  }, [adminOrderFilter]);

  const totalAdminOrderPages = Math.max(1, Math.ceil(filteredAdminOrders.length / adminOrdersPerPage));

  // Đảm bảo không ở trang vượt quá tổng số trang hiện có
  useEffect(() => {
    if (adminOrderPage > totalAdminOrderPages) {
      setAdminOrderPage(totalAdminOrderPages);
    }
  }, [adminOrderPage, totalAdminOrderPages]);

  // Cắt danh sách đơn hàng cho trang hiện tại
  const paginatedAdminOrders = useMemo(() => {
    const startIndex = (adminOrderPage - 1) * adminOrdersPerPage;
    return filteredAdminOrders.slice(startIndex, startIndex + adminOrdersPerPage);
  }, [filteredAdminOrders, adminOrderPage, adminOrdersPerPage]);

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

  // Mở modal chỉnh sửa đánh giá
  const handleOpenEditReview = (rev: ReviewItem) => {
    setEditingReview(rev);
    setEditReviewAuthor(rev.author);
    setEditReviewRating(rev.rating);
    setEditReviewContent(rev.content);
    setIsEditReviewModalOpen(true);
  };

  // Lưu chỉnh sửa đánh giá lên MongoDB
  const handleSaveEditReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview || !editReviewAuthor.trim() || !editReviewContent.trim() || isSavingReview) return;

    setIsSavingReview(true);
    try {
      const res = await api.updateReview(editingReview.id, {
        author: editReviewAuthor.trim(),
        rating: editReviewRating,
        content: editReviewContent.trim()
      });

      if (res && res.data) {
        setReviewsList((prev) =>
          prev.map((r) => (r.id === editingReview.id ? res.data : r))
        );
      } else {
        setReviewsList((prev) =>
          prev.map((r) =>
            r.id === editingReview.id
              ? { ...r, author: editReviewAuthor.trim(), rating: editReviewRating, content: editReviewContent.trim() }
              : r
          )
        );
      }
      setIsEditReviewModalOpen(false);
      setEditingReview(null);
    } catch (err) {
      console.error("Lỗi khi lưu chỉnh sửa đánh giá:", err);
    } finally {
      setIsSavingReview(false);
    }
  };

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

  // Lọc đánh giá theo tìm kiếm, số sao và từng sản phẩm
  const filteredReviews = useMemo(() => {
    return reviewsList.filter((rev) => {
      const q = reviewSearchQuery.toLowerCase();
      const matchSearch =
        rev.author.toLowerCase().includes(q) ||
        rev.content.toLowerCase().includes(q) ||
        (rev.productId && rev.productId.toLowerCase().includes(q));
      const matchRating = reviewRatingFilter === "all" || rev.rating === reviewRatingFilter;
      const matchProduct =
        selectedProductReviewFilter === "all" || rev.productId === selectedProductReviewFilter;
      return matchSearch && matchRating && matchProduct;
    });
  }, [reviewsList, reviewSearchQuery, reviewRatingFilter, selectedProductReviewFilter]);

  // Phân trang danh sách đánh giá từ MongoDB (mặc định 10 đánh giá / trang)
  const [adminReviewPage, setAdminReviewPage] = useState<number>(1);
  const [adminReviewsPerPage, setAdminReviewsPerPage] = useState<number>(10);
  useEffect(() => {
    setAdminReviewPage(1);
  }, [reviewSearchQuery, reviewRatingFilter, selectedProductReviewFilter]);
  const totalAdminReviewPages = Math.max(1, Math.ceil(filteredReviews.length / adminReviewsPerPage));
  useEffect(() => {
    if (adminReviewPage > totalAdminReviewPages) {
      setAdminReviewPage(totalAdminReviewPages);
    }
  }, [adminReviewPage, totalAdminReviewPages]);
  const paginatedAdminReviews = useMemo(() => {
    const startIndex = (adminReviewPage - 1) * adminReviewsPerPage;
    return filteredReviews.slice(startIndex, startIndex + adminReviewsPerPage);
  }, [filteredReviews, adminReviewPage, adminReviewsPerPage]);

  // Thống kê đánh giá
  const reviewStats = useMemo(() => {
    const list =
      selectedProductReviewFilter === "all"
        ? reviewsList
        : reviewsList.filter((r) => r.productId === selectedProductReviewFilter);
    const total = list.length;
    const fiveStar = list.filter((r) => r.rating === 5).length;
    const avg =
      total > 0
        ? (list.reduce((acc, cur) => acc + (cur.rating || 5), 0) / total).toFixed(1)
        : "5.0";
    return { total, fiveStar, avg };
  }, [reviewsList, selectedProductReviewFilter]);

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
  const [formCategory, setFormCategory] = useState("Văn học - Tiểu thuyết");
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number>(0);
  const [formImageUrl, setFormImageUrl] = useState("");
  // Chế độ nguồn ảnh: 'upload' (tải ảnh từ máy tính) hoặc 'url' (đường link web)
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");
  // Lưu tên tệp ảnh và dung lượng ước tính khi chọn từ máy tính
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadedFileSize, setUploadedFileSize] = useState<string>("");
  // Trạng thái đang xử lý nén ảnh từ máy
  const [isCompressingImage, setIsCompressingImage] = useState<boolean>(false);
  // Tham chiếu tới input type="file" ẩn
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Hàm xử lý đọc và nén ảnh trực tiếp từ máy tính bằng Canvas API
  const handleProcessImageFile = (file: File) => {
    if (!file) return;

    // Kiểm tra định dạng tệp có phải hình ảnh không
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn đúng tệp định dạng hình ảnh (PNG, JPG, JPEG, WEBP, GIF)!");
      return;
    }

    setIsCompressingImage(true);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        // Tối ưu hóa kích thước: giới hạn chiều dài/rộng tối đa 1000px để giảm dung lượng tải
        const canvas = document.createElement("canvas");
        const MAX_DIMENSION = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Xuất Data URL định dạng JPEG chất lượng 85%
          const compressedData = canvas.toDataURL("image/jpeg", 0.85);
          setFormImageUrl(compressedData);
          // Ước tính dung lượng sau nén (base64 length * 0.75)
          const sizeInKb = Math.round((compressedData.length * 0.75) / 1024);
          setUploadedFileSize(`${sizeInKb} KB`);
        } else {
          // Dự phòng nếu trình duyệt không hỗ trợ Canvas context 2D
          const fallbackData = loadEvent.target?.result as string;
          setFormImageUrl(fallbackData);
          setUploadedFileSize(`${Math.round(file.size / 1024)} KB`);
        }
        setIsCompressingImage(false);
      };

      img.onerror = () => {
        alert("Không thể đọc tệp ảnh này. Vui lòng thử chọn tệp ảnh khác!");
        setIsCompressingImage(false);
      };

      img.src = loadEvent.target?.result as string;
    };

    reader.onerror = () => {
      alert("Đã xảy ra lỗi trong quá trình đọc ảnh từ máy tính!");
      setIsCompressingImage(false);
    };

    reader.readAsDataURL(file);
  };

  // Sự kiện khi người dùng chọn tệp từ hộp thoại duyệt file máy tính
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
    // Xóa giá trị input để có thể chọn lại cùng một file nếu cần
    e.target.value = "";
  };

  // Sự kiện kéo thả tệp hình ảnh vào vùng thả
  const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
  };

  const handleDragOverImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Hàm xóa ảnh đã chọn
  const handleRemoveImage = () => {
    setFormImageUrl("");
    setUploadedFileName("");
    setUploadedFileSize("");
  };

  const [formDescription, setFormDescription] = useState("");
  const [formInStock, setFormInStock] = useState(true);
  const [formStockQuantity, setFormStockQuantity] = useState<number>(25);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formSpecs, setFormSpecs] = useState<{ [key: string]: string }>({
    "Tác giả": "Đang cập nhật",
    "Nhà xuất bản": "NXB Trẻ",
    "Năm xuất bản": "2024",
    "Số trang": "300 trang",
    "Hình thức": "Bìa mềm",
  });
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecVal, setNewSpecVal] = useState("");

  // Delete Confirmation State
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Khóa cuộn trang nền khi có bất kỳ modal/popup nào đang mở để triệt tiêu lỗi thanh cuộn kép và lệch vị trí
  useEffect(() => {
    const isAnyModalActive =
      isModalOpen ||
      isUserModalOpen ||
      isEditReviewModalOpen ||
      Boolean(deletingProductId) ||
      Boolean(deletingUserId) ||
      Boolean(deletingReviewId);

    if (isAnyModalActive) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [
    isModalOpen,
    isUserModalOpen,
    isEditReviewModalOpen,
    deletingProductId,
    deletingUserId,
    deletingReviewId,
  ]);

  // Format VND
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Filtered Products for Admin Table (Đã kết hợp Bộ lọc Kho hàng)
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCat =
        selectedCategory === "Tất cả" || item.category === selectedCategory;
      const matchQuery =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      const stock = item.stockQuantity ?? (item.inStock ? 25 : 0);
      let matchStock = true;
      if (selectedStockFilter === "in_stock") {
        matchStock = item.inStock && stock > 5;
      } else if (selectedStockFilter === "low_stock") {
        matchStock = item.inStock && stock > 0 && stock <= 5;
      } else if (selectedStockFilter === "out_of_stock") {
        matchStock = !item.inStock || stock === 0;
      }

      return matchCat && matchQuery && matchStock;
    });
  }, [products, selectedCategory, searchQuery, selectedStockFilter]);

  // Phân trang danh sách sản phẩm trong Admin (mặc định 10 cuốn / trang)
  const [adminProdPage, setAdminProdPage] = useState<number>(1);
  const [adminProdPerPage, setAdminProdPerPage] = useState<number>(10);
  useEffect(() => {
    setAdminProdPage(1);
  }, [selectedCategory, searchQuery, selectedStockFilter]);
  const totalAdminProdPages = Math.max(1, Math.ceil(filteredProducts.length / adminProdPerPage));
  useEffect(() => {
    if (adminProdPage > totalAdminProdPages) {
      setAdminProdPage(totalAdminProdPages);
    }
  }, [adminProdPage, totalAdminProdPages]);
  const paginatedAdminProducts = useMemo(() => {
    const startIndex = (adminProdPage - 1) * adminProdPerPage;
    return filteredProducts.slice(startIndex, startIndex + adminProdPerPage);
  }, [filteredProducts, adminProdPage, adminProdPerPage]);

  // Statistics
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== "Đã hủy")
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  // Thống kê chi tiết tình trạng kho sách
  const inStockCount = products.filter(
    (p) => p.inStock && (p.stockQuantity ?? 25) > 5
  ).length;
  const lowStockCount = products.filter(
    (p) => p.inStock && (p.stockQuantity ?? 25) > 0 && (p.stockQuantity ?? 25) <= 5
  ).length;
  const outOfStockCount = products.filter(
    (p) => !p.inStock || (p.stockQuantity ?? 25) === 0
  ).length;

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

  // Phân trang danh sách người dùng trong Admin (mặc định 10 người dùng / trang)
  const [adminUserPage, setAdminUserPage] = useState<number>(1);
  const [adminUsersPerPage, setAdminUsersPerPage] = useState<number>(10);
  useEffect(() => {
    setAdminUserPage(1);
  }, [userSearchQuery, userRoleFilter, userStatusFilter]);
  const totalAdminUserPages = Math.max(1, Math.ceil(filteredUsers.length / adminUsersPerPage));
  useEffect(() => {
    if (adminUserPage > totalAdminUserPages) {
      setAdminUserPage(totalAdminUserPages);
    }
  }, [adminUserPage, totalAdminUserPages]);
  const paginatedAdminUsers = useMemo(() => {
    const startIndex = (adminUserPage - 1) * adminUsersPerPage;
    return filteredUsers.slice(startIndex, startIndex + adminUsersPerPage);
  }, [filteredUsers, adminUserPage, adminUsersPerPage]);

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
    setFormCategory("Văn học - Tiểu thuyết");
    setFormPrice(95000);
    setFormOriginalPrice(120000);
    // Để trống ảnh ban đầu và ưu tiên chế độ tải ảnh từ máy tính của người dùng
    setFormImageUrl("");
    setImageInputMode("upload");
    setUploadedFileName("");
    setUploadedFileSize("");
    setFormDescription("Tác phẩm sách bản quyền chính thức, giấy in cao cấp tại BookStore.");
    setFormInStock(true);
    setFormStockQuantity(25);
    setFormFeatured(false);
    setFormSpecs({
      "Tác giả": "Đang cập nhật",
      "Nhà xuất bản": "NXB Trẻ",
      "Năm xuất bản": "2024",
      "Số trang": "300 trang",
      "Hình thức": "Bìa mềm",
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
    // Nhận diện xem ảnh hiện tại là ảnh base64 từ máy tính hay URL
    const isBase64 = product.imageUrl?.startsWith("data:");
    setImageInputMode("upload");
    setUploadedFileName(isBase64 ? "Ảnh đã lưu từ máy tính" : "Ảnh từ đường dẫn URL");
    setUploadedFileSize("");
    setFormDescription(product.description);
    setFormInStock(product.inStock);
    setFormStockQuantity(product.stockQuantity ?? (product.inStock ? 25 : 0));
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

    if (!formImageUrl.trim()) {
      alert("Vui lòng chọn ảnh từ máy tính hoặc nhập đường link ảnh cho sản phẩm!");
      return;
    }

    const discountPercent =
      formOriginalPrice > formPrice
        ? Math.round(((formOriginalPrice - formPrice) / formOriginalPrice) * 100)
        : 0;

    const qty = Number(formStockQuantity) || 0;

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
        inStock: qty > 0 ? formInStock : false,
        stockQuantity: qty,
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
        inStock: qty > 0 ? formInStock : false,
        stockQuantity: qty,
        featured: formFeatured,
        specs: formSpecs,
      };
      onAddProduct(newProduct);
    }

    setIsModalOpen(false);
  };

  // Cập nhật nhanh số lượng tồn kho trực tiếp từ bảng sản phẩm
  const handleUpdateStockQuantity = (product: Product, deltaOrAbsolute: number, isAbsolute = false) => {
    const currentStock = product.stockQuantity ?? (product.inStock ? 25 : 0);
    const newQty = Math.max(0, isAbsolute ? deltaOrAbsolute : currentStock + deltaOrAbsolute);
    onUpdateProduct({
      ...product,
      stockQuantity: newQty,
      inStock: newQty > 0,
    });
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
            Quản Lý Sách &amp; Đơn Hàng BookStore
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

      {/* Statistics Cards (Bổ sung Cảnh báo Kho sách sắp hết hàng) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Tổng đầu sách</p>
            <h3 className="text-xl font-black text-slate-900">{products.length}</h3>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Còn hàng (&gt;5)</p>
            <h3 className="text-xl font-black text-emerald-600">{inStockCount}</h3>
          </div>
        </div>

        {/* THẺ CẢNH BÁO SẮP HẾT HÀNG */}
        <div className="bg-white p-4.5 rounded-2xl border border-amber-200 shadow-sm flex items-center space-x-3.5 bg-gradient-to-br from-white to-amber-50/40">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-amber-800 font-bold">Sắp hết (≤ 5)</p>
            <h3 className="text-xl font-black text-amber-600">{lowStockCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Hết hàng (0)</p>
            <h3 className="text-xl font-black text-red-600">{outOfStockCount}</h3>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5 col-span-2 sm:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Doanh thu đơn</p>
            <h3 className="text-base sm:text-lg font-black text-purple-600 truncate">
              {formatVND(totalRevenue)}
            </h3>
          </div>
        </div>
      </div>

      {/* Admin Tab Switcher - Thanh chuyển tab chuyên dụng, tinh gọn, không rớt dòng */}
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setAdminTab("products")}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center space-x-1.5 shrink-0 ${
              adminTab === "products"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Sản Phẩm ({products.length})</span>
          </button>
          <button
            onClick={() => setAdminTab("orders")}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center space-x-1.5 shrink-0 ${
              adminTab === "orders"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Đơn Hàng ({orders.length})</span>
          </button>
          <button
            onClick={() => {
              setAdminTab("users");
              if (onResetDefaultUsers) onResetDefaultUsers();
            }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center space-x-1.5 shrink-0 ${
              adminTab === "users"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Người Dùng ({users.length})</span>
          </button>
          <button
            onClick={() => setAdminTab("reviews")}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center space-x-1.5 shrink-0 ${
              adminTab === "reviews"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Đánh Giá ({reviewsList.length})</span>
          </button>
          <button
            onClick={() => setAdminTab("coupons")}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center space-x-1.5 shrink-0 ${
              adminTab === "coupons"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Mã Giảm Giá</span>
          </button>
          <button
            onClick={() => setAdminTab("analytics")}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center space-x-1.5 shrink-0 ${
              adminTab === "analytics"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Báo Cáo Doanh Thu</span>
          </button>
          <button
            onClick={() => setAdminTab("categories")}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center space-x-1.5 shrink-0 ${
              adminTab === "categories"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Thể Loại Sách</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PRODUCT CRUD TABLE */}
      {adminTab === "products" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          {/* Search, Filter & Action Bar - Nút Thêm Sản Phẩm được đưa xuống đây gọn gàng */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Nhóm tìm kiếm và lọc dữ liệu sản phẩm */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm sản phẩm theo tên, danh mục, ID..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
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

              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-xs text-slate-500 font-medium">Kho hàng:</span>
                <select
                  value={selectedStockFilter}
                  onChange={(e) => setSelectedStockFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">Tất cả kho ({products.length})</option>
                  <option value="in_stock">Còn hàng &gt;5 ({inStockCount})</option>
                  <option value="low_stock">⚠️ Sắp hết hàng ≤ 5 ({lowStockCount})</option>
                  <option value="out_of_stock">❌ Hết hàng ({outOfStockCount})</option>
                </select>
              </div>
            </div>

            {/* Cụm nút Thao tác Sản phẩm (Chuyển từ phía trên xuống đây theo yêu cầu) */}
            <div className="flex items-center justify-end space-x-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Bạn có chắc muốn khôi phục về danh sách sản phẩm mẫu ban đầu không?")) {
                    onResetDefaultProducts();
                  }
                }}
                className="text-xs text-slate-500 hover:text-red-600 px-3 py-2 rounded-xl border border-slate-200 hover:bg-red-50 flex items-center space-x-1 transition-colors cursor-pointer"
                title="Khôi phục dữ liệu gốc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Khôi phục mặc định</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Sản Phẩm</span>
              </button>
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
                  paginatedAdminProducts.map((p) => (
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

                      {/* In Stock toggle & Stock Quantity (Đã nâng cấp Bộ chỉnh tồn kho Inline & Cảnh báo) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center space-y-1.5">
                          {/* Badge trạng thái tồn kho */}
                          {!p.inStock || (p.stockQuantity ?? 25) === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                              ❌ Hết hàng
                            </span>
                          ) : (p.stockQuantity ?? 25) <= 5 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                              ⚠️ Sắp hết ({p.stockQuantity ?? 25})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✅ Còn ({p.stockQuantity ?? 25})
                            </span>
                          )}

                          {/* Bộ điều khiển tăng / giảm số lượng tồn kho nhanh inline */}
                          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateStockQuantity(p, -1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-200 font-bold text-xs transition-colors"
                              title="Giảm 1 cuốn"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={p.stockQuantity !== undefined ? p.stockQuantity : (p.inStock ? 25 : 0)}
                              onChange={(e) => handleUpdateStockQuantity(p, Number(e.target.value), true)}
                              className="w-10 text-center font-bold text-xs bg-white border border-slate-200 rounded py-0.5 px-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateStockQuantity(p, 1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-200 font-bold text-xs transition-colors"
                              title="Tăng 1 cuốn"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductReviewFilter(p.id);
                              setAdminTab("reviews");
                            }}
                            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title={`Xem đánh giá của ${p.name}`}
                          >
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa sản phẩm"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
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

          {/* Thanh phân trang sản phẩm chuẩn 10 cuốn / trang */}
          <AdminPagination
            currentPage={adminProdPage}
            totalPages={totalAdminProdPages}
            totalItems={filteredProducts.length}
            itemsPerPage={adminProdPerPage}
            itemLabel="sản phẩm"
            onPageChange={setAdminProdPage}
            onPerPageChange={(per) => {
              setAdminProdPerPage(per);
              setAdminProdPage(1);
            }}
          />
        </div>
      )}

      {/* TAB 2: ORDERS MANAGEMENT */}
      {adminTab === "orders" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Quản Lý Đơn Hàng Mua Sách ({orders.length} đơn)
              </h3>
              <p className="text-xs text-slate-400">
                Xác nhận đơn, hẹn giờ shipper đến lấy hàng và cập nhật hành trình giao nhận
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Dữ liệu lưu tự động MongoDB Container</span>
          </div>

          {/* Bộ lọc trạng thái đơn hàng trong Admin */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "Tất cả", count: orders.length },
              {
                id: "Chờ xác nhận",
                label: "Chờ xác nhận",
                count: orders.filter((o) => o.status === "Chờ xác nhận" || (o.status === "Đang xử lý" && !o.pickupTime)).length,
              },
              {
                id: "Chờ lấy hàng",
                label: "Chờ lấy hàng",
                count: orders.filter((o) => o.status === "Chờ lấy hàng").length,
              },
              {
                id: "Chờ giao hàng",
                label: "Chờ giao hàng",
                count: orders.filter((o) => o.status === "Chờ giao hàng" || (o.status === "Đang giao" && !o.receivedAt)).length,
              },
              {
                id: "Hoàn tất",
                label: "Hoàn tất / Đã giao",
                count: orders.filter((o) => o.status === "Hoàn tất" || o.receivedAt).length,
              },
              {
                id: "Đã hủy",
                label: "Đã hủy",
                count: orders.filter((o) => o.status === "Đã hủy").length,
              },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setAdminOrderFilter(st.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  adminOrderFilter === st.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    adminOrderFilter === st.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {filteredAdminOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <ShoppingBag className="w-12 h-12 stroke-1 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600 text-sm">Chưa có đơn hàng nào</p>
              <p className="text-xs text-slate-400">
                Khi khách hàng đặt hàng ở trang Cửa Hàng, đơn hàng sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedAdminOrders.map((ord) => {
                  const isPendingConfirm =
                    ord.status === "Chờ xác nhận" || (ord.status === "Đang xử lý" && !ord.pickupTime);
                  const isPickup = ord.status === "Chờ lấy hàng";
                  const isShipping =
                    ord.status === "Chờ giao hàng" || (ord.status === "Đang giao" && !ord.receivedAt);
                  const isDone = ord.status === "Hoàn tất" || Boolean(ord.receivedAt);

                  return (
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

                        {/* Thao tác trạng thái nhanh và dropdown */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* 1. NÚT XÁC NHẬN & HẸN GIỜ LẤY HÀNG (CHO ĐƠN CHỜ XÁC NHẬN) */}
                          {isPendingConfirm && (
                            <button
                              type="button"
                              onClick={() => {
                                setPickupModalOrder(ord);
                                const defaultTime = new Date(Date.now() + 15 * 60000);
                                setPickupDateTime(defaultTime.toISOString().slice(0, 16));
                                setPickupCarrier(ord.shippingCarrier || "Giao Hàng Nhanh (GHN)");
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer transform hover:-translate-y-0.5"
                              title="Xác nhận đơn và chọn thời gian shipper lấy hàng"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Xác Nhận &amp; Hẹn Giờ Lấy Hàng</span>
                            </button>
                          )}

                          {/* 2. NÚT CHUYỂN SANG GIAO HÀNG (CHO ĐƠN CHỜ LẤY HÀNG) */}
                          {isPickup && (
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(ord.id, "Chờ giao hàng")}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                              title="Shipper đã nhận gói hàng, chuyển sang Đang Giao"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Shipper Đã Lấy (Giao Ngay)</span>
                            </button>
                          )}

                          {/* 3. NÚT XÁC NHẬN GIAO THÀNH CÔNG (CHO ĐƠN ĐANG GIAO) */}
                          {isShipping && (
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateOrderStatus(ord.id, "Hoàn tất", {
                                  receivedAt: new Date().toISOString(),
                                })
                              }
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                              title="Đánh dấu đơn hàng đã giao thành công tới khách"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Xác Nhận Đã Giao Thành Công</span>
                            </button>
                          )}

                          <span className="text-slate-500 font-medium">Trạng thái:</span>
                          <select
                            value={ord.status}
                            onChange={(e) =>
                              onUpdateOrderStatus(
                                ord.id,
                                e.target.value as AdminOrderStatus
                              )
                            }
                            className={`font-bold px-2.5 py-1 rounded-lg border text-xs focus:outline-none cursor-pointer ${
                              isDone
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : isShipping
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : isPickup
                                ? "bg-purple-100 text-purple-800 border-purple-300"
                                : ord.status === "Đã hủy"
                                ? "bg-red-100 text-red-800 border-red-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}
                          >
                            <option value="Chờ xác nhận">Chờ xác nhận</option>
                            <option value="Chờ lấy hàng">Chờ lấy hàng</option>
                            <option value="Chờ giao hàng">Chờ giao hàng</option>
                            <option value="Hoàn tất">Hoàn tất / Đã giao</option>
                            <option value="Đã hủy">Đã hủy</option>
                          </select>

                          {/* Nút In Hóa Đơn trong Admin */}
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceOrder(ord)}
                            className={`px-2.5 py-1 border rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer ${
                              ord.isPaid || isDone
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
                                : "bg-slate-100 text-slate-400 border-slate-200"
                            }`}
                            title={
                              ord.isPaid || isDone
                                ? "In hóa đơn bán lẻ (Đã thanh toán)"
                                : "Đơn hàng này chưa thanh toán"
                            }
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>
                              In Hóa Đơn {ord.isPaid || isDone ? "(Đã TT)" : "(Chưa TT)"}
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) {
                                onDeleteOrder(ord.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors ml-1 cursor-pointer"
                            title="Xóa đơn hàng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Banner hiển thị chi tiết lịch hẹn lấy hàng nếu có */}
                      {isPickup && ord.pickupTime && (
                        <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 flex items-center justify-between text-xs">
                          <span className="flex items-center space-x-1.5 font-bold">
                            <Clock className="w-4 h-4 text-purple-600" />
                            <span>Lịch shipper lấy hàng: {new Date(ord.pickupTime).toLocaleString("vi-VN")} ({ord.shippingCarrier || "Giao Hàng Nhanh"})</span>
                          </span>
                          <span className="text-[11px] text-purple-600 bg-white px-2 py-0.5 rounded border border-purple-200">
                            Tự động chuyển sang Chờ giao khi đến giờ
                          </span>
                        </div>
                      )}

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
                          {ord.isReviewed && (
                            <span className="ml-2 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">
                              ⭐ Khách đã đánh giá ({ord.reviewRating || 5}/5 sao)
                            </span>
                          )}
                        </span>
                        <div className="text-right">
                          <span className="text-slate-500 mr-2">Tổng thanh toán:</span>
                          <span className="font-extrabold text-red-600 text-sm">
                            {formatVND(ord.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

            {/* Thanh phân trang đơn hàng chuẩn 10 đơn / trang */}
            <AdminPagination
              currentPage={adminOrderPage}
              totalPages={totalAdminOrderPages}
              totalItems={filteredAdminOrders.length}
              itemsPerPage={adminOrdersPerPage}
              itemLabel="đơn hàng"
              onPageChange={setAdminOrderPage}
              onPerPageChange={(per) => {
                setAdminOrdersPerPage(per);
                setAdminOrderPage(1);
              }}
            />
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
            {/* Search and Filters & Action Bar - Đưa các nút thao tác xuống thanh công cụ */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên, email, SĐT..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs shrink-0">
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

                <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs shrink-0">
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
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 cursor-pointer"
                  >
                    Đặt lại lọc
                  </button>
                )}
              </div>

              {/* Cụm nút Thao tác Quản lý Người dùng */}
              <div className="flex items-center justify-end space-x-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                {onResetDefaultUsers && (
                  <button
                    type="button"
                    onClick={() => onResetDefaultUsers()}
                    className="text-xs text-blue-600 hover:text-blue-700 px-3 py-2 rounded-xl border border-blue-200 hover:bg-blue-50 flex items-center space-x-1.5 transition-colors cursor-pointer font-bold"
                    title="Đồng bộ danh sách tài khoản mới nhất từ MongoDB"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm mới</span>
                  </button>
                )}
                {onResetDefaultUsers && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Bạn có chắc muốn khôi phục về danh sách tài khoản người dùng mặc định ban đầu không?")) {
                        onResetDefaultUsers();
                      }
                    }}
                    className="text-xs text-slate-500 hover:text-red-600 px-3 py-2 rounded-xl border border-slate-200 hover:bg-red-50 flex items-center space-x-1 transition-colors cursor-pointer"
                    title="Khôi phục tài khoản mặc định"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Khôi phục mặc định</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenCreateUser}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Thêm Người Dùng</span>
                </button>
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
                    {paginatedAdminUsers.map((user) => (
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
          
              {/* Thanh phân trang người dùng chuẩn 10 người dùng / trang */}
              <AdminPagination
                currentPage={adminUserPage}
                totalPages={totalAdminUserPages}
                totalItems={filteredUsers.length}
                itemsPerPage={adminUsersPerPage}
                itemLabel="người dùng"
                onPageChange={setAdminUserPage}
                onPerPageChange={(per) => {
                  setAdminUsersPerPage(per);
                  setAdminUserPage(1);
                }}
              />
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

              <div className="flex flex-wrap items-center gap-2">
                {/* Lọc theo từng sản phẩm */}
                <select
                  value={selectedProductReviewFilter}
                  onChange={(e) => setSelectedProductReviewFilter(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 max-w-[200px] truncate font-medium"
                >
                  <option value="all">📦 Tất cả sản phẩm ({products.length})</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

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

            {/* Banner hiển thị khi đang lọc theo 1 sản phẩm cụ thể */}
            {selectedProductReviewFilter !== "all" && (() => {
              const currentProd = products.find((p) => p.id === selectedProductReviewFilter);
              if (!currentProd) return null;
              return (
                <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={currentProd.imageUrl}
                      alt={currentProd.name}
                      className="w-12 h-12 object-cover rounded-xl border border-slate-200 bg-white shadow-sm"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                          {currentProd.id}
                        </span>
                        <span className="text-xs text-slate-500">{currentProd.category}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">{currentProd.name}</h4>
                      <p className="text-xs text-blue-700 font-bold">{formatVND(currentProd.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 font-medium">Đánh giá sản phẩm này:</div>
                      <div className="font-black text-amber-500 text-sm flex items-center justify-end space-x-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{currentProd.rating} / 5 ({filteredReviews.length} nhận xét)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProductReviewFilter("all")}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                    >
                      Xem tất cả
                    </button>
                  </div>
                </div>
              );
            })()}

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
                    {paginatedAdminReviews.map((rev) => {
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
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditReview(rev)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Chỉnh sửa đánh giá này"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingReviewId(rev.id)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Xóa đánh giá khỏi MongoDB"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          
              {/* Thanh phân trang đánh giá chuẩn 10 nhận xét / trang */}
              <AdminPagination
                currentPage={adminReviewPage}
                totalPages={totalAdminReviewPages}
                totalItems={filteredReviews.length}
                itemsPerPage={adminReviewsPerPage}
                itemLabel="đánh giá"
                onPageChange={setAdminReviewPage}
                onPerPageChange={(per) => {
                  setAdminReviewsPerPage(per);
                  setAdminReviewPage(1);
                }}
              />
            </div>
        </div>
      )}

      {/* 5. TAB QUẢN LÝ MÃ GIẢM GIÁ (COUPONS) */}
      {adminTab === "coupons" && <CouponsTab />}

      {/* 6. TAB BÁO CÁO & THỐNG KÊ DOANH THU (ANALYTICS) */}
      {adminTab === "analytics" && <AnalyticsTab orders={orders} />}

      {/* 7. TAB QUẢN LÝ THỂ LOẠI SÁCH (CATEGORIES) */}
      {adminTab === "categories" && <CategoriesTab />}

      {/* CONFIRM DELETE REVIEW MODAL (Sử dụng createPortal gắn trực tiếp vào body để che phủ toàn màn hình, không bị cắt ngang header) */}
      {deletingReviewId && createPortal(
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/70 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
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
        </div>,
        document.body
      )}

      {/* EDIT REVIEW MODAL (Sử dụng createPortal gắn vào body để backdrop mờ trọn vẹn màn hình) */}
      {isEditReviewModalOpen && editingReview && createPortal(
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 sm:px-6 py-3 sm:py-3.5 bg-white shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Chỉnh Sửa Đánh Giá</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditReview} className="flex flex-col flex-1 overflow-hidden text-xs">
              <div className="overflow-y-auto px-5 sm:px-6 py-4 space-y-4 flex-1 custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Mã Đánh Giá &amp; Mã Sản Phẩm (Chỉ đọc)
                </label>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl font-bold">
                    {editingReview.id}
                  </span>
                  <span className="font-mono text-xs px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold">
                    FK: {editingReview.productId || "None"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Người Đánh Giá *
                </label>
                <input
                  type="text"
                  required
                  value={editReviewAuthor}
                  onChange={(e) => setEditReviewAuthor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Số Sao Đánh Giá ({editReviewRating} / 5)
                </label>
                <div className="flex items-center space-x-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= editReviewRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-2">
                    {editReviewRating} sao
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Nội Dung Nhận Xét *
                </label>
                <textarea
                  rows={4}
                  required
                  value={editReviewContent}
                  onChange={(e) => setEditReviewContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 px-5 sm:px-6 py-3 border-t border-slate-200 bg-white shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
              <button
                type="button"
                onClick={() => setIsEditReviewModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                disabled={isSavingReview}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingReview ? "Đang lưu lên MongoDB..." : "Lưu Thay Đổi"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )}

      {/* CREATE / EDIT PRODUCT MODAL (Render qua createPortal vào body, giải quyết triệt để lỗi vệt cắt mờ trên header) */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)]">
            {/* Header cố định */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 sm:px-6 py-2.5 sm:py-3 bg-white shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingProduct ? "Chỉnh Sửa Sách / Sản Phẩm" : "Thêm Sách Mới Vào Kho"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {editingProduct ? "Cập nhật thông tin chi tiết và giá bán của đầu sách" : "Điền thông tin và tải ảnh sách lên hệ thống"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="overflow-y-auto px-5 sm:px-6 py-3.5 flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CỘT TRÁI: THÔNG TIN CƠ BẢN VÀ GIÁ BÁN */}
                  <div className="space-y-3">
                    {/* Tên sách */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Tên sách / sản phẩm *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Đắc Nhân Tâm, Nhà Giả Kim..."
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Danh mục, Tồn kho & Trạng thái */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Danh mục *
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[11px]"
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
                          Số lượng kho *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={formStockQuantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setFormStockQuantity(val);
                            setFormInStock(val > 0);
                          }}
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[11px] font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Trạng thái kho
                        </label>
                        <div className="flex items-center space-x-2 pt-2">
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="radio"
                              name="inStock"
                              checked={formInStock}
                              onChange={() => {
                                setFormInStock(true);
                                if (formStockQuantity <= 0) setFormStockQuantity(25);
                              }}
                              className="text-blue-600"
                            />
                            <span className="font-semibold text-emerald-600 text-[11px]">Còn</span>
                          </label>
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="radio"
                              name="inStock"
                              checked={!formInStock}
                              onChange={() => {
                                setFormInStock(false);
                                setFormStockQuantity(0);
                              }}
                              className="text-blue-600"
                            />
                            <span className="font-semibold text-red-600 text-[11px]">Hết</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Giá bán & Giá gốc - Cho phép người dùng tự do nhập mọi mệnh giá (step="any") */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Giá bán (VNĐ) *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          step="any"
                          value={formPrice}
                          onChange={(e) => setFormPrice(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatVND(formPrice)}</p>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Giá gốc (VNĐ)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={formOriginalPrice}
                          onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatVND(formOriginalPrice)}</p>
                      </div>
                    </div>

                    {/* Mô tả sách */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mô tả tóm tắt sách
                      </label>
                      <textarea
                        rows={3}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Tác phẩm sách bản quyền chính thức, tóm tắt nội dung và thông điệp nổi bật..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-[11px]"
                      />
                    </div>
                  </div>

                  {/* CỘT PHẢI: HÌNH ẢNH SẢN PHẨM & THÔNG SỐ XUẤT BẢN */}
                  <div className="space-y-3">
                    {/* Hình ảnh sản phẩm */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block font-semibold text-slate-700">
                          Hình ảnh sản phẩm <span className="text-red-500">*</span>
                        </label>

                        {/* Switch giữa chế độ tải ảnh từ máy tính và link URL */}
                        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setImageInputMode("upload")}
                            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                              imageInputMode === "upload"
                                ? "bg-white text-blue-600 shadow-xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            <Upload className="w-3 h-3" />
                            <span>Từ máy</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageInputMode("url")}
                            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                              imageInputMode === "url"
                                ? "bg-white text-blue-600 shadow-xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            <Link2 className="w-3 h-3" />
                            <span>Link URL</span>
                          </button>
                        </div>
                      </div>

                      {/* Input file ẩn */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />

                      {/* Giao diện Chế độ 1: Tải ảnh từ máy tính (Mặc định) */}
                      {imageInputMode === "upload" ? (
                        <div>
                          {!formImageUrl ? (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              onDrop={handleDropImage}
                              onDragOver={handleDragOverImage}
                              className="group border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/40 rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="w-4 h-4" />
                              </div>
                              <p className="text-[11px] font-bold text-slate-800">
                                Bấm chọn ảnh từ máy tính
                              </p>
                              <p className="text-[10px] text-slate-400">
                                hoặc kéo thả ảnh vào đây (PNG, JPG, WEBP)
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                              <div className="relative w-14 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300 shadow-xs">
                                <img
                                  src={formImageUrl}
                                  alt="Ảnh sản phẩm xem trước"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center space-x-1.5">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">
                                    <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                                    Ảnh từ máy
                                  </span>
                                  {uploadedFileSize && (
                                    <span className="text-[9px] text-slate-400">
                                      ({uploadedFileSize})
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-semibold text-slate-800 truncate">
                                  {uploadedFileName || "Đã chọn ảnh từ máy tính"}
                                </p>
                                <div className="flex items-center space-x-1.5 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded text-[10px] font-semibold transition-colors flex items-center space-x-1"
                                  >
                                    <Upload className="w-2.5 h-2.5 text-blue-600" />
                                    <span>Đổi</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-semibold transition-colors flex items-center space-x-1"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                    <span>Xóa</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          {isCompressingImage && (
                            <p className="text-[10px] text-blue-600 font-medium mt-0.5 animate-pulse">
                              Đang tối ưu dung lượng ảnh...
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            placeholder="Dán link ảnh: https://..."
                            value={formImageUrl}
                            onChange={(e) => setFormImageUrl(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[11px]"
                          />
                          <div className="flex items-center gap-1 flex-wrap">
                            {SAMPLE_IMAGES.slice(0, 4).map((sample) => (
                              <button
                                key={sample.label}
                                type="button"
                                onClick={() => {
                                  setFormImageUrl(sample.url);
                                  setUploadedFileName(sample.label);
                                  setUploadedFileSize("");
                                }}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-medium text-slate-700 border"
                              >
                                {sample.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Thông số xuất bản */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-slate-800 text-[11px]">
                          Thông số xuất bản:
                        </label>
                        <span className="text-[10px] text-slate-400">
                          ({Object.keys(formSpecs).length} thông số)
                        </span>
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                        {Object.entries(formSpecs).map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded-md border text-[11px]">
                            <span className="text-slate-600 font-medium truncate">{key}: <span className="text-slate-900 font-semibold">{val}</span></span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSpec(key)}
                              className="text-red-500 hover:text-red-700 p-0.5 shrink-0 ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex space-x-1.5 pt-1">
                        <input
                          type="text"
                          placeholder="Thông số (VD: Tác giả)"
                          value={newSpecKey}
                          onChange={(e) => setNewSpecKey(e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                        />
                        <input
                          type="text"
                          placeholder="Giá trị (VD: Dale Carnegie)"
                          value={newSpecVal}
                          onChange={(e) => setNewSpecVal(e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={handleAddSpec}
                          className="px-2.5 py-1 bg-slate-800 text-white rounded-lg text-[11px] font-bold hover:bg-slate-700 shrink-0"
                        >
                          Thêm
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons: Cố định ở chân modal, luôn hiển thị rõ ràng */}
              <div className="flex items-center justify-end space-x-3 px-5 sm:px-6 py-2.5 border-t border-slate-200 bg-white shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingProduct ? "Lưu Thay Đổi" : "Tạo Sản Phẩm Mới"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRMATION MODAL (createPortal trực tiếp ra body) */}
      {deletingProductId && createPortal(
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/70 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
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
        </div>,
        document.body
      )}

      {/* CREATE / EDIT USER MODAL (createPortal trực tiếp ra body) */}
      {isUserModalOpen && createPortal(
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)]">
            {/* Header cố định */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 sm:px-6 py-3 sm:py-3.5 bg-white shrink-0">
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
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUserForm} className="flex flex-col flex-1 overflow-hidden text-xs">
              <div className="overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5 flex-1 custom-scrollbar">
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
            </div>

            {/* Submit Buttons: Cố định chân modal */}
            <div className="flex items-center justify-end space-x-3 px-5 sm:px-6 py-3 border-t border-slate-200 bg-white shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{editingUser ? "Lưu Thông Tin" : "Tạo Tài Khoản"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )}

      {/* DELETE USER CONFIRMATION MODAL (createPortal trực tiếp ra body) */}
      {deletingUserId && createPortal(
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/70 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
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
        </div>,
        document.body
      )}

      {/* MODAL HẸN GIỜ LẤY HÀNG CHO SHIPPER (ADMIN) */}
      {pickupModalOrder && (
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/70 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Xác Nhận &amp; Hẹn Giờ Shipper
                  </h3>
                  <p className="text-xs text-slate-400">Đơn hàng #{pickupModalOrder.id}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPickupModalOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thông tin tóm tắt đơn hàng */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <strong className="text-slate-800">{pickupModalOrder.customerInfo.fullName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="text-slate-700">{pickupModalOrder.customerInfo.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Địa chỉ:</span>
                <span className="text-slate-700 truncate max-w-[200px]" title={pickupModalOrder.customerInfo.address}>
                  {pickupModalOrder.customerInfo.address}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Tổng thanh toán:</span>
                <strong className="text-red-600 font-black">{formatVND(pickupModalOrder.totalAmount)}</strong>
              </div>
            </div>

            {/* Chọn thời gian lấy hàng */}
            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-800">
                Thời gian shipper đến kho lấy sách:
              </label>
              <input
                type="datetime-local"
                value={pickupDateTime}
                onChange={(e) => setPickupDateTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Các nút chọn nhanh thời gian */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block">Chọn nhanh lịch hẹn:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const t = new Date(Date.now() + 60000);
                      setPickupDateTime(t.toISOString().slice(0, 16));
                    }}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold text-left transition-colors cursor-pointer"
                  >
                    ⚡ Lấy ngay (+1 phút)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = new Date(Date.now() + 15 * 60000);
                      setPickupDateTime(t.toISOString().slice(0, 16));
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium text-left transition-colors cursor-pointer"
                  >
                    🕒 Sau 15 phút
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = new Date(Date.now() + 30 * 60000);
                      setPickupDateTime(t.toISOString().slice(0, 16));
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium text-left transition-colors cursor-pointer"
                  >
                    🕒 Sau 30 phút
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = new Date(Date.now() + 60 * 60000);
                      setPickupDateTime(t.toISOString().slice(0, 16));
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium text-left transition-colors cursor-pointer"
                  >
                    🕒 Sau 1 giờ
                  </button>
                </div>
              </div>
            </div>

            {/* Chọn đơn vị vận chuyển */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-800">
                Đơn vị vận chuyển liên kết:
              </label>
              <select
                value={pickupCarrier}
                onChange={(e) => setPickupCarrier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Giao Hàng Nhanh (GHN)">Giao Hàng Nhanh (GHN)</option>
                <option value="Viettel Post">Viettel Post</option>
                <option value="Shopee Xpress">Shopee Xpress</option>
                <option value="Giao Hàng Tiết Kiệm (GHTK)">Giao Hàng Tiết Kiệm (GHTK)</option>
                <option value="J&T Express">J&amp;T Express</option>
              </select>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPickupModalOrder(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-100 text-xs transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!pickupModalOrder) return;
                  const finalPickupTime = pickupDateTime
                    ? new Date(pickupDateTime).toISOString()
                    : new Date(Date.now() + 15 * 60000).toISOString();

                  onUpdateOrderStatus(pickupModalOrder.id, "Chờ lấy hàng", {
                    pickupTime: finalPickupTime,
                    shippingCarrier: pickupCarrier,
                  });
                  setPickupModalOrder(null);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Xác Nhận &amp; Lưu Lịch Shipper</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IN HÓA ĐƠN TRONG ADMIN */}
      <InvoiceModal
        isOpen={Boolean(selectedInvoiceOrder)}
        order={selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
      />
    </div>
  );
}
