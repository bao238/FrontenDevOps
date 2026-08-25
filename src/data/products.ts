export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  description: string;
  specs: { [key: string]: string };
  inStock: boolean;
  featured?: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "MacBook Pro 14 inch M3 Pro (18GB / 512GB SSD)",
    category: "Laptop & PC",
    price: 49990000,
    originalPrice: 54990000,
    discountPercent: 9,
    rating: 4.9,
    reviewsCount: 128,
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    description: "MacBook Pro 14 M3 Pro mang lại hiệu năng đỉnh cao cho lập trình viên và nhà thiết kế. Màn hình Liquid Retina XDR 120Hz siêu nét, thời lượng pin lên đến 18 giờ liên tục.",
    specs: {
      "Chip xử lý": "Apple M3 Pro 11-core CPU",
      "RAM": "18GB Unified Memory",
      "Ổ cứng": "512GB SSD siêu tốc",
      "Màn hình": "14.2 inch Liquid Retina XDR (3024x1964)",
      "Trọng lượng": "1.61 kg",
      "Cổng kết nối": "Thunderbolt 4, HDMI, MagSafe 3, SDXC"
    },
    inStock: true,
    featured: true
  },
  {
    id: "prod-2",
    name: "iPhone 15 Pro Max 256GB - Titan Tự Nhiên",
    category: "Điện thoại",
    price: 29490000,
    originalPrice: 34990000,
    discountPercent: 15,
    rating: 4.8,
    reviewsCount: 340,
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
    description: "Khung viền Titan chuẩn hàng không vũ trụ siêu nhẹ và bền bỉ. Chip A17 Pro mạnh mẽ hỗ trợ chơi game đồ họa đỉnh cao, camera tiềm vọng zoom quang học 5x.",
    specs: {
      "Màn hình": "6.7 inch Super Retina XDR OLED 120Hz",
      "Chip": "Apple A17 Pro (3nm)",
      "Bộ nhớ": "256GB",
      "Camera sau": "48MP + 12MP + 12MP (Zoom 5x)",
      "Cổng sạc": "USB-C chuẩn 3.0",
      "Kháng nước": "IP68"
    },
    inStock: true,
    featured: true
  },
  {
    id: "prod-3",
    name: "Tai nghe Sony WH-1000XM5 Chống Ồn Đỉnh Cao",
    category: "Âm thanh",
    price: 6990000,
    originalPrice: 8990000,
    discountPercent: 22,
    rating: 4.9,
    reviewsCount: 95,
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
    description: "Công nghệ chống ồn chủ động hàng đầu thế giới với 8 micro và bộ xử lý kép V1/QN1. Âm thanh Hi-Res Audio chuẩn phòng thu, thời lượng pin 30 giờ.",
    specs: {
      "Thời lượng pin": "30 giờ (bật ANC)",
      "Công nghệ": "Chống ồn tự động Auto NC Optimizer",
      "Driver": "30mm màng carbon tổng hợp",
      "Trọng lượng": "250g",
      "Kết nối": "Bluetooth 5.2, LDAC, AUX 3.5mm"
    },
    inStock: true,
    featured: true
  },
  {
    id: "prod-4",
    name: "Bàn phím cơ không dây Keychron Q1 Pro QMK/VIA",
    category: "Phụ kiện",
    price: 4290000,
    originalPrice: 4890000,
    discountPercent: 12,
    rating: 4.7,
    reviewsCount: 64,
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    description: "Bàn phím cơ Custom cao cấp với vỏ nhôm nguyên khối CNC, cấu trúc Gasket Mount êm ái, hỗ trợ Hot-swap và tùy biến layout phím qua QMK/VIA.",
    specs: {
      "Layout": "75% (81 phím)",
      "Vỏ": "Nhôm Anodized nguyên khối",
      "Switch": "Keychron K Pro Red / Brown",
      "Kết nối": "Bluetooth 5.1 / Type-C có dây",
      "Tương thích": "macOS / Windows / Linux"
    },
    inStock: true
  },
  {
    id: "prod-5",
    name: "Màn hình Dell UltraSharp U2723QE 27 inch 4K IPS Black",
    category: "Laptop & PC",
    price: 13890000,
    originalPrice: 15500000,
    discountPercent: 10,
    rating: 4.9,
    reviewsCount: 88,
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    description: "Màn hình 4K sắc nét trang bị công nghệ IPS Black mang lại độ tương phản 2000:1 vượt trội, độ phủ màu 98% DCI-P3, tích hợp cổng USB-C sạc 90W và hub mạng RJ45.",
    specs: {
      "Kích thước": "27 inch",
      "Độ phân giải": "4K UHD (3840 x 2160)",
      "Tấm nền": "IPS Black, 1.07 tỷ màu",
      "Độ phủ màu": "98% DCI-P3, 100% sRGB",
      "Cổng xuất": "USB-C (Power Delivery 90W), DP 1.4, HDMI 2.0"
    },
    inStock: true
  },
  {
    id: "prod-6",
    name: "Chuột không dây công thái học Logitech MX Master 3S",
    category: "Phụ kiện",
    price: 2190000,
    originalPrice: 2690000,
    discountPercent: 18,
    rating: 4.8,
    reviewsCount: 210,
    imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
    description: "Chuột làm việc số 1 cho lập trình viên và chuyên gia văn phòng. Con lăn điện từ MagSpeed cuộn 1000 dòng/giây, click êm ái giảm 90% tiếng ồn, cảm biến 8000 DPI trên mọi bề mặt kính.",
    specs: {
      "Cảm biến": "Darkfield 8000 DPI",
      "Pin": "Lên đến 70 ngày cho 1 lần sạc",
      "Kết nối": "Logi Bolt USB, Bluetooth (3 thiết bị)",
      "Phần mềm": "Logi Options+ tùy biến thao tác"
    },
    inStock: true
  },
  {
    id: "prod-7",
    name: "Đồng hồ thông minh Apple Watch Series 9 GPS 45mm",
    category: "Smart Home",
    price: 9990000,
    originalPrice: 11490000,
    discountPercent: 13,
    rating: 4.7,
    reviewsCount: 76,
    imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
    description: "Chip S9 SiP mạnh mẽ hơn bao giờ hết với tính năng Double Tap (chạm hai lần) điều khiển không chạm. Màn hình sáng gấp đôi 2000 nits, cảm biến đo điện tâm đồ ECG và nồng độ oxy trong máu.",
    specs: {
      "Kích thước mặt": "45mm nhôm",
      "Thời lượng pin": "18 giờ (tiêu chuẩn), 36 giờ (chế độ tiết kiệm)",
      "Tính năng": "ECG, SpO2, Đo nhịp tim, Phát hiện té ngã, GPS",
      "Kháng nước": "50m (WR50)"
    },
    inStock: true
  },
  {
    id: "prod-8",
    name: "Loa Bluetooth thông minh Marshall Stanmore III",
    category: "Âm thanh",
    price: 8490000,
    originalPrice: 9990000,
    discountPercent: 15,
    rating: 4.9,
    reviewsCount: 52,
    imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
    description: "Thiết kế Vintage sang trọng với chất âm Marshall huyền thoại. Âm trường rộng hơn thế hệ trước, công suất 80W mạnh mẽ lấp đầy không gian phòng khách.",
    specs: {
      "Công suất": "80W (1x 50W Woofer + 2x 15W Tweeter)",
      "Kết nối": "Bluetooth 5.2, AUX 3.5mm, RCA",
      "Dải tần số": "45 - 20,000 Hz",
      "Trọng lượng": "4.25 kg"
    },
    inStock: false
  }
];

export const CATEGORIES = [
  "Tất cả",
  "Điện thoại",
  "Laptop & PC",
  "Phụ kiện",
  "Âm thanh",
  "Smart Home"
];
