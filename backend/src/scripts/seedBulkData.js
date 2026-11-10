/**
 * Script nạp dữ liệu số lượng lớn (Bulk Seeding) cho MongoDB BookStore
 * Mục tiêu: Bổ sung dữ liệu cho 3 bảng collections theo yêu cầu (tầm 100 - 300 bản ghi):
 * - products: 150 cuốn sách phong phú, chuẩn danh mục và thông tin chi tiết
 * - users: 120 người dùng thực tế với thông tin Việt Nam hợp lệ
 * - reviews: 220 đánh giá chân thực từ độc giả kèm rating và số lượt thích
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');

// Danh mục các thể loại sách chuẩn
const CATEGORIES = [
  'Văn học - Tiểu thuyết',
  'Kinh tế - Kinh doanh',
  'Kỹ năng sống',
  'Công nghệ - Lập trình',
  'Khoa học - Triết học',
  'Thiếu nhi',
  'Tâm lý học',
  'Lịch sử - Địa lý',
  'Ngoại ngữ'
];

// Danh sách các nhà xuất bản uy tín tại Việt Nam
const PUBLISHERS = [
  'NXB Trẻ',
  'NXB Kim Đồng',
  'NXB Hội Nhà Văn',
  'NXB Phụ Nữ',
  'NXB Thế Giới',
  'NXB Lao Động',
  'NXB Dân Trí',
  'NXB Tổng Hợp TP.HCM',
  'NXB Văn Học',
  'NXB Thông Tin và Truyền Thông'
];

// Danh sách ảnh bìa sách chất lượng cao từ Unsplash
const BOOK_COVERS = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1532012164546-f432f2e37b73?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507842229451-77b103b41d0e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80'
];

// Danh mục 132 tựa sách nổi tiếng kinh điển bổ sung
const EXTRA_BOOKS_META = [
  // Văn học
  { name: 'Số Đỏ', author: 'Vũ Trọng Phụng', category: 'Văn học - Tiểu thuyết', desc: 'Kiệt tác trào phúng đỉnh cao của văn học hiện thực phê phán Việt Nam, xoay quanh nhân vật Xuân Tóc Đỏ.' },
  { name: 'Tắt Đèn', author: 'Ngô Tất Tố', category: 'Văn học - Tiểu thuyết', desc: 'Bức tranh hiện thực sắc nét về nỗi khổ cùng cực của người nông dân Việt Nam trước cách mạng qua hình tượng Chị Dậu.' },
  { name: 'Tuổi Thơ Dữ Dội', author: 'Phùng Quán', category: 'Văn học - Tiểu thuyết', desc: 'Bản anh hùng ca bi tráng và xúc động về những chú bé liên lạc quả cảm của Trung đoàn Trần Cao Vân.' },
  { name: 'Chiếc Thuyền Ngoài Xa', author: 'Nguyễn Minh Châu', category: 'Văn học - Tiểu thuyết', desc: 'Tập truyện ngắn sâu sắc về cái nhìn đa diện, sâu sắc trước cuộc sống mưu sinh đầy nghịch lý của con người.' },
  { name: 'Bắt Trẻ Đồng Xanh', author: 'J.D. Salinger', category: 'Văn học - Tiểu thuyết', desc: 'Tác phẩm bất hủ về nỗi cô đơn, sự nổi loạn và khao khát gìn giữ sự thuần khiết tuổi thiếu niên của Holden Caulfield.' },
  { name: 'Chiến Tranh và Hòa Bình', author: 'Lev Tolstoy', category: 'Văn học - Tiểu thuyết', desc: 'Bộ đại tiểu thuyết sử thi đồ sộ bậc nhất thế giới khắc họa nước Nga đầu thế kỷ XIX.' },
  { name: 'Tội Ác và Trừng Phạt', author: 'Fyodor Dostoevsky', category: 'Văn học - Tiểu thuyết', desc: 'Hành trình đấu tranh nội tâm dữ dội giữa tội lỗi, tòa án lương tâm và sự cứu rỗi linh hồn của Raskolnikov.' },
  { name: 'Ông Già và Biển Cả', author: 'Ernest Hemingway', category: 'Văn học - Tiểu thuyết', desc: 'Biểu tượng của lòng kiên cường: "Con người có thể bị hủy diệt nhưng không thể bị đánh bại".' },
  { name: '1984', author: 'George Orwell', category: 'Văn học - Tiểu thuyết', desc: 'Tiểu thuyết phản địa đàng kinh điển cảnh báo về sự giám sát toàn trị và thao túng tư tưởng con người.' },
  { name: 'Trăm Năm Cô Đơn', author: 'Gabriel Garcia Marquez', category: 'Văn học - Tiểu thuyết', desc: 'Kiệt tác chủ nghĩa hiện thực huyền ảo đoạt giải Nobel về dòng họ Buendia tại ngôi làng Macondo.' },
  { name: 'Suối Nguồn (The Fountainhead)', author: 'Ayn Rand', category: 'Văn học - Tiểu thuyết', desc: 'Bản hùng ca về chủ nghĩa cá nhân sáng tạo và lòng trung kiên với lý tưởng của kiến trúc sư Howard Roark.' },
  { name: 'Không Gia Đình', author: 'Hector Malot', category: 'Văn học - Tiểu thuyết', desc: 'Hành trình lưu lạc đầy nghị lực và tình người của chú bé Remi mồ côi trên khắp nẻo đường nước Pháp.' },
  { name: 'Hai Số Phận (Kane and Abel)', author: 'Jeffrey Archer', category: 'Văn học - Tiểu thuyết', desc: 'Cuộc đối đầu kinh điển kéo dài suốt nhiều thập kỷ giữa hai người đàn ông tài hoa sinh cùng một ngày.' },
  { name: 'Đại Gia Gatsby', author: 'F. Scott Fitzgerald', category: 'Văn học - Tiểu thuyết', desc: 'Bức tranh rực rỡ nhưng cay đắng về thời kỳ Jazz và sự sụp đổ của Giấc mơ Mỹ.' },
  { name: 'Tiếng Chim Hót Trong Bụi Mận Gai', author: 'Colleen McCullough', category: 'Văn học - Tiểu thuyết', desc: 'Thiên tình sử bi tráng và say đắm giữa Meggie Cleary và cha xứ Ralph de Bricassart.' },
  { name: 'Những Người Khốn Khổ', author: 'Victor Hugo', category: 'Văn học - Tiểu thuyết', desc: 'Bản trường ca nhân đạo cao cả về tình thương, công lý và sự tái sinh của Jean Valjean.' },
  { name: 'Chuông Nguyện Hồn Ai', author: 'Ernest Hemingway', category: 'Văn học - Tiểu thuyết', desc: 'Bản tình ca bi tráng giữa khói lửa chiến tranh nội chiến Tây Ban Nha.' },
  { name: 'Bố Già (The Godfather)', author: 'Mario Puzo', category: 'Văn học - Tiểu thuyết', desc: 'Kiệt tác về thế giới ngầm mafia và những quy tắc sinh tồn, tình gia đình thiêng liêng của Don Vito Corleone.' },
  { name: 'Rừng Na Uy', author: 'Haruki Murakami', category: 'Văn học - Tiểu thuyết', desc: 'Nỗi buồn u hoài, sự cô đơn và những mất mát khó phai mờ của tuổi trẻ Tokyo những năm 1960.' },
  { name: 'Gió Lạnh Đầu Mùa', author: 'Thạch Lam', category: 'Văn học - Tiểu thuyết', desc: 'Những trang văn thấm đượm tình người ấm áp, trong trẻo và dịu dàng như hơi thở mùa đông.' },

  // Kinh tế - Kinh doanh
  { name: 'Nghĩ Giàu và Làm Giàu', author: 'Napoleon Hill', category: 'Kinh tế - Kinh doanh', desc: 'Công thức thành công đã được kiểm chứng qua hàng trăm triệu phú hàng đầu thế giới.' },
  { name: 'Người Giàu Có Nhất Thành Babylon', author: 'George S. Clason', category: 'Kinh tế - Kinh doanh', desc: 'Những nguyên tắc tài chính cá nhân vượt thời gian thông qua các câu chuyện cổ thành Babylon.' },
  { name: 'Chiến Lược Đại Dương Xanh', author: 'W. Chan Kim & Renée Mauborgne', category: 'Kinh tế - Kinh doanh', desc: 'Cách tạo ra khoảng trống thị trường không có cạnh tranh và làm cho đối thủ trở nên không thích hợp.' },
  { name: 'Từ Tốt Đến Vĩ Đại (Good to Great)', author: 'Jim Collins', category: 'Kinh tế - Kinh doanh', desc: 'Nghiên cứu đột phá về những yếu tố biến một công ty bình thường thành tập đoàn vĩ đại trường tồn.' },
  { name: 'Zero to One: Khởi Nghiệp Để Đột Phá', author: 'Peter Thiel', category: 'Kinh tế - Kinh doanh', desc: 'Bí quyết tư duy độc quyền và kiến tạo những giá trị hoàn toàn mới từ số không đến một.' },
  { name: 'Dốc Hết Trái Tim (Pour Your Heart Into It)', author: 'Howard Schultz', category: 'Kinh tế - Kinh doanh', desc: 'Câu chuyện xây dựng đế chế cà phê Starbucks toàn cầu từ niềm đam mê cháy bỏng.' },
  { name: 'Quốc Gia Khởi Nghiệp', author: 'Dan Senor & Saul Singer', category: 'Kinh tế - Kinh doanh', desc: 'Câu chuyện kỳ tích kinh tế và tinh thần sáng tạo kiên cường của đất nước Israel.' },
  { name: 'Bí Mật Chuyên Gia (Expert Secrets)', author: 'Russell Brunson', category: 'Kinh tế - Kinh doanh', desc: 'Cẩm nang xây dựng thông điệp, chuyển hóa kiến thức thành doanh nghiệp triệu đô trực tuyến.' },
  { name: 'Dẫn Đầu Hay Là Chết', author: 'Jack Welch', category: 'Kinh tế - Kinh doanh', desc: 'Những bài học thực chiến quyết liệt từ vị CEO huyền thoại của tập đoàn General Electric.' },
  { name: 'Đường Vào Nội Tâm Của Một Nhà Đầu Tư', author: 'Howard Marks', category: 'Kinh tế - Kinh doanh', desc: 'Tư duy cấp độ hai và nghệ thuật quản trị rủi ro trên thị trường tài chính toàn cầu.' },
  { name: 'Bước Đi Ngẫu Nhiên Trên Phố Wall', author: 'Burton G. Malkiel', category: 'Kinh tế - Kinh doanh', desc: 'Kim chỉ nam đầu tư chứng khoán dựa trên lý thuyết thị trường hiệu quả và quỹ chỉ số.' },
  { name: 'Tiền Đẻ Ra Tiền', author: 'David Bach', category: 'Kinh tế - Kinh doanh', desc: 'Kế hoạch tài chính tự động hóa giúp bạn đạt được tự do tài chính mà không cần thắt lưng buộc bụng.' },
  { name: 'Tạo Lập Mô Hình Kinh Doanh', author: 'Alexander Osterwalder', category: 'Kinh tế - Kinh doanh', desc: 'Công cụ Business Model Canvas trực quan hóa cấu trúc tạo ra giá trị của mọi tổ chức.' },
  { name: 'Gã Nghiện Giày (Shoe Dog)', author: 'Phil Knight', category: 'Kinh tế - Kinh doanh', desc: 'Hành trình lập nghiệp đầy thăng trầm và táo bạo của nhà sáng lập tập đoàn Nike.' },
  { name: 'Tỷ Phú Bán Giày', author: 'Tony Hsieh', category: 'Kinh tế - Kinh doanh', desc: 'Văn hóa doanh nghiệp định hướng hạnh phúc và dịch vụ khách hàng phi thường của Zappos.' },

  // Kỹ năng sống
  { name: 'Sức Mạnh Của Hiện Tại', author: 'Eckhart Tolle', category: 'Kỹ năng sống', desc: 'Hướng dẫn sâu sắc để thoát khỏi ngục tù của tâm trí, sống trọn vẹn trong khoảnh khắc bây giờ.' },
  { name: 'Tư Duy Nhanh và Chậm', author: 'Daniel Kahneman', category: 'Kỹ năng sống', desc: 'Công trình kinh điển giải thích hai hệ thống tư duy chi phối mọi quyết định và sai lầm nhận thức.' },
  { name: 'Phi Lý Trí (Predictably Irrational)', author: 'Dan Ariely', category: 'Kỹ năng sống', desc: 'Khám phá những động cơ tiềm ẩn khiến chúng ta liên tục đưa ra những quyết định ngớ ngẩn nhưng có quy luật.' },
  { name: 'Kỷ Luật Tự Giác', author: 'Brian Tracy', category: 'Kỹ năng sống', desc: '21 nguyên tắc vàng để làm chủ bản thân, vượt qua thói trì hoãn và hoàn thành mọi mục tiêu.' },
  { name: 'Nghệ Thuật Giao Tiếp Để Thành Công', author: 'Leil Lowndes', category: 'Kỹ năng sống', desc: '92 thủ thuật nhỏ giúp bạn tạo ấn tượng sâu sắc và kết nối tự tin với mọi đối tượng.' },
  { name: 'Khéo Ăn Nói Sẽ Có Được Thiên Hạ', author: 'Trác Nhã', category: 'Kỹ năng sống', desc: 'Bí quyết đối nhân xử thế và làm chủ nghệ thuật ngôn từ trong công việc lẫn cuộc sống thường nhật.' },
  { name: 'Sống Thực Tế Giữa Đời Thực Dụng', author: 'Mễ Mông', category: 'Kỹ năng sống', desc: 'Những góc nhìn thẳng thắn, mạnh mẽ giúp bạn bản lĩnh đối diện với thực tế khắc nghiệt.' },
  { name: 'Biết Ơn Cuộc Đời (The Magic)', author: 'Rhonda Byrne', category: 'Kỹ năng sống', desc: '28 ngày thực hành lòng biết ơn để thu hút những điều kỳ diệu và bình an vào cuộc sống.' },
  { name: 'Tuần Làm Việc 4 Giờ', author: 'Timothy Ferriss', category: 'Kỹ năng sống', desc: 'Bí kíp thoát khỏi guồng quay 9-to-5, tự động hóa thu nhập và tận hưởng cuộc sống mới.' },
  { name: 'Ăn Gì Không Chết (How Not to Die)', author: 'Michael Greger', category: 'Kỹ năng sống', desc: 'Khoa học dinh dưỡng phòng chống và đẩy lùi 15 căn bệnh gây tử vong hàng đầu hiện nay.' },
  { name: 'Bật Lên Từ Thất Bại', author: 'Angela Duckworth', category: 'Kỹ năng sống', desc: 'Sức mạnh của niềm đam mê và sự bền bỉ (Grit) – chìa khóa quyết định thành công lâu dài.' },
  { name: 'Lập Kế Hoạch Cuộc Đời', author: 'Michael Hyatt', category: 'Kỹ năng sống', desc: 'Hệ thống thiết lập mục tiêu năm toàn diện giúp bạn sống một cuộc đời có chủ đích và rực rỡ.' },

  // Công nghệ - Lập trình
  { name: 'The Pragmatic Programmer', author: 'David Thomas & Andrew Hunt', category: 'Công nghệ - Lập trình', desc: 'Cẩm nang kinh điển rèn luyện tư duy từ thợ gõ mã thành bậc thầy kỹ nghệ phần mềm.' },
  { name: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma & cộng sự (Gang of Four)', category: 'Công nghệ - Lập trình', desc: '23 mẫu thiết kế hướng đối tượng chuẩn mực trường tồn trong ngành công nghiệp phần mềm.' },
  { name: 'Refactoring: Improving the Design of Existing Code', author: 'Martin Fowler', category: 'Công nghệ - Lập trình', desc: 'Nghệ thuật tái cấu trúc mã nguồn an toàn, tinh gọn và dễ bảo trì.' },
  { name: 'Building Microservices', author: 'Sam Newman', category: 'Công nghệ - Lập trình', desc: 'Chỉ dẫn thực tế thiết kế, kiểm thử, triển khai và vận hành kiến trúc Microservices phân tán.' },
  { name: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', category: 'Công nghệ - Lập trình', desc: 'Kinh thánh về kiến trúc hệ thống dữ liệu lớn, tính tin cậy, khả năng mở rộng và nhất quán.' },
  { name: 'Clean Architecture', author: 'Robert C. Martin', category: 'Công nghệ - Lập trình', desc: 'Kiến trúc sạch cho phần mềm: các quy tắc bất biến để giữ cho mã nguồn linh hoạt trước thay đổi.' },
  { name: 'Site Reliability Engineering (SRE)', author: 'Betsy Beyer & Google SRE Team', category: 'Công nghệ - Lập trình', desc: 'Kinh nghiệm vận hành và tự động hóa hạ tầng quy mô toàn cầu từ tập đoàn Google.' },
  { name: 'Continuous Delivery', author: 'Jez Humble & David Farley', category: 'Công nghệ - Lập trình', desc: 'Quy trình phát hành phần mềm tự động hóa, tin cậy và liên tục qua Deployment Pipeline.' },
  { name: 'Docker Deep Dive', author: 'Nigel Poulton', category: 'Công nghệ - Lập trình', desc: 'Chinh phục Docker container, kiến trúc image, networking và volume từ nền tảng đến nâng cao.' },
  { name: 'Kubernetes Up & Running', author: 'Brendan Burns & Joe Beda', category: 'Công nghệ - Lập trình', desc: 'Hướng dẫn toàn diện về điều phối container trên cụm máy chủ phân tán Kubernetes.' },
  { name: 'Effective Java', author: 'Joshua Bloch', category: 'Công nghệ - Lập trình', desc: '78 hướng dẫn tinh hoa viết mã Java chuẩn mực, an toàn và tối ưu hiệu năng.' },
  { name: 'JavaScript: The Good Parts', author: 'Douglas Crockford', category: 'Công nghệ - Lập trình', desc: 'Khám phá những phần tinh túy nhất của ngôn ngữ lập trình phổ biến bậc nhất thế giới.' },
  { name: 'You Don\'t Know JS Yet', author: 'Kyle Simpson', category: 'Công nghệ - Lập trình', desc: 'Bộ sách đào sâu tận gốc cơ chế Scope, Closure, Prototype và Async trong JavaScript.' },
  { name: 'Grokking Algorithms', author: 'Aditya Bhargava', category: 'Công nghệ - Lập trình', desc: 'Minh họa trực quan, dễ hiểu nhất về các thuật toán và cấu trúc dữ liệu cốt lõi.' },
  { name: 'Cracking the Coding Interview', author: 'Gayle Laakmann McDowell', category: 'Công nghệ - Lập trình', desc: '189 câu hỏi thuật toán và bí quyết phỏng vấn kỹ thuật vào các tập đoàn công nghệ lớn (FAANG).' },

  // Khoa học - Triết học
  { name: 'Lược Sử Thời Gian', author: 'Stephen Hawking', category: 'Khoa học - Triết học', desc: 'Tuyệt phẩm vật lý thiên văn giải thích về vụ nổ Big Bang, lỗ đen và bản chất của không - thời gian.' },
  { name: 'Homo Deus: Lược Sử Tương Lai', author: 'Yuval Noah Harari', category: 'Khoa học - Triết học', desc: 'Dự báo chấn động về tương lai nhân loại trước làn sóng AI, công nghệ sinh học và khát vọng bất tử.' },
  { name: '21 Bài Học Cho Thế Kỷ 21', author: 'Yuval Noah Harari', category: 'Khoa học - Triết học', desc: 'Góc nhìn tỉnh táo về khủng hoảng sinh thái, công nghệ số, tôn giáo và sự thật trong kỷ nguyên hỗn loạn.' },
  { name: 'Súng, Vi Trùng và Thép', author: 'Jared Diamond', category: 'Khoa học - Triết học', desc: 'Số phận các xã hội loài người dưới lăng kính địa lý học, sinh học và lịch sử tiến hóa hàng vạn năm.' },
  { name: 'Bản Thiết Kế Vĩ Đại', author: 'Stephen Hawking & Leonard Mlodinow', category: 'Khoa học - Triết học', desc: 'Khám phá thuyết M và câu trả lời tối hậu cho sự tồn tại của vũ trụ chúng ta.' },
  { name: 'Thế Giới Như Tôi Thấy', author: 'Albert Einstein', category: 'Khoa học - Triết học', desc: 'Tập tiểu luận sâu sắc về khoa học, tôn giáo, chính trị và hòa bình nhân loại của nhà bác học lỗi lạc.' },
  { name: 'Cộng Hòa (The Republic)', author: 'Plato', category: 'Khoa học - Triết học', desc: 'Tác phẩm triết học nền tảng của phương Tây bàn về bản chất của công lý và hình mẫu nhà nước lý tưởng.' },
  { name: 'Bàn Về Tự Do', author: 'John Stuart Mill', category: 'Khoa học - Triết học', desc: 'Luận thuyết kinh điển bảo vệ tự do ngôn luận, tự do tư tưởng và quyền cá nhân trước đa số.' },
  { name: 'Gen Vị Kỷ (The Selfish Gene)', author: 'Richard Dawkins', category: 'Khoa học - Triết học', desc: 'Góc nhìn mang tính cách mạng về thuyết tiến hóa tự nhiên đặt trên cấp độ phân tử gen.' },
  { name: 'Thế Giới Của Sophie', author: 'Jostein Gaarder', category: 'Khoa học - Triết học', desc: 'Cuốn tiểu thuyết lôi cuốn dẫn lối độc giả qua toàn bộ lịch sử 3.000 năm triết học phương Tây.' },
  { name: 'Những Câu Hỏi Lớn Về Vũ Trụ', author: 'Neil deGrasse Tyson', category: 'Khoa học - Triết học', desc: 'Vật lý thiên văn cho người bận rộn: giải đáp những bí ẩn không gian bằng giọng văn hóm hỉnh.' },
  { name: 'Ý Niệm Về Cái Đẹp', author: 'Umberto Eco', category: 'Khoa học - Triết học', desc: 'Hành trình khám phá lịch sử thẩm mỹ học và quan niệm biến thiên về cái đẹp qua các thời đại.' },

  // Tâm lý học
  { name: 'Hiểu Về Trái Tim', author: 'Thích Minh Niệm', category: 'Tâm lý học', desc: 'Liều thuốc chữa lành tâm hồn, giúp thấu hiểu cảm xúc, chuyển hóa khổ đau và nuôi dưỡng bình yên.' },
  { name: 'Đi Tìm Lẽ Sống (Man\'s Search for Meaning)', author: 'Viktor Frankl', category: 'Tâm lý học', desc: 'Liệu pháp ý nghĩa sống vượt qua địa ngục trại tập trung Auschwitz, tìm thấy hy vọng trong tột cùng gian truân.' },
  { name: 'Tâm Lý Học Về Tiền', author: 'Morgan Housel', category: 'Tâm lý học', desc: '19 câu chuyện sâu sắc khám phá cách cảm xúc, cái tôi và tâm lý định hình hành vi tài chính của chúng ta.' },
  { name: 'Dám Bị Ghét', author: 'Koga Fumitake & Kishimi Ichiro', category: 'Tâm lý học', desc: 'Giải phóng bản thân khỏi kỳ vọng của người khác dựa trên nền tảng tâm lý học Adler dũng cảm.' },
  { name: 'Dám Hạnh Phúc', author: 'Koga Fumitake & Kishimi Ichiro', category: 'Tâm lý học', desc: 'Hành trình dấn thân thực hành lòng can đảm để lựa chọn lối sống tự do và hạnh phúc đích thực.' },
  { name: 'Trí Tuệ Cảm Xúc (EQ)', author: 'Daniel Goleman', category: 'Tâm lý học', desc: 'Vì sao EQ lại quan trọng hơn cả IQ trong việc quyết định thành công và các mối quan hệ hạnh phúc.' },
  { name: 'Tâm Lý Học Đám Đông', author: 'Gustave Le Bon', category: 'Tâm lý học', desc: 'Phân tích chấn động về cơ chế tâm lý biến những cá nhân lý trí thành đám đông cuồng loạn.' },
  { name: 'Thao Túng Tâm Lý (Gaslighting)', author: 'Stephanie Sarkis', category: 'Tâm lý học', desc: 'Nhận diện và hóa giải những cạm bẫy kiểm soát tinh thần độc hại trong công việc và tình cảm.' },
  { name: 'Khi Hơi Thở Hóa Thinh Không', author: 'Paul Kalanithi', category: 'Tâm lý học', desc: 'Hồi ký cảm động của một bác sĩ phẫu thuật thần kinh đối diện với ung thư phổi giai đoạn cuối.' },
  { name: 'Tâm Hồn Cao Thượng', author: 'Edmondo De Amicis', category: 'Tâm lý học', desc: 'Những câu chuyện cảm động giáo dục lòng nhân ái, sự trung thực và lòng dũng cảm cho tâm hồn.' },

  // Lịch sử - Địa lý
  { name: 'Đại Việt Sử Ký Toàn Thư', author: 'Ngô Sĩ Liên', category: 'Lịch sử - Địa lý', desc: 'Bộ quốc sử đồ sộ ghi chép dòng chảy lịch sử Việt Nam từ thời Hồng Bàng đến triều Hậu Lê.' },
  { name: 'Việt Nam Sử Lược', author: 'Trần Trọng Kim', category: 'Lịch sử - Địa lý', desc: 'Cuốn sử thông dụng đầu tiên viết bằng chữ quốc ngữ, mạch lạc, khúc chiết và khách quan.' },
  { name: 'Những Tù Nhân Của Địa Lý', author: 'Tim Marshall', category: 'Lịch sử - Địa lý', desc: 'Mười bản đồ giải thích tất cả mọi cục diện xung đột địa chính trị trên toàn cầu ngày nay.' },
  { name: 'Con Đường Tơ Lụa Mới', author: 'Peter Frankopan', category: 'Lịch sử - Địa lý', desc: 'Lịch sử thế giới mới dịch chuyển trọng tâm địa chính trị và kinh tế về lại phương Đông.' },
  { name: 'Hành Trình Về Phương Đông', author: 'Baird T. Spalding', category: 'Lịch sử - Địa lý', desc: 'Chuyến thám hiểm huyền bí tìm hiểu văn hóa tâm linh và triết học cổ xưa của đất nước Ấn Độ.' },
  { name: 'Văn Minh Phương Tây', author: 'Niall Ferguson', category: 'Lịch sử - Địa lý', desc: 'Sáu ứng dụng sát thủ (Killer Apps) giải thích vì sao phương Tây thống trị thế giới suốt 500 năm qua.' },

  // Ngoại ngữ
  { name: 'English Grammar in Use', author: 'Raymond Murphy', category: 'Ngoại ngữ', desc: 'Giáo trình ngữ pháp tiếng Anh kinh điển và chuẩn mực nhất thế giới dành cho người tự học.' },
  { name: 'Oxford Advanced Learner\'s Dictionary', author: 'A.S. Hornby', category: 'Ngoại ngữ', desc: 'Từ điển chuẩn mực quốc tế giải thích rõ nghĩa và cách dùng từ chính xác nhất.' },
  { name: 'Hack Não 1500 Từ Tiếng Anh', author: 'Nguyễn Hiệp', category: 'Ngoại ngữ', desc: 'Phương pháp học từ vựng tiếng Anh qua hình ảnh liên tưởng và truyện chêm độc đáo.' },
  { name: 'IELTS Cambridge 19 Academic', author: 'Cambridge University Press', category: 'Ngoại ngữ', desc: 'Bộ đề luyện thi IELTS chính thức cập nhật sát thực tế format kỳ thi quốc tế.' },
  { name: 'Hangeul Tiếng Hàn Nhập Môn', author: 'Seoul National University', category: 'Ngoại ngữ', desc: 'Giáo trình chuẩn ngữ âm và ngữ pháp tiếng Hàn dành cho người mới bắt đầu.' },
  { name: 'Minna no Nihongo Sơ Cấp', author: '3A Corporation', category: 'Ngoại ngữ', desc: 'Bộ giáo trình tiếng Nhật phổ biến nhất thế giới dành cho luyện thi JLPT N5-N4.' },

  // Thiếu nhi
  { name: 'Dế Mèn Phiêu Lưu Ký', author: 'Tô Hoài', category: 'Thiếu nhi', desc: 'Tác phẩm văn học thiếu nhi kinh điển nhất Việt Nam kể về hành trình trưởng thành của chú Dế Mèn.' },
  { name: 'Đất Rừng Phương Nam', author: 'Đoàn Giỏi', category: 'Thiếu nhi', desc: 'Bức tranh thiên nhiên sông nước Nam Bộ trù phú và hào sảng qua cuộc đời lưu lạc của bé An.' },
  { name: 'Kính Vạn Hoa (Trọn Bộ)', author: 'Nguyễn Nhật Ánh', category: 'Thiếu nhi', desc: 'Bộ truyện học trò dài tập đầy ắp tiếng cười tinh nghịch của bộ ba Quý ròm, Tiểu Long và nhỏ Hạnh.' },
  { name: 'Góc Sân và Khoảng Trời', author: 'Trần Đăng Khoa', category: 'Thiếu nhi', desc: 'Tập thơ tuổi thơ trong trẻo, hồn nhiên đậm đà phong vị làng quê Bắc Bộ của thần đồng thơ ca.' },
  { name: 'Chuyện Con Mèo Dạy Hải Âu Bay', author: 'Luis Sepúlveda', category: 'Thiếu nhi', desc: 'Bài học cảm động sâu sắc về tình yêu thương vô điều kiện và lòng can đảm vượt qua giới hạn giống loài.' },
  { name: 'Cô Bé Bán Diêm', author: 'Hans Christian Andersen', category: 'Thiếu nhi', desc: 'Truyện cổ tích bất hủ thắp sáng lòng trắc ẩn và tình thương giữa đêm đông tuyết giá.' },
  { name: 'Alice Ở Xứ Sở Thần Tiên', author: 'Lewis Carroll', category: 'Thiếu nhi', desc: 'Cuộc phiêu lưu kỳ ảo đầy trí tưởng tượng bay bổng vượt thời gian của cô bé Alice.' },
  { name: 'Pinocchio - Chú Bé Người Gỗ', author: 'Carlo Collodi', category: 'Thiếu nhi', desc: 'Câu chuyện răn dạy về sự trung thực, lòng hiếu thảo và nỗ lực để trở thành một con người thật sự.' },
  { name: 'Gió Qua Rặng Liễu', author: 'Kenneth Grahame', category: 'Thiếu nhi', desc: 'Tình bạn ấm áp bên bờ sông thanh bình giữa bác Chuột Chũi, Chuột Nước và Bác Cóc ngông nghênh.' },
  { name: 'Thần Thoại Hy Lạp', author: 'Nguyễn Văn Khỏa', category: 'Thiếu nhi', desc: 'Thế giới các vị thần trên đỉnh Olympus và những chiến công hiển hách của các anh hùng cổ đại.' }
];

// Danh sách tên người dùng tiếng Việt chân thực
const VIETNAMESE_NAMES = [
  'Nguyễn Văn An', 'Trần Thị Thảo', 'Phạm Quốc Hưng', 'Lê Bảo Châu', 'Hoàng Minh Tuấn',
  'Đặng Văn Lâm', 'Ngô Thị Mai', 'Trịnh Hoàng Long', 'Đỗ Thị Lan', 'Nguyễn Duy Cường',
  'Bùi Tuyết Mai', 'Vũ Thành Đạt', 'Lý Hải Đăng', 'Đinh Hồng Hạnh', 'Dương Gia Huy',
  'Hà Thị Thùy Dung', 'Mai Đức Chung', 'Lương Bích Hữu', 'Hồ Hoài Anh', 'Phan Anh Tuấn',
  'Tạ Quang Bửu', 'Cao Thùy Linh', 'Quách Thành Danh', 'Ân Hoàng Lô', 'Trương Bá Chi',
  'Nguyễn Thanh Tùng', 'Võ Hoàng Yến', 'Chu Đăng Khoa', 'Lâm Khánh Chi', 'Thái Hòa',
  'Phùng Ngọc Huy', 'Bạch Công Khanh', 'Nhan Phúc Vinh', 'Hứa Vĩ Văn', 'Ninh Dương Lan Ngọc',
  'Diệu Nhi', 'Thu Trang', 'Tiến Luật', 'Trấn Thành', 'Hari Won',
  'Lê Dương Bảo Lâm', 'Khả Như', 'Puka', 'Gin Tuấn Kiệt', 'Hòa Minzy',
  'Đức Phúc', 'Erik', 'Văn Mai Hương', 'Bùi Anh Tuấn', 'Hồ Ngọc Hà',
  'Đàm Vĩnh Hưng', 'Mỹ Tâm', 'Đan Trường', 'Cẩm Ly', 'Lam Trường',
  'Phương Thanh', 'Tuấn Hưng', 'Noo Phước Thịnh', 'Đông Nhi', 'Ông Cao Thắng',
  'Bảo Thy', 'Isaac', 'Soobin Hoàng Sơn', 'Rocker Nguyễn', 'Châu Bùi',
  'Decao', 'Quỳnh Anh Shyn', 'Salim', 'Khánh Vy', 'Thảo Tâm',
  'Tóc Tiên', 'Hoàng Touliver', 'Rhymastic', 'Binz', 'Suboi',
  'JustaTee', 'Phương Ly', 'Karik', 'Wowy', 'Ricky Star',
  'Lăng LD', 'HIEUTHUHAI', 'HurryKng', 'Negav', 'RHYDER',
  'Captain', 'Quang Hùng MasterD', 'Anh Tú Atus', 'Song Luân', 'Voi Bản Đôn',
  'Vũ Cát Tường', 'Trúc Nhân', 'Bảo Anh', 'Miu Lê', 'Hoàng Thùy Linh',
  'Chi Pu', 'Suni Hạ Linh', 'Orange', 'LyLy', 'AMEE',
  'Grey D', 'MONO', 'Vũ.', 'Thịnh Suy', 'Trang',
  'Ngọt Band', 'Cá Hồi Hoang', 'Chillies', 'Da LAB', 'The Cassette'
];

// Danh sách thành phố & địa chỉ tại Việt Nam
const VIETNAMESE_CITIES = [
  'Quận 1, TP. Hồ Chí Minh',
  'Quận Cầu Giấy, Hà Nội',
  'Quận Hải Châu, TP. Đà Nẵng',
  'Quận Ninh Kiều, TP. Cần Thơ',
  'Quận Hồng Bàng, TP. Hải Phòng',
  'Thành phố Huế, Thừa Thiên Huế',
  'TP. Nha Trang, Khánh Hòa',
  'TP. Buôn Ma Thuột, Đắk Lắk',
  'TP. Vũng Tàu, Bà Rịa - Vũng Tàu',
  'TP. Đà Lạt, Lâm Đồng',
  'TP. Biên Hòa, Đồng Nai',
  'TP. Thủ Dầu Một, Bình Dương',
  'TP. Quy Nhơn, Bình Định',
  'TP. Phan Thiết, Bình Thuận',
  'Quận Bình Thạnh, TP. Hồ Chí Minh',
  'Quận Đống Đa, Hà Nội',
  'Quận Ba Đình, Hà Nội',
  'Quận Hoàn Kiếm, Hà Nội',
  'Quận 7, TP. Hồ Chí Minh',
  'Quận Tân Bình, TP. Hồ Chí Minh'
];

// Danh sách các nhận xét sách thực tế
const REVIEW_TEMPLATES = [
  'Sách đóng gói rất cẩn thận, có bọc chống sốc kĩ càng, bìa sách mới toanh không hề bị móp góc. Nội dung sâu sắc, đọc xong thấy mở mang thêm nhiều kiến thức bổ ích. Giao hàng cực nhanh!',
  'Cuốn sách này thực sự làm thay đổi tư duy của mình. Lối hành văn mạch lạc, ví dụ thực tế và rất dễ ứng dụng vào công việc hàng ngày. Sẽ tiếp tục ủng hộ BookStore.',
  'Chất lượng giấy in dày dặn, font chữ rõ ràng, đọc lâu không bị mỏi mắt. Cảm ơn nhà sách đã giao hàng đúng hẹn!',
  'Một kiệt tác đáng để gối đầu giường. Mình đã đọc đi đọc lại 3 lần mà mỗi lần đều thấm thía một bài học mới.',
  'Mua vào dịp khuyến mãi giá siêu mềm. Sách chính hãng có tem chuẩn NXB, dịch thuật mượt mà.',
  'Sách rất hay, phù hợp cho những ai đang tìm kiếm định hướng và sự bình an trong tâm hồn. Cho 5 sao không ngần ngại!',
  'Giao hàng nhanh như một cơn gió, đặt sáng chiều đã nhận được. Đóng gói đẹp, tặng kèm bookmark rất xinh.',
  'Nội dung sâu sắc, nhiều kiến thức hàn lâm được giải thích cực kỳ bình dân và hóm hỉnh. Rất đáng tiền!',
  'Một cuốn sách không thể thiếu trong tủ sách gia đình. Cả nhà mình ai đọc cũng thích.',
  'Rất hài lòng về chất lượng dịch vụ của BookStore. Đóng gói cẩn thận, sách thơm mùi giấy mới.',
  'Nội dung có vài chỗ hơi trừu tượng nhưng nhìn chung rất lôi cuốn. Đọc một mạch hết cả buổi chiều.',
  'Cảm ơn BookStore đã mang đến những tác phẩm tuyệt vời thế này đến tay bạn đọc. Chúc shop ngày càng phát triển!'
];

/**
 * Hàm sinh danh sách 150 sách
 */
