import React, { useState, useMemo, useEffect } from "react";
import { CATEGORIES, Product, INITIAL_BOOKS } from "./data/products";
import { UserAccount, DEFAULT_AVATAR } from "./data/users";
import { api } from "./services/api";

// Ánh xạ icon/emoji trực quan cho từng thể loại sách
const CATEGORY_ICONS: Record<string, string> = {
  "Tất cả": "📚",
  "Văn học - Tiểu thuyết": "📖",
  "Kinh tế - Kinh doanh": "📈",
  "Kỹ năng sống": "✨",
  "Công nghệ - Lập trình": "💻",
  "Khoa học - Triết học": "🧭",
  "Thiếu nhi": "🎈"
};
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  X,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Flame,
  Tag,
  SlidersHorizontal,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Package,
  Mail,
  Phone,
  Lock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  MapPin,
  Send,
  Award,
  Check,
  Building,
  Clock,
  AlertCircle,
  Heart,
  QrCode,
  Menu,
  BookOpen,
  Bookmark
} from "lucide-react";

import AdminPanel from "./components/AdminPanel";
import ProductDetailPage from "./components/ProductDetailPage";
import CartPage from "./components/CartPage";
import PaymentQRModal from "./components/PaymentQRModal";
import WishlistModal from "./components/WishlistModal";
import OrderTrackingModal from "./components/OrderTrackingModal";
import MyOrdersPage from "./components/MyOrdersPage";
import ProfilePage from "./components/ProfilePage";

