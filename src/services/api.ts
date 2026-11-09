/// <reference types="vite/client" />
import { Product, ReviewItem, INITIAL_BOOKS } from "../data/products";
import { UserAccount } from "../data/users";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "/api";

export interface OrderPayload {
  customerInfo: {
    fullName: string;
    phone: string;
    address: string;
  };
  items: Array<{
    product: Product;
    quantity: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
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
}

export const api = {
  // 1. Kiểm tra Backend Health
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error("Healthcheck failed");
      return await res.json();
    } catch {
      return { status: "offline", service: "disconnected" };
    }
  },

  // 2. Lấy danh sách sản phẩm từ MongoDB (có fallback dữ liệu sách chuẩn)
  async getProducts(): Promise<{ source: string; data: Product[] }> {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return { source: json.source || "mongodb", data: json.data };
        }
      }
    } catch (err) {
      console.error("❌ [API] Lỗi khi kết nối lấy sản phẩm từ MongoDB:", err);
    }
    return { source: "fallback-initial", data: INITIAL_BOOKS };
  },

  // 3. Thêm sản phẩm mới (Admin)
  async createProduct(product: Partial<Product>) {
    const res = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });
    return await res.json();
  },

  // 4. Cập nhật sản phẩm
  async updateProduct(id: string, product: Partial<Product>) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });
    return await res.json();
  },

  // 5. Xóa sản phẩm
  async deleteProduct(id: string) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: "DELETE"
    });
    return await res.json();
  },

  // 6. Lấy danh sách đơn hàng
  async getOrders() {
    try {
      const res = await fetch(`${API_BASE}/orders`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (err) {
      console.error("❌ [API] Lỗi lấy đơn hàng từ MongoDB:", err);
    }
    return [];
  },

  // 7. Tạo đơn hàng mới
  async createOrder(order: OrderPayload) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    return await res.json();
  },

  // 8. Cập nhật trạng thái đơn hàng
  async updateOrderStatus(id: string, status: string) {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    return await res.json();
  },

  // 9. Đăng nhập qua MongoDB
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "Đăng nhập thất bại");
    return data;
  },

  // 10. Lấy danh sách Users từ MongoDB (cho Admin)
  async getUsers(): Promise<UserAccount[]> {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (err) {
      console.error("❌ [API] Lỗi lấy danh sách user từ MongoDB:", err);
    }
    return [];
  },

  // 11. Xóa đơn hàng (Admin)
  async deleteOrder(id: string) {
    const res = await fetch(`${API_BASE}/orders/${id}`, { method: "DELETE" });
    return await res.json();
  },

  // 12. Thêm người dùng (Admin)
  async createUser(user: Partial<UserAccount>) {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.message || data.error || "Lỗi khi thêm người dùng", ...data };
    }
    return data;
  },

  // 13. Cập nhật người dùng (Admin)
  async updateUser(id: string, user: Partial<UserAccount>) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
    return await res.json();
  },

  // 14. Khóa / Mở khóa người dùng (Admin)
  async toggleUserStatus(id: string, status: "active" | "locked") {
    const res = await fetch(`${API_BASE}/users/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    return await res.json();
  },

  // 15. Xóa người dùng (Admin)
  async deleteUser(id: string) {
    const res = await fetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
    return await res.json();
  },

  // 16. Lấy đánh giá của sản phẩm từ MongoDB
  async getProductReviews(productId: string): Promise<ReviewItem[]> {
    try {
      const res = await fetch(`${API_BASE}/products/${productId}/reviews`);
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
  async addProductReview(productId: string, review: { author: string; rating: number; content: string; imageUrl?: string }) {
    const res = await fetch(`${API_BASE}/products/${productId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review)
    });
    return await res.json();
  },

  // 18. Lấy toàn bộ đánh giá trong hệ thống (Admin)
  async getAllReviews(): Promise<ReviewItem[]> {
    try {
      const res = await fetch(`${API_BASE}/reviews`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (err) {
      console.error("❌ [API] Lỗi lấy tất cả đánh giá:", err);
    }
    return [];
  },

  // 19. Xóa đánh giá (Admin)
  async deleteReview(id: string) {
    const res = await fetch(`${API_BASE}/reviews/${id}`, { method: "DELETE" });
    return await res.json();
  },

  // 20. Chỉnh sửa đánh giá (Admin)
  async updateReview(id: string, review: { author?: string; rating?: number; content?: string }) {
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review)
    });
    return await res.json();
  },

  // --- MODULE QUẢN LÝ MÃ GIẢM GIÁ (COUPONS) ---
  // 21. Lấy danh sách tất cả mã giảm giá
  async getCoupons(): Promise<CouponItem[]> {
    try {
      const res = await fetch(`${API_BASE}/coupons`);
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
    const res = await fetch(`${API_BASE}/coupons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coupon)
    });
    return await res.json();
  },

  // 23. Cập nhật mã giảm giá
  async updateCoupon(id: string, coupon: Partial<CouponItem>) {
    const res = await fetch(`${API_BASE}/coupons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coupon)
    });
    return await res.json();
  },

  // 24. Xóa mã giảm giá
  async deleteCoupon(id: string) {
    const res = await fetch(`${API_BASE}/coupons/${id}`, {
      method: "DELETE"
    });
    return await res.json();
  },

  // 25. Kiểm tra và áp dụng mã giảm giá khi thanh toán
  async applyCoupon(code: string, orderTotal: number) {
    const res = await fetch(`${API_BASE}/coupons/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, orderTotal })
    });
    return await res.json();
  },

  // --- MODULE QUẢN LÝ THỂ LOẠI SÁCH (CATEGORIES) ---
  // 26. Lấy danh sách thể loại sách kèm số lượng đầu sách
  async getCategories(): Promise<CategoryItem[]> {
    try {
      const res = await fetch(`${API_BASE}/categories`);
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
    const res = await fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category)
    });
    return await res.json();
  },

  // 28. Cập nhật thể loại sách
  async updateCategory(id: string, category: Partial<CategoryItem>) {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category)
    });
    return await res.json();
  },

  // 29. Xóa thể loại sách
  async deleteCategory(id: string) {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: "DELETE"
    });
    return await res.json();
  },

  // --- MODULE BÁO CÁO & THỐNG KÊ DOANH THU (ANALYTICS) ---
  // 30. Lấy báo cáo thống kê doanh thu và phân tích chuyên sâu
  async getAnalyticsSummary(): Promise<AnalyticsSummary | null> {
    try {
      const res = await fetch(`${API_BASE}/analytics/summary`);
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch (err) {
      console.error("❌ [API] Lỗi lấy báo cáo doanh thu:", err);
    }
    return null;
  }
};
