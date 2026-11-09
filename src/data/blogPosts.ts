// Dữ liệu bài viết Chuyên mục Góc Đọc Sách & Blog Phê Bình Văn Học BookStore

export interface BlogPost {
  id: string; // Khóa định danh bài viết
  title: string; // Tiêu đề bài viết
  slug: string; // Đường dẫn tĩnh
  category: "Điểm Sách Bestseller" | "Phương Pháp Đọc" | "Công Nghệ & DevOps" | "Thiếu Nhi & Giáo Dục"; // Thể loại bài viết
  author: string; // Tên tác giả bài viết
  authorRole: string; // Vai trò của tác giả
  date: string; // Ngày đăng bài
  readTime: string; // Thời gian đọc ước tính
  imageUrl: string; // Ảnh bìa minh họa bài viết
  excerpt: string; // Tóm tắt ngắn gọn
  content: string[]; // Các đoạn văn bản chi tiết của bài viết
  quote?: string; // Câu trích dẫn nổi bật
  relatedBookIds: string[]; // Danh sách ID các cuốn sách được nhắc tới trong bài
  tags: string[]; // Các thẻ phân loại
  views: number; // Lượt xem
  likes: number; // Lượt yêu thích
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "blog-post-1",
    title: "Top 5 Tác Phẩm Kinh Điển Giúp Bạn Thay Đổi Tư Duy Và Định Hình Lối Sống",
    slug: "top-5-tac-pham-kinh-dien-thay-doi-tu-duy",
    category: "Điểm Sách Bestseller",
    author: "Đinh Bảo",
    authorRole: "Chủ biên Ban Văn Học BookStore",
    date: "08/11/2026",
    readTime: "6 phút đọc",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80",
    excerpt: "Khám phá hành trình vượt qua định kiến, nuôi dưỡng ước mơ và tìm kiếm ý nghĩa cuộc sống qua những trang sách bất hủ từ Paulo Coelho, Dale Carnegie và George Orwell.",
    quote: "Khi bạn thực sự khao khát một điều gì, toàn bộ vũ trụ sẽ hợp sức giúp bạn đạt được điều đó. — Nhà Giả Kim",
    content: [
      "Trong thời đại thông tin bùng nổ, việc dành ra những khoảng lặng để lắng nghe chính mình qua từng trang sách là một thói quen vô cùng quý giá. Sách không chỉ cung cấp tri thức mà còn là tấm gương phản chiếu tâm hồn và định hướng tư duy sống.",
      "Cuốn sách đầu tiên mà bất kỳ ai cũng nên đọc một lần trong đời chính là 'Nhà Giả Kim' (The Alchemist) của Paulo Coelho. Tác phẩm kể về hành trình theo đuổi 'Vận Mệnh Của Mình' của chàng chăn cừu Santiago. Cuốn sách nhắc nhở chúng ta rằng kho báu đích thực không nằm ở điểm đến, mà chính là những bài học và sự trưởng thành xuyên suốt hành trình tìm kiếm ước mơ.",
      "Tiếp nối hành trình hoàn thiện bản thân là kiệt tác 'Đắc Nhân Tâm' (How to Win Friends and Influence People) của Dale Carnegie. Hơn 80 năm qua, những nguyên lý ứng xử chân thành, biết lắng nghe và thấu hiểu người khác vẫn giữ nguyên vẹn giá trị trong mọi mối quan hệ gia đình, công việc và xã hội.",
      "Bên cạnh đó, 'Tư Duy Nhanh Và Chậm' của Daniel Kahneman sẽ giúp bạn nhận diện những thiên kiến nhận thức vô thức thường khiến chúng ta đưa ra những quyết định sai lầm trong kinh doanh và tài chính.",
      "Hãy bắt đầu thói quen đọc 20 trang sách mỗi ngày ngay từ hôm nay. Bạn sẽ nhận ra sự thay đổi kỳ diệu trong cách mình tư duy và đối thoại với thế giới xung quanh."
    ],
    relatedBookIds: ["prod-book-1", "prod-book-3", "prod-book-7"],
    tags: ["Tư Duy", "Kỹ Năng Sống", "Bestseller", "Văn Học"],
    views: 1420,
    likes: 186
  },
  {
    id: "blog-post-2",
    title: "Bí Quyết Đọc 50 Cuốn Sách Một Năm: Phương Pháp Đọc Sâu Của Bill Gates",
    slug: "bi-quyet-doc-50-cuon-sach-mot-nam-bill-gates",
    category: "Phương Pháp Đọc",
    author: "Thu Trang",
    authorRole: "Chuyên viên Khuyến Đọc",
    date: "05/11/2026",
    readTime: "5 phút đọc",
    imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1000&auto=format&fit=crop&q=80",
    excerpt: "Làm thế nào để duy trì sự tập trung, ghi chú thông minh và chuyển hóa kiến thức từ trang sách thành kỹ năng hành động thực tế?",
    quote: "Đọc sách là cách tốt nhất để bạn nạp những góc nhìn mới và liên tục thử thách khả năng hiểu biết của bản thân. — Bill Gates",
    content: [
      "Nhiều người nghĩ rằng những nhà lãnh đạo bận rộn như Bill Gates hay Warren Buffett đọc sách rất nhanh nhờ kỹ năng 'Speed Reading'. Nhưng sự thật hoàn toàn ngược lại: họ đọc rất chậm và luôn đọc một cách chủ động.",
      "Nguyên tắc số 1: Luôn ghi chú bên lề trang sách (Marginalia). Khi đọc một luận điểm thú vị hoặc thậm chí là không đồng tình với tác giả, hãy dùng bút viết ngay suy nghĩ của bạn vào lề trang. Điều này kích hoạt tư duy phản biện thay vì chỉ tiếp nhận thụ động.",
      "Nguyên tắc số 2: Dành tối thiểu 1 giờ liên tục không bị gián đoạn. Đọc sách trong 15 phút ngắt quãng dễ khiến não bộ bị phân tán bởi thông báo điện thoại. Hãy tạo một không gian yên tĩnh và tắt toàn bộ thiết bị điện tử khi bắt đầu mở sách.",
      "Nguyên tắc số 3: Hoàn thành cuốn sách bạn đã bắt đầu. Khi bạn chọn đọc một cuốn sách chuyên khảo, hãy cố gắng đọc hết để nắm trọn bức tranh toàn cảnh mà tác giả muốn truyền tải.",
      "Nguyên tắc số 4: Ứng dụng ngay kỹ thuật Feynman. Sau khi đọc xong một chương sách hay, hãy thử giải thích lại nội dung đó cho một người bạn hoặc viết một bài tóm tắt ngắn bằng ngôn ngữ đơn giản nhất của chính bạn."
    ],
    relatedBookIds: ["prod-book-6", "prod-book-7", "prod-book-8"],
    tags: ["Phương Pháp Đọc", "Ghi Nhớ", "Thói Quen", "Năng Suất"],
    views: 980,
    likes: 142
  },
  {
    id: "blog-post-3",
    title: "DevOps Không Chỉ Là Công Cụ: Tư Duy Tự Động Hóa Trong Phát Triển Phần Mềm",
    slug: "devops-khong-chi-la-cong-cu-tu-duy-tu-dong-hoa",
    category: "Công Nghệ & DevOps",
    author: "Kỹ sư Cloud DevOps",
    authorRole: "Giảng viên CNTT",
    date: "02/11/2026",
    readTime: "7 phút đọc",
    imageUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1000&auto=format&fit=crop&q=80",
    excerpt: "Khám phá 'Tam Giác Vàng' của DevOps: Con Người, Quy Trình và Công Cụ cùng cẩm nang kinh điển 'The DevOps Handbook' và 'Clean Code'.",
    quote: "Mục tiêu của DevOps là rút ngắn chu kỳ phản hồi từ khi viết dòng code đầu tiên cho tới khi tạo ra giá trị thực tế cho người dùng cuối.",
    content: [
      "Trong các môn học công nghệ thông tin hiện đại, sinh viên và kỹ sư phần mềm thường nghe rất nhiều về Docker, Kubernetes, Jenkins hay GitHub Actions. Tuy nhiên, việc thành thạo các công cụ này chỉ chiếm 30% thành công của một văn hóa DevOps thực thụ.",
      "Theo cuốn sách gối đầu giường 'The DevOps Handbook' của Gene Kim và Jez Humble, cốt lõi của DevOps nằm ở 'Ba Cách Thức' (The Three Ways):",
      "1. Nguyên tắc Dòng chảy (Flow): Tối ưu hóa chuỗi phân phối giá trị từ Dev sang Ops, loại bỏ nút thắt cổ chai và giảm thiểu kích thước lô phát hành (Batch Size).",
      "2. Nguyên tắc Vòng phản hồi (Feedback): Xây dựng hệ thống giám sát thời gian thực, phát hiện lỗi ngay từ môi trường kiểm thử tự động thay vì chờ tới khi người dùng phàn nàn trên môi trường Production.",
      "3. Nguyên tắc Học hỏi liên tục (Continuous Learning): Khuyến khích văn hóa thử nghiệm, không đổ lỗi khi xảy ra sự cố (Blameless Post-mortem) và biến những thất bại kỹ thuật thành tài sản tri thức cho toàn đội ngũ.",
      "Kết hợp tư duy này với việc viết mã nguồn sạch (Clean Code theo chuẩn Robert C. Martin), bạn sẽ xây dựng được các hệ thống phần mềm vừa linh hoạt, vừa có độ tin cậy tuyệt đối."
    ],
    relatedBookIds: ["prod-book-10", "prod-book-11", "prod-book-12"],
    tags: ["DevOps", "CI/CD", "Clean Code", "Lập Trình", "Hạ Tầng Đám Mây"],
    views: 1870,
    likes: 245
  },
  {
    id: "blog-post-4",
    title: "Nuôi Dưỡng Trí Tưởng Tượng Cho Trẻ Từ Những Trang Truyện Tranh Nhân Văn",
    slug: "nuoi-duong-tri-tuong-tuong-cho-tre-truyen-tranh",
    category: "Thiếu Nhi & Giáo Dục",
    author: "Minh Anh",
    authorRole: "Cố vấn Văn học Thiếu nhi",
    date: "28/10/2026",
    readTime: "4 phút đọc",
    imageUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1000&auto=format&fit=crop&q=80",
    excerpt: "Tại sao truyện tranh kinh điển và tác phẩm đồng thoại như Dế Mèn Phiêu Lưu Ký hay Hoàng Tử Bé lại là hành trang cảm xúc đẹp đẽ nhất cho tuổi thơ?",
    quote: "Người lớn nào thoạt đầu cũng là trẻ con. Nhưng ít người trong số họ còn nhớ được điều đó. — Hoàng Tử Bé",
    content: [
      "Trẻ em không tiếp nhận thế giới qua những con số khô khan; các em cảm nhận cuộc sống bằng hình ảnh, cảm xúc và sự tò mò vô tận. Những cuốn sách thiếu nhi kinh điển chính là chiếc cầu nối kỳ diệu dẫn lối các em bước vào thế giới bao la.",
      "Tác phẩm 'Dế Mèn Phiêu Lưu Ký' của nhà văn Tô Hoài đã đồng hành cùng biết bao thế hệ tuổi thơ Việt Nam. Những chuyến phiêu lưu mạo hiểm, bài học về lòng vị tha, sự khiêm nhường và khát vọng hòa bình được truyền tải một cách tự nhiên và đầy cảm xúc.",
      "Trong khi đó, 'Hoàng Tử Bé' (Le Petit Prince) lại dạy trẻ em và cả người lớn về bài học của sự gắn kết và tình bạn: 'Người ta chỉ nhìn thấy thật rõ ràng bằng trái tim; cái cốt yếu thì vô hình đối với đôi mắt'.",
      "Cha mẹ hãy dành 20 phút mỗi tối trước giờ đi ngủ để cùng con đọc sách. Đó sẽ là những ký ức tuổi thơ ấm áp và ngọt ngào nhất đi cùng con suốt chặng đường trưởng thành."
    ],
    relatedBookIds: ["prod-book-16", "prod-book-17", "prod-book-18"],
    tags: ["Thiếu Nhi", "Hoàng Tử Bé", "Dế Mèn", "Gia Đình", "Giáo Dục"],
    views: 1150,
    likes: 198
  }
];