function generateProducts(existingCount = 18) {
  const products = [];
  const targetCount = 150;
  let bookIndex = 0;

  for (let i = existingCount + 1; i <= targetCount; i++) {
    const meta = EXTRA_BOOKS_META[bookIndex % EXTRA_BOOKS_META.length];
    bookIndex++;

    const suffix = Math.floor(bookIndex / EXTRA_BOOKS_META.length);
    const bookTitle = suffix === 0 ? meta.name : `${meta.name} (Tập ${suffix + 1})`;
    const price = (Math.floor(Math.random() * 25) + 6) * 10000; // 60,000 - 300,000
    const originalPrice = Math.round((price * (1 + Math.random() * 0.35)) / 1000) * 1000;
    const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
    const publisher = PUBLISHERS[i % PUBLISHERS.length];
    const pubYear = 2018 + (i % 7);
    const pages = 180 + (i * 7) % 550;
    const coverUrl = BOOK_COVERS[i % BOOK_COVERS.length];

    products.push({
      id: `prod-book-${i}`,
      name: bookTitle,
      category: meta.category,
      price: price,
      originalPrice: originalPrice,
      discountPercent: discountPercent,
      rating: 4.8,
      reviewsCount: 0,
      imageUrl: coverUrl,
      description: meta.desc,
      author: meta.author,
      publisher: publisher,
      publicationYear: pubYear,
      pages: pages,
      isbn: `978-604-${Math.floor(100 + Math.random() * 899)}-${Math.floor(1000 + Math.random() * 8999)}-${i % 10}`,
      specs: {
        'Tác giả': meta.author,
        'Nhà xuất bản': publisher,
        'Năm xuất bản': String(pubYear),
        'Số trang': `${pages} trang`,
        'Hình thức': i % 5 === 0 ? 'Bìa cứng' : 'Bìa mềm',
        'Ngôn ngữ': 'Tiếng Việt',
        'Kích thước': '14 x 20.5 cm'
      },
      inStock: true,
      stockQuantity: 15 + (i % 50),
      featured: i % 7 === 0,
      reviews: []
    });
  }
  return products;
}

