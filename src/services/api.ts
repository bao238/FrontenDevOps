/// <reference types="vite/client" />
import { Product } from "../data/products";
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

  // 2. Lấy danh sách sản phẩm từ MongoDB
  async getProducts(): Promise<{ source: string; data: Product[] }> {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) {
        const json = await res.json();
        return { source: json.source || "mongodb", data: json.data || [] };
      }
    } catch (err) {
      console.error("❌ [API] Lỗi khi kết nối lấy sản phẩm từ MongoDB:", err);
    }
    return { source: "mongodb-empty", data: [] };
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

  // 6. Lấy danh sách đơn hàng từ SQL Server
  async getOrders() {
    try {
      const res = await fetch(`${API_BASE}/orders`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (err) {
      console.error("❌ [API] Lỗi lấy đơn hàng từ SQL Server:", err);
    }
    return [];
  },

  // 7. Tạo đơn hàng mới trên SQL Server
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

  // 9. Đăng nhập qua SQL Server
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

  // 10. Lấy danh sách Users từ SQL Server (cho Admin)
  async getUsers(): Promise<UserAccount[]> {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (err) {
      console.error("❌ [API] Lỗi lấy danh sách user từ SQL Server:", err);
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
  }
};
