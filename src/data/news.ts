export interface NewsItem {
  id: string;
  category: string;
  categoryColor: string;
  date: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  sourceUrl?: string;
  imageUrl: string;
  readTime: string;
  author: string;
}

export const NEWS_DATA: NewsItem[] = [
  {
    id: "ai-2024",
    category: "Công nghệ",
    categoryColor: "bg-sky-100 text-sky-700 border-sky-200",
    date: "15 tháng 1, 2024",
    title: "Công nghệ AI phát triển mạnh mẽ trong năm 2024",
    summary: "Các công ty công nghệ lớn đang đầu tư mạnh vào trí tuệ nhân tạo, mở ra nhiều cơ hội mới cho ngành công nghiệp.",
    content: `Trí tuệ nhân tạo (AI) và các mô hình ngôn ngữ lớn (LLMs) tiếp tục dẫn dắt làn sóng đổi mới công nghệ toàn cầu trong năm 2024. Hàng loạt doanh nghiệp hàng đầu từ Thung lũng Silicon đến Châu Á đã tích hợp AI vào quy trình sản xuất, tự động hóa quy trình phần mềm (DevOps CI/CD) và nâng cao trải nghiệm người dùng.\n\nTheo báo cáo mới nhất, thị trường AI dự kiến sẽ đạt quy mô hàng trăm tỷ USD vào năm 2025, với sự bùng nổ của các trợ lý lập trình thông minh, xử lý ngôn ngữ tự nhiên và thị giác máy tính.`,
    source: "VnEconomy",
    sourceUrl: "https://vneconomy.vn",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
    readTime: "3 phút đọc",
    author: "Ban Công Nghệ"
  },
  {
    id: "economy-vn",
    category: "Kinh tế",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    date: "14 tháng 1, 2024",
    title: "Kinh tế Việt Nam tăng trưởng ổn định",
    summary: "GDP quý 4/2023 tăng trưởng tích cực, tạo tiền đề cho sự phát triển bền vững trong năm 2024.",
    content: `Nền kinh tế Việt Nam tiếp tục duy trì đà phục hồi tích cực với các chỉ số vĩ mô ổn định. Xuất khẩu, giải ngân vốn đầu tư trực tiếp nước ngoài (FDI) và tiêu dùng nội địa đều ghi nhận mức tăng trưởng khả quan.\n\nCác chuyên gia kinh tế đánh giá việc đẩy mạnh chuyển đổi số và phát triển hạ tầng công nghệ thông tin là một trong những động lực then chốt thúc đẩy năng suất lao động và thu hút dòng vốn đầu tư công nghệ cao vào Việt Nam.`,
    source: "VnEconomy",
    sourceUrl: "https://vneconomy.vn",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80",
    readTime: "4 phút đọc",
    author: "Trung tâm Phân tích Kinh tế"
  },
  {
    id: "sports-football",
    category: "Thể thao",
    categoryColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    date: "13 tháng 1, 2024",
    title: "Bóng đá: Việt Nam chuẩn bị cho vòng loại World Cup",
    summary: "Đội tuyển Việt Nam đang tích cực chuẩn bị cho các trận đấu vòng loại World Cup 2026.",
    content: `Đội tuyển bóng đá quốc gia Việt Nam đã bước vào đợt tập trung cao điểm nhằm chuẩn bị cho loạt trận then chốt thuộc khuôn khổ Vòng loại World Cup 2026 khu vực Châu Á.\n\nBan huấn luyện chú trọng rèn luyện thể lực, chiến thuật pressing hiện đại và tinh thần đồng đội. Toàn đội quyết tâm cống hiến những trận cầu mãn nhãn và hướng tới mục tiêu giành quyền đi tiếp vào các vòng đấu sau.`,
    source: "VnExpress",
    sourceUrl: "https://vnexpress.net",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
    readTime: "2 phút đọc",
    author: "Phóng viên Thể Thao"
  },
  {
    id: "devops-cicd",
    category: "DevOps",
    categoryColor: "bg-purple-100 text-purple-700 border-purple-200",
    date: "25 tháng 8, 2024",
    title: "Tự động hóa CI/CD với Docker, GitHub Actions & Render",
    summary: "Áp dụng phương pháp DevOps hiện đại giúp rút ngắn chu kỳ phát hành, giảm downtime và nâng cao chất lượng phần mềm.",
    content: `DevOps là sự kết hợp chặt chẽ giữa Phát triển (Development) và Vận hành (Operations). Với sự hỗ trợ của Docker (containerization) và GitHub Actions (tự động hóa CI/CD pipeline), quy trình từ lúc lập trình viên commit code đến khi ứng dụng chạy trên cloud server diễn ra hoàn toàn tự động chỉ trong vài phút.\n\nThực hành DevOps giúp giảm thiểu lỗi phát hành thủ công, đảm bảo tính nhất quán giữa môi trường phát triển và môi trường production.`,
    source: "Đại học Đông Á - DevOps",
    sourceUrl: "https://donga.edu.vn",
    imageUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80",
    readTime: "5 phút đọc",
    author: "Khoa CNTT - Đại học Đông Á"
  },
  {
    id: "cloud-computing",
    category: "Công nghệ",
    categoryColor: "bg-sky-100 text-sky-700 border-sky-200",
    date: "20 tháng 8, 2024",
    title: "Xu hướng kiến trúc Microservices và Container Orchestration",
    summary: "Cách các doanh nghiệp lớn như Netflix, Amazon mở rộng hệ thống lên hàng triệu người dùng thông qua container và microservices.",
    content: `Kiến trúc Microservices kết hợp với nền tảng Container cho phép các nhóm phát triển độc lập triển khai các dịch vụ nhỏ mà không ảnh hưởng tới toàn bộ hệ thống. Nhờ đó, các công ty công nghệ có thể phát hành hàng trăm bản cập nhật mỗi ngày với độ sẵn sàng cao lên đến 99.99%.`,
    source: "TechTalk Global",
    sourceUrl: "https://donga.edu.vn",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    readTime: "4 phút đọc",
    author: "Ban Công Nghệ Cloud"
  },
  {
    id: "green-tech",
    category: "Kinh tế",
    categoryColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    date: "18 tháng 8, 2024",
    title: "Chuyển dịch năng lượng xanh và công nghệ bền vững",
    summary: "Đầu tư vào công nghệ xanh và phát triển bền vững đang trở thành xu hướng kinh tế toàn cầu.",
    content: `Các cam kết Net Zero và xu hướng ESG (Môi trường - Xã hội - Quản trị) đang định hình lại chiến lược đầu tư của các tập đoàn đa quốc gia. Các trung tâm dữ liệu xanh tiết kiệm năng lượng và các giải pháp đám mây trung hòa carbon đang nhận được nguồn vốn đầu tư kỷ lục.`,
    source: "Forbes VN",
    sourceUrl: "https://forbes.vn",
    imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80",
    readTime: "3 phút đọc",
    author: "Diễn Đàn Doanh Nghiệp"
  }
];