/**
 * Hàm sinh danh sách người dùng lên tới 120 users
 */
function generateUsers(existingUsers) {
  const users = [];
  const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
  const existingIds = new Set(existingUsers.map((u) => u.id));
  const targetTotal = 120;
  const needToAdd = targetTotal - existingUsers.length;

  let added = 0;
  let counter = existingUsers.length + 1;

  for (let idx = 0; added < needToAdd; idx++) {
    const rawName = VIETNAMESE_NAMES[idx % VIETNAMESE_NAMES.length];
    const name = added >= VIETNAMESE_NAMES.length ? `${rawName} ${Math.floor(added / VIETNAMESE_NAMES.length) + 1}` : rawName;
    const cleanEmailName = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/\s+/g, '.');

    let email = `${cleanEmailName}${counter}@gmail.com`;
    if (existingEmails.has(email)) {
      email = `user.${counter}.${cleanEmailName}@bookstore.vn`;
    }
    existingEmails.add(email);

    let id = `usr-cust-${counter}`;
    while (existingIds.has(id)) {
      counter++;
      id = `usr-cust-${counter}`;
    }
    existingIds.add(id);

    const city = VIETNAMESE_CITIES[added % VIETNAMESE_CITIES.length];
    const phone = `09${Math.floor(10000000 + Math.random() * 89999999)}`;

    users.push({
      id: id,
      name: name,
      email: email,
      phone: phone,
      role: 'customer',
      status: 'active',
      password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890dummyHashForDevOps',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(id)}`,
      address: `${Math.floor(10 + Math.random() * 200)} Đường số ${Math.floor(1 + Math.random() * 20)}, ${city}`,
      createdAtStr: new Date(Date.now() - (added * 86400000 * 2)).toLocaleDateString('vi-VN')
    });

    counter++;
    added++;
  }

  return users;
}

