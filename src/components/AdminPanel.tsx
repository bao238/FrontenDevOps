import React, { useState, useMemo, useEffect, useRef } from "react";
// Import createPortal để render modal trực tiếp ra document.body, tránh lỗi cắt ngang header do stacking context hoặc space-y
import { createPortal } from "react-dom";
import { Product, CATEGORIES, ReviewItem, normalizeCategoryName } from "../data/products";
import { UserAccount } from "../data/users";
import { api } from "../services/api";
import {
  LayoutList,
  LayoutGrid,
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
  Check,
  CornerDownRight,
  EyeOff,
  Send,
  Bell
} from "lucide-react";
import CouponsTab from "./admin/CouponsTab";
import NotificationsTab from "./admin/NotificationsTab";
import AnalyticsTab from "./admin/AnalyticsTab";
import CategoriesTab from "./admin/CategoriesTab";
import AdminPagination from "./admin/AdminPagination";
import InvoiceModal from "./InvoiceModal";
import { SearchableSelect } from "./SearchableSelect";

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

const DEFAULT_PUBLISHERS = [
  "NXB Trẻ",
  "NXB Kim Đồng",
  "NXB Tổng Hợp TP.HCM",
  "NXB Hội Nhà Văn",
  "NXB Văn Học",
  "NXB Thế Giới",
  "NXB Lao Động",
  "NXB Thông Tin & Truyền Thông",
  "NXB Tri Thức",
  "NXB Bách Khoa",
  "NXB Công Thương",
  "NXB Khoa Học Xã Hội",
  "Cambridge University",
  "Oxford University Press",
  "NXB Giáo Dục Việt Nam",
  "NXB Phụ Nữ Việt Nam",
  "NXB Dân Trí",
  "NXB Chính Trị Quốc Gia Sự Thật",
];

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
    "products" | "orders" | "users" | "reviews" | "coupons" | "notifications" | "analytics" | "categories"
  >("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  // Thể loại sách động tải trực tiếp từ MongoDB API (/api/categories)
  const [adminCategories, setAdminCategories] = useState<string[]>(CATEGORIES);

  useEffect(() => {
    let isMounted = true;
    const fetchAdminCategories = async () => {
      try {
        const cats = await api.getCategories();
        if (isMounted && Array.isArray(cats) && cats.length > 0) {
          const activeNames = cats
            .filter((c) => c.isActive !== false)
            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
            .map((c) => c.name);
          if (activeNames.length > 0) {
            setAdminCategories(["Tất cả", ...activeNames]);
          }
        }
      } catch (err) {
        console.warn("⚠️ Không thể tải danh mục thể loại sách trong Admin:", err);
      }
    };
    fetchAdminCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Danh sách các Nhà xuất bản cho dropdown thanh xổ xuống khi tạo/sửa sách
  const [availablePublishers, setAvailablePublishers] = useState<string[]>(DEFAULT_PUBLISHERS);

  useEffect(() => {
    let isMounted = true;
    api.getFilterOptions().then((res) => {
      if (isMounted && res && res.publishers && res.publishers.length > 0) {
        setAvailablePublishers((prev) => {
          const set = new Set([...prev, ...res.publishers]);
          return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
        });
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Tổng hợp danh sách NXB từ database, danh sách mặc định và từ các sản phẩm hiện có
  const publisherOptions = useMemo(() => {
    const set = new Set(availablePublishers);
    products.forEach((p) => {
      if (p.publisher && p.publisher.trim()) set.add(p.publisher.trim());
      if (p.specs && p.specs["Nhà xuất bản"] && p.specs["Nhà xuất bản"].trim()) {
        set.add(p.specs["Nhà xuất bản"].trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [availablePublishers, products]);
  // Quản lý Bộ lọc Kho sách (Stock Filter: Tất cả, Còn hàng, Sắp hết <=5, Hết hàng)
  const [selectedStockFilter, setSelectedStockFilter] = useState<
    "all" | "in_stock" | "low_stock" | "out_of_stock"
  >("all");

  // Reviews Management State (MongoDB)
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | string>("all");
  const [selectedProductReviewFilter, setSelectedProductReviewFilter] = useState<string>("all");
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Modal Phân Quyền & Khóa / Mở Khóa Tài Khoản Người Dùng
  const [roleModalUser, setRoleModalUser] = useState<UserAccount | null>(null);
  const [roleModalRole, setRoleModalRole] = useState<"admin" | "staff" | "customer">("customer");
  const [roleModalStatus, setRoleModalStatus] = useState<"active" | "locked">("active");
  const [isUpdatingUserRole, setIsUpdatingUserRole] = useState(false);

  // Modal Phản Hồi Đánh Giá Độc Giả
  const [replyingReview, setReplyingReview] = useState<ReviewItem | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Lọc đánh giá theo nhóm cảm xúc (Tất cả, 5 sao, 4 sao, Tích cực 4-5 sao, Cần hỗ trợ 1-2 sao)
  const [reviewSentimentFilter, setReviewSentimentFilter] = useState<string>("all");

  // Xử lý lưu Phân Quyền & Khóa/Mở Khóa Người Dùng (Cập nhật tức thì không cần load lại trang)
  const handleSaveUserRoleStatus = async () => {
    if (!roleModalUser) return;
    setIsUpdatingUserRole(true);
    try {
      // Bảo vệ phân quyền: Admin được thiết lập cố định trong MongoDB, không cho phép nâng cấp hoặc hạ cấp qua UI
      const finalRole: "admin" | "staff" | "customer" =
        roleModalUser.role === "admin"
          ? "admin"
          : (roleModalRole === "admin" ? "customer" : roleModalRole);

      const updatedUser: UserAccount = {
        ...roleModalUser,
        role: finalRole,
        status: roleModalStatus
      };

      // 1. Cập nhật tức thì danh sách hiển thị trên giao diện (Optimistic UI)
      setServerUsers((prev) =>
        prev.map((u) => (u.id === roleModalUser.id ? updatedUser : u))
      );

      // 2. Cập nhật lên state users của App.tsx để đồng bộ toàn bộ app & hiển thị toast
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      // 3. Cập nhật tức thì các thẻ thống kê KPI Cards (Quản trị, Nhân viên, Khách hàng, Bị khóa)
      setServerUserStats((prev: any) => {
        if (!prev) return prev;
        const oldRole = roleModalUser.role || "customer";
        const newRole = finalRole;
        const oldStatus = roleModalUser.status || "active";
        const newStatus = roleModalStatus;

        let adminCount = prev.adminCount || 0;
        let staffCount = prev.staffCount || 0;
        let customerCount = prev.customerCount || 0;
        let lockedCount = prev.lockedCount || 0;

        // Cập nhật số đếm theo vai trò
        if (oldRole !== newRole) {
          if (oldRole === "admin") adminCount = Math.max(0, adminCount - 1);
          if (oldRole === "staff") staffCount = Math.max(0, staffCount - 1);
          if (oldRole === "customer") customerCount = Math.max(0, customerCount - 1);

          if (newRole === "admin") adminCount++;
          if (newRole === "staff") staffCount++;
          if (newRole === "customer") customerCount++;
        }

        // Cập nhật số đếm theo trạng thái khóa/mở khóa
        if (oldStatus !== newStatus) {
          if (newStatus === "locked") lockedCount++;
          else lockedCount = Math.max(0, lockedCount - 1);
        }

        return {
          ...prev,
          adminCount,
          staffCount,
          customerCount,
          lockedCount
        };
      });

      // 4. Xóa cache cũ để đồng bộ dữ liệu mới nhất
      userPageCacheRef.current.clear();

      // 5. Gửi request cập nhật lên MongoDB
      await api.updateUser(roleModalUser.id, {
        role: finalRole,
        status: roleModalStatus
      });

      // 6. Nạp lại dữ liệu người dùng từ MongoDB để đồng bộ phân trang tuyệt đối
      await fetchServerUsers(adminUserPage, adminUsersPerPage);

      setRoleModalUser(null);
    } catch (err) {
      console.error("Lỗi khi cập nhật vai trò người dùng:", err);
    } finally {
      setIsUpdatingUserRole(false);
    }
  };

  // Xử lý gửi phản hồi của Ban Quản Trị đến Đánh Giá của Độc Giả
  const handleSaveReviewReply = async () => {
    if (!replyingReview) return;
    setIsSubmittingReply(true);
    try {
      const trimmed = adminReplyText.trim();
      const updatedReview: ReviewItem = {
        ...replyingReview,
        adminReply: trimmed || null,
        repliedAt: trimmed ? new Date().toISOString() : null
      };

      // Cập nhật Optimistic vào danh sách đánh giá
      setReviewsList((prev) =>
        prev.map((r) => (r.id === replyingReview.id ? updatedReview : r))
      );
      // Xóa cache để làm mới
      reviewPageCacheRef.current.clear();

      await api.replyToReview(replyingReview.id, trimmed);
      setReplyingReview(null);
      setAdminReplyText("");
    } catch (err) {
      console.error("Lỗi khi gửi phản hồi đánh giá:", err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Xử lý Ẩn / Hiện Đánh Giá (Kiểm duyệt nội dung)
  const handleToggleReviewModeration = async (rev: ReviewItem) => {
    const newStatus = rev.moderationStatus === "hidden" ? "approved" : "hidden";
    // Cập nhật Optimistic UI
    setReviewsList((prev) =>
      prev.map((r) => (r.id === rev.id ? { ...r, moderationStatus: newStatus } : r))
    );
    reviewPageCacheRef.current.clear();

    await api.updateReviewModeration(rev.id, newStatus);
  };

  // Edit Review Modal State
  const [isEditReviewModalOpen, setIsEditReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [editReviewAuthor, setEditReviewAuthor] = useState("");
  const [editReviewRating, setEditReviewRating] = useState(5);
  const [editReviewContent, setEditReviewContent] = useState("");
  const [isSavingReview, setIsSavingReview] = useState(false);
  // Modal In Hóa Đơn trong Admin
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<OrderRecord | null>(null);

  // Quản lý Bộ Lọc Đơn Hàng trong Admin
  const [adminOrderFilter, setAdminOrderFilter] = useState<
    "all" | "Chờ xác nhận" | "Chờ lấy hàng" | "Chờ giao hàng" | "Hoàn tất" | "Đã hủy"
  >("all");
  // Tìm kiếm, Chế độ xem & Modal chi tiết đơn hàng
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [debouncedOrderSearch, setDebouncedOrderSearch] = useState("");
  const [orderViewMode, setOrderViewMode] = useState<"table" | "card">("table");
  const [viewingOrderDetail, setViewingOrderDetail] = useState<OrderRecord | null>(null);

  // Debounce tìm kiếm đơn hàng 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedOrderSearch(orderSearchQuery), 300);
    return () => clearTimeout(timer);
  }, [orderSearchQuery]);

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

  // Cắt danh sách đơn hàng cho trang hiện tại
  const paginatedAdminOrders = useMemo(() => {
    const startIndex = (adminOrderPage - 1) * adminOrdersPerPage;
    return filteredAdminOrders.slice(startIndex, startIndex + adminOrdersPerPage);
  }, [filteredAdminOrders, adminOrderPage, adminOrdersPerPage]);

  // Server-Side State cho Đơn hàng trong Admin
  const [serverOrders, setServerOrders] = useState<OrderRecord[]>([]);
  const [serverTotalOrders, setServerTotalOrders] = useState<number>(25013);
  const [serverTotalOrderPages, setServerTotalOrderPages] = useState<number>(1251);
  const [serverOrderStats, setServerOrderStats] = useState<{
    total: number;
    pending: number;
    pickup: number;
    shipping: number;
    completed: number;
    canceled: number;
    totalRevenue?: number;
  }>({
    total: 25013,
    pending: 6258,
    pickup: 6250,
    shipping: 6250,
    completed: 6255,
    canceled: 0,
    totalRevenue: 18185464000
  });

  // Bộ nhớ đệm phân trang Đơn Hàng (In-Memory Page Cache) - Chuyển trang tức thì 0ms
  const orderPageCacheRef = useRef<Map<string, { data: OrderRecord[]; count: number; totalPages: number; stats?: any }>>(new Map());

  // Tải trước trang đơn hàng ngầm (Smart Background & Hover Prefetching)
  const prefetchOrdersPage = async (page: number) => {
    if (page < 1 || page > serverTotalOrderPages) return;
    const cacheKey = `${page}-${adminOrdersPerPage}-${adminOrderFilter}-${debouncedOrderSearch}`;
    if (orderPageCacheRef.current.has(cacheKey)) return;
    try {
      const res = await api.getOrders({
        page,
        limit: adminOrdersPerPage,
        status: adminOrderFilter,
        search: debouncedOrderSearch
      });
      if (res && res.source === "mongodb" && res.data) {
        orderPageCacheRef.current.set(cacheKey, {
          data: res.data,
          count: res.count ?? res.totalAllCount ?? res.data.length,
          totalPages: res.totalPages || 1,
          stats: res.stats
        });
      }
    } catch {}
  };

  const fetchServerOrders = async (page = adminOrderPage, limit = adminOrdersPerPage, skipCache = false) => {
    const cacheKey = `${page}-${limit}-${adminOrderFilter}-${debouncedOrderSearch}`;
    if (!skipCache && orderPageCacheRef.current.has(cacheKey)) {
      const cached = orderPageCacheRef.current.get(cacheKey)!;
      setServerOrders(cached.data);
      setServerTotalOrders(cached.count);
      setServerTotalOrderPages(cached.totalPages);
      if (cached.stats) setServerOrderStats(cached.stats);
      // Tự động tải trước trang tiếp theo ngầm
      if (page < cached.totalPages) {
        prefetchOrdersPage(page + 1);
      }
      return;
    }

    try {
      const res = await api.getOrders({
        page,
        limit,
        status: adminOrderFilter,
        search: debouncedOrderSearch
      });
      if (res && res.source === "mongodb" && res.data) {
        setServerOrders(res.data);
        setServerTotalOrders(res.count ?? res.totalAllCount ?? res.data.length);
        setServerTotalOrderPages(res.totalPages || 1);
        if (res.stats) {
          setServerOrderStats(res.stats as any);
        }
        orderPageCacheRef.current.set(cacheKey, {
          data: res.data,
          count: res.count ?? res.totalAllCount ?? res.data.length,
          totalPages: res.totalPages || 1,
          stats: res.stats
        });
        // Tự động tải trước trang tiếp theo ngầm
        if (page < (res.totalPages || 1)) {
          prefetchOrdersPage(page + 1);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải đơn hàng từ MongoDB:", err);
    }
  };

  // Hệ thống đồng bộ đơn hàng Real-time cho Admin Console (BroadcastChannel, StorageEvent, Visibility, Focus & Smart Polling)
  // Tự động nhận và cập nhật đơn hàng mới ngay khi khách hàng bấm Đặt Hàng mà không cần load lại trang
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("bookstore_orders_sync");
      channel.onmessage = (event) => {
        if (event.data?.type === "ORDER_CREATED" || event.data?.type === "ORDER_STATUS_UPDATED") {
          orderPageCacheRef.current.clear();
          fetchServerOrders(adminOrderPage, adminOrdersPerPage, true);
        }
      };
    } catch {
      // ignore
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bookstore_orders") {
        orderPageCacheRef.current.clear();
        fetchServerOrders(adminOrderPage, adminOrdersPerPage, true);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        orderPageCacheRef.current.clear();
        fetchServerOrders(adminOrderPage, adminOrdersPerPage, true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    // Smart Polling mỗi 3 giây khi Admin đang mở tab Đơn Hàng để tự động tải đơn mới ngay lập tức
    const pollTimer = setInterval(() => {
      if (document.visibilityState === "visible" && adminTab === "orders") {
        fetchServerOrders(adminOrderPage, adminOrdersPerPage, true);
      }
    }, 3000);

    return () => {
      channel?.close();
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      clearInterval(pollTimer);
    };
  }, [adminOrderPage, adminOrdersPerPage, adminOrderFilter, debouncedOrderSearch, adminTab]);

  // Reset trang về 1 khi người dùng đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm
  useEffect(() => {
    setAdminOrderPage(1);
  }, [adminOrderFilter, debouncedOrderSearch]);

  useEffect(() => {
    fetchServerOrders(adminOrderPage, adminOrdersPerPage);
  }, [adminOrderPage, adminOrdersPerPage, adminOrderFilter, debouncedOrderSearch]);

  const displayAdminOrders = serverOrders.length > 0 ? serverOrders : paginatedAdminOrders;
  const displayTotalOrderCount = serverTotalOrders > 0 ? serverTotalOrders : filteredAdminOrders.length;
  const displayTotalOrderPages = serverTotalOrders > 0 ? serverTotalOrderPages : totalAdminOrderPages;

  // Đảm bảo trang đơn hàng không vượt quá tổng số trang máy chủ
  useEffect(() => {
    if (adminOrderPage > displayTotalOrderPages) {
      setAdminOrderPage(displayTotalOrderPages);
    }
  }, [adminOrderPage, displayTotalOrderPages]);

  // Cập nhật trạng thái đơn hàng thời gian thực (Real-time UI Update 0ms)
  const handleUpdateOrderStatusRealtime = (orderId: string, newStatus: AdminOrderStatus, extraData?: any) => {
    orderPageCacheRef.current.clear();
    setServerOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, ...extraData } : o))
    );
    onUpdateOrderStatus(orderId, newStatus, extraData);
  };

  const handleDeleteOrderRealtime = (orderId: string) => {
    orderPageCacheRef.current.clear();
    setServerOrders((prev) => prev.filter((o) => o.id !== orderId));
    setServerTotalOrders((prev) => Math.max(0, prev - 1));
    onDeleteOrder(orderId);
  };

  // State phân trang đánh giá Server-Side
  const [adminReviewPage, setAdminReviewPage] = useState<number>(1);
  const [adminReviewsPerPage, setAdminReviewsPerPage] = useState<number>(10);
  const [totalAdminReviews, setTotalAdminReviews] = useState<number>(25229);
  const [totalAdminReviewPages, setTotalAdminReviewPages] = useState<number>(2523);
  const [serverReviewStats, setServerReviewStats] = useState<{ total: number; fiveStar: number; avg: string } | null>({
    total: 25229,
    fiveStar: 20183,
    avg: "4.8"
  });
  const [debouncedReviewSearchQuery, setDebouncedReviewSearchQuery] = useState(reviewSearchQuery);

  // Debounce tìm kiếm đánh giá 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedReviewSearchQuery(reviewSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [reviewSearchQuery]);

  // Bộ nhớ đệm phân trang Đánh Giá (In-Memory Page Cache) - Phản hồi 0ms khi chuyển qua lại giữa các trang
  const reviewPageCacheRef = useRef<Map<string, { data: ReviewItem[]; count: number; totalPages: number; stats?: any }>>(new Map());

  // Tải trước trang đánh giá ngầm (Smart Background & Hover Prefetching)
  const prefetchReviewsPage = async (page: number) => {
    if (page < 1 || page > totalAdminReviewPages) return;
    const cacheKey = `${page}-${adminReviewsPerPage}-${reviewRatingFilter}-${selectedProductReviewFilter}-${debouncedReviewSearchQuery}`;
    if (reviewPageCacheRef.current.has(cacheKey)) return;
    try {
      const res = await api.getAllReviews({
        page,
        limit: adminReviewsPerPage,
        rating: reviewRatingFilter,
        search: debouncedReviewSearchQuery,
        productId: selectedProductReviewFilter
      });
      if (res && res.source === "mongodb" && res.data) {
        const count = res.count ?? res.totalAllCount ?? res.data.length;
        const totalPages = res.totalPages || Math.ceil(count / adminReviewsPerPage) || 1;
        reviewPageCacheRef.current.set(cacheKey, {
          data: res.data,
          count,
          totalPages,
          stats: res.stats
        });
      }
    } catch {}
  };

  // Tải danh sách đánh giá từ MongoDB hỗ trợ Server-Side Pagination & In-Memory Caching
  const fetchReviews = async (page = adminReviewPage, limit = adminReviewsPerPage) => {
    const cacheKey = `${page}-${limit}-${reviewRatingFilter}-${selectedProductReviewFilter}-${debouncedReviewSearchQuery}`;
    if (reviewPageCacheRef.current.has(cacheKey)) {
      const cached = reviewPageCacheRef.current.get(cacheKey)!;
      setReviewsList(cached.data);
      setTotalAdminReviews(cached.count);
      setTotalAdminReviewPages(cached.totalPages);
      if (cached.stats) setServerReviewStats(cached.stats);
      // Tự động tải trước trang tiếp theo ngầm
      if (page < cached.totalPages) {
        prefetchReviewsPage(page + 1);
      }
      return;
    }

    setIsLoadingReviews(true);
    try {
      const res = await api.getAllReviews({
        page,
        limit,
        rating: reviewRatingFilter,
        search: debouncedReviewSearchQuery,
        productId: selectedProductReviewFilter
      });
      if (res && res.source === "mongodb" && res.data) {
        setReviewsList(res.data);
        const count = res.count ?? res.totalAllCount ?? res.data.length;
        const totalPages = res.totalPages || Math.ceil(count / limit) || 1;
        setTotalAdminReviews(count);
        setTotalAdminReviewPages(totalPages);
        if (res.stats) {
          setServerReviewStats(res.stats as any);
        }
        reviewPageCacheRef.current.set(cacheKey, {
          data: res.data,
          count,
          totalPages,
          stats: res.stats
        });
        // Tự động tải trước trang tiếp theo ngầm
        if (page < totalPages) {
          prefetchReviewsPage(page + 1);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải đánh giá từ MongoDB:", err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews(adminReviewPage, adminReviewsPerPage);
  }, [adminReviewPage, adminReviewsPerPage, reviewRatingFilter, debouncedReviewSearchQuery, selectedProductReviewFilter]);

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
      reviewPageCacheRef.current.clear();
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
      setTotalAdminReviews((prev) => Math.max(0, prev - 1));
      reviewPageCacheRef.current.clear();
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
      const matchRating =
        reviewRatingFilter === "all" ||
        (reviewRatingFilter === "4-5"
          ? (rev.rating >= 4)
          : reviewRatingFilter === "1-2"
          ? (rev.rating <= 2)
          : rev.rating === Number(reviewRatingFilter));
      const matchProduct =
        selectedProductReviewFilter === "all" || rev.productId === selectedProductReviewFilter;
      return matchSearch && matchRating && matchProduct;
    });
  }, [reviewsList, reviewSearchQuery, reviewRatingFilter, selectedProductReviewFilter]);

  // Phân trang danh sách đánh giá từ MongoDB (mặc định 10 đánh giá / trang)
  useEffect(() => {
    setAdminReviewPage(1);
  }, [debouncedReviewSearchQuery, reviewRatingFilter, selectedProductReviewFilter]);
  const localTotalAdminReviewPages = Math.max(1, Math.ceil(filteredReviews.length / adminReviewsPerPage));
  const displayTotalReviewPages = totalAdminReviews > 0 ? totalAdminReviewPages : localTotalAdminReviewPages;
  useEffect(() => {
    if (adminReviewPage > displayTotalReviewPages) {
      setAdminReviewPage(displayTotalReviewPages);
    }
  }, [adminReviewPage, displayTotalReviewPages]);

  // Khi phân trang trên server MongoDB, reviewsList ĐÃ là danh sách đúng của trang hiện tại (e.g. 10 phần tử của trang 2).
  // Tuyệt đối không slice((page - 1) * limit) nữa vì sẽ làm trang 2, 3... bị rỗng mảng!
  const displayAdminReviews = useMemo(() => {
    if (totalAdminReviews > 0) {
      return reviewsList;
    }
    const startIndex = (adminReviewPage - 1) * adminReviewsPerPage;
    return filteredReviews.slice(startIndex, startIndex + adminReviewsPerPage);
  }, [totalAdminReviews, reviewsList, filteredReviews, adminReviewPage, adminReviewsPerPage]);

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
  const userAvatarFileInputRef = useRef<HTMLInputElement>(null);
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
    const validAmount = Number(amount);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(isNaN(validAmount) ? 0 : validAmount);
  };

  // Chuẩn hóa tên hình thức thanh toán tiếng Việt, loại bỏ in hoa toàn bộ (ALL-CAPS BODY TEXT)
  const formatPaymentMethodName = (method?: string) => {
    if (!method) return "Chuyển khoản QR";
    const m = method.toLowerCase();
    if (m.includes("qr") || m.includes("banking") || m.includes("khoản")) return "Chuyển khoản QR";
    if (m.includes("cod") || m.includes("nhận hàng") || m.includes("tiền mặt")) return "Tiền mặt (COD)";
    if (m.includes("thẻ") || m.includes("card")) return "Thẻ ngân hàng";
    return method;
  };

  // Filtered Products for Admin Table (Đã kết hợp Bộ lọc Kho hàng)
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCat =
        selectedCategory === "Tất cả" ||
        item.category === selectedCategory ||
        normalizeCategoryName(item.category) === selectedCategory;
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
  const paginatedAdminProducts = useMemo(() => {
    const startIndex = (adminProdPage - 1) * adminProdPerPage;
    return filteredProducts.slice(startIndex, startIndex + adminProdPerPage);
  }, [filteredProducts, adminProdPage, adminProdPerPage]);

  // Debounce tìm kiếm sản phẩm 300ms (Tránh gọi API liên tục mỗi phím gõ)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Bộ nhớ đệm phân trang Sản phẩm (In-Memory Page Cache) - Chuyển qua lại giữa các trang mượt 0ms
  const productPageCacheRef = useRef<Map<string, { data: Product[]; count: number; totalPages: number; stats?: any }>>(new Map());

  // Server-Side State cho Sản phẩm trong Admin (Tránh nạp toàn bộ 10.000+ sản phẩm gây tràn RAM)
  const [serverProducts, setServerProducts] = useState<Product[]>([]);
  const [serverTotalProducts, setServerTotalProducts] = useState<number>(0);
  const [serverTotalProdPages, setServerTotalProdPages] = useState<number>(1);
  const [serverProdStats, setServerProdStats] = useState<{
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  }>({ total: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
  const [isLoadingServerProducts, setIsLoadingServerProducts] = useState<boolean>(false);

  // Tải trước trang sản phẩm ngầm (Smart Background & Hover Prefetching)
  const prefetchProductsPage = async (page: number) => {
    if (page < 1 || page > serverTotalProdPages) return;
    const cacheKey = `${page}-${adminProdPerPage}-${selectedCategory}-${debouncedSearchQuery}-${selectedStockFilter}`;
    if (productPageCacheRef.current.has(cacheKey)) return;
    try {
      const res = await api.getProducts({
        page,
        limit: adminProdPerPage,
        category: selectedCategory,
        search: debouncedSearchQuery,
        stock: selectedStockFilter
      });
      if (res && res.data) {
        productPageCacheRef.current.set(cacheKey, {
          data: res.data,
          count: res.count ?? res.totalAllCount ?? res.data.length,
          totalPages: res.totalPages || 1,
          stats: res.stats
        });
      }
    } catch {}
  };

  // Tải danh sách sản phẩm phân trang từ MongoDB
  const fetchServerProducts = async (page = adminProdPage, limit = adminProdPerPage) => {
    const cacheKey = `${page}-${limit}-${selectedCategory}-${debouncedSearchQuery}-${selectedStockFilter}`;
    if (productPageCacheRef.current.has(cacheKey)) {
      const cached = productPageCacheRef.current.get(cacheKey)!;
      setServerProducts(cached.data);
      setServerTotalProducts(cached.count);
      setServerTotalProdPages(cached.totalPages);
      if (cached.stats) setServerProdStats(cached.stats);
      // Tự động tải trước trang tiếp theo ngầm
      if (page < cached.totalPages) {
        prefetchProductsPage(page + 1);
      }
      return; // Phản hồi tức thì 0ms!
    }

    setIsLoadingServerProducts(true);
    try {
      const res = await api.getProducts({
        page,
        limit,
        category: selectedCategory,
        search: debouncedSearchQuery,
        stock: selectedStockFilter
      });
      if (res && res.data) {
        setServerProducts(res.data);
        setServerTotalProducts(res.count ?? res.totalAllCount ?? res.data.length);
        setServerTotalProdPages(res.totalPages || 1);
        if (res.stats) {
          setServerProdStats(res.stats as any);
        }
        productPageCacheRef.current.set(cacheKey, {
          data: res.data,
          count: res.count ?? res.totalAllCount ?? res.data.length,
          totalPages: res.totalPages || 1,
          stats: res.stats
        });
        // Tự động tải trước trang tiếp theo ngầm
        if (page < (res.totalPages || 1)) {
          prefetchProductsPage(page + 1);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu sản phẩm từ MongoDB:", err);
    } finally {
      setIsLoadingServerProducts(false);
    }
  };

  useEffect(() => {
    fetchServerProducts(adminProdPage, adminProdPerPage);
  }, [adminProdPage, adminProdPerPage, selectedCategory, debouncedSearchQuery, selectedStockFilter]);

  const displayAdminProducts = serverProducts.length > 0 ? serverProducts : paginatedAdminProducts;
  const displayTotalProdPages = serverTotalProducts > 0 ? serverTotalProdPages : totalAdminProdPages;
  const displayTotalProdCount = serverTotalProducts > 0 ? serverTotalProducts : filteredProducts.length;

  // Đảm bảo trang sản phẩm không vượt quá tổng số trang máy chủ (Cho phép chuyển qua trang 5, 6, 7...)
  useEffect(() => {
    if (adminProdPage > displayTotalProdPages) {
      setAdminProdPage(displayTotalProdPages);
    }
  }, [adminProdPage, displayTotalProdPages]);

  const displayTotalReviewCount = totalAdminReviews > 0 ? totalAdminReviews : reviewsList.length;

  // Statistics
  const totalRevenue = useMemo(() => {
    if (serverOrderStats?.totalRevenue) {
      return serverOrderStats.totalRevenue;
    }
    const list = serverOrders.length > 0 ? serverOrders : orders;
    return list
      .filter((o) => (o.status || (o as any).orderStatus) !== "Đã hủy")
      .reduce((sum, o) => {
        const val = Number(o.totalAmount) || Number((o as any).totalPrice) || 0;
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
  }, [orders, serverOrders, serverOrderStats]);

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

  const hasServerStats = serverProdStats.total > 0;
  const displayTotalBooks = hasServerStats ? serverProdStats.total : (serverTotalProducts > 0 ? serverTotalProducts : products.length);
  const displayInStockCount = hasServerStats ? serverProdStats.inStock : inStockCount;
  const displayLowStockCount = hasServerStats ? serverProdStats.lowStock : lowStockCount;
  const displayOutOfStockCount = hasServerStats ? serverProdStats.outOfStock : outOfStockCount;

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
  const paginatedAdminUsers = useMemo(() => {
    const startIndex = (adminUserPage - 1) * adminUsersPerPage;
    return filteredUsers.slice(startIndex, startIndex + adminUsersPerPage);
  }, [filteredUsers, adminUserPage, adminUsersPerPage]);

  // Debounce tìm kiếm người dùng 300ms
  const [debouncedUserSearchQuery, setDebouncedUserSearchQuery] = useState(userSearchQuery);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearchQuery(userSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  // Bộ nhớ đệm phân trang Người dùng (In-Memory Page Cache)
  const userPageCacheRef = useRef<Map<string, { data: UserAccount[]; count: number; totalPages: number; stats?: any }>>(new Map());

  // Server-Side State cho Người dùng trong Admin
  const [serverUsers, setServerUsers] = useState<UserAccount[]>([]);
  const [serverTotalUsers, setServerTotalUsers] = useState<number>(0);
  const [serverTotalUserPages, setServerTotalUserPages] = useState<number>(1);
  const [serverUserStats, setServerUserStats] = useState<any>(null);

  // Tải trước trang người dùng ngầm (Smart Background & Hover Prefetching)
  const prefetchUsersPage = async (page: number) => {
    if (page < 1 || page > serverTotalUserPages) return;
    const cacheKey = `${page}-${adminUsersPerPage}-${userRoleFilter}-${userStatusFilter}-${debouncedUserSearchQuery}`;
    if (userPageCacheRef.current.has(cacheKey)) return;
    try {
      const res = await api.getUsers({
        page,
        limit: adminUsersPerPage,
        role: userRoleFilter,
        status: userStatusFilter,
        search: debouncedUserSearchQuery
      });
      if (res && res.source === "mongodb" && res.data) {
        userPageCacheRef.current.set(cacheKey, {
          data: res.data,
          count: res.count ?? res.totalAllCount ?? res.data.length,
          totalPages: res.totalPages || 1,
          stats: res.stats
        });
      }
    } catch {}
  };

  const fetchServerUsers = async (page = adminUserPage, limit = adminUsersPerPage) => {
    const cacheKey = `${page}-${limit}-${userRoleFilter}-${userStatusFilter}-${debouncedUserSearchQuery}`;
    if (userPageCacheRef.current.has(cacheKey)) {
      const cached = userPageCacheRef.current.get(cacheKey)!;
      setServerUsers(cached.data);
      setServerTotalUsers(cached.count);
      setServerTotalUserPages(cached.totalPages);
      if (cached.stats) setServerUserStats(cached.stats);
      // Tự động tải trước trang tiếp theo ngầm
      if (page < cached.totalPages) {
        prefetchUsersPage(page + 1);
      }
      return;
    }

    try {
      const res = await api.getUsers({
        page,
        limit,
        role: userRoleFilter,
        status: userStatusFilter,
        search: debouncedUserSearchQuery
      });
      if (res && res.source === "mongodb" && res.data) {
        setServerUsers(res.data);
        setServerTotalUsers(res.count ?? res.totalAllCount ?? res.data.length);
        setServerTotalUserPages(res.totalPages || 1);
        if (res.stats) {
          setServerUserStats(res.stats);
        }
        userPageCacheRef.current.set(cacheKey, {
          data: res.data,
          count: res.count ?? res.totalAllCount ?? res.data.length,
          totalPages: res.totalPages || 1,
          stats: res.stats
        });
        // Tự động tải trước trang tiếp theo ngầm
        if (page < (res.totalPages || 1)) {
          prefetchUsersPage(page + 1);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải người dùng từ MongoDB:", err);
    }
  };

  useEffect(() => {
    fetchServerUsers(adminUserPage, adminUsersPerPage);
  }, [adminUserPage, adminUsersPerPage, userRoleFilter, userStatusFilter, debouncedUserSearchQuery]);

  // Tự động xóa cache và nạp lại người dùng khi chuyển sang tab users hoặc khi danh sách users bên ngoài thay đổi
  useEffect(() => {
    if (adminTab === "users") {
      userPageCacheRef.current.clear();
      fetchServerUsers(adminUserPage, adminUsersPerPage);
    }
  }, [adminTab, users]);

  const displayAdminUsers = serverUsers.length > 0 ? serverUsers : paginatedAdminUsers;
  const displayTotalUserCount = serverTotalUsers > 0 ? serverTotalUsers : filteredUsers.length;
  const displayTotalUserPages = serverTotalUsers > 0 ? serverTotalUserPages : totalAdminUserPages;

  // Đảm bảo trang người dùng không vượt quá tổng số trang máy chủ
  useEffect(() => {
    if (adminUserPage > displayTotalUserPages) {
      setAdminUserPage(displayTotalUserPages);
    }
  }, [adminUserPage, displayTotalUserPages]);

  const userStats = useMemo(() => {
    if (serverUserStats) {
      return {
        total: serverUserStats.total || serverTotalUsers || displayTotalUserCount,
        adminCount: serverUserStats.adminCount || 0,
        staffCount: serverUserStats.staffCount || 0,
        customerCount: serverUserStats.customerCount || 0,
        lockedCount: serverUserStats.lockedCount || 0,
      };
    }
    const total = displayTotalUserCount;
    const adminCount = users.filter((u) => u.role === "admin").length;
    const staffCount = users.filter((u) => u.role === "staff").length;
    const customerCount = users.filter((u) => u.role === "customer").length;
    const lockedCount = users.filter((u) => u.status === "locked").length;
    return { total, adminCount, staffCount, customerCount, lockedCount };
  }, [users, serverUserStats, displayTotalUserCount, serverTotalUsers]);

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

  // Xử lý tải ảnh đại diện từ máy tính cho tài khoản người dùng
  const handleUserAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP)!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Dung lượng ảnh vượt quá 5MB, vui lòng chọn file nhỏ hơn!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result as string;
      if (dataUrl) {
        setUserFormAvatar(dataUrl);
      }
    };
    reader.readAsDataURL(file);
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

    // Bảo vệ: Admin chỉ thiết lập qua MongoDB, không cho tạo mới hoặc nâng cấp lên Admin từ giao diện
    if (editingUser) {
      const targetRole: "admin" | "staff" | "customer" =
        editingUser.role === "admin"
          ? "admin"
          : userFormRole === "admin"
          ? "customer"
          : userFormRole;

      const updatedUser: UserAccount = {
        ...editingUser,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: userFormPassword.trim() || editingUser.password,
        role: targetRole,
        status: userFormStatus,
        address: userFormAddress.trim(),
        avatarUrl: cleanAvatar,
      };
      setServerUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updatedUser : u)));
      if (onUpdateUser) onUpdateUser(updatedUser);
      userPageCacheRef.current.clear();
      api.updateUser(editingUser.id, updatedUser).then(() => {
        fetchServerUsers(adminUserPage, adminUsersPerPage);
      }).catch(console.error);
    } else {
      const targetRole: "staff" | "customer" =
        userFormRole === "admin" ? "customer" : (userFormRole as "staff" | "customer");

      const newUser: UserAccount = {
        id: "usr-" + Date.now(),
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: userFormPassword.trim() || "123456",
        role: targetRole,
        status: userFormStatus,
        address: userFormAddress.trim(),
        avatarUrl: cleanAvatar,
        createdAt: new Date().toLocaleDateString("vi-VN"),
      };
      setServerUsers((prev) => [newUser, ...prev]);
      setServerTotalUsers((prev) => prev + 1);
      if (onAddUser) onAddUser(newUser);
      userPageCacheRef.current.clear();
      fetchServerUsers(adminUserPage, adminUsersPerPage);
    }
    setIsUserModalOpen(false);
  };

  // Confirm Delete User
  const handleConfirmDeleteUser = () => {
    if (deletingUserId) {
      setServerUsers((prev) => prev.filter((u) => u.id !== deletingUserId));
      setServerTotalUsers((prev) => Math.max(0, prev - 1));
      if (onDeleteUser) onDeleteUser(deletingUserId);
      userPageCacheRef.current.clear();
      fetchServerUsers(adminUserPage, adminUsersPerPage);
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
    setFormCategory(normalizeCategoryName(product.category));
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
    
    // Đảm bảo các thông số xuất bản cốt lõi luôn có sẵn trong formSpecs để chỉnh sửa trực tiếp
    const currentSpecs = { ...(product.specs || {}) };
    if (product.author && !currentSpecs["Tác giả"]) {
      currentSpecs["Tác giả"] = product.author;
    }
    if (product.publisher && !currentSpecs["Nhà xuất bản"]) {
      currentSpecs["Nhà xuất bản"] = product.publisher;
    }
    if (product.publicationYear && !currentSpecs["Năm xuất bản"]) {
      currentSpecs["Năm xuất bản"] = String(product.publicationYear);
    }
    setFormSpecs(currentSpecs);
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

    // Trích xuất trực tiếp giá trị Tác giả và NXB từ formSpecs đã sửa
    const authorVal = formSpecs["Tác giả"] || formSpecs["author"] || (editingProduct ? editingProduct.author : "") || "";
    const publisherVal = formSpecs["Nhà xuất bản"] || formSpecs["publisher"] || (editingProduct ? editingProduct.publisher : "") || "";
    const pubYearVal = parseInt(formSpecs["Năm xuất bản"] || formSpecs["publicationYear"] || "") || (editingProduct ? editingProduct.publicationYear : 2024) || 2024;

    if (editingProduct) {
      // Cập nhật thống kê tồn kho 0ms nếu có thay đổi số lượng / trạng thái kho
      const oldStock = editingProduct.stockQuantity !== undefined ? editingProduct.stockQuantity : (editingProduct.inStock ? 25 : 0);
      const oldCat = !editingProduct.inStock || oldStock === 0 ? "outOfStock" : (oldStock <= 5 ? "lowStock" : "inStock");
      const newCat = qty === 0 || !formInStock ? "outOfStock" : (qty <= 5 ? "lowStock" : "inStock");
      if (oldCat !== newCat) {
        setServerProdStats((prev) => ({
          ...prev,
          [oldCat]: Math.max(0, prev[oldCat] - 1),
          [newCat]: prev[newCat] + 1,
        }));
      }

      // Update (Cập nhật ngay vào serverProducts để giao diện thay đổi tức thì 0ms không cần reload trang)
      productPageCacheRef.current.clear();
      const updated: Product = {
        ...editingProduct,
        name: formName.trim(),
        category: formCategory,
        price: formPrice,
        originalPrice: formOriginalPrice,
        discountPercent,
        imageUrl: formImageUrl || SAMPLE_IMAGES[0].url,
        description: formDescription,
        author: authorVal,
        publisher: publisherVal,
        publicationYear: pubYearVal,
        inStock: qty > 0 ? formInStock : false,
        stockQuantity: qty,
        featured: formFeatured,
        specs: formSpecs,
      };
      setServerProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
      onUpdateProduct(updated);
    } else {
      // Create (Thêm ngay vào serverProducts để hiển thị đầu danh sách)
      productPageCacheRef.current.clear();
      const newCat = qty === 0 || !formInStock ? "outOfStock" : (qty <= 5 ? "lowStock" : "inStock");
      setServerProdStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        [newCat]: prev[newCat] + 1,
      }));
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
        author: authorVal || "Đang cập nhật",
        publisher: publisherVal || "NXB Trẻ",
        publicationYear: pubYearVal || 2024,
        inStock: qty > 0 ? formInStock : false,
        stockQuantity: qty,
        featured: formFeatured,
        specs: formSpecs,
      };
      setServerProducts((prev) => [newProduct, ...prev]);
      setServerTotalProducts((prev) => prev + 1);
      onAddProduct(newProduct);
    }

    setIsModalOpen(false);
  };

  // Cập nhật nhanh số lượng tồn kho trực tiếp từ bảng sản phẩm (Cập nhật giao diện lập tức 0ms)
  const handleUpdateStockQuantity = (product: Product, deltaOrAbsolute: number, isAbsolute = false) => {
    const currentStock = product.stockQuantity !== undefined ? product.stockQuantity : (product.inStock ? 25 : 0);
    const newQty = Math.max(0, isAbsolute ? deltaOrAbsolute : currentStock + deltaOrAbsolute);
    const updated: Product = {
      ...product,
      stockQuantity: newQty,
      inStock: newQty > 0,
    };

    // Phân loại trạng thái kho cũ và mới
    const oldCat = !product.inStock || currentStock === 0 ? "outOfStock" : (currentStock <= 5 ? "lowStock" : "inStock");
    const newCat = newQty === 0 ? "outOfStock" : (newQty <= 5 ? "lowStock" : "inStock");

    // Cập nhật tức thì 0ms vào serverProdStats (Thẻ Sắp hết, Hết hàng, Còn hàng)
    if (oldCat !== newCat) {
      setServerProdStats((prev) => ({
        ...prev,
        [oldCat]: Math.max(0, prev[oldCat] - 1),
        [newCat]: prev[newCat] + 1,
      }));
    }

    // Xóa bộ nhớ đệm trang để bộ lọc Kho hàng luôn lấy dữ liệu mới nhất
    productPageCacheRef.current.clear();

    setServerProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
    onUpdateProduct(updated);
  };

  // Thêm một dòng thông số xuất bản mới
  const handleAddSpec = () => {
    if (!newSpecKey.trim() || !newSpecVal.trim()) return;
    setFormSpecs((prev) => ({
      ...prev,
      [newSpecKey.trim()]: newSpecVal.trim(),
    }));
    setNewSpecKey("");
    setNewSpecVal("");
  };

  // Xóa một dòng thông số xuất bản (bảo vệ các trường cố định cốt lõi)
  const handleRemoveSpec = (keyToRemove: string) => {
    if (keyToRemove === "Tác giả" || keyToRemove === "Nhà xuất bản") {
      return;
    }
    setFormSpecs((prev) => {
      const copy = { ...prev };
      delete copy[keyToRemove];
      return copy;
    });
  };

  // Chỉnh sửa trực tiếp giá trị của từng thông số xuất bản (Tên tác giả, Tên NXB, Năm xuất bản...)
  const handleSpecValueChange = (key: string, value: string) => {
    setFormSpecs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Confirm delete (Xóa ngay khỏi serverProducts)
  const handleConfirmDelete = () => {
    if (deletingProductId) {
      const prod = serverProducts.find((p) => p.id === deletingProductId) || products.find((p) => p.id === deletingProductId);
      if (prod) {
        const qty = prod.stockQuantity !== undefined ? prod.stockQuantity : (prod.inStock ? 25 : 0);
        const cat = !prod.inStock || qty === 0 ? "outOfStock" : (qty <= 5 ? "lowStock" : "inStock");
        setServerProdStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          [cat]: Math.max(0, prev[cat] - 1),
        }));
      }
      productPageCacheRef.current.clear();
      setServerProducts((prev) => prev.filter((p) => p.id !== deletingProductId));
      setServerTotalProducts((prev) => Math.max(0, prev - 1));
      onDeleteProduct(deletingProductId);
      setDeletingProductId(null);
    }
  };

  // Quick toggle in-stock (Đổi trạng thái ngay trên giao diện)
  const handleToggleStock = (product: Product) => {
    const newInStock = !product.inStock;
    const currentStock = product.stockQuantity !== undefined ? product.stockQuantity : (product.inStock ? 25 : 0);
    const newQty = newInStock ? (currentStock > 0 ? currentStock : 25) : 0;
    const updated: Product = {
      ...product,
      inStock: newInStock,
      stockQuantity: newQty,
    };

    const oldCat = !product.inStock || currentStock === 0 ? "outOfStock" : (currentStock <= 5 ? "lowStock" : "inStock");
    const newCat = !newInStock || newQty === 0 ? "outOfStock" : (newQty <= 5 ? "lowStock" : "inStock");

    if (oldCat !== newCat) {
      setServerProdStats((prev) => ({
        ...prev,
        [oldCat]: Math.max(0, prev[oldCat] - 1),
        [newCat]: prev[newCat] + 1,
      }));
    }

    productPageCacheRef.current.clear();
    setServerProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
    onUpdateProduct(updated);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner & Return to Storefront */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="max-w-3xl space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center space-x-2.5">
            <SlidersHorizontal className="w-6 h-6 text-blue-400 shrink-0" />
            <span>Quản Lý Sách &amp; Đơn Hàng BookStore</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
            CRUD sản phẩm, thay đổi trạng thái tồn kho, xử lý đơn hàng và lưu dữ liệu trên MongoDB.
          </p>
        </div>

        {/* Trạng thái hệ thống: dạng phẳng hoàn toàn, loại bỏ viền lồng nhau (NESTED CARDS) */}
        <div className="hidden sm:inline-flex items-center space-x-2 text-xs font-semibold text-emerald-400 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>Hệ thống hoạt động ổn định</span>
        </div>
      </div>

      {/* Statistics Cards - Thiết kế thu nhỏ tinh tế, gọn gàng, tiết kiệm không gian màn hình */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Thẻ 1: Tổng đầu sách */}
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tổng đầu sách</p>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {displayTotalBooks.toLocaleString('vi-VN')}
            </h3>
          </div>
        </div>

        {/* Thẻ 2: Còn hàng - Độ tương phản cao chuẩn WCAG AAA */}
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Còn hàng</p>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <h3 className="text-base sm:text-lg font-black text-emerald-800 tracking-tight">
              {displayInStockCount.toLocaleString('vi-VN')}
            </h3>
          </div>
        </div>

        {/* Thẻ 3: Sắp hết - Độ tương phản cao chuẩn WCAG AAA */}
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-amber-300 shadow-2xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Sắp hết</p>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <h3 className="text-base sm:text-lg font-black text-amber-900 tracking-tight">
              {displayLowStockCount.toLocaleString('vi-VN')}
            </h3>
          </div>
        </div>

        {/* Thẻ 4: Hết hàng */}
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hết hàng</p>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-rose-700 flex items-center justify-center font-bold shrink-0">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <h3 className="text-base sm:text-lg font-black text-rose-800 tracking-tight">
              {displayOutOfStockCount.toLocaleString('vi-VN')}
            </h3>
          </div>
        </div>

        {/* Thẻ 5: Doanh thu đơn */}
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between col-span-2 sm:col-span-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Doanh thu đơn</p>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold shrink-0">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <h3 className="text-xs sm:text-sm xl:text-base font-black text-slate-900 tracking-tight leading-snug whitespace-nowrap overflow-visible" title={formatVND(totalRevenue)}>
              {formatVND(totalRevenue)}
            </h3>
          </div>
        </div>
      </div>

      {/* Admin Tab Switcher - Thanh chuyển tab thu gọn tối ưu, hiển thị vừa khít không tràn mép */}
      <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
          <button
            type="button"
            onClick={() => setAdminTab("products")}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              adminTab === "products"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span>Sản Phẩm</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-bold leading-none ${
                adminTab === "products"
                  ? "bg-white/25 text-white"
                  : "bg-slate-200 text-slate-800"
              }`}
            >
              {displayTotalProdCount.toLocaleString("vi-VN")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab("orders")}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              adminTab === "orders"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span>Đơn Hàng</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-bold leading-none ${
                adminTab === "orders"
                  ? "bg-white/25 text-white"
                  : "bg-slate-200 text-slate-800"
              }`}
            >
              {displayTotalOrderCount.toLocaleString("vi-VN")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdminTab("users");
              if (serverUsers.length === 0) {
                userPageCacheRef.current.clear();
                fetchServerUsers(adminUserPage, adminUsersPerPage);
              }
              if (onResetDefaultUsers) onResetDefaultUsers();
            }}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              adminTab === "users"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Người Dùng</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-bold leading-none ${
                adminTab === "users"
                  ? "bg-white/25 text-white"
                  : "bg-slate-200 text-slate-800"
              }`}
            >
              {displayTotalUserCount.toLocaleString("vi-VN")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab("reviews")}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              adminTab === "reviews"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            <Star className="w-3.5 h-3.5 shrink-0" />
            <span>Đánh Giá</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-bold leading-none ${
                adminTab === "reviews"
                  ? "bg-white/25 text-white"
                  : "bg-slate-200 text-slate-800"
              }`}
            >
              {displayTotalReviewCount.toLocaleString("vi-VN")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab("coupons")}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              adminTab === "coupons"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            <Ticket className="w-3.5 h-3.5 shrink-0" />
            <span>Mã Giảm Giá</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab("notifications")}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              adminTab === "notifications"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            <Bell className="w-3.5 h-3.5 shrink-0" />
            <span>Thông Báo</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab("analytics")}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              adminTab === "analytics"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>Báo Cáo</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab("categories")}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
              adminTab === "categories"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-700 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            <Folder className="w-3.5 h-3.5 shrink-0" />
            <span>Thể Loại</span>
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
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
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
                  {adminCategories.map((cat) => (
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
                  <option value="all">Tất cả ({displayTotalBooks.toLocaleString('vi-VN')})</option>
                  <option value="in_stock">Còn hàng ({displayInStockCount.toLocaleString('vi-VN')})</option>
                  <option value="low_stock">Sắp hết ({displayLowStockCount.toLocaleString('vi-VN')})</option>
                  <option value="out_of_stock">Hết hàng ({displayOutOfStockCount.toLocaleString('vi-VN')})</option>
                </select>
              </div>
            </div>

            {/* Cụm nút Thao tác Sản phẩm (Chuyển từ phía trên xuống đây theo yêu cầu) */}
            <div className="flex items-center justify-end space-x-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Sản Phẩm</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b-2 border-slate-200 text-slate-700 font-bold uppercase text-xs tracking-wider">
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
                {displayAdminProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Không tìm thấy sản phẩm nào phù hợp
                    </td>
                  </tr>
                ) : (
                  displayAdminProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3.5">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold text-slate-900 text-sm truncate">{p.name}</p>
                            <p className="text-xs text-slate-600 font-mono font-medium mt-0.5">ID: {p.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-bold text-red-600 text-sm">
                        {formatVND(p.price)}
                      </td>

                      {/* Original Price */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium line-through text-xs">
                        {formatVND(p.originalPrice)}
                      </td>

                      {/* In Stock toggle & Stock Quantity (Đã nâng cấp kích thước điều khiển và độ tương phản) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          {/* Badge trạng thái tồn kho (Chuẩn text-xs, không dùng animate-pulse) */}
                          {!p.inStock || (p.stockQuantity ?? 25) === 0 ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                              ❌ Hết hàng
                            </span>
                          ) : (p.stockQuantity ?? 25) <= 5 ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              ⚠️ Sắp hết ({p.stockQuantity ?? 25})
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✅ Còn ({p.stockQuantity ?? 25})
                            </span>
                          )}

                          {/* Bộ điều khiển tăng / giảm tồn kho đạt chuẩn touch target tối thiểu 28px */}
                          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateStockQuantity(p, -1)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-200 font-black text-sm transition-colors cursor-pointer"
                              title="Giảm 1 cuốn"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={p.stockQuantity !== undefined ? p.stockQuantity : (p.inStock ? 25 : 0)}
                              onChange={(e) => handleUpdateStockQuantity(p, Number(e.target.value), true)}
                              className="w-12 text-center font-bold text-xs bg-white border border-slate-200 rounded-lg py-1 px-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateStockQuantity(p, 1)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-200 font-black text-sm transition-colors cursor-pointer"
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
            totalPages={displayTotalProdPages}
            totalItems={displayTotalProdCount}
            itemsPerPage={adminProdPerPage}
            itemLabel="sản phẩm"
            onPageChange={setAdminProdPage}
            onPageHover={prefetchProductsPage}
            onPerPageChange={(per) => {
              setAdminProdPerPage(per);
              setAdminProdPage(1);
            }}
          />
        </div>
      )}

      {/* TAB 2: ORDERS MANAGEMENT (QUẢN LÝ ĐƠN HÀNG TOÀN DIỆN MONGODB) */}
      {adminTab === "orders" && (
        <div className="space-y-6">
          {/* Cụm 4 Thẻ KPI Thống Kê Đơn Hàng Thu Nhỏ Gọn Gàng */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh thu tích lũy</p>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1.5">
                <h3 className="text-xs sm:text-sm xl:text-base font-black text-slate-900 tracking-tight leading-snug whitespace-nowrap overflow-visible" title={formatVND(serverOrderStats?.totalRevenue || 18185464000)}>
                  {formatVND(serverOrderStats?.totalRevenue || 18185464000)}
                </h3>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng đơn hàng</p>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  <Package className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1.5">
                <h3 className="text-base sm:text-lg font-black text-blue-600 tracking-tight">
                  {(serverOrderStats?.total || displayTotalOrderCount).toLocaleString('vi-VN')}
                </h3>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Cần xử lý gấp</p>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1.5">
                <h3 className="text-base sm:text-lg font-black text-amber-600 tracking-tight">
                  {((serverOrderStats?.pending || 6258) + (serverOrderStats?.pickup || 6250)).toLocaleString('vi-VN')}
                </h3>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Giao thành công</p>
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1.5">
                <h3 className="text-base sm:text-lg font-black text-teal-700 tracking-tight">
                  {(serverOrderStats?.completed || 6255).toLocaleString('vi-VN')}
                </h3>
              </div>
            </div>
          </div>

          {/* Khối quản trị đơn hàng chính */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
            {/* Header tab */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Quản Lý Đơn Hàng Mua Sách ({(serverOrderStats?.total || displayTotalOrderCount).toLocaleString('vi-VN')} đơn)
                </h3>
                {/* Giới hạn độ dài dòng chữ phụ đề tối đa 55 ký tự (LINE LENGTH TOO LONG) */}
                <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mt-1 leading-relaxed">
                  Quản lý đơn hàng, in hóa đơn bán lẻ và cập nhật trạng thái vận chuyển thời gian thực.
                </p>
              </div>
              <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                Lưu trữ tự động MongoDB Container
              </span>
            </div>

            {/* Thanh công cụ tìm kiếm, bộ lọc & chuyển đổi chế độ xem */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Ô tìm kiếm đơn hàng */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo mã đơn (#ord-...), họ tên khách hàng, số điện thoại..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                />
                {orderSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setOrderSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Nút chuyển đổi View Mode: Dạng phẳng loại bỏ hoàn toàn viền lồng (NESTED CARDS) */}
              <div className="flex items-center space-x-1.5 self-end lg:self-auto">
                <button
                  type="button"
                  onClick={() => setOrderViewMode("table")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    orderViewMode === "table"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="Chế độ xem Bảng dữ liệu đối soát nhanh"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>Dạng Bảng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderViewMode("card")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    orderViewMode === "card"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="Chế độ xem Thẻ khối chi tiết"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Dạng Thẻ</span>
                </button>

                <button
                  type="button"
                  onClick={() => fetchServerOrders()}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Làm mới danh sách từ MongoDB"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bộ lọc trạng thái đơn hàng (Đồng bộ số liệu chuẩn xác từ MongoDB) */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "Tất cả", count: (serverOrderStats?.total || displayTotalOrderCount).toLocaleString('vi-VN') },
                {
                  id: "Chờ xác nhận",
                  label: "Chờ xác nhận",
                  count: (serverOrderStats ? serverOrderStats.pending : orders.filter((o) => o.status === "Chờ xác nhận" || (o.status === "Đang xử lý" && !o.pickupTime)).length).toLocaleString('vi-VN'),
                },
                {
                  id: "Chờ lấy hàng",
                  label: "Chờ lấy hàng",
                  count: (serverOrderStats ? serverOrderStats.pickup : orders.filter((o) => o.status === "Chờ lấy hàng").length).toLocaleString('vi-VN'),
                },
                {
                  id: "Chờ giao hàng",
                  label: "Chờ giao hàng",
                  count: (serverOrderStats ? serverOrderStats.shipping : orders.filter((o) => o.status === "Chờ giao hàng" || (o.status === "Đang giao" && !o.receivedAt)).length).toLocaleString('vi-VN'),
                },
                {
                  id: "Hoàn tất",
                  label: "Hoàn tất / Đã giao",
                  count: (serverOrderStats ? serverOrderStats.completed : orders.filter((o) => o.status === "Hoàn tất" || o.receivedAt).length).toLocaleString('vi-VN'),
                },
                {
                  id: "Đã hủy",
                  label: "Đã hủy",
                  count: (serverOrderStats ? serverOrderStats.canceled : orders.filter((o) => o.status === "Đã hủy").length).toLocaleString('vi-VN'),
                },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setAdminOrderFilter(st.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                    adminOrderFilter === st.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{st.label}</span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      adminOrderFilter === st.id
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    {st.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Danh sách đơn hàng theo chế độ xem (Bảng hoặc Thẻ) */}
            {displayAdminOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <ShoppingBag className="w-12 h-12 stroke-1 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600 text-sm">Không tìm thấy đơn hàng nào</p>
                <p className="text-xs text-slate-500">
                  Không có đơn hàng nào khớp với điều kiện lọc hoặc từ khóa tìm kiếm.
                </p>
              </div>
            ) : orderViewMode === "table" ? (
              /* CHẾ ĐỘ XEM BẢNG (TABLE VIEW) - Đối soát nhanh chuẩn công nghiệp */
              <div className="overflow-x-auto">
                <table className="table-fixed w-full text-left text-xs sm:text-sm">
                  <thead className="border-b-2 border-slate-200 text-slate-700 font-bold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 w-[130px]">Mã &amp; Ngày</th>
                      <th className="py-3.5 px-4 w-[200px]">Khách Hàng</th>
                      <th className="py-3.5 px-4 w-[280px]">Sản Phẩm Đã Mua</th>
                      <th className="py-3.5 px-4 w-[180px]">Tổng Tiền</th>
                      <th className="py-3.5 px-4 w-[160px] text-center">Trạng Thái</th>
                      <th className="py-3.5 px-4 w-[130px] text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {displayAdminOrders.map((ord) => {
                      const isPendingConfirm =
                        ord.status === "Chờ xác nhận" || (ord.status === "Đang xử lý" && !ord.pickupTime);
                      const isPickup = ord.status === "Chờ lấy hàng";
                      const isShipping =
                        ord.status === "Chờ giao hàng" || (ord.status === "Đang giao" && !ord.receivedAt);
                      const isDone = ord.status === "Hoàn tất" || Boolean(ord.receivedAt);

                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Cột 1: Mã & Ngày */}
                          <td className="py-3.5 px-4 font-mono text-xs align-middle">
                            <div
                              onClick={() => setViewingOrderDetail(ord)}
                              className="font-bold text-blue-600 cursor-pointer hover:underline flex items-center space-x-1"
                              title="Nhấn để xem chi tiết đơn hàng"
                            >
                              <span>#{ord.id}</span>
                            </div>
                            <div className="text-xs text-slate-600 font-medium mt-0.5">{ord.date}</div>
                          </td>

                          {/* Cột 2: Khách Hàng */}
                          <td className="py-3.5 px-4 text-xs align-middle">
                            <div className="font-bold text-slate-900 text-sm line-clamp-1">
                              {ord.customerInfo?.fullName || (ord as any).customerName || "Khách Hàng"}
                            </div>
                            <div className="text-slate-600 font-mono text-xs font-medium mt-0.5">
                              {ord.customerInfo?.phone || (ord as any).customerPhone || "0988 000 000"}
                            </div>
                            <div
                              className="text-slate-600 text-xs truncate max-w-[180px] mt-0.5"
                              title={ord.customerInfo?.address || (ord as any).shippingAddress}
                            >
                              {ord.customerInfo?.address || (ord as any).shippingAddress || "Toàn quốc"}
                            </div>
                          </td>

                          {/* Cột 3: Sản Phẩm Đã Mua - Danh sách tên sản phẩm kèm số lượng, không hiển thị ảnh */}
                          <td className="py-3.5 px-4 text-xs align-middle">
                            {Array.isArray(ord.items) && ord.items.length > 0 ? (
                              <div className="space-y-1">
                                {ord.items.slice(0, 3).map((it: any, idx: number) => (
                                  <div key={it.product?.id || idx} className="flex items-center justify-between gap-2">
                                    <span
                                      className="font-semibold text-slate-800 truncate text-xs leading-tight"
                                      title={it.product?.name || "Ấn Phẩm Sách"}
                                    >
                                      {it.product?.name || "Ấn Phẩm Sách"}
                                    </span>
                                    <span className="font-bold text-slate-900 font-mono text-xs shrink-0">
                                      x{it.quantity || 1}
                                    </span>
                                  </div>
                                ))}
                                {ord.items.length > 3 && (
                                  <div
                                    onClick={() => setViewingOrderDetail(ord)}
                                    className="text-[11px] text-blue-600 font-medium hover:underline cursor-pointer pt-0.5"
                                    title="Nhấn để xem đầy đủ tất cả sản phẩm trong đơn"
                                  >
                                    ... (+{ord.items.length - 3} món khác)
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-700 font-semibold text-xs">
                                {(ord as any).itemCount || 1} sản phẩm
                              </span>
                            )}
                          </td>

                          {/* Cột 4: Tổng Tiền & Thanh Toán - Cân bằng tuyệt đối, không rớt dòng */}
                          <td className="py-3.5 px-4 text-xs align-middle">
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-red-600 text-sm whitespace-nowrap">
                                {formatVND(ord.totalAmount)}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-md font-bold whitespace-nowrap ${
                                ord.isPaid || isDone
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}>
                                {ord.isPaid || isDone ? "Đã TT" : "Chưa TT"}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 font-medium mt-1 whitespace-nowrap">
                              {formatPaymentMethodName(ord.paymentMethod)}
                            </div>
                          </td>

                          {/* Cột 5: Trạng Thái - Căn giữa chuẩn mực, chữ vừa khít không bị che khuất */}
                          <td className="py-3.5 px-4 text-xs align-middle">
                            <div className="flex justify-center">
                              <select
                                value={ord.status}
                                onChange={(e) =>
                                  handleUpdateOrderStatusRealtime(
                                    ord.id,
                                    e.target.value as AdminOrderStatus
                                  )
                                }
                                className={`font-bold px-3 py-1.5 rounded-xl border text-xs focus:outline-none cursor-pointer w-full max-w-[150px] transition-colors shadow-2xs ${
                                  isDone
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100/70"
                                    : isShipping
                                    ? "bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100/70"
                                    : isPickup
                                    ? "bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100/70"
                                    : ord.status === "Đã hủy"
                                    ? "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100/70"
                                    : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100/70"
                                }`}
                              >
                                <option value="Chờ xác nhận">Chờ xác nhận</option>
                                <option value="Chờ lấy hàng">Chờ lấy hàng</option>
                                <option value="Chờ giao hàng">Chờ giao hàng</option>
                                <option value="Hoàn tất">Hoàn tất</option>
                                <option value="Đã hủy">Đã hủy</option>
                              </select>
                            </div>
                          </td>

                          {/* Cột 6: Thao Tác - Chuẩn mực 3 nút cố định (Xem chi tiết, In hóa đơn, Xóa) cân đối hoàn hảo */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <div className="flex items-center justify-center space-x-1.5">
                              {/* Xem chi tiết */}
                              <button
                                type="button"
                                onClick={() => setViewingOrderDetail(ord)}
                                className="w-8 h-8 border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0"
                                title="Xem chi tiết đơn hàng & hành trình"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* In hóa đơn */}
                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceOrder(ord)}
                                className="w-8 h-8 border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0"
                                title="In hóa đơn bán lẻ"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Xóa đơn */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) {
                                    handleDeleteOrderRealtime(ord.id);
                                  }
                                }}
                                className="w-8 h-8 border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0"
                                title="Xóa đơn hàng"
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
            ) : (
              /* CHẾ ĐỘ XEM THẺ (CARD VIEW) - Trực quan chi tiết */
              <div className="space-y-4">
                {displayAdminOrders.map((ord) => {
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
                          <span
                            onClick={() => setViewingOrderDetail(ord)}
                            className="font-bold font-mono text-blue-600 text-sm cursor-pointer hover:underline"
                          >
                            #{ord.id}
                          </span>
                          <span className="text-slate-500 text-xs">
                            Ngày đặt: {ord.date}
                          </span>
                        </div>

                        {/* Thao tác trạng thái nhanh và dropdown */}
                        <div className="flex flex-wrap items-center gap-2">
                          {isPendingConfirm && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatusRealtime(ord.id, "Chờ lấy hàng")}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer transform hover:-translate-y-0.5"
                              title="Xác nhận đơn hàng và chuyển sang Chờ lấy hàng"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Xác Nhận Đơn</span>
                            </button>
                          )}

                          {isPickup && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatusRealtime(ord.id, "Chờ giao hàng")}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
                              title="Shipper đã nhận gói hàng, chuyển sang Đang Giao"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Shipper Đã Lấy (Giao Ngay)</span>
                            </button>
                          )}

                          {isShipping && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateOrderStatusRealtime(ord.id, "Hoàn tất", {
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
                              handleUpdateOrderStatusRealtime(
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
                                ? "bg-indigo-100 text-indigo-800 border-indigo-300"
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

                          <button
                            type="button"
                            onClick={() => setViewingOrderDetail(ord)}
                            className="px-2.5 py-1 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                            title="Xem chi tiết đơn hàng & hành trình"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chi Tiết</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceOrder(ord)}
                            className={`px-2.5 py-1 border rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer ${
                              ord.isPaid || isDone
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
                                : "bg-slate-100 text-slate-500 border-slate-200"
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
                                handleDeleteOrderRealtime(ord.id);
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
                        <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 flex items-center justify-between text-xs">
                          <span className="flex items-center space-x-1.5 font-bold">
                            <Clock className="w-4 h-4 text-indigo-600" />
                            <span>Lịch shipper lấy hàng: {new Date(ord.pickupTime).toLocaleString("vi-VN")} ({ord.shippingCarrier || "Giao Hàng Nhanh"})</span>
                          </span>
                          <span className="text-xs text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                            Tự động chuyển sang Chờ giao khi đến giờ
                          </span>
                        </div>
                      )}

                      {/* Customer Information */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
                        <div>
                          <span className="text-slate-500 block text-xs">Khách hàng:</span>
                          <strong className="text-slate-800 font-bold">
                            {ord.customerInfo?.fullName || (ord as any).customerName || "Khách hàng"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-xs">Số điện thoại:</span>
                          <strong className="text-slate-800 font-bold">
                            {ord.customerInfo?.phone || (ord as any).customerPhone || "0988 000 000"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-xs">Địa chỉ giao:</span>
                          <span className="text-slate-700">
                            {ord.customerInfo?.address || (ord as any).shippingAddress || "Toàn quốc"}
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="divide-y divide-slate-200/50">
                        {Array.isArray(ord.items) && ord.items.length > 0 ? (
                          ord.items.map((it: any, idx: number) => (
                            <div key={it.product?.id || idx} className="py-2 flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <img
                                  src={it.product?.imageUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80"}
                                  alt={it.product?.name || "Sách"}
                                  className="w-8 h-8 rounded-lg object-cover"
                                />
                                <span className="text-slate-800 font-medium">
                                  {it.product?.name || "Ấn Phẩm Sách"} <strong className="text-blue-600">x{it.quantity || 1}</strong>
                                </span>
                              </div>
                              <span className="font-semibold text-slate-800">
                                {formatVND((it.product?.price || 0) * (it.quantity || 1))}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="py-2 flex justify-between items-center text-slate-600">
                            <span>Chi tiết đơn: <strong className="text-blue-600">{(ord as any).itemCount || 1} sản phẩm</strong></span>
                            <span className="font-bold text-slate-900">{formatVND(ord.totalAmount || (ord as any).totalPrice || 0)}</span>
                          </div>
                        )}
                      </div>

                      {/* Total & Payment method */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs">
                        <span className="text-slate-600">
                          Hình thức: <strong className="text-slate-800 font-semibold">{formatPaymentMethodName(ord.paymentMethod)}</strong>
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
              </div>
            )}
            {/* Thanh phân trang đơn hàng chuẩn 10 đơn / trang */}
            <AdminPagination
              currentPage={adminOrderPage}
              totalPages={displayTotalOrderPages}
              totalItems={displayTotalOrderCount}
              itemsPerPage={adminOrdersPerPage}
              itemLabel="đơn hàng"
              onPageChange={setAdminOrderPage}
              onPageHover={prefetchOrdersPage}
              onPerPageChange={(per) => {
                setAdminOrdersPerPage(per);
                setAdminOrderPage(1);
              }}
            />
          </div>
      </div>
    )}

      {/* TAB 3: USER MANAGEMENT (QUẢN LÝ NGƯỜI DÙNG) */}
      {adminTab === "users" && (
        <div className="space-y-6">
          {/* User Quick Stats - Thu nhỏ gọn gàng, tinh tế */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng người dùng</p>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">{userStats.total}</h3>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Quản trị &amp; Nhân viên</p>
                <h3 className="text-base sm:text-lg font-black text-blue-700 mt-0.5">
                  {userStats.adminCount + userStats.staffCount}
                </h3>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Khách hàng</p>
                <h3 className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">{userStats.customerCount}</h3>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
                <UserX className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tài khoản bị khóa</p>
                <h3 className="text-base sm:text-lg font-black text-red-600 mt-0.5">{userStats.lockedCount}</h3>
              </div>
            </div>
          </div>

          {/* User Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
            {/* Search and Filters & Action Bar - Đưa các nút thao tác xuống thanh công cụ */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên, email, SĐT..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Bộ lọc vai trò: phẳng, không tạo viền lồng nhau (NESTED CARDS) */}
                <div className="flex items-center space-x-1.5 bg-slate-100/80 px-3 py-1.5 rounded-xl text-xs shrink-0">
                  <span className="text-slate-500 font-medium">Vai trò:</span>
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

                {/* Bộ lọc trạng thái: phẳng, không tạo viền lồng nhau (NESTED CARDS) */}
                <div className="flex items-center space-x-1.5 bg-slate-100/80 px-3 py-1.5 rounded-xl text-xs shrink-0">
                  <span className="text-slate-500 font-medium">Trạng thái:</span>
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
                <button
                  type="button"
                  onClick={() => {
                    userPageCacheRef.current.clear();
                    fetchServerUsers(adminUserPage, adminUsersPerPage);
                    if (onResetDefaultUsers) onResetDefaultUsers();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 px-3 py-2 rounded-xl border border-blue-200 hover:bg-blue-50 flex items-center space-x-1.5 transition-colors cursor-pointer font-bold"
                  title="Đồng bộ danh sách tài khoản mới nhất từ MongoDB"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm mới</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateUser}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
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
                <p className="text-xs text-slate-500">
                  Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc phân loại.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-fixed w-full text-left text-xs">
                  <thead className="border-b-2 border-slate-200 text-slate-700 font-bold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="py-3 px-3 w-56">Người Dùng</th>
                      <th className="py-3 px-3 w-52">Liên Hệ</th>
                      <th className="py-3 px-3 w-36">Vai Trò</th>
                      <th className="py-3 px-3 w-32">Trạng Thái</th>
                      <th className="py-3 px-3 w-28">Ngày Tạo</th>
                      <th className="py-3 px-3 w-36 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayAdminUsers.map((user) => (
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
                              <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                                <span>{user.name}</span>
                                {user.role === "admin" && (
                                  <Shield className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                )}
                              </div>
                              <span className="text-xs text-slate-600 font-mono font-medium">ID: {user.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Email & Phone */}
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5 text-slate-800 text-xs font-semibold">
                              <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{user.email}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-slate-600 text-xs font-medium">
                              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{user.phone || "Chưa cập nhật SĐT"}</span>
                            </div>
                            {user.address && (
                              <div className="flex items-center space-x-1.5 text-slate-600 text-xs truncate max-w-xs font-medium">
                                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="truncate">{user.address}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Role Badge - Cỡ chữ chuẩn text-xs, loại bỏ màu tím AI Palette */}
                        <td className="py-3 px-3">
                          {user.role === "admin" && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              <Shield className="w-3.5 h-3.5" />
                              <span>Quản trị viên</span>
                            </span>
                          )}
                          {user.role === "staff" && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Nhân viên</span>
                            </span>
                          )}
                          {user.role === "customer" && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <User className="w-3.5 h-3.5" />
                              <span>Khách hàng</span>
                            </span>
                          )}
                        </td>

                        {/* Status Badge - Loại bỏ chấm nhấp nháy animate-pulse (PULSING STATUS DOT) */}
                        <td className="py-3 px-3">
                          {user.status === "active" ? (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span>Đang hoạt động</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                              <Lock className="w-3.5 h-3.5" />
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
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Phân Quyền & Quản Lý Tài Khoản Modal */}
                            <button
                              type="button"
                              onClick={() => {
                                setRoleModalUser(user);
                                setRoleModalRole(user.role || "customer");
                                setRoleModalStatus(user.status || "active");
                              }}
                              className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Phân quyền & Khóa/Mở khóa tài khoản"
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(user)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeletingUserId(user.id)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
                totalPages={displayTotalUserPages}
                totalItems={displayTotalUserCount}
                itemsPerPage={adminUsersPerPage}
                itemLabel="người dùng"
                onPageChange={setAdminUserPage}
                onPageHover={prefetchUsersPage}
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
          {/* Review Quick Stats - Thu nhỏ gọn gàng, tinh tế */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center font-bold shrink-0">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng số đánh giá</p>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                  {(serverReviewStats?.total || displayTotalReviewCount).toLocaleString('vi-VN')}
                </h3>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Đánh giá 5 sao</p>
                <h3 className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">
                  {(serverReviewStats?.fiveStar || Math.round(displayTotalReviewCount * 0.8)).toLocaleString('vi-VN')}
                </h3>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Điểm trung bình</p>
                <h3 className="text-base sm:text-lg font-black text-blue-600 mt-0.5">
                  {serverReviewStats?.avg || "4.8"} / 5
                </h3>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Lưu trữ dữ liệu</p>
                <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">MongoDB Reviews</h3>
              </div>
            </div>
          </div>

          {/* Review Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                  <option value="all">📦 Tất cả sản phẩm ({displayTotalBooks.toLocaleString('vi-VN')})</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <select
                  value={reviewRatingFilter}
                  onChange={(e) =>
                    setReviewRatingFilter(e.target.value === "all" ? "all" : (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)))
                  }
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
                >
                  <option value="all">⭐ Tất cả đánh giá ({displayTotalReviewCount.toLocaleString('vi-VN')})</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 sao (Hài lòng)</option>
                  <option value="4">⭐⭐⭐⭐ 4 sao (Tốt)</option>
                  <option value="4-5">🌟 Tích cực (4 - 5 sao)</option>
                  <option value="1-2">⚠️ Cần phản hồi gấp (1 - 2 sao)</option>
                  <option value="3">⭐⭐⭐ 3 sao (Bình thường)</option>
                  <option value="2">⭐⭐ 2 sao</option>
                  <option value="1">⭐ 1 sao (Tiêu cực)</option>
                </select>

                <button
                  type="button"
                  onClick={() => fetchReviews()}
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
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
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
                      <div className="text-xs text-slate-500 font-medium">Đánh giá sản phẩm này:</div>
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

            {/* Reviews List - Giữ nguyên bảng cũ khi chuyển trang để chống chớp giật (Keep Previous Data) */}
            {isLoadingReviews && displayAdminReviews.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Đang tải đánh giá từ MongoDB...
              </div>
            ) : displayAdminReviews.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <MessageSquare className="w-12 h-12 stroke-1 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600 text-sm">Không có đánh giá nào phù hợp</p>
                <p className="text-xs text-slate-500">
                  Các đánh giá của khách hàng trên trang chi tiết sản phẩm sẽ xuất hiện ở đây.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-fixed w-full text-left text-xs sm:text-sm">
                  <thead className="border-b-2 border-slate-200 text-slate-700 font-bold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-36">Mã &amp; Ngày</th>
                      <th className="py-3 px-4 w-44">Sản Phẩm (Mã FK)</th>
                      <th className="py-3 px-4 w-36">Người Đánh Giá</th>
                      <th className="py-3 px-4 w-28">Số Sao</th>
                      <th className="py-3 px-4">Nội Dung Nhận Xét</th>
                      <th className="py-3 px-4 w-24 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {displayAdminReviews.map((rev) => {
                      const relatedProduct = products.find((p) => p.id === rev.productId);
                      return (
                        <tr key={rev.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs">
                            <span className="font-bold text-slate-900">{rev.id}</span>
                            <div className="text-xs text-slate-600 font-medium mt-0.5">{rev.date}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 text-sm line-clamp-1">
                              {relatedProduct ? relatedProduct.name : rev.productId || "Chưa gắn mã"}
                            </div>
                            <span className="inline-block mt-0.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                              FK: {rev.productId || "None"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm">{rev.author}</div>
                            {rev.userId && (
                              <div className="text-xs font-mono text-slate-600 font-medium mt-0.5">
                                FK: {rev.userId}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= rev.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-200"
                                  }`}
                                />
                              ))}
                              <span className="font-bold text-xs ml-1 text-slate-800">
                                {rev.rating}/5
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {/* Bọc chống tràn văn bản đánh giá kèm phản hồi Admin */}
                            <div className="max-w-md space-y-2">
                              <p
                                className="text-xs text-slate-800 leading-relaxed italic line-clamp-3 break-words"
                                title={rev.content}
                              >
                                "{rev.content}"
                              </p>

                              {/* Hiển thị Phản hồi của Ban Quản Trị: Chuẩn flat quote, loại bỏ viền dày accent border (SIDE TAB ACCENT BORDER, NESTED CARDS) */}
                              {rev.adminReply && (
                                <div className="mt-2 text-xs text-slate-700 flex items-start space-x-2 bg-slate-100/70 p-2.5 rounded-xl">
                                  <CornerDownRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-slate-800">Phản hồi từ Nhà Sách: </span>
                                    <span className="text-slate-600 italic">"{rev.adminReply}"</span>
                                  </div>
                                </div>
                              )}

                              {rev.moderationStatus === "hidden" && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-200">
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Đã ẩn khỏi trang khách hàng</span>
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Nút Phản hồi khách hàng: Cỡ chữ text-xs chuẩn WCAG, dùng màu xanh doanh nghiệp thay vì màu tím AI Palette */}
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingReview(rev);
                                  setAdminReplyText(rev.adminReply || "");
                                }}
                                className="h-7 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold text-xs inline-flex items-center space-x-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                                title="Soạn phản hồi gửi khách hàng"
                              >
                                <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
                                <span className="whitespace-nowrap">Phản hồi</span>
                              </button>

                              {/* Nút Ẩn / Hiện kiểm duyệt */}
                              <button
                                type="button"
                                onClick={() => handleToggleReviewModeration(rev)}
                                className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors cursor-pointer shrink-0 ${
                                  rev.moderationStatus === "hidden"
                                    ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                    : "border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                                title={rev.moderationStatus === "hidden" ? "Hiện lại đánh giá" : "Ẩn đánh giá này"}
                              >
                                {rev.moderationStatus === "hidden" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditReview(rev)}
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer shrink-0"
                                title="Chỉnh sửa đánh giá"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingReviewId(rev.id)}
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
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
                totalPages={displayTotalReviewPages}
                totalItems={displayTotalReviewCount}
                itemsPerPage={adminReviewsPerPage}
                itemLabel="đánh giá"
                onPageChange={setAdminReviewPage}
                onPageHover={prefetchReviewsPage}
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

      {/* 5.1 TAB QUẢN TRỊ THÔNG BÁO (NOTIFICATIONS) */}
      {adminTab === "notifications" && <NotificationsTab />}

      {/* 6. TAB BÁO CÁO & THỐNG KÊ DOANH THU (ANALYTICS) */}
      {adminTab === "analytics" && <AnalyticsTab orders={serverOrders.length > 0 ? serverOrders : orders} />}

      {/* 7. TAB QUẢN LÝ THỂ LOẠI SÁCH (CATEGORIES) */}
      {adminTab === "categories" && <CategoriesTab />}

      {/* CONFIRM DELETE REVIEW MODAL (Sử dụng createPortal gắn trực tiếp vào body để che phủ toàn màn hình, không bị cắt ngang header) */}
      {deletingReviewId && createPortal(
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/70 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-lg border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95">
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
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md"
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
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-lg border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)]">
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
                className="text-slate-500 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-xl transition-colors"
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
                      className="p-1 transition-colors"
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
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
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
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full shadow-lg border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)]">
            {/* Header cố định */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 sm:px-6 py-2.5 sm:py-3 bg-white shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingProduct ? "Chỉnh Sửa Sách / Sản Phẩm" : "Thêm Sách Mới Vào Kho"}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingProduct ? "Cập nhật thông tin chi tiết và giá bán của đầu sách" : "Điền thông tin và tải ảnh sách lên hệ thống"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-xl transition-colors"
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
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        >
                          {adminCategories.filter((c) => c !== "Tất cả").map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                          {/* Bảo đảm nếu thể loại sách chưa có trong danh mục vẫn hiển thị chính xác, không bị nhảy sang option đầu tiên */}
                          {formCategory && !adminCategories.includes(formCategory) && (
                            <option key={formCategory} value={formCategory}>
                              {formCategory}
                            </option>
                          )}
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
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold"
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
                            <span className="font-semibold text-emerald-600 text-xs">Còn</span>
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
                            <span className="font-semibold text-red-600 text-xs">Hết</span>
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
                        <p className="text-xs text-slate-500 mt-0.5">{formatVND(formPrice)}</p>
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
                        <p className="text-xs text-slate-500 mt-0.5">{formatVND(formOriginalPrice)}</p>
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
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
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
                            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                              imageInputMode === "upload"
                                ? "bg-white text-blue-600 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Từ máy</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageInputMode("url")}
                            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                              imageInputMode === "url"
                                ? "bg-white text-blue-600 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <Link2 className="w-3.5 h-3.5" />
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
                              <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center">
                                <Upload className="w-4 h-4" />
                              </div>
                              <p className="text-xs font-bold text-slate-800">
                                Bấm chọn ảnh từ máy tính
                              </p>
                              <p className="text-xs text-slate-500">
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
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                    <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                                    Ảnh từ máy
                                  </span>
                                  {uploadedFileSize && (
                                    <span className="text-xs text-slate-500">
                                      ({uploadedFileSize})
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-slate-800 truncate">
                                  {uploadedFileName || "Đã chọn ảnh từ máy tính"}
                                </p>
                                <div className="flex items-center space-x-1.5 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold transition-colors flex items-center space-x-1"
                                  >
                                    <Upload className="w-2.5 h-2.5 text-blue-600" />
                                    <span>Đổi</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-semibold transition-colors flex items-center space-x-1"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                    <span>Xóa</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          {isCompressingImage && (
                            <p className="text-xs text-blue-600 font-medium mt-0.5">
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
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
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
                                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium text-slate-700 border"
                              >
                                {sample.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Thông số xuất bản: Tên trường cố định (Tác giả, NXB...), cho phép sửa trực tiếp giá trị */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-slate-800 text-xs">
                          Thông số xuất bản:
                        </label>
                        <span className="text-xs text-slate-500">
                          ({Object.keys(formSpecs).length} thông số)
                        </span>
                      </div>
                      <div className="space-y-1.5 pr-0.5">
                        {Object.entries(formSpecs).map(([key, val]) => {
                          const isFixedField = key === "Tác giả" || key === "Nhà xuất bản";
                          return (
                            <div
                              key={key}
                              className="flex items-center space-x-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs hover:border-slate-300 transition-colors"
                            >
                              {/* Tên trường được giữ cố định, không sửa trực tiếp tên trường */}
                              <span className="text-slate-700 font-bold shrink-0 min-w-[85px] max-w-[110px] truncate select-none text-[10.5px]">
                                {key}:
                              </span>

                              {/* Cho phép sửa trực tiếp giá trị: Nếu là Nhà xuất bản thì hiển thị thanh xổ xuống SearchableSelect */}
                              {key === "Nhà xuất bản" ? (
                                <div className="flex-1 min-w-0">
                                  <SearchableSelect
                                    value={val}
                                    onChange={(newPub) => handleSpecValueChange("Nhà xuất bản", newPub)}
                                    options={publisherOptions}
                                    placeholder="Chọn nhà xuất bản..."
                                    searchPlaceholder="🔍 Tìm theo tên NXB..."
                                    hideAllOption={true}
                                    allowCustom={true}
                                    triggerClassName="bg-white border border-slate-200 rounded-md px-2 py-0.5 text-xs text-slate-900 font-semibold hover:border-slate-300 shadow-2xs"
                                  />
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => handleSpecValueChange(key, e.target.value)}
                                  placeholder={`Nhập ${key.toLowerCase()}...`}
                                  className="flex-1 min-w-0 bg-white border border-slate-200 rounded-md px-2 py-0.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1.5 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs"
                                />
                              )}

                              {/* Nút xóa chỉ dành cho các thông số phụ, các trường cố định như Tác giả và NXB được bảo vệ */}
                              {!isFixedField ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSpec(key)}
                                  title={`Xóa ${key}`}
                                  className="text-slate-500 hover:text-red-600 p-0.5 shrink-0 rounded transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <div className="w-4 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex space-x-1.5 pt-1">
                        <input
                          type="text"
                          placeholder="Thông số (VD: Dịch giả)"
                          value={newSpecKey}
                          onChange={(e) => setNewSpecKey(e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Giá trị (VD: Nguyễn Văn A)"
                          value={newSpecVal}
                          onChange={(e) => setNewSpecVal(e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddSpec}
                          className="px-2.5 py-1 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 shrink-0 transition-colors"
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md flex items-center space-x-1.5 transition-colors"
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
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-lg border border-slate-200 space-y-4 text-center animate-in fade-in zoom-in-95">
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
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md"
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
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-lg border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)]">
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
                  <p className="text-xs text-slate-500">
                    {editingUser ? `Cập nhật dữ liệu tài khoản ID: ${editingUser.id}` : "Tạo tài khoản mới và cấp quyền đăng nhập"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-500 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-xl transition-colors"
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
                  <p className="text-xs text-slate-500 mt-0.5">Bắt buộc nhập đúng 10 chữ số.</p>
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
                <p className="text-xs text-slate-500 mt-0.5">Để trống sẽ giữ nguyên mật khẩu cũ nếu đang sửa.</p>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vai trò (Phân quyền) *
                  </label>
                  {userFormRole === "admin" ? (
                    <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Quản Trị Viên (Mặc định CSDL MongoDB)</span>
                    </div>
                  ) : (
                    <select
                      value={userFormRole}
                      onChange={(e) => setUserFormRole(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                      <option value="customer">Khách Hàng (Customer)</option>
                      <option value="staff">Nhân Viên (Staff)</option>
                    </select>
                  )}
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

              {/* Avatar URL & Upload ảnh từ máy tính */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ảnh đại diện (Avatar)
                </label>
                <div className="flex items-center space-x-3 mb-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <img
                    src={userFormAvatar || "/images/default-avatar.png"}
                    alt="Avatar Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm bg-white shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/default-avatar.png";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">Ảnh đại diện xem trước</p>
                    <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-1">
                      <input
                        ref={userAvatarFileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleUserAvatarFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => userAvatarFileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải ảnh từ máy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserFormAvatar("/images/default-avatar.png")}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Đặt lại mặc định</span>
                      </button>
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Hoặc dán link ảnh trực tiếp: https://..."
                  value={userFormAvatar}
                  onChange={(e) => setUserFormAvatar(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
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
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md flex items-center space-x-1.5 transition-colors"
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
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-lg border border-slate-200 space-y-4 text-center animate-in fade-in zoom-in-95">
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
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}



      {/* MODAL XEM CHI TIẾT ĐƠN HÀNG & HÀNH TRÌNH VẬN CHUYỂN */}
      {viewingOrderDetail && createPortal(
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/70 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-lg border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                    <span>Đơn Hàng #{viewingOrderDetail.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                      viewingOrderDetail.status === "Hoàn tất"
                        ? "bg-emerald-100 text-emerald-800"
                        : viewingOrderDetail.status === "Chờ giao hàng"
                        ? "bg-blue-100 text-blue-800"
                        : viewingOrderDetail.status === "Chờ lấy hàng"
                        ? "bg-indigo-100 text-indigo-800"
                        : viewingOrderDetail.status === "Đã hủy"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {viewingOrderDetail.status}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">Ngày đặt: {viewingOrderDetail.date}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingOrderDetail(null)}
                className="p-2 text-slate-500 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hành trình vận chuyển (Timeline) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center space-x-1.5">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Hành Trình Giao Nhận</span>
              </h4>
              <div className="flex items-center justify-between relative text-center text-xs">
                <div className="flex-1">
                  <div className="w-7 h-7 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">✓</div>
                  <div className="font-bold text-slate-800 mt-1 text-xs">Đặt hàng</div>
                  <div className="text-xs text-slate-500">{viewingOrderDetail.date}</div>
                </div>
                <div className="w-6 sm:w-10 h-0.5 bg-emerald-300" />
                <div className="flex-1">
                  <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                    viewingOrderDetail.pickupTime || viewingOrderDetail.status !== "Chờ xác nhận"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}>
                    {viewingOrderDetail.pickupTime || viewingOrderDetail.status !== "Chờ xác nhận" ? "✓" : "2"}
                  </div>
                  <div className="font-bold text-slate-800 mt-1 text-xs">Hẹn lấy hàng</div>
                  <div className="text-xs text-slate-500 truncate max-w-[80px] mx-auto">
                    {viewingOrderDetail.pickupTime ? new Date(viewingOrderDetail.pickupTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "Chờ xếp"}
                  </div>
                </div>
                <div className={`w-6 sm:w-10 h-0.5 ${
                  viewingOrderDetail.status === "Chờ giao hàng" || viewingOrderDetail.status === "Hoàn tất"
                    ? "bg-emerald-300"
                    : "bg-slate-200"
                }`} />
                <div className="flex-1">
                  <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                    viewingOrderDetail.status === "Chờ giao hàng" || viewingOrderDetail.status === "Hoàn tất"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}>
                    {viewingOrderDetail.status === "Hoàn tất" ? "✓" : "3"}
                  </div>
                  <div className="font-bold text-slate-800 mt-1 text-xs">Đang giao</div>
                  <div className="text-xs text-slate-500 truncate max-w-[80px] mx-auto">
                    {viewingOrderDetail.shippingCarrier ? viewingOrderDetail.shippingCarrier.slice(0, 8) : "GHN"}
                  </div>
                </div>
                <div className={`w-6 sm:w-10 h-0.5 ${
                  viewingOrderDetail.status === "Hoàn tất"
                    ? "bg-emerald-300"
                    : "bg-slate-200"
                }`} />
                <div className="flex-1">
                  <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                    viewingOrderDetail.status === "Hoàn tất"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}>
                    {viewingOrderDetail.status === "Hoàn tất" ? "✓" : "4"}
                  </div>
                  <div className="font-bold text-slate-800 mt-1 text-xs">Hoàn tất</div>
                  <div className="text-xs text-slate-500">
                    {viewingOrderDetail.receivedAt ? new Date(viewingOrderDetail.receivedAt).toLocaleDateString("vi-VN") : "Chưa giao"}
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin khách hàng & Giao nhận */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 text-xs block">Người nhận hàng:</span>
                <strong className="text-slate-900 font-bold text-sm block">
                  {viewingOrderDetail.customerInfo?.fullName || (viewingOrderDetail as any).customerName || "Khách Hàng"}
                </strong>
                <span className="text-slate-600 block mt-0.5">
                  SĐT: {viewingOrderDetail.customerInfo?.phone || (viewingOrderDetail as any).customerPhone || "0988 000 000"}
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Địa chỉ: {viewingOrderDetail.customerInfo?.address || (viewingOrderDetail as any).shippingAddress || "Toàn quốc"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Thanh toán &amp; Vận chuyển:</span>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-600">Hình thức:</span>
                    <strong className="text-slate-800 uppercase">{viewingOrderDetail.paymentMethod}</strong>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                      viewingOrderDetail.isPaid || viewingOrderDetail.status === "Hoàn tất"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {viewingOrderDetail.isPaid || viewingOrderDetail.status === "Hoàn tất" ? "Đã thanh toán" : "Chưa thanh toán (COD)"}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Đơn vị: <strong>{viewingOrderDetail.shippingCarrier || "Giao Hàng Nhanh (GHN)"}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Danh sách sách đã mua */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                <span>Chi Tiết Sản Phẩm ({Array.isArray(viewingOrderDetail.items) ? viewingOrderDetail.items.length : 1} ấn phẩm)</span>
                <span className="text-slate-500 font-normal text-xs">Đơn vị: VNĐ</span>
              </h4>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                {Array.isArray(viewingOrderDetail.items) && viewingOrderDetail.items.length > 0 ? (
                  viewingOrderDetail.items.map((it: any, idx: number) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={it.product?.imageUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80"}
                          alt={it.product?.name || "Sách"}
                          className="w-9 h-9 rounded-lg object-cover shadow-xs border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-800 line-clamp-1 max-w-xs">{it.product?.name || "Ấn Phẩm Sách"}</div>
                          <div className="text-xs text-slate-500 font-mono">Đơn giá: {formatVND(it.product?.price || 0)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-slate-800">x{it.quantity || 1}</div>
                        <div className="font-bold text-blue-600">{formatVND((it.product?.price || 0) * (it.quantity || 1))}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-slate-500 text-xs text-center">
                    Chi tiết sản phẩm đã được tổng hợp trong đơn hàng.
                  </div>
                )}
              </div>
            </div>

            {/* Tổng thanh toán & Thao tác */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-500 block">Tổng thanh toán:</span>
                <span className="text-lg font-black text-red-600">{formatVND(viewingOrderDetail.totalAmount)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoiceOrder(viewingOrderDetail);
                    setViewingOrderDetail(null);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Hóa Đơn</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingOrderDetail(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-md"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL PHÂN QUYỀN & KHÓA/MỞ KHÓA TÀI KHOẢN (ADMIN USERS) */}
      {roleModalUser && createPortal(
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/70 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-lg border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Phân Quyền &amp; Quản Lý Tài Khoản</h3>
                  <p className="text-xs text-slate-500">ID: #{roleModalUser.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thông tin tài khoản */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Họ và tên:</span>
                <strong className="text-slate-900">{roleModalUser.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email đăng nhập:</span>
                <span className="text-slate-700 font-mono">{roleModalUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="text-slate-700 font-mono">{roleModalUser.phone || "Chưa thiết lập"}</span>
              </div>
            </div>

            {/* Chọn vai trò: Chỉ cho phép chọn Khách Hàng hoặc Nhân Viên, Admin được quản lý trực tiếp trong MongoDB */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Vai Trò Người Dùng (Role):</label>
              {roleModalUser.role === "admin" ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
                  <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Tài khoản Quản Trị Viên (Admin):</span>
                    <p className="mt-0.5 text-slate-600">
                      Vai trò Quản trị viên được chỉ định trực tiếp trong MongoDB. Không cho phép nâng cấp hay hạ cấp tài khoản này trên giao diện.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRoleModalRole("customer")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                      roleModalRole === "customer"
                        ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Khách Hàng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleModalRole("staff")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all cursor-pointer ${
                      roleModalRole === "staff"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Nhân Viên</span>
                  </button>
                </div>
              )}
            </div>

            {/* Trạng thái tài khoản */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Trạng Thái Hoạt Động (Status):</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRoleModalStatus("active")}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    roleModalStatus === "active"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoạt Động Bình Thường</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleModalStatus("locked")}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    roleModalStatus === "locked"
                      ? "bg-red-600 text-white border-red-600 shadow-sm"
                      : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Khóa Tài Khoản Này</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-100 text-xs transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveUserRoleStatus}
                disabled={isUpdatingUserRole}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isUpdatingUserRole ? "Đang lưu..." : "Xác Nhận & Cập Nhật"}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL PHẢN HỒI ĐÁNH GIÁ ĐỘC GIẢ (ADMIN REVIEWS REPLY) */}
      {replyingReview && createPortal(
        <div className="fixed inset-0 !m-0 !top-0 !left-0 !right-0 !bottom-0 z-[100] bg-slate-900/70 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-lg border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <CornerDownRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Phản Hồi Đánh Giá Của Độc Giả</h3>
                  <p className="text-xs text-slate-500">Gửi lời cảm ơn hoặc giải đáp thắc mắc của độc giả</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingReview(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chi tiết đánh giá của khách hàng */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">{replyingReview.author}</span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= replyingReview.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                      }`}
                    />
                  ))}
                  <span className="font-bold ml-1 text-slate-700">{replyingReview.rating}/5</span>
                </div>
              </div>
              <p className="text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                "{replyingReview.content}"
              </p>
            </div>

            {/* Khung soạn thảo phản hồi */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Nội Dung Phản Hồi Từ Ban Quản Trị:
              </label>
              <textarea
                rows={4}
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                placeholder="Ví dụ: Cảm ơn bạn đã ủng hộ nhà sách! BookStore rất vui vì bạn hài lòng với chất lượng sách..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all leading-relaxed"
              />
              <p className="text-xs text-slate-500">
                Nội dung này sẽ hiển thị công khai trên giao diện trang chi tiết sách với nhãn <strong>"Phản hồi từ Nhà Sách BookStore"</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReplyingReview(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-100 text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveReviewReply}
                disabled={isSubmittingReply}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingReply ? "Đang gửi..." : "Gửi Phản Hồi"}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
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
