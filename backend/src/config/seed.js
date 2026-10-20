// Dữ liệu khởi tạo MongoDB cho Đề tài Nhà Sách Trực Tuyến (BookStore)
// Bao gồm: Danh mục Sách (Products), Người Dùng (Users), Đơn Hàng (Orders), Chi Tiết Đơn (OrderItems) và Đánh Giá Độc Giả (Reviews)

const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Review = require('../models/Review');

// 1. Danh sách 18 Tác phẩm Sách Bestseller theo 6 thể loại chuẩn
const initialProducts = [
  // --- THỂ LOẠI: VĂN HỌC - TIỂU THUYẾT ---
  {
    id: 'prod-book-1',
    name: 'Nhà Giả Kim (The Alchemist)',
    category: 'Văn học - Tiểu thuyết',
    price: 63000,
    originalPrice: 79000,
    discountPercent: 20,
    rating: 4.9,
    reviewsCount: 312,
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
    description: 'Một trong những cuốn sách bán chạy nhất mọi thời đại của Paulo Coelho. Cuốn sách kể về hành trình theo đuổi vận mệnh của chàng trai chăn cừu Santiago, gửi gắm bài học sâu sắc: "Khi bạn khao khát một điều gì đó, cả vũ trụ sẽ hợp lực giúp bạn đạt được điều đó".',
    author: 'Paulo Coelho',
    publisher: 'NXB Hội Nhà Văn',
    publicationYear: 2023,
    pages: 228,
    isbn: '978-604-989-123-4',
    specs: {
      'Tác giả': 'Paulo Coelho',
      'Người dịch': 'Lê Chu Cầu',
      'Nhà xuất bản': 'NXB Hội Nhà Văn',
      'Năm xuất bản': '2023',
      'Số trang': '228 trang',
      'Hình thức': 'Bìa mềm',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-989-123-4'
    },
    inStock: true,
    featured: true
  },
  {
    id: 'prod-book-2',
    name: 'Cây Cam Ngọt Của Tôi',
    category: 'Văn học - Tiểu thuyết',
    price: 86000,
    originalPrice: 108000,
    discountPercent: 20,
    rating: 4.9,
    reviewsCount: 245,
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    description: 'Tác phẩm tự truyện xúc động của José Mauro de Vasconcelos về chú bé Zezé 5 tuổi thông minh, giàu tình cảm nhưng thiếu thốn sự thấu hiểu từ gia đình. Tình bạn ấm áp giữa chú và cây cam ngọt đã chạm đến trái tim hàng triệu độc giả toàn cầu.',
    author: 'José Mauro de Vasconcelos',
    publisher: 'NXB Hội Nhà Văn',
    publicationYear: 2022,
    pages: 244,
    isbn: '978-604-53-9021-3',
    specs: {
      'Tác giả': 'José Mauro de Vasconcelos',
      'Người dịch': 'Nguyễn Bích Lan, Tô Yến Ly',
      'Nhà xuất bản': 'NXB Hội Nhà Văn',
      'Năm xuất bản': '2022',
      'Số trang': '244 trang',
      'Hình thức': 'Bìa mềm',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-53-9021-3'
    },
    inStock: true,
    featured: true
  },
  {
    id: 'prod-book-3',
    name: 'Mắt Biếc',
    category: 'Văn học - Tiểu thuyết',
    price: 92000,
    originalPrice: 115000,
    discountPercent: 20,
    rating: 4.8,
    reviewsCount: 189,
    imageUrl: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=800&q=80',
    description: 'Tuyệt phẩm văn học tuổi học trò của nhà văn Nguyễn Nhật Ánh. Câu chuyện tình buồn đằm thắm giữa Ngạn và Hà Lan ở làng Đo Đo, mang đến hoài niệm trong trẻo về thời niên thiếu và tình yêu thủy chung son sắt.',
    author: 'Nguyễn Nhật Ánh',
    publisher: 'NXB Trẻ',
    publicationYear: 2021,
    pages: 300,
    isbn: '978-604-1-18234-8',
    specs: {
      'Tác giả': 'Nguyễn Nhật Ánh',
      'Nhà xuất bản': 'NXB Trẻ',
      'Năm xuất bản': '2021',
      'Số trang': '300 trang',
      'Hình thức': 'Bìa mềm',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-1-18234-8'
    },
    inStock: true,
    featured: false
  },
  {
    id: 'prod-book-4',
    name: 'Bố Già (The Godfather)',
    category: 'Văn học - Tiểu thuyết',
    price: 135000,
    originalPrice: 169000,
    discountPercent: 20,
    rating: 4.9,
    reviewsCount: 178,
    imageUrl: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=800&q=80',
    description: 'Tiểu thuyết kinh điển của Mario Puzo viết về thế giới ngầm mafia Mỹ và gia tộc Corleone. Không chỉ là truyện tội phạm, Bố Già là cuốn sách kinh điển về quyền lực, danh dự gia đình, và nghệ thuật lãnh đạo tâm lý sắc sảo.',
    author: 'Mario Puzo',
    publisher: 'NXB Văn Học',
    publicationYear: 2023,
    pages: 524,
    isbn: '978-604-963-789-1',
    specs: {
      'Tác giả': 'Mario Puzo',
      'Người dịch': 'Trịnh Huy Triều',
      'Nhà xuất bản': 'NXB Văn Học',
      'Năm xuất bản': '2023',
      'Số trang': '524 trang',
      'Hình thức': 'Bìa cứng cao cấp',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-963-789-1'
    },
    inStock: true,
    featured: true
  },
  {
    id: 'prod-book-5',
    name: 'Rừng Na Uy (Norwegian Wood)',
    category: 'Văn học - Tiểu thuyết',
    price: 120000,
    originalPrice: 150000,
    discountPercent: 20,
    rating: 4.7,
    reviewsCount: 142,
    imageUrl: 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?auto=format&fit=crop&w=800&q=80',
    description: 'Tác phẩm nổi tiếng nhất đưa tên tuổi Haruki Murakami ra toàn thế giới. Bức tranh chân thực về sự cô đơn, khát khao tuổi trẻ và những mất mát tâm hồn của thế hệ thanh niên Nhật Bản thập niên 1960.',
    author: 'Haruki Murakami',
    publisher: 'NXB Hội Nhà Văn',
    publicationYear: 2022,
    pages: 552,
    isbn: '978-604-989-654-3',
    specs: {
      'Tác giả': 'Haruki Murakami',
      'Người dịch': 'Trịnh Lữ',
      'Nhà xuất bản': 'NXB Hội Nhà Văn',
      'Năm xuất bản': '2022',
      'Số trang': '552 trang',
      'Hình thức': 'Bìa mềm',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-989-654-3'
    },
    inStock: true,
    featured: false
  },

  // --- THỂ LOẠI: KINH TẾ - KINH DOANH ---
  {
    id: 'prod-book-6',
    name: 'Đắc Nhân Tâm (How to Win Friends and Influence People)',
    category: 'Kinh tế - Kinh doanh',
    price: 68000,
    originalPrice: 86000,
    discountPercent: 21,
    rating: 4.9,
    reviewsCount: 420,
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
    description: 'Cuốn sách nghệ thuật giao tiếp và đối nhân xử thế kinh điển nhất mọi thời đại của Dale Carnegie. Hướng dẫn cách thu phục lòng người, tạo dựng mối quan hệ chân thành và thành công trong sự nghiệp lẫn cuộc sống.',
    author: 'Dale Carnegie',
    publisher: 'NXB Tổng Hợp TP.HCM',
    publicationYear: 2023,
    pages: 320,
    isbn: '978-604-58-4567-8',
    specs: {
      'Tác giả': 'Dale Carnegie',
      'Người dịch': 'Nguyễn Văn Phước',
      'Nhà xuất bản': 'NXB Tổng Hợp TP.HCM',
      'Năm xuất bản': '2023',
      'Số trang': '320 trang',
      'Hình thức': 'Bìa mềm',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-58-4567-8'
    },
    inStock: true,
    featured: true
  },
  {
    id: 'prod-book-7',
    name: 'Cha Giàu Cha Nghèo (Rich Dad Poor Dad)',
    category: 'Kinh tế - Kinh doanh',
    price: 110000,
    originalPrice: 138000,
    discountPercent: 20,
    rating: 4.8,
    reviewsCount: 295,
    imageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=800&q=80',
    description: 'Cuốn sách khai sáng tư duy tài chính của Robert Kiyosaki. Phân biệt rõ rệt giữa tài sản và tiêu sản, hướng dẫn cách bắt đồng tiền làm việc cho bạn thay vì làm việc quần quật vì tiền.',
    author: 'Robert T. Kiyosaki',
    publisher: 'NXB Trẻ',
    publicationYear: 2022,
    pages: 412,
    isbn: '978-604-1-09876-2',
    specs: {
      'Tác giả': 'Robert T. Kiyosaki',
      'Nhà xuất bản': 'NXB Trẻ',
      'Năm xuất bản': '2022',
      'Số trang': '412 trang',
      'Hình thức': 'Bìa mềm',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-1-09876-2'
    },
    inStock: true,
    featured: true
  },
  {
    id: 'prod-book-8',
    name: 'Khởi Nghiệp Tinh Gọn (The Lean Startup)',
    category: 'Kinh tế - Kinh doanh',
    price: 125000,
    originalPrice: 155000,
    discountPercent: 19,
    rating: 4.7,
    reviewsCount: 110,
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    description: 'Phương pháp luận đột phá của Eric Ries dành cho nhà sáng lập startup: xây dựng sản phẩm mẫu khả dụng tối thiểu (MVP), thử nghiệm nhanh trên thị trường và liên tục tinh chỉnh để tiết kiệm chi phí và tăng tỷ lệ thành công.',
    author: 'Eric Ries',
    publisher: 'NXB Công Thương',
    publicationYear: 2021,
    pages: 368,
    isbn: '978-604-99-4321-0',
    specs: {
      'Tác giả': 'Eric Ries',
      'Nhà xuất bản': 'NXB Công Thương',
      'Năm xuất bản': '2021',
      'Số trang': '368 trang',
      'Hình thức': 'Bìa mềm',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-99-4321-0'
    },
    inStock: true,
    featured: false
  },

  // --- THỂ LOẠI: KỸ NĂNG SỐNG ---
  {
    id: 'prod-book-9',
    name: 'Atomic Habits - Thay Đổi Tí Hon, Hiệu Quả Bất Ngờ',
    category: 'Kỹ năng sống',
    price: 149000,
    originalPrice: 189000,
    discountPercent: 21,
    rating: 5.0,
    reviewsCount: 380,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    description: 'Bestseller toàn cầu của James Clear về khoa học hành vi. Cuốn sách chỉ ra rằng cải thiện 1% mỗi ngày sẽ tạo nên bước nhảy vọt phi thường sau 1 năm, cung cấp 4 quy luật vàng để hình thành thói quen tốt và từ bỏ thói quen xấu.',
    author: 'James Clear',
    publisher: 'NXB Thế Giới',
    publicationYear: 2023,
    pages: 304,
    isbn: '978-604-77-8910-4',
    specs: {
      'Tác giả': 'James Clear',
      'Nhà xuất bản': 'NXB Thế Giới',
      'Năm xuất bản': '2023',
      'Số trang': '304 trang',
      'Hình thức': 'Bìa mềm',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-77-8910-4'
    },
    inStock: true,
    featured: true
  },
  {
    id: 'prod-book-10',
    name: 'Tâm Lý Học Về Tiền (The Psychology of Money)',
    category: 'Kỹ năng sống',
    price: 128000,
    originalPrice: 160000,
    discountPercent: 20,
    rating: 4.8,
    reviewsCount: 165,
    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80',
    description: '19 câu chuyện ngắn của Morgan Housel khám phá cách con người tư duy và cảm nhận về tiền bạc. Thành công tài chính không chỉ là khoa học tính toán mà phụ thuộc lớn vào việc kiểm soát hành vi tâm lý và sự kiên nhẫn.',
    author: 'Morgan Housel',
    publisher: 'NXB Dân Trí',
    publicationYear: 2022,
    pages: 384,
    isbn: '978-604-88-9123-5',
    specs: {
      'Tác giả': 'Morgan Housel',
      'Nhà xuất bản': 'NXB Dân Trí',
      'Năm xuất bản': '2022',
      'Số trang': '384 trang',
      'Hình thức': 'Bìa mềm',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-88-9123-5'
    },
    inStock: true,
    featured: false
  },
  {
    id: 'prod-book-11',
    name: 'Hiểu Về Trái Tim',
    category: 'Kỹ năng sống',
    price: 115000,
    originalPrice: 145000,
    discountPercent: 21,
    rating: 4.9,
    reviewsCount: 220,
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    description: 'Tác phẩm chữa lành tâm hồn sâu sắc của Thiền sư Minh Niệm. Cuốn sách giúp người đọc nhận diện và chuyển hóa 50 hiện tượng tâm lý: khổ đau, cô đơn, tức giận, tham ái, tha thứ... để tìm lại sự bình yên nội tại.',
    author: 'Thầy Minh Niệm',
    publisher: 'NXB Trẻ',
    publicationYear: 2022,
    pages: 480,
    isbn: '978-604-1-12345-6',
    specs: {
      'Tác giả': 'Thầy Minh Niệm',
      'Nhà xuất bản': 'NXB Trẻ',
      'Năm xuất bản': '2022',
      'Số trang': '480 trang',
      'Hình thức': 'Bìa mềm',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-1-12345-6'
    },
    inStock: true,
    featured: true
  },

  // --- THỂ LOẠI: CÔNG NGHỆ - LẬP TRÌNH ---
  {
    id: 'prod-book-12',
    name: 'Clean Code - Mã Sạch Trong Lập Trình Phần Mềm',
    category: 'Công nghệ - Lập trình',
    price: 260000,
    originalPrice: 320000,
    discountPercent: 19,
    rating: 4.9,
    reviewsCount: 156,
    imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80',
    description: 'Kinh thánh của mọi kỹ sư phần mềm chuyên nghiệp do Robert C. Martin (Uncle Bob) chắp bút. Hướng dẫn chi tiết nguyên tắc đặt tên, viết hàm ngắn gọn, phân tách lớp, xử lý lỗi và refactor mã nguồn chuẩn Clean Architecture.',
    author: 'Robert C. Martin (Uncle Bob)',
    publisher: 'NXB Thông Tin và Truyền Thông',
    publicationYear: 2023,
    pages: 464,
    isbn: '978-604-80-6789-1',
    specs: {
      'Tác giả': 'Robert C. Martin (Uncle Bob)',
      'Nhà xuất bản': 'NXB Thông Tin và Truyền Thông',
      'Năm xuất bản': '2023',
      'Số trang': '464 trang',
      'Hình thức': 'Bìa mềm',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-80-6789-1'
    },
    inStock: true,
    featured: true
  },
  {
    id: 'prod-book-13',
    name: 'Thiết Kế Hệ Thống Quy Mô Lớn (DDIA)',
    category: 'Công nghệ - Lập trình',
    price: 350000,
    originalPrice: 420000,
    discountPercent: 17,
    rating: 5.0,
    reviewsCount: 98,
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    description: 'Designing Data-Intensive Applications của Martin Kleppmann là tác phẩm kinh điển cho Software & Data Engineer. Đào sâu kiến trúc dữ liệu phân tán, Storage Engines, Replication, Partitioning, Transactions và Stream Processing.',
    author: 'Martin Kleppmann',
    publisher: 'NXB Bách Khoa Hà Nội',
    publicationYear: 2023,
    pages: 616,
    isbn: '978-604-95-1234-7',
    specs: {
      'Tác giả': 'Martin Kleppmann',
      'Nhà xuất bản': 'NXB Bách Khoa Hà Nội',
      'Năm xuất bản': '2023',
      'Số trang': '616 trang',
      'Hình thức': 'Bìa cứng cao cấp',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-95-1234-7'
    },
    inStock: true,
    featured: true
  },
  {
    id: 'prod-book-14',
    name: 'The DevOps Handbook - Cẩm Nang Thực Chiến DevOps & CI/CD',
    category: 'Công nghệ - Lập trình',
    price: 290000,
    originalPrice: 350000,
    discountPercent: 17,
    rating: 4.8,
    reviewsCount: 84,
    imageUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80',
    description: 'Cẩm nang toàn diện về triển khai DevOps, CI/CD Pipeline, tự động hóa hạ tầng đám mây và giám sát hệ thống sản xuất. Cuốn sách gối đầu giường cho sinh viên và kỹ sư môn học DevOps.',
    author: 'Gene Kim, Jez Humble, Patrick Debois',
    publisher: 'NXB Thông Tin và Truyền Thông',
    publicationYear: 2023,
    pages: 480,
    isbn: '978-604-80-9988-2',
    specs: {
      'Tác giả': 'Gene Kim, Patrick Debois',
      'Nhà xuất bản': 'NXB Thông Tin và Truyền Thông',
      'Năm xuất bản': '2023',
      'Số trang': '480 trang',
      'Hình thức': 'Bìa mềm',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-80-9988-2'
    },
    inStock: true,
    featured: false
  },

  // --- THỂ LOẠI: KHOA HỌC - TRIẾT HỌC ---
  {
    id: 'prod-book-15',
    name: 'Sapiens - Lược Sử Loài Người',
    category: 'Khoa học - Triết học',
    price: 175000,
    originalPrice: 220000,
    discountPercent: 20,
    rating: 4.9,
    reviewsCount: 260,
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    description: 'Công trình vĩ đại của GS. Yuval Noah Harari xâu chuỗi 70.000 năm lịch sử tiến hóa nhân loại qua 3 cuộc cách mạng lớn: Cách mạng Nhận thức, Cách mạng Nông nghiệp và Cách mạng Khoa học.',
    author: 'Yuval Noah Harari',
    publisher: 'NXB Tri Thức',
    publicationYear: 2022,
    pages: 560,
    isbn: '978-604-943-876-5',
    specs: {
      'Tác giả': 'Yuval Noah Harari',
      'Người dịch': 'Nguyễn Thủy Chung',
      'Nhà xuất bản': 'NXB Tri Thức',
      'Năm xuất bản': '2022',
      'Số trang': '560 trang',
      'Hình thức': 'Bìa mềm',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-943-876-5'
    },
    inStock: true,
    featured: true
  },
  {
    id: 'prod-book-16',
    name: 'Vũ Trụ (Cosmos - Carl Sagan)',
    category: 'Khoa học - Triết học',
    price: 185000,
    originalPrice: 230000,
    discountPercent: 20,
    rating: 4.8,
    reviewsCount: 96,
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    description: 'Chuyến du hành kỳ vĩ qua không gian và thời gian cùng nhà thiên văn học Carl Sagan. Cuốn sách thắp sáng tình yêu khoa học vũ trụ, giải thích nguồn gốc các thiên hà và vị trí khiêm nhường của Trái Đất.',
    author: 'Carl Sagan',
    publisher: 'NXB Thế Giới',
    publicationYear: 2021,
    pages: 496,
    isbn: '978-604-77-5432-1',
    specs: {
      'Tác giả': 'Carl Sagan',
      'Nhà xuất bản': 'NXB Thế Giới',
      'Năm xuất bản': '2021',
      'Số trang': '496 trang',
      'Hình thức': 'Bìa cứng in màu',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-77-5432-1'
    },
    inStock: true,
    featured: false
  },

  // --- THỂ LOẠI: THIẾU NHI ---
  {
    id: 'prod-book-17',
    name: 'Hoàng Tử Bé (Le Petit Prince)',
    category: 'Thiếu nhi',
    price: 55000,
    originalPrice: 70000,
    discountPercent: 21,
    rating: 4.9,
    reviewsCount: 310,
    imageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=800&q=80',
    description: 'Cuốn sách bất hủ của Antoine de Saint-Exupéry dành cho cả trẻ em lẫn người lớn. Câu chuyện về bông hồng duy nhất và chú cáo với chân lý: "Người ta chỉ thấy rõ bằng trái tim. Những gì cốt yếu mắt trần không thể thấy được".',
    author: 'Antoine de Saint-Exupéry',
    publisher: 'NXB Kim Đồng',
    publicationYear: 2023,
    pages: 112,
    isbn: '978-604-2-19876-0',
    specs: {
      'Tác giả': 'Antoine de Saint-Exupéry',
      'Nhà xuất bản': 'NXB Kim Đồng',
      'Năm xuất bản': '2023',
      'Số trang': '112 trang',
      'Hình thức': 'Bìa mềm minh họa màu',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-2-19876-0'
    },
    inStock: true,
    featured: true
  },
  {
    id: 'prod-book-18',
    name: 'Dế Mèn Phiêu Lưu Ký',
    category: 'Thiếu nhi',
    price: 62000,
    originalPrice: 80000,
    discountPercent: 23,
    rating: 4.8,
    reviewsCount: 175,
    imageUrl: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
    description: 'Kiệt tác văn học thiếu nhi Việt Nam của nhà văn Tô Hoài. Bài học về tính tự lập, lòng nhân ái và tình bạn bè thủy chung qua những chuyến phiêu lưu hấp dẫn của chàng Dế Mèn kiêu hãnh.',
    author: 'Tô Hoài',
    publisher: 'NXB Kim Đồng',
    publicationYear: 2023,
    pages: 188,
    isbn: '978-604-2-20123-1',
    specs: {
      'Tác giả': 'Tô Hoài',
      'Nhà xuất bản': 'NXB Kim Đồng',
      'Năm xuất bản': '2023',
      'Số trang': '188 trang',
      'Hình thức': 'Bìa mềm minh họa đẹp',
      'Ngôn ngữ': 'Tiếng Việt',
      'Mã ISBN': '978-604-2-20123-1'
    },
    inStock: true,
    featured: false
  }
];