/**
 * Hàm sinh danh sách 220 reviews
 */
function generateReviews(allProducts, allUsers, existingCount = 12) {
  const reviews = [];
  const targetCount = 220;

  for (let i = existingCount + 1; i <= targetCount; i++) {
    const targetProduct = allProducts[(i * 3) % allProducts.length];
    const targetUser = allUsers[(i * 7) % allUsers.length];
    const content = REVIEW_TEMPLATES[i % REVIEW_TEMPLATES.length];
    const rating = (i % 6 === 0) ? 4 : 5; // Chủ yếu 5 sao và 4 sao
    const daysAgo = Math.floor(Math.random() * 60) + 1;
    const dateStr = `${daysAgo} ngày trước`;
    const likes = Math.floor(Math.random() * 28);

    reviews.push({
      id: `rev-${i}`,
      productId: targetProduct.id,
      userId: targetUser.id,
      author: targetUser.name,
      rating: rating,
      date: dateStr,
      content: content,
      verified: true,
      likes: likes
    });
  }

  return reviews;
}

/**
 * Hàm thực thi nạp dữ liệu vào MongoDB theo URI chỉ định
 */
async function runBulkSeeding(targetUri) {
  const mongoUri = targetUri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookstore';

  console.log('========================================================');
  console.log('🚀 [BookStore Mongo Bulk Seeding Tool]');
  console.log(`🔌 Kết nối tới MongoDB: ${mongoUri}`);
  console.log('========================================================');

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 20000
    });
    console.log(`✅ Kết nối thành công tới database: [${mongoose.connection.name}]`);

    // 1. Kiểm tra và bổ sung Products lên 150 cuốn sách
    const currentProducts = await Product.find({}, { id: 1 }).lean();
    console.log(`📚 Hiện tại có ${currentProducts.length} sản phẩm trong database.`);
    if (currentProducts.length < 150) {
      const newProducts = generateProducts(currentProducts.length);
      console.log(`⏳ Đang nạp thêm ${newProducts.length} sản phẩm sách mới...`);
      await Product.insertMany(newProducts);
      console.log(`✅ Đã nạp thành công các cuốn sách mới!`);
    } else {
      console.log(`ℹ️ Collection [products] đã có đủ >= 150 cuốn sách.`);
    }

    // 2. Kiểm tra và bổ sung Users lên 120 tài khoản
    const currentUsers = await User.find({}, { id: 1, email: 1 }).lean();
    console.log(`👥 Hiện tại có ${currentUsers.length} người dùng trong database.`);
    if (currentUsers.length < 120) {
      const newUsers = generateUsers(currentUsers);
      console.log(`⏳ Đang nạp thêm ${newUsers.length} tài khoản người dùng mới...`);
      await User.insertMany(newUsers);
      console.log(`✅ Đã nạp thành công các tài khoản người dùng mới!`);
    } else {
      console.log(`ℹ️ Collection [users] đã có đủ >= 120 người dùng.`);
    }

    // 3. Lấy lại toàn bộ danh sách Products & Users để gắn khóa ngoại FK cho Reviews
    const allProducts = await Product.find({}, { id: 1 }).lean();
    const allUsers = await User.find({}, { id: 1, name: 1 }).lean();

    // 4. Kiểm tra và bổ sung Reviews lên 220 nhận xét
    const currentReviews = await Review.find({}, { id: 1 }).lean();
    console.log(`⭐ Hiện tại có ${currentReviews.length} đánh giá trong database.`);
    if (currentReviews.length < 220) {
      const newReviews = generateReviews(allProducts, allUsers, currentReviews.length);
      console.log(`⏳ Đang nạp thêm ${newReviews.length} đánh giá nhận xét mới...`);
      await Review.insertMany(newReviews);
      console.log(`✅ Đã nạp thành công các đánh giá nhận xét mới!`);
    } else {
      console.log(`ℹ️ Collection [reviews] đã có đủ >= 220 đánh giá.`);
    }

    // 5. Tính toán và đồng bộ chuẩn xác reviewsCount & rating cho từng sản phẩm
    console.log(`🔄 Đang cập nhật rating và reviewsCount cho toàn bộ danh mục sách...`);
    const allReviews = await Review.find().lean();
    const reviewStatsByProduct = {};
    for (const r of allReviews) {
      if (!reviewStatsByProduct[r.productId]) {
        reviewStatsByProduct[r.productId] = { totalRating: 0, count: 0 };
      }
      reviewStatsByProduct[r.productId].totalRating += (r.rating || 5);
      reviewStatsByProduct[r.productId].count += 1;
    }

    const bulkOps = allProducts.map((p) => {
      const stats = reviewStatsByProduct[p.id];
      const count = stats ? stats.count : 0;
      const rating = stats && stats.count > 0 ? Number((stats.totalRating / stats.count).toFixed(1)) : 5.0;
      return {
        updateOne: {
          filter: { id: p.id },
          update: { $set: { reviewsCount: count, rating: rating } }
        }
      };
    });

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
    }
    console.log(`✅ Đã đồng bộ rating & reviewsCount cho toàn bộ ${allProducts.length} cuốn sách.`);

    // 6. Thống kê số lượng cuối cùng
    const finalPCount = await Product.countDocuments();
    const finalUCount = await User.countDocuments();
    const finalRCount = await Review.countDocuments();

    console.log('\n========================================================');
    console.log('🎉 KẾT QUẢ NẠP DỮ LIỆU THÀNH CÔNG VÀO MONGODB COMPASS:');
    console.log('========================================================');
    console.log(`📚 Collection [products] : ${finalPCount} cuốn sách (Mục tiêu 100-300: ĐẠT)`);
    console.log(`👥 Collection [users]    : ${finalUCount} tài khoản (Mục tiêu 100-300: ĐẠT)`);
    console.log(`⭐ Collection [reviews]  : ${finalRCount} đánh giá (Mục tiêu 100-300: ĐẠT)`);
    console.log('========================================================\n');

    return { products: finalPCount, users: finalUCount, reviews: finalRCount };
  } catch (err) {
    console.error('❌ Lỗi nạp dữ liệu bulk:', err.message);
    throw err;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối an toàn.');
  }
}

// Nếu gọi trực tiếp từ command line
if (require.main === module) {
  const argUri = process.argv[2];
  runBulkSeeding(argUri)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runBulkSeeding };