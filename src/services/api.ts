/// <reference types="vite/client" />
import { Product, PRODUCTS } from "../data/products";
import { UserAccount, DEFAULT_USERS } from "../data/users";

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

export const api = {
  // 1. Kiểm tra Backend Health
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error("Healthcheck failed");
      return await res.json();
    } catch {
      return { status: "offline", service: "local-fallback" };
    }
  },

  // 2. Lấy danh sách sản phẩm
  async getProducts(): Promise<{ source: string; data: Product[] }> {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return { source: json.source || "api", data: json.data };
        }
      }
    } catch (err) {
      console.warn("⚠️ [API] Không kết nối được Backend, dùng dữ liệu dự phòng:", err);
    }
    return { source: "local-fallback", data: PRODUCTS };
  },

  // 3. Thêm sản phẩm mới (Admin)
  async createProduct(product: Partial<Product>) {
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      });
      return await res.json();
    } catch (err) {
      console.warn("⚠️ [API] Lỗi khi tạo sản phẩm:", err);
      return { message: "Lỗi kết nối", data: product };
    }
  },

  // 4. Cập nhật sản phẩm
  async updateProduct(id: string, product: Partial<Product>) {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      });
      return await res.json();
    } catch (err) {
      console.warn("⚠️ [API] Lỗi cập nhật sản phẩm:", err);
      return { message: "Lỗi kết nối" };
    }
  },

  // 5. Xóa sản phẩm
  async deleteProduct(id: string) {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE"
      });
      return await res.json();
    } catch (err) {
      console.warn("⚠️ [API] Lỗi xóa sản phẩm:", err);
      return { message: "Lỗi kết nối" };
    }
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
      console.warn("⚠️ [API] Lỗi lấy đơn hàng:", err);
    }
    return [];
  },

  // 7. Tạo đơn hàng mới
  async createOrder(order: OrderPayload) {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
      });
      return await res.json();
    } catch (err) {
      console.warn("⚠️ [API] Lỗi đặt hàng:", err);
      return { message: "Lỗi kết nối", data: order };
    }
  },

  // 8. Cập nhật trạng thái đơn hàng
  async updateOrderStatus(id: string, status: string) {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (err) {
      console.warn("⚠️ [API] Lỗi cập nhật trạng thái đơn:", err);
      return { message: "Lỗi kết nối" };
    }
  },

  // 9. Đăng nhập
  async login(email: string, password: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
      return data;
    } catch (err: any) {
      // Local fallback check
      const localUser = DEFAULT_USERS.find(u => u.email === email && u.password === password);
      if (localUser) {
        return {
          user: {
            id: localUser.id,
            name: localUser.name,
            email: localUser.email,
            phone: localUser.phone,
            role: localUser.role,
            avatarUrl: localUser.avatarUrl,
            memberSince: localUser.createdAt
          }
        };
      }
      throw err;
    }
  },

  // 10. Lấy danh sách Users (cho Admin)
  async getUsers(): Promise<UserAccount[]> {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (err) {
      console.warn("⚠️ [API] Lỗi lấy danh sách user:", err);
    }
    return DEFAULT_USERS;
  },

  // 11. Xóa đơn hàng (Admin)
  async deleteOrder(id: string) {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, { method: "DELETE" });
      return await res.json();
    } catch (err) {
      console.warn("⚠️ [API] Lỗi xóa đơn hàng:", err);
      return { message: "Lỗi kết nối" };
    }
  },

  // 12. Thêm người dùng (Admin)
  async createUser(user: Partial<UserAccount>) {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      });
      return await res.json();
    } catch (err) {
      console.warn("⚠️ [API] Lỗi tạo user:", err);
      return { message: "Lỗi kết nối" };
    }
  },

  // 13. Cập nhật người dùng (Admin)
  async updateUser(id: string, user: Partial<UserAccount>) {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      });
      return await res.json();
    } catch (err) {
      console.warn("⚠️ [API] Lỗi cập nhật user:", err);
      return { message: "Lỗi kết nối" };
    }
  },

  // 14. Khóa / Mở khóa người dùng (Admin)
  async toggleUserStatus(id: string, status: "active" | "locked") {
    try {
      const res = await fetch(`${API_BASE}/users/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (err) {
      console.warn("⚠️ [API] Lỗi đổi trạng thái user:", err);
      return { message: "Lỗi kết nối" };
    }
  },

  // 15. Xóa người dùng (Admin)
  async deleteUser(id: string) {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
      return await res.json();
    } catch (err) {
      console.warn("⚠️ [API] Lỗi xóa user:", err);
      return { message: "Lỗi kết nối" };
    }
  }
};