// 2. Danh sách Người Dùng chuẩn cho Đề tài BookStore (Admin, Thủ thư, Độc giả)
const initialUsers = [
  {
    id: 'usr-admin-1',
    name: 'Quản Trị Viên (BookStore Admin)',
    email: 'admin@bookstore.vn',
    phone: '0905 888 999',
    role: 'admin',
    status: 'active',
    password: 'admin',
    avatarUrl: '/default-avatar.png',
    address: 'Đà Nẵng'
  },
  {
    id: 'usr-admin-2',
    name: 'Quản Lý BookStore',
    email: 'manager@bookstore.vn',
    phone: '0905 123 456',
    role: 'admin',
    status: 'active',
    password: 'admin123',
    avatarUrl: '/default-avatar.png',
    address: 'Hà Nội'
  },
  {
    id: 'usr-staff-1',
    name: 'Trần Thị Mai (Thủ Thư / Quản Lý Kho Sách)',
    email: 'staff@bookstore.vn',
    phone: '0912 345 678',
    role: 'staff',
    status: 'active',
    password: 'staff123',
    avatarUrl: '/default-avatar.png',
    address: 'Quận Cẩm Lệ, TP. Đà Nẵng'
  },
  {
    id: 'usr-cust-1',
    name: 'Nguyễn Văn An (Độc Giả Thân Thiết)',
    email: 'demo@bookstore.vn',
    phone: '0988 776 655',
    role: 'customer',
    status: 'active',
    password: 'demo123',
    avatarUrl: '/default-avatar.png',
    address: '123 Nguyễn Văn Linh, Quận Hải Châu, TP. Đà Nẵng'
  },
  {
    id: 'usr-cust-2',
    name: 'Lê Thị Thu Thảo',
    email: 'thuthao@gmail.com',
    phone: '0977 112 233',
    role: 'customer',
    status: 'active',
    password: 'user123',
    avatarUrl: '/default-avatar.png',
    address: '45 Lê Duẩn, TP. Đà Nẵng'
  },
  {
    id: 'usr-cust-3',
    name: 'Phạm Quốc Hưng (Tài Khoản Khóa)',
    email: 'hung.pham@gmail.com',
    phone: '0935 999 888',
    role: 'customer',
    status: 'locked',
    password: 'user123',
    avatarUrl: '/default-avatar.png',
    address: 'Quận 1, TP. Hồ Chí Minh'
  }
];

