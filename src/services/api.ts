/// <reference types="vite/client" />
import { Product, ReviewItem, INITIAL_BOOKS } from "../data/products";
import { UserAccount } from "../data/users";
import { applyRatingBalancing } from "../utils/ratingBalancer";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "/api";
const TOKEN_STORAGE_KEY = "bookstore_token";
const REFRESH_TOKEN_STORAGE_KEY = "bookstore_refresh_token";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthTokens(token?: string | null, refreshToken?: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    }
  } catch {
    // ignore storage errors
  }
}

export function clearAuthTokens() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  // Nếu token đã lưu bị hết hạn hoặc không hợp lệ, dọn sạch token cũ
  if (res.status === 401 && token && !endpoint.startsWith("/auth/login")) {
    clearAuthTokens();
  }

  return res;
}

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export interface OrderPayload {
  customerInfo: {
    fullName: string;
    phone: string;
    address: string;
    note?: string;
  };
  items: Array<{
    product: Product;
    quantity: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
  status?: string;
  pickupTime?: string;
  shippingCarrier?: string;
}

// Kiểu dữ liệu Mã giảm giá (Coupons)
export interface CouponItem {
  _id?: string;
  code: string;
  title: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number | null;
  usageLimit: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt?: string;
}

// Kiểu dữ liệu Thể loại sách động (Categories)
export interface CategoryItem {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  bookCount?: number;
  createdAt?: string;
}

// Kiểu dữ liệu Báo cáo & Thống kê Doanh thu (Analytics Summary)
export interface AnalyticsSummary {
  financial: {
    totalRevenue: number;
    averageOrderValue: number;
    completedOrdersCount: number;
    totalOrdersCount: number;
  };
  orderStatusDistribution: {
    completed: number;
    shipping: number;
    pending: number;
    canceled: number;
  };
  inventory: {
    totalBooks: number;
    outOfStockBooks: number;
    totalUsers: number;
    totalReviews: number;
  };
  revenueTrend: Array<{ date: string; revenue: number }>;
  topSellingBooks: Array<{
    id: string;
    name: string;
    author: string;
    imageUrl: string;
    category: string;
    quantitySold: number;
    totalSales: number;
  }>;
  vipCustomers?: Array<{
    rank: number;
    name: string;
    phone: string;
    totalSpent: number;
    ordersCount: number;
  }>;
  categorySales?: Array<{
    name: string;
    percentage: number;
    revenue: number;
  }>;
}

// Kieu du lieu phan trang Server-Side
export interface PaginatedResponse<T> {
  source: string;
  count: number;
  totalAllCount?: number;
  totalPages: number;
  currentPage: number;
  stats?: {
    total: number;
    inStock?: number;
    lowStock?: number;
    outOfStock?: number;
    pending?: number;
    pickup?: number;
    shipping?: number;
    completed?: number;
    canceled?: number;
    adminCount?: number;
    staffCount?: number;
    customerCount?: number;
    lockedCount?: number;
    [key: string]: any;
  };
  data: T[];
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  stock?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: string;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}

export interface ReviewQueryParams {
  page?: number;
  limit?: number;
  rating?: number | string;
  search?: string;
  productId?: string;
  moderationStatus?: string;
}

export const api = {
  // 1. Kiểm tra Backend Health
  async checkHealth() {
    try {
      const res = await apiFetch("/health");
      if (!res.ok) throw new Error("Healthcheck failed");
      return await res.json();
    } catch {
      return { status: "offline", service: "disconnected" };
    }
  },

  // 2. Lay danh sach san pham tu MongoDB ho tro Server-Side Pagination
  async getProducts(params?: ProductQueryParams): Promise<PaginatedResponse<Product>> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append("page", String(params.page));
      if (params?.limit) query.append("limit", String(params.limit));
      if (params?.category && params.category !== "Tất cả") query.append("category", params.category);
      if (params?.search && params.search.trim()) query.append("search", params.search.trim());
      if (params?.stock && params.stock !== "all") query.append("stock", params.stock);
      if (params?.minPrice !== undefined && params.minPrice !== null) query.append("minPrice", String(params.minPrice));
      if (params?.maxPrice !== undefined && params.maxPrice !== null) query.append("maxPrice", String(params.maxPrice));
      if (params?.rating) query.append("rating", String(params.rating));
      if (params?.sortBy && params.sortBy !== "default") query.append("sortBy", params.sortBy);

      const qs = query.toString() ? `?${query.toString()}` : "";
      const res = await apiFetch(`/products${qs}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          return {
            source: json.source || "mongodb",
            count: json.count ?? json.data.length,
            totalAllCount: json.totalAllCount ?? json.count ?? json.data.length,
            totalPages: json.totalPages || 1,
            currentPage: json.currentPage || (params?.page || 1),
            stats: json.stats,
            data: applyRatingBalancing(json.data)
          };
        }
      }
    } catch (err) {
      console.error("❌ [API] Loi khi ket noi lay san pham tu MongoDB:", err);
    }
    return {
      source: "fallback-initial",
      count: INITIAL_BOOKS.length,
      totalAllCount: INITIAL_BOOKS.length,
      totalPages: 1,
      currentPage: 1,
      stats: {
        total: INITIAL_BOOKS.length,
        inStock: INITIAL_BOOKS.length,
        lowStock: 0,
        outOfStock: 0
      },
      data: applyRatingBalancing(INITIAL_BOOKS)
    };
  },

  // 3. Thêm sản phẩm mới (Admin/Staff)
  async createProduct(product: Partial<Product>) {
    const res = await apiFetch("/products", {
      method: "POST",
      body: JSON.stringify(product)
    });
    return await parseJsonSafe(res);
  },

  // 4. Cập nhật sản phẩm (Admin/Staff)
  async updateProduct(id: string, product: Partial<Product>) {
    const res = await apiFetch(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product)
    });
    return await parseJsonSafe(res);
  },

  // 5. Xóa sản phẩm (Admin)
  async deleteProduct(id: string) {
    const res = await apiFetch(`/products/${id}`, {
      method: "DELETE"
    });
    return await parseJsonSafe(res);
  },

  // 6. Lay danh sach don hang ho tro Server-Side Pagination
  async getOrders(params?: OrderQueryParams): Promise<PaginatedResponse<any>> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append("page", String(params.page));
      if (params?.limit) query.append("limit", String(params.limit));
      if (params?.status && params.status !== "all") query.append("status", params.status);
      if (params?.search && params.search.trim()) query.append("search", params.search.trim());

      const qs = query.toString() ? `?${query.toString()}` : "";
      const res = await apiFetch(`/orders${qs}`);
      if (res.ok) {
        const json = await res.json();
        return {
          source: json.source || "mongodb",
          count: json.count ?? (json.data ? json.data.length : 0),
          totalAllCount: json.totalAllCount ?? json.count ?? 0,
          totalPages: json.totalPages || 1,
          currentPage: json.currentPage || (params?.page || 1),
          stats: json.stats,
          data: json.data || []
        };
      }
      if (res.status === 401 || res.status === 403) {
        return { source: "unauthorized", count: 0, totalPages: 1, currentPage: 1, data: [] };
      }
    } catch (err) {
      console.error("❌ [API] Loi lay don hang tu MongoDB:", err);
    }
    return { source: "empty", count: 0, totalPages: 1, currentPage: 1, data: [] };
  },

  // 7. Tạo đơn hàng mới
  async createOrder(order: OrderPayload) {
    const res = await apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify(order)
    });
    return await parseJsonSafe(res);
  },

  // 8. Cập nhật trạng thái và dữ liệu liên quan của đơn hàng
  async updateOrderStatus(id: string, status: string, extraData?: Record<string, any>) {
    const res = await apiFetch(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, ...extraData })
    });
    return await parseJsonSafe(res);
  },

  // 9. Đăng nhập qua MongoDB (lưu JWT Token)
  async login(email: string, password: string) {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) throw new Error(data.message || data.error || "Đăng nhập thất bại");
    setAuthTokens(data.token, data.refreshToken);
    return data;
  },

  // 9b. Đăng ký tài khoản độc giả mới (lưu JWT Token)
  async register(payload: { name: string; email: string; phone: string; password: string }) {
    const res = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) throw new Error(data.message || data.error || "Đăng ký tài khoản thất bại");
    setAuthTokens(data.token, data.refreshToken);
    return data;
  },

  // 9c. Lấy thông tin tài khoản hiện tại từ JWT Token
  async getMe() {
    if (!getAuthToken()) return null;
    try {
      const res = await apiFetch("/auth/me");
      if (!res.ok) return null;
      const data = await parseJsonSafe(res);
      return data.user || null;
    } catch {
      return null;
    }
  },

  // 10. Lay danh sach Users tu MongoDB ho tro Server-Side Pagination
  async getUsers(params?: UserQueryParams): Promise<PaginatedResponse<UserAccount>> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append("page", String(params.page));
      if (params?.limit) query.append("limit", String(params.limit));
      if (params?.role && params.role !== "all") query.append("role", params.role);
      if (params?.status && params.status !== "all") query.append("status", params.status);
      if (params?.search && params.search.trim()) query.append("search", params.search.trim());

      const qs = query.toString() ? `?${query.toString()}` : "";
      const res = await apiFetch(`/users${qs}`);
      if (res.ok) {
        const json = await res.json();
        return {
          source: json.source || "mongodb",
          count: json.count ?? (json.data ? json.data.length : 0),
          totalAllCount: json.totalAllCount ?? json.count ?? 0,
          totalPages: json.totalPages || 1,
          currentPage: json.currentPage || (params?.page || 1),
          stats: json.stats,
          data: json.data || []
        };
      }
      if (res.status === 401 || res.status === 403) {
        return { source: "unauthorized", count: 0, totalPages: 1, currentPage: 1, data: [] };
      }
    } catch (err) {
      console.error("❌ [API] Loi lay danh sach user tu MongoDB:", err);
    }
    return { source: "empty", count: 0, totalPages: 1, currentPage: 1, data: [] };
  },

  // 11. Xóa đơn hàng (Admin)
  async deleteOrder(id: string) {
    const res = await apiFetch(`/orders/${id}`, { method: "DELETE" });
    return await parseJsonSafe(res);
  },

  // 12. Thêm người dùng (Admin)
  async createUser(user: Partial<UserAccount>) {
    const res = await apiFetch("/users", {
      method: "POST",
      body: JSON.stringify(user)
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) {
      return { error: data.message || data.error || "Lỗi khi thêm người dùng", ...data };
    }
    return data;
  },

  // 13. Cập nhật người dùng (Chính chủ hoặc Admin)
  async updateUser(id: string, user: Partial<UserAccount>) {
    const res = await apiFetch(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(user)
    });
    return await parseJsonSafe(res);
  },

  // 14. Khóa / Mở khóa người dùng (Admin)
  async toggleUserStatus(id: string, status: "active" | "locked") {
    const res = await apiFetch(`/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    return await parseJsonSafe(res);
  },

  // 15. Xóa người dùng (Admin)
  async deleteUser(id: string) {
    const res = await apiFetch(`/users/${id}`, { method: "DELETE" });
    return await parseJsonSafe(res);
  },

  // 16. Lấy đánh giá của sản phẩm từ MongoDB
  async getProductReviews(productId: string): Promise<ReviewItem[]> {
    try {
      const res = await apiFetch(`/products/${productId}/reviews`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (err) {
      console.error("❌ [API] Lỗi lấy đánh giá sản phẩm:", err);
    }
    return [];
  },

  // 17. Thêm đánh giá cho sản phẩm lưu trực tiếp vào MongoDB
  async addProductReview(productId: string, review: { author: string; rating: number; content: string; imageUrl?: string; userId?: string }) {
    const res = await apiFetch(`/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify(review)
    });
    return await parseJsonSafe(res);
  },

  // 18. Lay toan bo danh gia trong he thong ho tro Server-Side Pagination
  async getAllReviews(params?: ReviewQueryParams): Promise<PaginatedResponse<ReviewItem>> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.append("page", String(params.page));
      if (params?.limit) query.append("limit", String(params.limit));
      if (params?.rating && params.rating !== "all") query.append("rating", String(params.rating));
      if (params?.search && params.search.trim()) query.append("search", params.search.trim());
      if (params?.productId && params.productId !== "all") query.append("productId", params.productId);
      if (params?.moderationStatus && params.moderationStatus !== "all") query.append("moderationStatus", params.moderationStatus);

      const qs = query.toString() ? `?${query.toString()}` : "";
      const res = await apiFetch(`/reviews${qs}`);
      if (res.ok) {
        const json = await res.json();
        return {
          source: json.source || "mongodb",
          count: json.count ?? (json.data ? json.data.length : 0),
          totalAllCount: json.totalAllCount ?? json.count ?? 0,
          totalPages: json.totalPages || 1,
          currentPage: json.currentPage || (params?.page || 1),
          stats: json.stats,
          data: json.data || []
        };
      }
      if (res.status === 401 || res.status === 403) {
        return { source: "unauthorized", count: 0, totalPages: 1, currentPage: 1, data: [] };
      }
    } catch (err) {
      console.error("❌ [API] Loi lay tat ca danh gia:", err);
    }
    return { source: "empty", count: 0, totalPages: 1, currentPage: 1, data: [] };
  },

  // 19. Xóa đánh giá (Admin)
  async deleteReview(id: string) {
    const res = await apiFetch(`/reviews/${id}`, { method: "DELETE" });
    return await parseJsonSafe(res);
  },

  // 20. Chỉnh sửa đánh giá (Admin/Staff)
  async updateReview(id: string, review: { author?: string; rating?: number; content?: string }) {
    const res = await apiFetch(`/reviews/${id}`, {
      method: "PUT",
      body: JSON.stringify(review)
    });
    return await parseJsonSafe(res);
  },

  // --- MODULE QUẢN LÝ MÃ GIẢM GIÁ (COUPONS) ---
  // 21. Lấy danh sách tất cả mã giảm giá
  async getCoupons(): Promise<CouponItem[]> {
    try {
      const res = await apiFetch("/coupons");
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (err) {
      console.error("❌ [API] Lỗi lấy danh sách coupon:", err);
    }
    return [];
  },

  // 22. Tạo mã giảm giá mới
  async createCoupon(coupon: Partial<CouponItem>) {
    const res = await apiFetch("/coupons", {
      method: "POST",
      body: JSON.stringify(coupon)
    });
    return await parseJsonSafe(res);
  },

  // 23. Cập nhật mã giảm giá
  async updateCoupon(id: string, coupon: Partial<CouponItem>) {
    const res = await apiFetch(`/coupons/${id}`, {
      method: "PUT",
      body: JSON.stringify(coupon)
    });
    return await parseJsonSafe(res);
  },

  // 24. Xóa mã giảm giá
  async deleteCoupon(id: string) {
    const res = await apiFetch(`/coupons/${id}`, {
      method: "DELETE"
    });
    return await parseJsonSafe(res);
  },

  // 25. Kiểm tra và áp dụng mã giảm giá khi thanh toán
  async applyCoupon(code: string, orderTotal: number) {
    const res = await apiFetch("/coupons/apply", {
      method: "POST",
      body: JSON.stringify({ code, orderTotal })
    });
    return await parseJsonSafe(res);
  },

  // --- MODULE QUẢN LÝ THỂ LOẠI SÁCH (CATEGORIES) ---
  // 26. Lấy danh sách thể loại sách kèm số lượng đầu sách
  async getCategories(): Promise<CategoryItem[]> {
    try {
      const res = await apiFetch("/categories");
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (err) {
      console.error("❌ [API] Lỗi lấy danh sách thể loại sách:", err);
    }
    return [];
  },

  // 27. Tạo thể loại sách mới
  async createCategory(category: Partial<CategoryItem>) {
    const res = await apiFetch("/categories", {
      method: "POST",
      body: JSON.stringify(category)
    });
    return await parseJsonSafe(res);
  },

  // 28. Cập nhật thể loại sách
  async updateCategory(id: string, category: Partial<CategoryItem>) {
    const res = await apiFetch(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(category)
    });
    return await parseJsonSafe(res);
  },

  // 29. Xóa thể loại sách
  async deleteCategory(id: string) {
    const res = await apiFetch(`/categories/${id}`, {
      method: "DELETE"
    });
    return await parseJsonSafe(res);
  },

  // --- MODULE BÁO CÁO & THỐNG KÊ DOANH THU (ANALYTICS) ---
  // 30. Lấy báo cáo thống kê doanh thu và phân tích chuyên sâu
  async getAnalyticsSummary(): Promise<AnalyticsSummary | null> {
    try {
      const res = await apiFetch("/analytics/summary");
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch (err) {
      console.error("❌ [API] Lỗi lấy báo cáo doanh thu:", err);
    }
    return null;
  },

  // 31. Admin phan hoi danh gia doc gia
  async replyToReview(reviewId: string, reply: string): Promise<{ message: string; data: ReviewItem } | null> {
    try {
      const res = await apiFetch(`/reviews/${reviewId}/reply`, {
        method: "PUT",
        body: JSON.stringify({ reply })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("❌ [API] Loi phan hoi danh gia:", err);
    }
    return null;
  },

  // 32. Admin kiem duyet danh gia (approved, hidden, flagged)
  async updateReviewModeration(reviewId: string, status: "approved" | "hidden" | "flagged"): Promise<{ message: string; data: ReviewItem } | null> {
    try {
      const res = await apiFetch(`/reviews/${reviewId}/moderation`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("❌ [API] Loi cap nhat kiem duyet danh gia:", err);
    }
    return null;
  }
};