interface CartItem {
  product: Product;
  quantity: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  avatarUrl?: string;
  memberSince: string;
  role?: string;
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

export default function App() {
  const [activeTab, setActiveTab] = useState<"products" | "about" | "contact" | "admin" | "cart" | "orders" | "profile">("products");
  const [products, setProducts] = useState<Product[]>(INITIAL_BOOKS);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("default");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [promoCode, setPromoCode] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication States
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState<boolean>(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);

  // Wishlist, Order Tracking & Payment QR States
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("bookstore_wishlist") || "[]");
    } catch {
      return [];
    }
  });
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState<boolean>(false);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<OrderRecord | null>(null);
  const [isPaymentQROpen, setIsPaymentQROpen] = useState<boolean>(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [regName, setRegName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPhone, setRegPhone] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>("");

  // Contact Form state
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [contactSubmitted, setContactSubmitted] = useState<boolean>(false);

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [currentOrderId, setCurrentOrderId] = useState<string>("");
  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    paymentMethod: "cod",
    note: "",
  });

  // Admin Authentication States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem("bookstore_admin_session") === "true" ||
        localStorage.getItem("dinhbao_admin_session") === "true"
      );
    } catch {
      return false;
    }
  });
  const [adminUsername, setAdminUsername] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [adminShowPassword, setAdminShowPassword] = useState<boolean>(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  // Sync URL with activeTab & Product Detail (/admin and /product?id=...)
  useEffect(() => {
    const handleUrlSync = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const prodId = params.get("id");

      if (path === "/admin" || path.startsWith("/admin")) {
        setActiveTab("admin");
        setSelectedProduct(null);
      } else if (path === "/cart" || path.startsWith("/cart")) {
        setActiveTab("cart");
        setSelectedProduct(null);
      } else if (path === "/orders" || path.startsWith("/orders")) {
        setActiveTab("orders");
        setSelectedProduct(null);
      } else if (path === "/profile" || path.startsWith("/profile")) {
        setActiveTab("profile");
        setSelectedProduct(null);
      } else if (prodId || path.startsWith("/product")) {
        setActiveTab("products");
        if (prodId) {
          const found = products.find((p) => p.id === prodId);
          if (found) setSelectedProduct(found);
        }
      } else {
        setSelectedProduct(null);
      }
    };

    handleUrlSync();
    window.addEventListener("popstate", handleUrlSync);
    return () => window.removeEventListener("popstate", handleUrlSync);
  }, [products]);

  const switchTab = (tab: "products" | "about" | "contact" | "admin" | "cart" | "orders" | "profile") => {
    setActiveTab(tab);
    setSelectedProduct(null);
    setIsUserMenuOpen(false);
    setIsMobileNavOpen(false);
    if (tab === "admin") {
      if (window.location.pathname !== "/admin") {
        window.history.pushState({}, "", "/admin");
      }
    } else if (tab === "cart") {
      if (window.location.pathname !== "/cart") {
        window.history.pushState({}, "", "/cart");
      }
    } else if (tab === "orders") {
      if (window.location.pathname !== "/orders") {
        window.history.pushState({}, "", "/orders");
      }
    } else if (tab === "profile") {
      if (window.location.pathname !== "/profile") {
        window.history.pushState({}, "", "/profile");
      }
    } else {
      if (window.location.pathname !== "/" || window.location.search) {
        window.history.pushState({}, "", "/");
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setActiveTab("products");
    window.history.pushState({}, "", "/product?id=" + prod.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToProducts = () => {
    setSelectedProduct(null);
    window.history.pushState({}, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBuyNow = (prod: Product, quantity = 1) => {
    addToCart(prod, quantity);
    switchTab("cart");
  };

  const handleClearCart = () => {
    setCart([]);
    showToast("Đã làm trống giỏ hàng thành công!");
  };

  // Cập nhật thông tin hồ sơ cá nhân độc giả
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    const newProf: UserProfile = { ...currentUser, ...updated };
    setCurrentUser(newProf);
    try {
      localStorage.setItem("bookstore_user", JSON.stringify(newProf));
    } catch (err) {
      console.error("Lỗi khi lưu hồ sơ:", err);
    }
    showToast("Cập nhật thông tin hồ sơ thành công!");
  };

  // Mua lại toàn bộ sách từ đơn hàng đã đặt
  const handleReorder = (order: OrderRecord) => {
    order.items.forEach((item) => {
      addToCart(item.product, item.quantity);
    });
    showToast(`Đã thêm các cuốn sách từ đơn #${order.id} vào giỏ hàng!`);
    switchTab("cart");
  };

  // Load saved user from local storage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("bookstore_user") || localStorage.getItem("dinhbao_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (!parsed.avatarUrl || parsed.avatarUrl.includes("unsplash.com")) {
          parsed.avatarUrl = DEFAULT_AVATAR;
        }
        setCurrentUser(parsed);
        setCustomerInfo((prev) => ({
          ...prev,
          fullName: parsed.name || "",
          phone: parsed.phone || "",
        }));
      }

      const savedOrders = localStorage.getItem("bookstore_orders") || localStorage.getItem("dinhbao_orders");
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } catch {
      // ignore
    }

    // Tự động đồng bộ 100% từ Backend REST API (MongoDB)
    api.getProducts().then((res) => {
      if (res && res.data) {
        setProducts(res.data);
      }
    });
    api.getOrders().then((ordList) => {
      if (ordList && Array.isArray(ordList)) {
        setOrders(ordList);
      }
    });
    api.getUsers().then((userList) => {
      if (userList && Array.isArray(userList)) {
        setUsers(userList);
      }
    });
  }, []);

  // Format VND currency
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      const err = "Vui lòng nhập đầy đủ Email/Tài khoản và Mật khẩu!";
      setAuthError(err);
      showToast(err);
      return;
    }

    const inputVal = loginEmail.trim().toLowerCase();
    const inputPass = loginPassword.trim();
    const existing = users.find(
      (u) =>
        u.email.toLowerCase() === inputVal ||
        (inputVal === "admin" && u.role === "admin") ||
        u.name.toLowerCase() === inputVal
    );

    // Fallback nếu tài khoản admin hệ thống (admin / admin123 hoặc admin@bookstore.vn / admin)
    const isFallbackAdmin =
      (inputVal === "admin" || inputVal === "admin@bookstore.vn" || inputVal === "manager@bookstore.vn" || inputVal === "bao@gmail.com" || inputVal === "admin@dinhbao.vn") &&
      (inputPass === "admin123" || inputPass === "admin");

    if (existing) {
      if (existing.status === "locked") {
        const err = "Tài khoản của bạn đã bị KHÓA bởi Quản trị viên!";
        setAuthError(err);
        showToast(err);
        return;
      }
      if (existing.password && existing.password !== inputPass && !isFallbackAdmin) {
        const err = "Mật khẩu không chính xác! Vui lòng kiểm tra lại.";
        setAuthError(err);
        showToast(err);
        return;
      }
      const loggedUser: UserProfile = {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        avatarUrl: existing.avatarUrl || "/default-avatar.png",
        memberSince: existing.createdAt || "Tháng " + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
      };
      setCurrentUser(loggedUser);
      localStorage.setItem("bookstore_user", JSON.stringify(loggedUser));
      setCustomerInfo((prev) => ({
        ...prev,
        fullName: loggedUser.name,
        phone: loggedUser.phone,
        address: existing.address || prev.address,
      }));
      setIsAuthModalOpen(false);
      setLoginPassword("");
      setAuthError(null);

      // NẾU LÀ TÀI KHOẢN ADMIN HOẶC STAFF -> TỰ ĐỘNG CHUYỂN QUA TRANG /admin VÀ KÍCH HOẠT PHIÊN QUẢN TRỊ
      if (existing.role === "admin" || existing.role === "staff") {
        setIsAdminLoggedIn(true);
        try {
          localStorage.setItem("bookstore_admin_session", "true");
          localStorage.setItem("bookstore_admin_user", JSON.stringify(existing));
        } catch (err) {
          console.error(err);
        }
        switchTab("admin");
        showToast(`Đăng nhập quyền Quản trị (${existing.role === "admin" ? "Admin" : "Nhân viên"}) thành công! Chuyển hướng sang Trang Admin...`);
        return;
      }

      showToast(`Chào mừng bạn trở lại, ${loggedUser.name}!`);
      return;
    }

    if (isFallbackAdmin) {
      const adminAcc = users.find((u) => u.role === "admin") || {
        id: "usr-admin-1",
        name: "Quản Trị Viên (BookStore Admin)",
        email: "admin@bookstore.vn",
        phone: "0905 888 999",
        role: "admin" as const,
        status: "active" as const,
        avatarUrl: "/default-avatar.png",
        createdAt: "01/01/2024"
      };
      const loggedUser: UserProfile = {
        id: adminAcc.id,
        name: adminAcc.name,
        email: adminAcc.email,
        phone: adminAcc.phone,
        avatarUrl: adminAcc.avatarUrl || "/default-avatar.png",
        memberSince: adminAcc.createdAt || "Tháng 01/2024",
      };
      setCurrentUser(loggedUser);
      localStorage.setItem("bookstore_user", JSON.stringify(loggedUser));
      setIsAdminLoggedIn(true);
      try {
        localStorage.setItem("bookstore_admin_session", "true");
        localStorage.setItem("bookstore_admin_user", JSON.stringify(adminAcc));
      } catch (err) {
        console.error(err);
      }
      setIsAuthModalOpen(false);
      setLoginPassword("");
      setAuthError(null);
      switchTab("admin");
      showToast("Đăng nhập quyền Quản trị (Admin) thành công! Chuyển hướng sang Trang Admin...");
      return;
    }

    // Tài khoản không tồn tại trên hệ thống
    const err = "Tài khoản hoặc mật khẩu không chính xác! Vui lòng kiểm tra lại.";
    setAuthError(err);
    showToast(err);
  };

  // Handle Register
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!regName || !regEmail || !regPhone || !regPassword) {
      const err = "Vui lòng điền đầy đủ các thông tin đăng ký!";
      setAuthError(err);
      showToast(err);
      return;
    }
    if (regPassword !== regConfirmPassword) {
      const err = "Mật khẩu xác nhận không trùng khớp!";
      setAuthError(err);
      showToast(err);
      return;
    }

    const email = regEmail.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === email)) {
      const err = "Email này đã được đăng ký! Vui lòng chuyển sang tab Đăng Nhập.";
      setAuthError(err);
      showToast(err);
      return;
    }

    const newAccount: UserAccount = {
      id: "usr-" + Date.now(),
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      role: "customer",
      status: "active",
      password: regPassword,
      avatarUrl: "/default-avatar.png",
      createdAt: new Date().toLocaleDateString("vi-VN"),
    };

    api.createUser(newAccount).catch(console.error);
    const updatedUsers = [newAccount, ...users];
    setUsers(updatedUsers);

    const newUser: UserProfile = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      phone: newAccount.phone,
      avatarUrl: "/default-avatar.png",
      memberSince: newAccount.createdAt,
    };

    setCurrentUser(newUser);
    localStorage.setItem("bookstore_user", JSON.stringify(newUser));
    setCustomerInfo((prev) => ({
      ...prev,
      fullName: newUser.name,
      phone: newUser.phone,
    }));
    setIsAuthModalOpen(false);
    showToast(`Đăng ký tài khoản thành công! Xin chào ${newUser.name}`);
    setRegPassword("");
    setRegConfirmPassword("");
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    localStorage.removeItem("bookstore_user");
    localStorage.removeItem("bookstore_admin_session");
    localStorage.removeItem("bookstore_admin_user");
    localStorage.removeItem("dinhbao_user");
    localStorage.removeItem("dinhbao_admin_session");
    localStorage.removeItem("dinhbao_admin_user");
    setIsUserMenuOpen(false);
    showToast("Đã đăng xuất tài khoản thành công.");
  };

  // Add to Cart
  const addToCart = (product: Product, quantity = 1) => {
    if (!product.inStock) {
      showToast("Sản phẩm hiện đang tạm hết hàng!");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Đã thêm "${product.name.slice(0, 25)}..." vào giỏ hàng!`);
  };

  // Update Cart Quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast("Đã xóa sản phẩm khỏi giỏ hàng");
  };

  // Thêm / Bỏ sách yêu thích (Wishlist)
  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      let nextList: Product[];
      if (exists) {
        nextList = prev.filter((p) => p.id !== product.id);
        showToast(`Đã bỏ "${product.name}" khỏi danh sách yêu thích`);
      } else {
        nextList = [...prev, product];
        showToast(`Đã thêm "${product.name}" vào danh sách yêu thích ❤️`);
      }
      try {
        localStorage.setItem("bookstore_wishlist", JSON.stringify(nextList));
      } catch {
        // ignore
      }
      return nextList;
    });
  };

  // Apply Coupon (Kết nối trực tiếp MongoDB với cơ chế fallback dự phòng)
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoCode.trim().toUpperCase();
    if (!cleanCode) {
      showToast("Vui lòng nhập mã giảm giá!");
      return;
    }

    try {
      const res = await api.applyCoupon(cleanCode, subtotal);
      if (res && res.success && res.coupon) {
        if (res.coupon.discountType === "percent") {
          setAppliedDiscount(res.coupon.discountValue / 100);
        } else {
          // Loại tiền cố định (fixed VND)
          const ratio = subtotal > 0 ? Math.min(1, res.coupon.discountAmount / subtotal) : 0;
          setAppliedDiscount(ratio);
        }
        showToast(res.message || `Áp dụng mã "${cleanCode}" thành công!`);
        return;
      } else if (res && res.error) {
        showToast(res.error);
        return;
      }
    } catch {
      // Fallback kiểm tra cục bộ khi chưa kết nối backend
    }

    if (
      cleanCode === "BOOKWORM10" ||
      cleanCode === "DEVOPS10" ||
      cleanCode === "DINHBAO10"
    ) {
      setAppliedDiscount(0.1);
      showToast("Áp dụng mã giảm 10% thành công!");
    } else {
      showToast("Mã giảm giá không hợp lệ hoặc đã hết hạn!");
    }
  };

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    const result = products.filter((item) => {
      const matchCat =
        selectedCategory === "Tất cả" || item.category === selectedCategory;
      const matchQuery =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Tự động reset trang về 1 khi người dùng đổi bộ lọc danh mục, tìm kiếm hoặc sắp xếp
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

  // Đảm bảo trang hiện tại không vượt quá tổng số trang
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Cắt danh sách sản phẩm hiển thị trên trang hiện tại theo phân trang
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Cart Calculations
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const discountAmount = subtotal * appliedDiscount;
  const shippingFee = subtotal > 5000000 || subtotal === 0 ? 0 : 30000;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  // Handle Checkout Submit
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.fullName || !customerInfo.phone || !customerInfo.address) {
      showToast("Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng!");
      return;
    }
    const generatedId = "DB-" + Math.floor(100000 + Math.random() * 900000);
    setCurrentOrderId(generatedId);

    const newOrder: OrderRecord = {
      id: generatedId,
      date: new Date().toLocaleDateString("vi-VN"),
      items: [...cart],
      totalAmount: finalTotal,
      paymentMethod: customerInfo.paymentMethod,
      status: "Đang xử lý",
      customerInfo: { ...customerInfo },
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    try {
      localStorage.setItem("bookstore_orders", JSON.stringify(updatedOrders));
    } catch {
      // ignore
    }

    // Gửi đơn hàng lên Backend / GearHost MS SQL
    api.createOrder({
      customerInfo: { ...customerInfo },
      items: [...cart],
      totalAmount: finalTotal,
      paymentMethod: customerInfo.paymentMethod
    }).catch(console.error);

    setOrderSuccess(true);
    if (customerInfo.paymentMethod === "banking") {
      setIsPaymentQROpen(true);
    }
    setCart([]);
    setAppliedDiscount(0);
    setPromoCode("");
  };

  // Handle Contact Submit
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone || !contactForm.message) {
      showToast("Vui lòng nhập đầy đủ họ tên, số điện thoại và lời nhắn!");
      return;
    }
    setContactSubmitted(true);
    showToast("Cảm ơn bạn! BookStore đã nhận được tin nhắn và sẽ liên hệ lại sớm nhất.");
    setContactForm({ name: "", email: "", phone: "", message: "" });
  };

  // Product CRUD Handlers for Admin
  const handleAddProduct = (newProd: Product) => {
    api.createProduct(newProd).catch(console.error);
    const updated = [newProd, ...products];
    setProducts(updated);
    showToast(`Đã thêm sản phẩm "${newProd.name}" thành công!`);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    api.updateProduct(updatedProd.id, updatedProd).catch(console.error);
    const updated = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
    setProducts(updated);
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === updatedProd.id ? { ...item, product: updatedProd } : item
      )
    );
    showToast(`Đã cập nhật sản phẩm "${updatedProd.name}"!`);
  };

  const handleDeleteProduct = (productId: string) => {
    api.deleteProduct(productId).catch(console.error);
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast("Đã xóa sản phẩm khỏi hệ thống!");
  };

  const handleResetDefaultProducts = () => {
    api.getProducts().then((res) => {
      if (res && res.data) setProducts(res.data);
    });
    showToast("Đã đồng bộ lại danh sách sản phẩm từ MongoDB!");
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    newStatus: "Đang xử lý" | "Đang giao" | "Hoàn tất" | "Đã hủy"
  ) => {
    api.updateOrderStatus(orderId, newStatus).catch(console.error);
    const updated = orders.map((ord) =>
      ord.id === orderId ? { ...ord, status: newStatus } : ord
    );
    setOrders(updated);
    showToast(`Đã đổi trạng thái đơn #${orderId} thành "${newStatus}"!`);
  };

  const handleDeleteOrder = (orderId: string) => {
    api.deleteOrder(orderId).catch(console.error);
    const updated = orders.filter((ord) => ord.id !== orderId);
    setOrders(updated);
    showToast(`Đã xóa đơn hàng #${orderId}!`);
  };

  // User Management Handlers (Admin CRUD)
  const handleAddUser = async (newUser: UserAccount) => {
    try {
      const res = await api.createUser(newUser);
      if (res && res.error) {
        alert(res.error);
        showToast(res.error);
        return;
      }
      if (res && res.message && (res.message.includes("đã tồn tại") || res.message.includes("Lỗi"))) {
        alert(res.message);
        showToast(res.message);
        return;
      }
      const created = res && res.user ? { ...newUser, ...res.user } : newUser;
      const updated = [created, ...users];
      setUsers(updated);
      showToast(`Đã tạo tài khoản "${created.name}" thành công!`);
    } catch (err: any) {
      alert("Lỗi khi tạo tài khoản: " + (err.message || "Không thể kết nối máy chủ"));
    }
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    api.updateUser(updatedUser.id, updatedUser).catch(console.error);
    const updated = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updated);
    showToast(`Đã cập nhật tài khoản "${updatedUser.name}"!`);
  };

  const handleDeleteUser = (userId: string) => {
    api.deleteUser(userId).catch(console.error);
    const target = users.find((u) => u.id === userId);
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    showToast(`Đã xóa tài khoản "${target ? target.name : userId}"!`);
  };

  const handleToggleLockUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      const nextStatus: "active" | "locked" = target.status === "active" ? "locked" : "active";
      api.toggleUserStatus(userId, nextStatus).catch(console.error);
    }
    const updated = users.map((u) => {
      if (u.id === userId) {
        const nextStatus: "active" | "locked" = u.status === "active" ? "locked" : "active";
        showToast(
          nextStatus === "locked"
            ? `Đã khóa tài khoản "${u.name}"!`
            : `Đã mở khóa tài khoản "${u.name}"!`
        );
        return { ...u, status: nextStatus };
      }
      return u;
    });
    setUsers(updated);
  };

  const handleResetDefaultUsers = () => {
    api.getUsers().then((userList) => {
      if (userList) setUsers(userList);
    });
    showToast("Đã đồng bộ lại danh sách người dùng từ MongoDB!");
  };

  // Admin Login Handlers
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    const u = adminUsername.trim().toLowerCase();
    const p = adminPassword.trim();

    // Look for account in users list
    const found = users.find(
      (acc) =>
        (acc.email.toLowerCase() === u ||
          acc.name.toLowerCase() === u ||
          (u === "admin" && acc.role === "admin")) &&
        acc.password === p
    );

    if (found) {
      if (found.status === "locked") {
        setAdminLoginError("Tài khoản này đã bị KHÓA bởi Quản trị viên!");
        return;
      }
      if (found.role !== "admin" && found.role !== "staff") {
        setAdminLoginError(
          "Tài khoản này là 'Khách Hàng', không có quyền truy cập Cổng Quản Trị!"
        );
        return;
      }
      const loggedUser: UserProfile = {
        id: found.id,
        name: found.name,
        email: found.email,
        phone: found.phone,
        avatarUrl: found.avatarUrl || "/default-avatar.png",
        memberSince: found.createdAt || "Tháng " + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
      };
      setCurrentUser(loggedUser);
      setIsAdminLoggedIn(true);
      try {
        localStorage.setItem("bookstore_admin_session", "true");
        localStorage.setItem("bookstore_admin_user", JSON.stringify(found));
        localStorage.setItem("bookstore_user", JSON.stringify(loggedUser));
      } catch (err) {
        console.error(err);
      }
      showToast(`Đăng nhập Quản trị thành công! Xin chào ${found.name}`);
      setAdminPassword("");
      return;
    }

    // Fallback credentials for demo: admin / admin123 or admin@bookstore.vn / admin
    if (
      (u === "admin" || u === "admin@bookstore.vn" || u === "manager@bookstore.vn" || u === "bao@gmail.com" || u === "admin@dinhbao.vn") &&
      (p === "admin123" || p === "admin")
    ) {
      const adminAcc = users.find((acc) => acc.role === "admin") || {
        id: "usr-admin-1",
        name: "Quản Trị Viên (BookStore Admin)",
        email: "admin@bookstore.vn",
        phone: "0905 888 999",
        role: "admin" as const,
        status: "active" as const,
        avatarUrl: "/default-avatar.png",
        createdAt: "01/01/2024"
      };
      const loggedUser: UserProfile = {
        id: adminAcc.id,
        name: adminAcc.name,
        email: adminAcc.email,
        phone: adminAcc.phone,
        avatarUrl: adminAcc.avatarUrl || "/default-avatar.png",
        memberSince: adminAcc.createdAt || "Tháng 01/2024",
      };
      setCurrentUser(loggedUser);
      setIsAdminLoggedIn(true);
      try {
        localStorage.setItem("bookstore_admin_session", "true");
        localStorage.setItem("bookstore_admin_user", JSON.stringify(adminAcc));
        localStorage.setItem("bookstore_user", JSON.stringify(loggedUser));
      } catch (err) {
        console.error(err);
      }
      showToast("Đăng nhập quyền Quản trị (Admin) thành công!");
      setAdminPassword("");
    } else {
      setAdminLoginError(
        "Tài khoản hoặc mật khẩu không chính xác! Vui lòng kiểm tra lại."
      );
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentUser(null);
    setIsUserMenuOpen(false);
    try {
      localStorage.removeItem("bookstore_admin_session");
      localStorage.removeItem("bookstore_admin_user");
      localStorage.removeItem("bookstore_user");
      localStorage.removeItem("dinhbao_admin_session");
      localStorage.removeItem("dinhbao_admin_user");
      localStorage.removeItem("dinhbao_user");
    } catch (err) {
      console.error(err);
    }
    showToast("Đã đăng xuất toàn bộ tài khoản thành công!");
  };

  // NẾU ĐANG Ở TRANG /admin: HIỂN THỊ GIAO DIỆN ADMIN RIÊNG BIỆT (KHÔNG CÓ HEADER/CART CỦA CỬA HÀNG)
  if (activeTab === "admin") {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col justify-between">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {!isAdminLoggedIn ? (
          /* 1. Màn hình Đăng Nhập Quản Trị độc lập (Toàn màn hình, bảo mật) */
          <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-md w-full relative z-10">
              <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    BookStore Admin Portal
                  </h2>
                  <p className="text-xs text-slate-400">
                    Cổng Quản Trị Nhà Sách &bull; Quản lý sách, độc giả &amp; đơn hàng
                  </p>
                </div>

                {adminLoginError && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start space-x-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{adminLoginError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Tài khoản hoặc Email Admin
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="admin@bookstore.vn hoặc admin"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Mật khẩu quản trị
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={adminShowPassword ? "text" : "password"}
                        required
                        placeholder="admin123"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setAdminShowPassword(!adminShowPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {adminShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Đăng Nhập Quản Trị</span>
                  </button>

                  <div className="pt-3 border-t border-slate-800 text-center">
                    <button
                      type="button"
                      onClick={() => switchTab("products")}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      &larr; Quay lại Website Cửa Hàng
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* 2. Giao diện Trang Quản Trị Độc Lập khi đã đăng nhập */
          <div className="min-h-screen flex flex-col justify-between">
            {/* Header riêng của Admin */}
            <header className="bg-slate-900 text-white px-6 py-4 shadow-md sticky top-0 z-40 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                  B
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight flex items-center space-x-2">
                    <span>BookStore Admin Console</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 font-bold uppercase">
                      Hệ Thống Quản Trị Nhà Sách
                    </span>
                  </h1>
                  <p className="text-[11px] text-slate-400">Trang quản trị nội bộ nhà sách &bull; /admin</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => switchTab("products")}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Về Cửa Hàng</span>
                </button>
                <button
                  onClick={handleAdminLogout}
                  className="flex items-center space-x-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </header>

            {/* Nội dung AdminPanel */}
            <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
              <AdminPanel
                products={products}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onResetDefaultProducts={handleResetDefaultProducts}
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onDeleteOrder={handleDeleteOrder}
                onSwitchToStore={() => switchTab("products")}
                onAdminLogout={handleAdminLogout}
                users={users}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onToggleLockUser={handleToggleLockUser}
                onResetDefaultUsers={handleResetDefaultUsers}
              />
            </main>

            {/* Footer riêng của Admin */}
            <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-xs py-4 px-6 text-center">
              BookStore Admin Console &bull; Quản lý sách &amp; đơn hàng nội bộ
            </footer>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* KHỐI ĐỈNH TRANG: THANH THÔNG BÁO & HEADER (ĐÃ SỬA LỖI TRÀN & LỖI DÍNH SCROLL) */}
        <div className="space-y-2.5">
          {/* Thanh Thông Báo Tiện Ích Đỉnh Trang (Top Announcement Bar) */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white py-2 px-4 sm:px-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between text-xs gap-2 border border-blue-900/40">
            <div className="flex items-center space-x-2 overflow-hidden text-center sm:text-left">
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 shadow-sm">
                Ưu Đãi
              </span>
              <span className="text-slate-200 truncate">
                Hội Sách Tri Thức 2026 &bull; Nhập mã <strong className="text-amber-300 font-mono font-bold">BOOKWORM10</strong> giảm 10% &bull; Freeship toàn quốc từ 250k
              </span>
            </div>

            <div className="flex items-center space-x-3 text-slate-300 text-[11px] font-medium shrink-0">
              {/* Lối Vào Cổng Quản Trị Trực Tiếp Cho Admin / Quản Trị Viên */}
              <button
                onClick={() => switchTab("admin")}
                className="hover:text-amber-300 transition-colors flex items-center space-x-1 text-purple-300 hover:text-white font-semibold"
                title="Truy cập Cổng Quản Trị Hệ Thống /admin"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Quản trị {currentUser?.role === "admin" ? "(Admin)" : ""}</span>
              </button>
              <span className="text-slate-600 hidden sm:inline">&bull;</span>
              <button
                onClick={() => {
                  setSelectedTrackingOrder(null);
                  setIsOrderTrackingOpen(true);
                }}
                className="hover:text-amber-300 transition-colors flex items-center space-x-1"
              >
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                <span>Tra cứu đơn</span>
              </button>
              <span className="text-slate-600 hidden sm:inline">&bull;</span>
              <span className="hidden sm:flex items-center space-x-1 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hotline: <strong className="text-white">1900 8888</strong></span>
              </span>
            </div>
          </div>

          {/* Main Header / Store Navigation - Dính mượt mà trên cùng (Sticky Top-0) */}
          <header className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-md shadow-slate-200/50 sticky top-0 z-40 transition-all">
            <div className="flex items-center justify-between gap-3">
              {/* Logo Thương Hiệu BookStore */}
              <div
                onClick={() => switchTab("products")}
                className="flex items-center space-x-3 cursor-pointer group shrink-0"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform shrink-0">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                    <span className="text-blue-600">Book</span><span>Store</span>
                  </h1>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-blue-100">
                    Nhà Sách Tri Thức
                  </span>
                </div>
              </div>

              {/* Thanh Điều Hướng Desktop (Bảo đảm không bị xuống dòng chữ) */}
              <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60 text-xs font-bold shrink-0">
                <button
                  onClick={() => switchTab("products")}
                  className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                    activeTab === "products"
                      ? "bg-white text-blue-700 shadow-sm shadow-slate-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <span>📚</span>
                  <span>Sản Phẩm</span>
                </button>

                {/* Nút Đơn Hàng Của Tôi TRỰC TIẾP TRÊN THANH MENU */}
                <button
                  onClick={() => switchTab("orders")}
                  className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                    activeTab === "orders"
                      ? "bg-white text-blue-700 shadow-sm shadow-slate-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <span>📦</span>
                  <span>Đơn Hàng</span>
                  {orders.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        activeTab === "orders"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {orders.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => switchTab("about")}
                  className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                    activeTab === "about"
                      ? "bg-white text-blue-700 shadow-sm shadow-slate-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <span>🏛️</span>
                  <span>Giới Thiệu</span>
                </button>

                <button
                  onClick={() => switchTab("contact")}
                  className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                    activeTab === "contact"
                      ? "bg-white text-blue-700 shadow-sm shadow-slate-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <span>📞</span>
                  <span>Liên Hệ</span>
                </button>
              </nav>

              {/* Khối Tiện Ích Khách Hàng (Tra Cứu, Yêu Thích, Giỏ Hàng, Tài Khoản) */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                {/* Nút Tra cứu đơn hàng */}
                <button
                  onClick={() => {
                    setSelectedTrackingOrder(null);
                    setIsOrderTrackingOpen(true);
                  }}
                  className="hidden xl:flex items-center space-x-1.5 px-2.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100/80 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all whitespace-nowrap shrink-0"
                  title="Tra cứu lộ trình đơn hàng"
                >
                  <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Tra cứu đơn</span>
                </button>

                {/* Nút Sách Yêu Thích */}
                <button
                  onClick={() => setIsWishlistOpen(true)}
                  className="relative flex items-center space-x-1 px-2.5 py-2 text-xs font-bold text-slate-700 hover:text-rose-600 bg-slate-100/80 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all whitespace-nowrap shrink-0"
                  title="Danh sách sách yêu thích"
                >
                  <Heart
                    className={`w-3.5 h-3.5 shrink-0 ${
                      wishlist.length > 0 ? "text-rose-500 fill-rose-500" : "text-slate-500"
                    }`}
                  />
                  <span className="hidden xl:inline">Yêu thích</span>
                  {wishlist.length > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-sm">
                      {wishlist.length}
                    </span>
                  )}
                </button>

                {/* Nút Giỏ Hàng */}
                <button
                  onClick={() => switchTab("cart")}
                  className={`relative flex items-center space-x-1.5 px-3 sm:px-3.5 py-2 rounded-xl font-bold text-xs shadow-md transition-all whitespace-nowrap shrink-0 hover:scale-[1.02] ${
                    activeTab === "cart"
                      ? "bg-slate-900 text-white shadow-slate-900/20"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25"
                  }`}
                  title="Xem giỏ hàng"
                >
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Giỏ hàng</span>
                  <span
                    className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                      activeTab === "cart"
                        ? "bg-amber-400 text-slate-900"
                        : "bg-white text-blue-700"
                    }`}
                  >
                    {totalItemsCount}
                  </span>
                </button>

                {/* Khối Tài Khoản User */}
                {currentUser ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 transition-colors whitespace-nowrap shrink-0 border border-slate-200"
                      title={currentUser.name}
                    >
                      <img
                        src={currentUser.avatarUrl || "/default-avatar.png"}
                        alt={currentUser.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <span className="hidden sm:inline max-w-[85px] xl:max-w-[110px] truncate">
                        {currentUser.role === "admin" ? "Quản Trị Viên" : currentUser.name}
                      </span>
                      {currentUser.role === "admin" && (
                        <span className="hidden xl:inline text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-bold border border-purple-200 uppercase">
                          Admin
                        </span>
                      )}
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* Dropdown Menu người dùng */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                        <div className="px-3 py-2 border-b border-slate-100 flex items-center space-x-2.5">
                          <img
                            src={currentUser.avatarUrl || "/default-avatar.png"}
                            alt={currentUser.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                          </div>
                        </div>
                        <div className="py-1">
                          {/* Nút Hồ Sơ Của Tôi */}
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              switchTab("profile");
                            }}
                            className={`w-full px-3 py-2 text-xs rounded-xl flex items-center space-x-2 font-bold transition-colors ${
                              activeTab === "profile"
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <User className="w-4 h-4 text-blue-600" />
                            <span>Hồ Sơ Của Tôi</span>
                          </button>

                          {/* Nút Đơn Hàng Của Tôi */}
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              switchTab("orders");
                            }}
                            className={`w-full px-3 py-2 text-xs rounded-xl flex items-center space-x-2 font-medium transition-colors ${
                              activeTab === "orders"
                                ? "bg-blue-50 text-blue-700 font-bold"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <Package className="w-4 h-4 text-indigo-600" />
                            <span>Đơn hàng của tôi ({orders.length})</span>
                          </button>

                          {/* Nút Vào Trang Quản Trị Hệ Thống Nổi Bật */}
                          {(currentUser.role === "admin" || currentUser.role === "staff" || isAdminLoggedIn) ? (
                            <button
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                switchTab("admin");
                              }}
                              className="w-full px-3 py-2 text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl flex items-center justify-between font-bold transition-colors mt-1"
                            >
                              <div className="flex items-center space-x-2">
                                <ShieldCheck className="w-4 h-4 text-purple-600" />
                                <span>Trang Quản Trị (Admin)</span>
                              </div>
                              <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded font-black">
                                ADMIN
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                switchTab("admin");
                              }}
                              className="w-full px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded-xl flex items-center space-x-2 transition-colors mt-1"
                            >
                              <Lock className="w-4 h-4 text-slate-400" />
                              <span>Đăng nhập Quản Trị</span>
                            </button>
                          )}
                        </div>
                        <div className="border-t border-slate-100 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl flex items-center space-x-2 font-bold transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Đăng xuất</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setAuthTab("login");
                        setIsAuthModalOpen(true);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Đăng nhập</span>
                    </button>
                    <button
                      onClick={() => {
                        setAuthTab("register");
                        setIsAuthModalOpen(true);
                      }}
                      className="hidden md:flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors whitespace-nowrap"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Đăng ký</span>
                    </button>
                  </div>
                )}

                {/* Nút Hamburger bật/tắt Menu Mobile */}
                <button
                  onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                  className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                  title="Mở menu điều hướng"
                >
                  {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Menu Điều Hướng Rút Gọn Trên Mobile / Tablet */}
            {isMobileNavOpen && (
              <div className="lg:hidden pt-3 mt-3 border-t border-slate-100 flex flex-col space-y-1.5 animate-in fade-in slide-in-from-top-2">
                {/* Nút Admin trong Mobile Menu */}
                {(currentUser?.role === "admin" || currentUser?.role === "staff" || isAdminLoggedIn) ? (
                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      switchTab("admin");
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between bg-purple-50 text-purple-700 border border-purple-200 transition-all"
                  >
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Trang Quản Trị Hệ Thống (Admin)</span>
                    </div>
                    <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded font-black">
                      ADMIN
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      switchTab("admin");
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center space-x-2 text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Cổng Quản Trị Viên (Admin)</span>
                  </button>
                )}

                <button
                  onClick={() => switchTab("products")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center space-x-2 transition-all ${
                    activeTab === "products"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>📚</span>
                  <span>Sách &amp; Tác Phẩm Bestseller</span>
                </button>

                <button
                  onClick={() => switchTab("orders")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all ${
                    activeTab === "orders"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>📦</span>
                    <span>Đơn Hàng Của Tôi</span>
                  </div>
                  {orders.length > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {orders.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => switchTab("profile")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center space-x-2 transition-all ${
                    activeTab === "profile"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>👤</span>
                  <span>Hồ Sơ Cá Nhân &amp; Tài Khoản</span>
                </button>

                <button
                  onClick={() => switchTab("about")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center space-x-2 transition-all ${
                    activeTab === "about"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>🏛️</span>
                  <span>Giới Thiệu Nhà Sách BookStore</span>
                </button>

                <button
                  onClick={() => switchTab("contact")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center space-x-2 transition-all ${
                    activeTab === "contact"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>📞</span>
                  <span>Liên Hệ &amp; Hỗ Trợ Độc Giả</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    setSelectedTrackingOrder(null);
                    setIsOrderTrackingOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-left flex items-center space-x-2 text-slate-700 hover:bg-slate-50 transition-all"
                >
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Tra Cứu Hành Trình Đơn Hàng</span>
                </button>
              </div>
            )}
          </header>
        </div>

        {/* TAB 1: SẢN PHẨM (PRODUCTS) */}
        {activeTab === "products" && (
          selectedProduct ? (
            <ProductDetailPage
              product={selectedProduct}
              allProducts={products}
              onAddToCart={addToCart}
              onBuyNow={handleBuyNow}
              onBack={handleBackToProducts}
              onSelectRelatedProduct={handleSelectProduct}
              onToggleWishlist={handleToggleWishlist}
              isWishlisted={wishlist.some((w) => w.id === selectedProduct?.id)}
            />
          ) : (
            <div className="space-y-8 animate-in fade-in duration-200">
            {/* Hero Banner 2 Cột Hiện Đại Với Mockup Sách 3D */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-12 shadow-2xl border border-blue-900/40">
              {/* Vòng sáng nền mờ tạo chiều sâu */}
              <div className="absolute -right-16 -top-16 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-16 -bottom-16 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Cột Trái: Tiêu Đề, Mô Tả & Kêu Gọi Hành Động */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Badge sự kiện */}
                  <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold text-white border border-white/15 shadow-sm">
                    <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Hội Sách Tri Thức 2026 &bull; Tri thức mở lối tương lai</span>
                  </div>

                  {/* Tiêu đề Typography lớn */}
                  <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                    Khám Phá Thế Giới Tri Thức <br className="hidden sm:inline" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400">
                      Qua Từng Trang Sách
                    </span>
                  </h2>

                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                    Hàng ngàn tựa sách Bestseller văn học, kinh tế, công nghệ và kỹ năng sống chính hãng với ưu đãi đặc biệt đến 25% cùng quà tặng bookmark độc quyền và dịch vụ bọc sách miễn phí.
                  </p>

                  {/* Nút hành động & Mã voucher */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        const el = document.getElementById("product-grid");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
                    >
                      <span>Khám phá tủ sách ngay</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-xs text-slate-200">
                      <Tag className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>
                        Mã giảm 10%: <strong className="text-white font-mono font-bold tracking-wide">BOOKWORM10</strong> / <strong className="text-white font-mono font-bold tracking-wide">DEVOPS10</strong>
                      </span>
                    </div>
                  </div>

                  {/* Chỉ số uy tín (Social Proof) */}
                  <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-300 border-t border-white/10">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="font-bold text-white">18+</span> <span>Tựa Bestseller</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-bold text-white">100%</span> <span>Sách Chuẩn NXB</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Truck className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-bold text-white">Freeship</span> <span>Đơn từ 250k</span>
                    </div>
                  </div>
                </div>

                {/* Cột Phải: Mockup Bìa Sách 3D Xếp Lớp (Tactile Book Mockup) */}
                <div className="lg:col-span-5 relative hidden lg:flex items-center justify-center min-h-[360px]">
                  {/* Bìa Sách Phụ Trái: Đắc Nhân Tâm */}
                  <div className="absolute -left-2 top-8 w-40 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/20 -rotate-12 hover:rotate-0 transition-all duration-300 bg-slate-900 group/bk1 cursor-pointer">
                    <img
                      src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80"
                      alt="Đắc Nhân Tâm"
                      className="w-full h-full object-cover group-hover/bk1:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-black/10 to-transparent pointer-events-none" />
                  </div>

                  {/* Bìa Sách Phụ Phải: Cây Cam Ngọt Của Tôi */}
                  <div className="absolute -right-2 top-10 w-40 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/20 rotate-12 hover:rotate-0 transition-all duration-300 bg-slate-900 group/bk2 cursor-pointer">
                    <img
                      src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80"
                      alt="Cây Cam Ngọt Của Tôi"
                      className="w-full h-full object-cover group-hover/bk2:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-black/10 to-transparent pointer-events-none" />
                  </div>

                  {/* Bìa Sách Chính Trung Tâm: Nhà Giả Kim */}
                  <div className="relative z-10 w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border-2 border-white/40 hover:scale-105 transition-all duration-300 bg-slate-900 group/bk3 cursor-pointer">
                    <img
                      src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80"
                      alt="Nhà Giả Kim"
                      className="w-full h-full object-cover group-hover/bk3:scale-105 transition-transform duration-300"
                    />
                    {/* Hiệu ứng gáy sách 3D */}
                    <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/50 via-black/15 to-transparent pointer-events-none" />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/70 backdrop-blur-md rounded-xl p-2 text-center text-white border border-white/10">
                      <span className="block text-[11px] font-black uppercase tracking-wider text-amber-300">Nhà Giả Kim</span>
                      <span className="block text-[9px] text-slate-300">Paulo Coelho</span>
                    </div>
                  </div>

                  {/* Floating Star Rating Badge */}
                  <div className="absolute top-2 right-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xl border border-white/60 text-slate-900 text-xs font-black flex items-center space-x-1.5 animate-pulse">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>4.9/5 Đánh Giá</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Value Proposition Features */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800">Miễn Phí Giao Sách</h4>
                  <p className="text-[11px] text-slate-500">Đơn hàng từ 250.000đ</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800">100% Sách Thật</h4>
                  <p className="text-[11px] text-slate-500">Chuẩn NXB &amp; Bọc sách free</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800">Đổi Trả Sách 7 Ngày</h4>
                  <p className="text-[11px] text-slate-500">Lỗi in ấn đổi mới 100%</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800">Tư Vấn Đọc Sách</h4>
                  <p className="text-[11px] text-slate-500">Đội ngũ thủ thư hỗ trợ 24/7</p>
                </div>
              </div>
            </section>

            {/* Filter & Sorting Controls */}
            <section id="product-grid" className="space-y-4">
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Category Tabs dạng Icon Pills với số lượng sách */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {CATEGORIES.map((cat) => {
                    const icon = CATEGORY_ICONS[cat] || "📚";
                    const count =
                      cat === "Tất cả"
                        ? products.length
                        : products.filter((p) => p.category === cat).length;

                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 ${
                          selectedCategory === cat
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/25 scale-[1.02]"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900"
                        }`}
                      >
                        <span>{icon}</span>
                        <span>{cat}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                            selectedCategory === cat
                              ? "bg-white/20 text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search & Sort */}
                <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                  <div className="relative w-full md:w-60">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm sách, tác giả, NXB..."
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="default">Phổ biến</option>
                      <option value="price-asc">Giá: Thấp &rarr; Cao</option>
                      <option value="price-desc">Giá: Cao &rarr; Thấp</option>
                      <option value="rating">Đánh giá cao</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Product Grid */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-700">Không tìm thấy sản phẩm</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Không có sản phẩm nào phù hợp với bộ lọc hoặc từ khóa &ldquo;{searchQuery}&rdquo;.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("Tất cả");
                      setSortBy("default");
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {paginatedProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white rounded-3xl border border-slate-200/80 p-3.5 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-300 flex flex-col justify-between group"
                    >
                      {/* Khung Bìa Sách 3D Tỷ Lệ 3:4 Chuẩn NXB */}
                      <div
                        className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 cursor-pointer shadow-inner"
                        onClick={() => handleSelectProduct(prod)}
                      >
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />

                        {/* Hiệu ứng gáy sách chiều sâu 3D */}
                        <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/30 via-black/10 to-transparent pointer-events-none z-10" />

                        {/* Giảm giá badge */}
                        {prod.discountPercent > 0 && (
                          <div className="absolute top-3 left-3 z-20 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md shadow-red-600/30">
                            -{prod.discountPercent}%
                          </div>
                        )}

                        {/* Nút Thả Tim Yêu Thích */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(prod);
                          }}
                          className={`absolute top-3 right-3 z-20 p-2 rounded-xl backdrop-blur-md transition-all shadow-md ${
                            wishlist.some((w) => w.id === prod.id)
                              ? "bg-rose-500 text-white shadow-rose-500/30"
                              : "bg-white/85 hover:bg-white text-slate-700"
                          }`}
                          title={
                            wishlist.some((w) => w.id === prod.id)
                              ? "Xóa khỏi yêu thích"
                              : "Thêm vào yêu thích"
                          }
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              wishlist.some((w) => w.id === prod.id) ? "fill-white" : ""
                            }`}
                          />
                        </button>

                        {/* Tạm hết hàng overlay */}
                        {!prod.inStock && (
                          <div className="absolute inset-0 z-30 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center text-white text-xs font-bold">
                            Tạm Hết Hàng
                          </div>
                        )}
                      </div>

                      {/* Thông tin chi tiết sách */}
                      <div className="pt-3.5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          {/* Thể loại & Tồn kho & Đánh giá */}
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                            <span className="font-bold text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                              {prod.category}
                            </span>
                            {prod.inStock && prod.stockQuantity !== undefined && prod.stockQuantity <= 5 && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md font-black animate-pulse">
                                ⚡ Còn {prod.stockQuantity}
                              </span>
                            )}
                            {prod.reviewsCount && prod.reviewsCount > 0 ? (
                              <div className="flex items-center text-amber-500 font-bold text-xs">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                                <span>{prod.rating || 5.0}</span>
                                <span className="text-slate-400 text-[10px] ml-1 font-normal">
                                  ({prod.reviewsCount})
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center text-slate-400 text-[11px] font-medium">
                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[10px]">
                                  Chưa có đánh giá
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Tên Sách */}
                          <h3
                            onClick={() => handleSelectProduct(prod)}
                            className="font-bold text-sm text-slate-900 line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors leading-snug"
                            title={prod.name}
                          >
                            {prod.name}
                          </h3>

                          {/* Tên Tác Giả */}
                          <p className="text-xs text-slate-500 font-medium truncate mt-1">
                            Tác giả: <span className="text-slate-700 font-semibold">{prod.author || "Nhiều tác giả"}</span>
                          </p>
                        </div>

                        {/* Giá & Nút hành động */}
                        <div>
                          <div className="flex items-baseline space-x-2">
                            <span className="text-base font-black text-red-600">
                              {formatVND(prod.price)}
                            </span>
                            {prod.originalPrice > prod.price && (
                              <span className="text-xs text-slate-400 line-through">
                                {formatVND(prod.originalPrice)}
                              </span>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center space-x-2">
                            <button
                              onClick={() => handleSelectProduct(prod)}
                              className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
                            >
                              Chi tiết
                            </button>
                            <button
                              onClick={() => addToCart(prod)}
                              disabled={!prod.inStock}
                              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                                prod.inStock
                                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 hover:shadow-lg"
                                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                              }`}
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>{prod.inStock ? "Thêm vào giỏ" : "Hết hàng"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* THANH ĐIỀU HƯỚNG PHÂN TRANG (PAGINATION CONTROLS) */}
              {filteredProducts.length > 0 && (
                <div className="mt-10 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Thông tin số lượng hiển thị */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500">
                    <span>
                      Hiển thị{" "}
                      <strong className="text-slate-800 font-bold">
                        {(currentPage - 1) * itemsPerPage + 1} -{" "}
                        {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                      </strong>{" "}
                      trên tổng số{" "}
                      <strong className="text-slate-800 font-bold">
                        {filteredProducts.length}
                      </strong>{" "}
                      cuốn sách
                    </span>
                    <span className="text-slate-300 hidden sm:inline">&bull;</span>
                    {/* Bộ chọn số lượng hiển thị trên 1 trang */}
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-400">Xem mỗi trang:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                      >
                        <option value={8}>8 cuốn (2 hàng)</option>
                        <option value={12}>12 cuốn (3 hàng)</option>
                        <option value={16}>16 cuốn (4 hàng)</option>
                      </select>
                    </div>
                  </div>

                  {/* Nút điều hướng các trang */}
                  {totalPages > 1 && (
                    <div className="flex items-center space-x-1.5">
                      {/* Nút Trang trước */}
                      <button
                        onClick={() => {
                          const newPage = Math.max(1, currentPage - 1);
                          setCurrentPage(newPage);
                          document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 border transition-all ${
                          currentPage === 1
                            ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 shadow-xs"
                        }`}
                        title="Trang trước"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Trước</span>
                      </button>

                      {/* Các nút số trang */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => {
                                setCurrentPage(page);
                                document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                                currentPage === page
                                  ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-105"
                                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-xs"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          (page === currentPage - 2 && page > 1) ||
                          (page === currentPage + 2 && page < totalPages)
                        ) {
                          return (
                            <span key={page} className="px-1 text-slate-400 text-xs font-bold">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}

                      {/* Nút Trang sau */}
                      <button
                        onClick={() => {
                          const newPage = Math.min(totalPages, currentPage + 1);
                          setCurrentPage(newPage);
                          document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 border transition-all ${
                          currentPage === totalPages
                            ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 shadow-xs"
                        }`}
                        title="Trang tiếp theo"
                      >
                        <span className="hidden sm:inline">Sau</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
          )
        )}

        {/* TAB 2: GIỚI THIỆU SHOP (ABOUT US) */}
        {activeTab === "about" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* About Hero */}
            <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
              <div className="relative z-10 max-w-3xl space-y-4">
                <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3.5 py-1 rounded-full text-xs font-bold">
                  <Award className="w-4 h-4" />
                  <span>Thương Hiệu Uy Tín &amp; Chất Lượng</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  Chào mừng bạn đến với BookStore
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  <strong>BookStore</strong> được thành lập với sứ mệnh lan tỏa văn hóa đọc, mang đến cho độc giả, học sinh, sinh viên và cộng đồng yêu tri thức những tựa sách văn học, kinh tế, công nghệ lập trình và phát triển bản thân xuất sắc nhất từ các Nhà xuất bản uy tín hàng đầu.
                </p>
              </div>
            </section>

            {/* Core Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">100% Sách Thật Chuẩn NXB</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tất cả tác phẩm tại BookStore đều có bản quyền chính thức từ NXB Trẻ, Kim Đồng, Hội Nhà Văn, Thông Tin Truyền Thông... nói không với sách in lậu.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Đổi Trả Sách 7 Ngày</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hỗ trợ đổi mới cuốn sách miễn phí trong 7 ngày nếu phát sinh lỗi in ấn, nhầm trang hoặc hư hỏng trong quá trình vận chuyển.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Headphones className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Tư Vấn Văn Hóa Đọc</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đội ngũ thủ thư am hiểu sâu sắc về các dòng sách, luôn sẵn sàng lắng nghe và gợi ý tác phẩm phù hợp nhất với mục tiêu học tập và thư giãn của bạn.
                </p>
              </div>
            </div>

            {/* Store Stats */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-blue-600">10,000+</div>
                  <div className="text-xs text-slate-500 font-semibold mt-1">Độc Giả Thân Thiết</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-indigo-600">100%</div>
                  <div className="text-xs text-slate-500 font-semibold mt-1">Sách Thật Chuẩn NXB</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-600">7 Ngày</div>
                  <div className="text-xs text-slate-500 font-semibold mt-1">Đổi Trả Miễn Phí</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-purple-600">24/7</div>
                  <div className="text-xs text-slate-500 font-semibold mt-1">Tư Vấn Đọc Sách</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIÊN HỆ (CONTACT US) */}
        {activeTab === "contact" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-3xl font-black text-slate-900">Liên Hệ Với BookStore</h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Chúng tôi luôn lắng nghe và sẵn sàng hỗ trợ bạn bất cứ lúc nào.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Information */}
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
                    Thông Tin Liên Hệ
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="block text-slate-800 font-bold">Địa chỉ cửa hàng:</strong>
                        <span className="text-slate-600">33 Xô Viết Nghệ Tĩnh, Quận Cẩm Lệ, TP. Đà Nẵng</span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="block text-slate-800 font-bold">Hotline tư vấn &amp; đặt hàng:</strong>
                        <span className="text-slate-600 font-semibold">1900 8888 &middot; 0905 123 456</span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="block text-slate-800 font-bold">Email hỗ trợ:</strong>
                        <span className="text-slate-600">contact@bookstore.vn &middot; support@bookstore.vn</span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="block text-slate-800 font-bold">Giờ làm việc:</strong>
                        <span className="text-slate-600">8:00 - 21:30 (Thứ 2 - Chủ Nhật)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map simulation */}
                <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200 text-center space-y-2">
                  <MapPin className="w-8 h-8 text-red-500 mx-auto animate-bounce" />
                  <h4 className="font-bold text-xs text-slate-800">Bản Đồ Chỉ Đường</h4>
                  <p className="text-[11px] text-slate-500">Đại học Đông Á - 33 Xô Viết Nghệ Tĩnh, Đà Nẵng</p>
                </div>
              </div>

              {/* Contact Message Form */}
              <div className="lg:col-span-2">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-lg mb-1">Gửi Lời Nhắn Trực Tuyến</h3>
                  <p className="text-xs text-slate-500 mb-6">
                    Điền thông tin bên dưới, nhân viên hỗ trợ của BookStore sẽ phản hồi bạn trong vòng 15 phút.
                  </p>

                  <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Họ và tên của bạn *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Nguyễn Văn A"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Số điện thoại *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="0905 123 456"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Địa chỉ Email
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nội dung lời nhắn hoặc yêu cầu hỗ trợ *
                      </label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Tôi muốn tư vấn về tựa sách Clean Code hoặc đặt sách số lượng lớn cho thư viện..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Gửi Tin Nhắn Cho BookStore</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GIỎ HÀNG TOÀN TRANG (FULL-PAGE CART) */}
        {activeTab === "cart" && (
          <CartPage
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            onClearCart={handleClearCart}
            onContinueShopping={() => switchTab("products")}
            onProceedToCheckout={() => setIsCheckoutOpen(true)}
            onSelectProduct={handleSelectProduct}
            suggestedProducts={products}
            promoCode={promoCode}
            setPromoCode={setPromoCode}
            appliedDiscount={appliedDiscount}
            onApplyCoupon={handleApplyCoupon}
            subtotal={subtotal}
            discountAmount={discountAmount}
            shippingFee={shippingFee}
            totalAmount={finalTotal}
          />
        )}

        {/* TAB 5: ĐƠN HÀNG CỦA TÔI (MY ORDERS TRANG RIÊNG BIỆT) */}
        {activeTab === "orders" && (
          <MyOrdersPage
            orders={orders}
            currentUser={currentUser}
            onContinueShopping={() => switchTab("products")}
            onTrackOrder={(ord) => {
              setSelectedTrackingOrder(ord);
              setIsOrderTrackingOpen(true);
            }}
            onReorder={handleReorder}
            onOpenAuth={() => {
              setAuthTab("login");
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {/* TAB 6: HỒ SƠ ĐỘC GIẢ (USER PROFILE TRANG RIÊNG BIỆT) */}
        {activeTab === "profile" && (
          <ProfilePage
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            ordersCount={orders.length}
            wishlistCount={wishlist.length}
            onNavigateToOrders={() => switchTab("orders")}
            onNavigateToWishlist={() => setIsWishlistOpen(true)}
            onOpenAuth={() => {
              setAuthTab("login");
              setIsAuthModalOpen(true);
            }}
            onLogout={handleLogout}
            onContinueShopping={() => switchTab("products")}
          />
        )}

        {/* AUTHENTICATION MODAL */}
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="relative bg-slate-50 border-b border-slate-200 p-4 pb-0 flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setAuthError(null);
                      setAuthTab("login");
                    }}
                    className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
                      authTab === "login"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Đăng Nhập
                  </button>
                  <button
                    onClick={() => {
                      setAuthError(null);
                      setAuthTab("register");
                    }}
                    className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
                      authTab === "register"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Đăng Ký
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setAuthError(null);
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {authTab === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="text-center mb-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        Chào mừng đến với BookStore
                      </h3>
                      <p className="text-xs text-slate-500">
                        Đăng nhập để theo dõi đơn hàng và nhận ưu đãi
                      </p>
                    </div>

                    {authError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start space-x-2.5 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                        <span className="font-semibold leading-relaxed">{authError}</span>
                      </div>
                    )}

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Email / Tài khoản / Số điện thoại
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            placeholder="admin@bookstore.vn hoặc email của bạn"
                            value={loginEmail}
                            onChange={(e) => {
                              setLoginEmail(e.target.value);
                              if (authError) setAuthError(null);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Mật khẩu
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => {
                              setLoginPassword(e.target.value);
                              if (authError) setAuthError(null);
                            }}
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Đăng Nhập Ngay</span>
                    </button>

                    <div className="pt-3 border-t border-slate-100 text-center">
                      <p className="text-xs text-slate-500">
                        Chưa có tài khoản?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setAuthError(null);
                            setAuthTab("register");
                          }}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Đăng ký ngay
                        </button>
                      </p>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-3 text-xs">
                    <div className="text-center mb-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        Tạo Tài Khoản Mới
                      </h3>
                      <p className="text-xs text-slate-500">
                        Tham gia cùng hàng ngàn độc giả của BookStore
                      </p>
                    </div>

                    {authError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start space-x-2.5 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                        <span className="font-semibold leading-relaxed">{authError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Họ và tên *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Địa chỉ Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="nguyenvana@gmail.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0912 345 678"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mật khẩu *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Tối thiểu 6 ký tự"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Xác nhận mật khẩu *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Nhập lại mật khẩu"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Đăng Ký Tài Khoản</span>
                    </button>

                    <p className="text-center text-xs text-slate-500 pt-2">
                      Đã có tài khoản?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError(null);
                          setAuthTab("login");
                        }}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Đăng nhập ngay
                      </button>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* USER ORDERS HISTORY MODAL */}
        {isOrdersModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Lịch Sử Đơn Hàng ({orders.length})
                  </h3>
                </div>
                <button
                  onClick={() => setIsOrdersModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Package className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">Bạn chưa có đơn hàng nào</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hãy thêm sản phẩm vào giỏ hàng và hoàn tất đặt hàng nhé!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-mono text-blue-600">#{ord.id}</span>
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                          {ord.status}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-200/60">
                        {ord.items.map((item) => (
                          <div key={item.product.id} className="py-1.5 flex justify-between">
                            <span className="text-slate-700">
                              {item.quantity}x {item.product.name}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {formatVND(item.product.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                        <span className="text-slate-500">Ngày đặt: {ord.date}</span>
                        <span className="font-extrabold text-red-600 text-sm">
                          {formatVND(ord.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 animate-in fade-in zoom-in-95">
              {!orderSuccess ? (
                <form onSubmit={handleCheckoutSubmit} className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Thông Tin Giao Hàng &amp; Thanh Toán
                      </h3>
                      <p className="text-xs text-slate-500">
                        Vui lòng nhập thông tin chính xác để nhận hàng nhanh nhất
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Họ và tên người nhận *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={customerInfo.fullName}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            fullName: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Số điện thoại nhận hàng *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0912 345 678"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Địa chỉ nhận hàng chi tiết *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                        value={customerInfo.address}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            address: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Phương thức thanh toán
                      </label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <label
                          className={`border rounded-xl p-3 flex items-center space-x-2 cursor-pointer transition-all ${
                            customerInfo.paymentMethod === "cod"
                              ? "border-blue-600 bg-blue-50 text-blue-900"
                              : "border-slate-200 text-slate-700"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cod"
                            checked={customerInfo.paymentMethod === "cod"}
                            onChange={(e) =>
                              setCustomerInfo({
                                ...customerInfo,
                                paymentMethod: e.target.value,
                              })
                            }
                            className="text-blue-600"
                          />
                          <div className="flex items-center space-x-1.5">
                            <Truck className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-xs">
                              COD (Tiền mặt)
                            </span>
                          </div>
                        </label>

                        <label
                          className={`border rounded-xl p-3 flex items-center space-x-2 cursor-pointer transition-all ${
                            customerInfo.paymentMethod === "banking"
                              ? "border-blue-600 bg-blue-50 text-blue-900"
                              : "border-slate-200 text-slate-700"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="banking"
                            checked={customerInfo.paymentMethod === "banking"}
                            onChange={(e) =>
                              setCustomerInfo({
                                ...customerInfo,
                                paymentMethod: e.target.value,
                              })
                            }
                            className="text-blue-600"
                          />
                          <div className="flex items-center space-x-1.5">
                            <CreditCard className="w-4 h-4 text-indigo-600" />
                            <span className="font-semibold text-xs">
                              Chuyển khoản QR
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Ghi chú đơn hàng (nếu có)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Giao giờ hành chính, gọi trước khi giao..."
                        value={customerInfo.note}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            note: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-600 font-medium">
                      Tổng tiền thanh toán:
                    </span>
                    <span className="text-lg font-black text-red-600">
                      {formatVND(finalTotal)}
                    </span>
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                    >
                      Quay lại
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác Nhận Đặt Hàng</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">
                    Đặt Hàng Thành Công!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Cảm ơn bạn{" "}
                    <strong className="text-slate-800">
                      {customerInfo.fullName}
                    </strong>{" "}
                    đã mua sắm tại BookStore. Đơn hàng của bạn đang được xử lý.
                  </p>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-left space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mã đơn hàng:</span>
                      <span className="font-bold text-blue-600">
                        {currentOrderId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số điện thoại:</span>
                      <span className="text-slate-800">{customerInfo.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Địa chỉ:</span>
                      <span className="text-slate-800 truncate max-w-[200px]">
                        {customerInfo.address}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hình thức:</span>
                      <span className="text-slate-800 uppercase">
                        {customerInfo.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setOrderSuccess(false);
                    }}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    Tiếp Tục Mua Sắm
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL THANH TOÁN VIETQR */}
        <PaymentQRModal
          isOpen={isPaymentQROpen}
          onClose={() => setIsPaymentQROpen(false)}
          orderId={currentOrderId}
          totalAmount={finalTotal}
          customerName={customerInfo.fullName}
          onConfirmPaid={() => {
            setIsPaymentQROpen(false);
            showToast("Xác nhận thanh toán thành công! BookStore đang xử lý đơn hàng của bạn.");
          }}
        />

        {/* MODAL SÁCH YÊU THÍCH (WISHLIST) */}
        <WishlistModal
          isOpen={isWishlistOpen}
          onClose={() => setIsWishlistOpen(false)}
          wishlist={wishlist}
          onRemoveFromWishlist={(id) => {
            setWishlist((prev) => {
              const next = prev.filter((p) => p.id !== id);
              try {
                localStorage.setItem("bookstore_wishlist", JSON.stringify(next));
              } catch {}
              return next;
            });
          }}
          onAddToCart={(p) => {
            addToCart(p);
            showToast(`Đã thêm "${p.name}" vào giỏ hàng!`);
          }}
          onSelectProduct={(p) => handleSelectProduct(p)}
        />

        {/* MODAL TRA CỨU TIẾN TRÌNH ĐƠN HÀNG */}
        <OrderTrackingModal
          isOpen={isOrderTrackingOpen}
          onClose={() => {
            setIsOrderTrackingOpen(false);
            setSelectedTrackingOrder(null);
          }}
          orders={orders}
          selectedOrder={selectedTrackingOrder}
        />
      </div>

      {/* Footer Nhà Sách Cao Cấp 4 Cột */}
      <footer className="bg-slate-900 text-slate-300 mt-16 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Cột 1: Thông Tin Thương Hiệu */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="font-black text-xl text-white tracking-tight">
                  <span className="text-blue-400">Book</span>Store
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Nhà sách trực tuyến uy tín hàng đầu. Sứ mệnh lan tỏa tri thức và văn hóa đọc đến mọi độc giả Việt Nam với 100% sách thật chuẩn bản quyền Nhà xuất bản.
              </p>
              <div className="pt-1 space-y-1 text-slate-400 text-[11px]">
                <p className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>33 Xô Viết Nghệ Tĩnh, Quận Cẩm Lệ, Đà Nẵng</span>
                </p>
                <p className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Hotline: <strong className="text-white">1900 8888</strong> &bull; 0905 123 456</span>
                </p>
                <p className="flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>contact@bookstore.vn</span>
                </p>
              </div>
            </div>

            {/* Cột 2: Danh Mục Sách Bestseller */}
            <div>
              <h4 className="font-bold text-white text-sm mb-3.5 pb-1 border-b border-slate-800 flex items-center space-x-1.5">
                <span>📚</span>
                <span>Danh Mục Sách Hay</span>
              </h4>
              <ul className="space-y-2 text-slate-400 text-[11px]">
                {CATEGORIES.filter((c) => c !== "Tất cả").slice(0, 5).map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => {
                        setSelectedCategory(cat);
                        switchTab("products");
                        const el = document.getElementById("product-grid");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="hover:text-amber-300 transition-colors flex items-center space-x-1.5"
                    >
                      <span className="text-slate-600">&rsaquo;</span>
                      <span>{cat}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột 3: Chính Sách & Cam Kết Độc Quyền */}
            <div>
              <h4 className="font-bold text-white text-sm mb-3.5 pb-1 border-b border-slate-800 flex items-center space-x-1.5">
                <span>🛡️</span>
                <span>Chính Sách &amp; Hỗ Trợ</span>
              </h4>
              <ul className="space-y-2.5 text-slate-400 text-[11px]">
                <li className="flex items-start space-x-2">
                  <Truck className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>Freeship toàn quốc cho đơn hàng từ 250.000₫</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>100% Sách thật chuẩn NXB, bồi hoàn 200% nếu sách lậu</span>
                </li>
                <li className="flex items-start space-x-2">
                  <RotateCcw className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Đổi trả sách miễn phí trong 7 ngày do lỗi in ấn</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Bookmark className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Tặng kèm bookmark độc quyền &amp; bọc sách plastic free</span>
                </li>
              </ul>
            </div>

            {/* Cột 4: Đối Tác Xuất Bản & Thanh Toán */}
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white text-sm mb-3 pb-1 border-b border-slate-800 flex items-center space-x-1.5">
                  <span>🏛️</span>
                  <span>Nhà Xuất Bản Đối Tác</span>
                </h4>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                  <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-slate-300">NXB Trẻ</span>
                  <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-slate-300">Kim Đồng</span>
                  <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-slate-300">Nhã Nam</span>
                  <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-slate-300">First News</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white text-xs mb-2 text-slate-400">
                  Phương Thức Thanh Toán Linh Hoạt
                </h4>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                  <span className="bg-blue-900/60 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-md">VietQR</span>
                  <span className="bg-red-900/60 text-rose-300 border border-red-800 px-2 py-0.5 rounded-md">VNPAY</span>
                  <span className="bg-pink-900/60 text-pink-300 border border-pink-800 px-2 py-0.5 rounded-md">MoMo</span>
                  <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md">Tiền Mặt (COD)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dòng Bản Quyền Cuối Trang */}
          <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <p>&copy; {new Date().getFullYear()} BookStore &bull; Hệ Thống Nhà Sách Trực Tuyến &amp; Tri Thức Số.</p>
            <div className="flex items-center space-x-3 text-slate-400">
              <button
                onClick={() => switchTab("admin")}
                className="hover:text-purple-300 transition-colors flex items-center space-x-1 text-slate-400"
                title="Truy cập Cổng Quản Trị Hệ Thống"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Cổng Quản Trị Admin</span>
              </button>
              <span>&bull;</span>
              <p className="flex items-center space-x-2">
                <span>Đại học Đông Á &bull; Khoa Công Nghệ Thông Tin</span>
                <span>&bull;</span>
                <span className="text-emerald-400 font-mono">React 18 &bull; Vite</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
