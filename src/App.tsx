import React, { useState, useMemo, useEffect } from "react";
import { PRODUCTS, CATEGORIES, Product } from "./data/products";
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
  Eye,
  EyeOff,
  MapPin,
  Send,
  Award,
  Check,
  Building,
  Clock
} from "lucide-react";

interface CartItem {
  product: Product;
  quantity: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  memberSince: string;
}

interface OrderRecord {
  id: string;
  date: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: string;
  status: "Đang xử lý" | "Đang giao" | "Hoàn tất";
  customerInfo: {
    fullName: string;
    phone: string;
    address: string;
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"products" | "about" | "contact">("products");
  const [products] = useState<Product[]>(PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("default");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [promoCode, setPromoCode] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication States
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState<boolean>(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);

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

  // Load saved user from local storage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("dinhbao_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setCustomerInfo((prev) => ({
          ...prev,
          fullName: parsed.name || "",
          phone: parsed.phone || "",
        }));
      }

      const savedOrders = localStorage.getItem("dinhbao_orders");
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } catch {
      // ignore
    }
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
    if (!loginEmail || !loginPassword) {
      showToast("Vui lòng nhập đầy đủ Email và Mật khẩu!");
      return;
    }

    const loggedUser: UserProfile = {
      id: "usr-" + Date.now(),
      name: loginEmail.split("@")[0] || "Khách Hàng",
      email: loginEmail,
      phone: "0905 123 456",
      memberSince: "Tháng " + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
    };

    setCurrentUser(loggedUser);
    localStorage.setItem("dinhbao_user", JSON.stringify(loggedUser));
    setCustomerInfo((prev) => ({
      ...prev,
      fullName: loggedUser.name,
      phone: loggedUser.phone,
    }));
    setIsAuthModalOpen(false);
    showToast(`Chào mừng bạn trở lại, ${loggedUser.name}!`);
    setLoginPassword("");
  };

  // Handle Register
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regPassword) {
      showToast("Vui lòng điền đầy đủ các thông tin đăng ký!");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      showToast("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    const newUser: UserProfile = {
      id: "usr-" + Date.now(),
      name: regName,
      email: regEmail,
      phone: regPhone,
      memberSince: "Tháng " + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
    };

    setCurrentUser(newUser);
    localStorage.setItem("dinhbao_user", JSON.stringify(newUser));
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

  // Quick Demo Login
  const handleQuickDemoLogin = () => {
    const demoUser: UserProfile = {
      id: "demo-user-1",
      name: "Nguyễn Văn An",
      email: "demo@dinhbao.vn",
      phone: "0988 776 655",
      memberSince: "Tháng 8/2024",
    };
    setCurrentUser(demoUser);
    localStorage.setItem("dinhbao_user", JSON.stringify(demoUser));
    setCustomerInfo((prev) => ({
      ...prev,
      fullName: demoUser.name,
      phone: demoUser.phone,
      address: "123 Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng",
    }));
    setIsAuthModalOpen(false);
    showToast("Đã đăng nhập nhanh với tài khoản Demo!");
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("dinhbao_user");
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

  // Apply Coupon
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === "DINHBAO10" || promoCode.trim().toUpperCase() === "DEVOPS10") {
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
      localStorage.setItem("dinhbao_orders", JSON.stringify(updatedOrders));
    } catch {
      // ignore
    }

    setOrderSuccess(true);
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
    showToast("Cảm ơn bạn! DinhBao Store đã nhận được tin nhắn và sẽ liên hệ lại sớm nhất.");
    setContactForm({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Main Header / Store Navigation */}
        <header className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-40 backdrop-blur-md bg-white/95">
          {/* Brand & Mobile Actions */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between">
            <div
              onClick={() => setActiveTab("products")}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                D
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  DinhBao
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Cửa Hàng Công Nghệ Chính Hãng
                </p>
              </div>
            </div>

            {/* Mobile User & Cart */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={() => {
                  if (currentUser) {
                    setIsUserMenuOpen(!isUserMenuOpen);
                  } else {
                    setIsAuthModalOpen(true);
                  }
                }}
                className="p-2.5 bg-slate-100 rounded-xl text-slate-700"
              >
                <User className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                    {totalItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 p-1.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-600">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === "products"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "hover:text-slate-900"
              }`}
            >
              Sản phẩm
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === "about"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "hover:text-slate-900"
              }`}
            >
              Giới thiệu shop
            </button>
            <button
              onClick={() => setActiveTab("contact")}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === "contact"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "hover:text-slate-900"
              }`}
            >
              Liên hệ
            </button>
          </nav>

          {/* Desktop User Account & Cart */}
          <div className="hidden md:flex items-center space-x-3">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2.5 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="max-w-[100px] truncate">{currentUser.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsOrdersModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl flex items-center space-x-2 font-medium"
                      >
                        <Package className="w-4 h-4 text-blue-600" />
                        <span>Đơn hàng của tôi ({orders.length})</span>
                      </button>
                    </div>
                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl flex items-center space-x-2 font-bold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setAuthTab("login");
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </button>
                <button
                  onClick={() => {
                    setAuthTab("register");
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Đăng ký</span>
                </button>
              </div>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Giỏ hàng</span>
              <span className="bg-white text-blue-700 text-[11px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                {totalItemsCount}
              </span>
            </button>
          </div>
        </header>

        {/* TAB 1: SẢN PHẨM (PRODUCTS) */}
        {activeTab === "products" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Hero Banner */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white p-6 sm:p-10 shadow-xl">
              <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold text-white">
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>DinhBao Tech Mega Sale</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  Trải Nghiệm Thiết Bị Công Nghệ Đỉnh Cao
                </h2>
                <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                  Chuyên cung cấp MacBook, iPhone, bàn phím cơ và thiết bị âm thanh chính hãng với chính sách bảo hành 1 đổi 1 trong 30 ngày.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      const el = document.getElementById("product-grid");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center space-x-2"
                  >
                    <span>Khám phá sản phẩm</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="text-xs text-blue-200 flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-300" />
                    <span>Mã giảm 10%: <strong className="text-white font-mono font-bold">DINHBAO10</strong></span>
                  </div>
                </div>
              </div>
            </section>

            {/* Value Proposition Features */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800">Miễn Phí Giao Hàng</h4>
                  <p className="text-[11px] text-slate-500">Đơn hàng từ 5.000.000đ</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800">Bảo Hành 100%</h4>
                  <p className="text-[11px] text-slate-500">Chính hãng 12 - 24 tháng</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800">Đổi Trả Dễ Dàng</h4>
                  <p className="text-[11px] text-slate-500">30 ngày miễn phí 1 đổi 1</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800">Hỗ Trợ 24/7</h4>
                  <p className="text-[11px] text-slate-500">Hotline 1900 8888</p>
                </div>
              </div>
            </section>

            {/* Filter & Sorting Controls */}
            <section id="product-grid" className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Category Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        selectedCategory === cat
                          ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search & Sort */}
                <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                  <div className="relative w-full md:w-56">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm sản phẩm..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                  {filteredProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:border-slate-300 transition-all duration-200 group"
                    >
                      {/* Product Image */}
                      <div
                        className="relative h-52 bg-slate-50 overflow-hidden cursor-pointer"
                        onClick={() => setSelectedProduct(prod)}
                      >
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {prod.discountPercent > 0 && (
                          <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                            -{prod.discountPercent}%
                          </div>
                        )}
                        {!prod.inStock && (
                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center text-white text-xs font-bold">
                            Tạm Hết Hàng
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                            <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {prod.category}
                            </span>
                            <div className="flex items-center text-amber-500 font-semibold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                              <span>{prod.rating}</span>
                              <span className="text-slate-400 text-[10px] ml-1">
                                ({prod.reviewsCount})
                              </span>
                            </div>
                          </div>

                          <h3
                            onClick={() => setSelectedProduct(prod)}
                            className="font-bold text-sm text-slate-900 line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors leading-snug"
                          >
                            {prod.name}
                          </h3>
                        </div>

                        {/* Price */}
                        <div>
                          <div className="flex items-baseline space-x-2">
                            <span className="text-base font-extrabold text-red-600">
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
                              onClick={() => setSelectedProduct(prod)}
                              className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
                            >
                              Chi tiết
                            </button>
                            <button
                              onClick={() => addToCart(prod)}
                              disabled={!prod.inStock}
                              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1 ${
                                prod.inStock
                                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
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
            </section>
          </div>
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
                  Chào mừng bạn đến với DinhBao Store
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  <strong>DinhBao Store</strong> được thành lập với sứ mệnh mang đến cho cộng đồng yêu công nghệ, lập trình viên và sinh viên những thiết bị điện tử, laptop, điện thoại và phụ kiện chính hãng với mức giá cạnh tranh cùng dịch vụ hậu mãi số 1.
                </p>
              </div>
            </section>

            {/* Core Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">100% Chính Hãng</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tất cả sản phẩm tại DinhBao Store đều có nguồn gốc xuất xứ rõ ràng, đầy đủ hóa đơn VAT và bảo hành chính hãng theo tiêu chuẩn của nhà sản xuất.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Đổi Trả 30 Ngày</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hỗ trợ đổi mới sản phẩm miễn phí trong 30 ngày nếu phát sinh bất kỳ lỗi nào từ nhà sản xuất. Thủ tục nhanh gọn chỉ trong 5 phút.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Headphones className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Tư Vấn Chuyên Nghiệp</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đội ngũ kỹ thuật viên am hiểu sâu sắc về phần cứng, luôn sẵn sàng hỗ trợ cài đặt phần mềm, tối ưu hóa thiết bị và hỗ trợ kỹ thuật trọn đời.
                </p>
              </div>
            </div>

            {/* Store Stats */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-blue-600">10,000+</div>
                  <div className="text-xs text-slate-500 font-semibold mt-1">Khách Hàng Tin Dùng</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-indigo-600">100%</div>
                  <div className="text-xs text-slate-500 font-semibold mt-1">Sản Phẩm Chính Hãng</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-600">30 Ngày</div>
                  <div className="text-xs text-slate-500 font-semibold mt-1">Đổi Trả Miễn Phí</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-purple-600">24/7</div>
                  <div className="text-xs text-slate-500 font-semibold mt-1">Hỗ Trợ Khách Hàng</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIÊN HỆ (CONTACT US) */}
        {activeTab === "contact" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-3xl font-black text-slate-900">Liên Hệ Với DinhBao Store</h2>
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
                        <span className="text-slate-600">contact@dinhbao.vn &middot; support@dinhbao.vn</span>
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
                    Điền thông tin bên dưới, nhân viên hỗ trợ của DinhBao sẽ phản hồi bạn trong vòng 15 phút.
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
                        placeholder="Tôi muốn tư vấn về dòng laptop MacBook M3 Pro..."
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
                      <span>Gửi Tin Nhắn Cho DinhBao</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AUTHENTICATION MODAL */}
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="relative bg-slate-50 border-b border-slate-200 p-4 pb-0 flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setAuthTab("login")}
                    className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
                      authTab === "login"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Đăng Nhập
                  </button>
                  <button
                    onClick={() => setAuthTab("register")}
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
                  onClick={() => setIsAuthModalOpen(false)}
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
                        Chào mừng đến với DinhBao
                      </h3>
                      <p className="text-xs text-slate-500">
                        Đăng nhập để theo dõi đơn hàng và nhận ưu đãi
                      </p>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Email / Số điện thoại
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            placeholder="example@dinhbao.vn"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
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
                            onChange={(e) => setLoginPassword(e.target.value)}
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

                    <div className="pt-3 border-t border-slate-100 text-center space-y-2">
                      <button
                        type="button"
                        onClick={handleQuickDemoLogin}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Đăng nhập nhanh (Tài khoản mẫu Demo)</span>
                      </button>

                      <p className="text-xs text-slate-500">
                        Chưa có tài khoản?{" "}
                        <button
                          type="button"
                          onClick={() => setAuthTab("register")}
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
                        Tham gia cùng hàng ngàn khách hàng của DinhBao
                      </p>
                    </div>

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
                        onClick={() => setAuthTab("login")}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Đăng nhập
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

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="relative h-64 sm:h-72 bg-slate-100">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 bg-slate-900/70 hover:bg-slate-900 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-600 text-white shadow-md">
                    {selectedProduct.category}
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full shadow-md ${
                      selectedProduct.inStock
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {selectedProduct.inStock ? "Còn hàng" : "Hết hàng"}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-5">
                <div>
                  <div className="flex items-center space-x-2 text-amber-500 text-sm font-semibold mb-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{selectedProduct.rating} / 5.0</span>
                    <span className="text-slate-400 text-xs">
                      ({selectedProduct.reviewsCount} đánh giá từ khách hàng)
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {selectedProduct.name}
                  </h3>
                  <div className="mt-2 flex items-baseline space-x-3">
                    <span className="text-2xl font-extrabold text-red-600">
                      {formatVND(selectedProduct.price)}
                    </span>
                    {selectedProduct.originalPrice > selectedProduct.price && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatVND(selectedProduct.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-sm text-slate-600 leading-relaxed border-t border-b border-slate-100 py-3">
                  {selectedProduct.description}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-2.5">
                    Thông số kỹ thuật chi tiết:
                  </h4>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                    {Object.entries(selectedProduct.specs).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex justify-between py-1 border-b border-slate-200/60 last:border-0"
                      >
                        <span className="text-slate-500 font-medium">{key}</span>
                        <span className="text-slate-800 font-semibold text-right">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    disabled={!selectedProduct.inStock}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
                      selectedProduct.inStock
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>
                      {selectedProduct.inStock
                        ? "Thêm vào giỏ hàng ngay"
                        : "Hết hàng"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shopping Cart Drawer */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
            <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Giỏ hàng ({totalItemsCount})
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                    <ShoppingCart className="w-16 h-16 stroke-1 text-slate-300" />
                    <p className="font-semibold text-slate-600">
                      Giỏ hàng của bạn đang trống
                    </p>
                    <p className="text-xs text-slate-400">
                      Hãy chọn mua các sản phẩm công nghệ tuyệt vời nhé!
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-md"
                    >
                      Xem sản phẩm
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-200"
                    >
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-xl shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-xs font-extrabold text-blue-600 mt-0.5">
                          {formatVND(item.product.price)}
                        </p>

                        <div className="flex items-center space-x-2 mt-2">
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="p-1 hover:bg-slate-100 text-slate-600 rounded-l"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-bold text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="p-1 hover:bg-slate-100 text-slate-600 rounded-r"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-500 hover:text-red-700 p-1 text-xs"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-5 border-t border-slate-200 bg-white space-y-4">
                  <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Mã giảm giá (VD: DINHBAO10)"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      Áp dụng
                    </button>
                  </form>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Tạm tính:</span>
                      <span>{formatVND(subtotal)}</span>
                    </div>
                    {appliedDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Giảm giá (10%):</span>
                        <span>-{formatVND(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500">
                      <span>Phí vận chuyển:</span>
                      <span>
                        {shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Tổng thanh toán:</span>
                      <span className="text-red-600">{formatVND(finalTotal)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Tiến hành Đặt hàng</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
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
                    đã mua sắm tại DinhBao. Đơn hàng của bạn đang được xử lý.
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
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 text-slate-600 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  D
                </div>
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                  DinhBao Store
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cửa hàng thiết bị công nghệ chính hãng hàng đầu. Cam kết chất lượng, bảo hành 1 đổi 1 và giao hàng toàn quốc.
              </p>
              <div className="text-xs text-slate-400">
                Khoa CNTT - Đại học Đông Á
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-3">Chính sách mua hàng</h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li><a href="#" className="hover:text-blue-600">Giao hàng toàn quốc (Freeship từ 500k)</a></li>
                <li><a href="#" className="hover:text-blue-600">Bảo hành chính hãng 12-24 tháng</a></li>
                <li><a href="#" className="hover:text-blue-600">Đổi trả miễn phí 30 ngày</a></li>
                <li><a href="#" className="hover:text-blue-600">Chính sách bảo mật thông tin</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-3">Hỗ trợ khách hàng</h4>
              <ul className="space-y-2 text-xs text-slate-500">
                <li>Hotline: <strong className="text-slate-700">1900 8888 &middot; 0905 123 456</strong></li>
                <li>Email: contact@dinhbao.vn</li>
                <li>Địa chỉ: 33 Xô Viết Nghệ Tĩnh, Đà Nẵng</li>
                <li>Giờ mở cửa: 8:00 - 21:30 hàng ngày</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <p>&copy; {new Date().getFullYear()} DinhBao Store. All rights reserved.</p>
            <p className="font-medium text-slate-500">
              Thiết kế bởi DinhBao &middot; React 18 &amp; Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