// 3. Đơn Hàng Mua Sách Mẫu (Orders)
const initialOrders = [
  {
    id: 'ORD-2026-001',
    userId: 'usr-cust-1',
    date: '2026-10-18',
    customerInfo: {
      fullName: 'Nguyễn Văn An',
      phone: '0988 776 655',
      address: '123 Nguyễn Văn Linh, Quận Hải Châu, TP. Đà Nẵng'
    },
    items: [
      {
        product: {
          id: 'prod-book-1',
          name: 'Nhà Giả Kim (The Alchemist)',
          price: 63000,
          category: 'Văn học - Tiểu thuyết',
          imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80'
        },
        quantity: 1
      },
      {
        product: {
          id: 'prod-book-9',
          name: 'Atomic Habits - Thay Đổi Tí Hon, Hiệu Quả Bất Ngờ',
          price: 149000,
          category: 'Kỹ năng sống',
          imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'
        },
        quantity: 1
      }
    ],
    totalAmount: 212000,
    paymentMethod: 'Thanh toán khi nhận hàng (COD)',
    status: 'Hoàn tất'
  },
  {
    id: 'ORD-2026-002',
    userId: 'usr-cust-2',
    date: '2026-10-20',
    customerInfo: {
      fullName: 'Lê Thị Thu Thảo',
      phone: '0977 112 233',
      address: '45 Lê Duẩn, TP. Đà Nẵng'
    },
    items: [
      {
        product: {
          id: 'prod-book-12',
          name: 'Clean Code - Mã Sạch Trong Lập Trình Phần Mềm',
          price: 260000,
          category: 'Công nghệ - Lập trình',
          imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80'
        },
        quantity: 1
      }
    ],
    totalAmount: 260000,
    paymentMethod: 'Chuyển khoản ngân hàng (QR Code)',
    status: 'Đang giao'
  }
];

