// Định nghĩa phân loại các loại thông báo trong hệ sinh thái BookStore
export type NotificationType = 'order' | 'coupon' | 'review' | 'system';

// Định nghĩa bộ lọc thông báo trên giao diện
export type NotificationFilter = 'all' | 'unread' | 'order' | 'coupon' | 'review' | 'system';

// Cấu trúc dữ liệu chi tiết của một thông báo
export interface NotificationItem {
  // Mã định danh duy nhất của thông báo
  id: string;
  // Mã người dùng sở hữu thông báo (null nếu là thông báo chung toàn sàn)
  userId?: string | null;
  // Tiêu đề tóm tắt của thông báo
  title: string;
  // Nội dung chi tiết của thông báo
  message: string;
  // Loại thông báo: order (đơn hàng), coupon (khuyến mãi), review (đánh giá), system (hệ thống)
  type: NotificationType;
  // Đường dẫn hoặc tab điều hướng khi người dùng nhấp vào
  link?: string | null;
  // Trạng thái đã xem/đã đọc (true: đã đọc, false: chưa đọc)
  isRead: boolean;
  // Dữ liệu mở rộng đính kèm (mã đơn hàng, mã giảm giá,...)
  metadata?: Record<string, any>;
  // Thời điểm tạo thông báo (chuỗi ISO)
  createdAt: string;
  // Thời điểm cập nhật trạng thái
  updatedAt?: string;
}

// Cấu trúc phản hồi từ API danh sách thông báo
export interface NotificationApiResponse {
  success: boolean;
  data: NotificationItem[];
  unreadCount: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