// 4. Bảng Chi Tiết Món Hàng (OrderItems) - Quan hệ 1-N với Orders
const initialOrderItems = [
  {
    id: 'item-1',
    orderId: 'ORD-2026-001',
    productId: 'prod-book-1',
    productName: 'Nhà Giả Kim (The Alchemist)',
    price: 63000,
    quantity: 1
  },
  {
    id: 'item-2',
    orderId: 'ORD-2026-001',
    productId: 'prod-book-9',
    productName: 'Atomic Habits - Thay Đổi Tí Hon, Hiệu Quả Bất Ngờ',
    price: 149000,
    quantity: 1
  },
  {
    id: 'item-3',
    orderId: 'ORD-2026-002',
    productId: 'prod-book-12',
    productName: 'Clean Code - Mã Sạch Trong Lập Trình Phần Mềm',
    price: 260000,
    quantity: 1
  }
];

// 5. Bảng Nhận Xét & Đánh Giá Độc Giả (Reviews)
const initialReviews = [
  {
    id: 'rev-1',
    productId: 'prod-book-1',
    userId: 'usr-cust-1',
    author: 'Trần Minh Hoàng',
    rating: 5,
    date: '2 ngày trước',
    content: 'Một cuốn sách tuyệt vời, thay đổi nhân sinh quan của mình. Sách được bọc cẩn thận, bìa cứng cáp, giấy in chuẩn NXB Hội Nhà Văn đọc rất thích mắt.',
    verified: true,
    likes: 18
  },
  {
    id: 'rev-2',
    productId: 'prod-book-2',
    userId: 'usr-cust-2',
    author: 'Lê Thị Thu Thảo',
    rating: 5,
    date: '4 ngày trước',
    content: 'Đọc mà rơi nước mắt với bé Zezé. Nhà sách giao hàng rất nhanh trong 24h, kèm bookmark xinh xắn. Chắc chắn sẽ tiếp tục ủng hộ BookStore!',
    verified: true,
    likes: 14
  },
  {
    id: 'rev-3',
    productId: 'prod-book-9',
    userId: 'usr-cust-1',
    author: 'Nguyễn Quốc Bảo',
    rating: 5,
    date: '1 tuần trước',
    content: 'Atomic Habits phân tích tâm lý cực kỳ khoa học và thực tế. Cuốn sách giúp mình duy trì việc đọc sách 30 phút mỗi sáng đều đặn.',
    verified: true,
    likes: 22
  },
  {
    id: 'rev-4',
    productId: 'prod-book-12',
    userId: 'usr-cust-1',
    author: 'Võ Thành Đạt (Dev)',
    rating: 5,
    date: '5 ngày trước',
    content: 'Kỹ sư phần mềm bắt buộc phải đọc cuốn này! Sách in tiếng Việt dịch chuẩn xác các thuật ngữ lập trình. Đóng gói 3 lớp xốp chống va đập góc sách rất ưng ý.',
    verified: true,
    likes: 9
  }
];

// Hàm nạp dữ liệu tự động vào MongoDB
async function seedData() {
  try {
    // 1. Kiểm tra làm mới nếu database còn lưu dữ liệu cũ
    const legacyProduct = await Product.findOne({
      category: { $in: ['Laptop & PC', 'Điện thoại', 'Phụ kiện', 'Âm thanh', 'Smart Home'] }
    });
    const legacyUser = await User.findOne({
      email: { $in: ['admin@dinhbao.vn', 'staff@dinhbao.vn', 'demo@dinhbao.vn', 'bao@gmail.com'] }
    });
    const missingAuthorField = await Product.findOne({ author: { $exists: false } });

    if (legacyProduct || legacyUser || missingAuthorField) {
      console.log('🔄 [MongoDB Seed] Đang làm mới cơ sở dữ liệu MongoDB theo đúng chuẩn BookStore...');
      await Product.deleteMany({});
      await User.deleteMany({});
      await Order.deleteMany({});
      await OrderItem.deleteMany({});
      await Review.deleteMany({});
    }

    // 2. Nạp sách vào collection products
    const pCount = await Product.countDocuments();
    if (pCount === 0) {
      await Product.insertMany(initialProducts);
      console.log('📚 [MongoDB Seed] Đã tự động nạp 18 đầu sách Bestseller vào collection products!');
    }

    // 3. Nạp người dùng vào collection users
    const uCount = await User.countDocuments();
    if (uCount === 0) {
      await User.insertMany(initialUsers);
      console.log('👥 [MongoDB Seed] Đã tự động nạp 6 tài khoản người dùng BookStore vào collection users!');
    }

    // 4. Nạp đơn hàng vào collection orders
    const oCount = await Order.countDocuments();
    if (oCount === 0) {
      await Order.insertMany(initialOrders);
      console.log('📦 [MongoDB Seed] Đã tự động nạp 2 đơn hàng mua sách mẫu vào collection orders!');
    }

    // 5. Nạp chi tiết đơn vào collection order_items
    const oiCount = await OrderItem.countDocuments();
    if (oiCount === 0) {
      await OrderItem.insertMany(initialOrderItems);
      console.log('📑 [MongoDB Seed] Đã tự động nạp chi tiết đơn hàng vào collection order_items!');
    }

    // 6. Nạp đánh giá vào collection reviews
    const rCount = await Review.countDocuments();
    if (rCount === 0) {
      await Review.insertMany(initialReviews);
      console.log('⭐ [MongoDB Seed] Đã tự động nạp đánh giá độc giả vào collection reviews!');
    }

    console.log('🎉 [MongoDB Seed] Cơ sở dữ liệu BookStore trên MongoDB đã sẵn sàng!');
  } catch (err) {
    console.error('⚠️ [MongoDB Seed] Lỗi nạp dữ liệu khởi tạo:', err.message);
  }
}

module.exports = { seedData };
