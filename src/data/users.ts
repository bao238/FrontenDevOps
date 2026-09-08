export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "staff" | "customer";
  status: "active" | "locked";
  password?: string;
  avatarUrl?: string;
  address?: string;
  createdAt: string;
}

export const DEFAULT_AVATAR = "/default-avatar.png";

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: "usr-admin-1",
    name: "Quản Trị Viên (Đình Bảo)",
    email: "admin@dinhbao.vn",
    phone: "0905 888 999",
    role: "admin",
    status: "active",
    password: "admin123",
    avatarUrl: DEFAULT_AVATAR,
    address: "Tòa nhà DinhBao Center, Hải Châu, Đà Nẵng",
    createdAt: "01/01/2024",
  },
  {
    id: "usr-admin-2",
    name: "Bảo Admin",
    email: "bao@gmail.com",
    phone: "0905 123 456",
    role: "admin",
    status: "active",
    password: "admin123",
    avatarUrl: DEFAULT_AVATAR,
    address: "Đà Nẵng",
    createdAt: "15/01/2024",
  },
  {
    id: "usr-staff-1",
    name: "Trần Thị Mai (Kinh Doanh)",
    email: "staff@dinhbao.vn",
    phone: "0912 345 678",
    role: "staff",
    status: "active",
    password: "staff123",
    avatarUrl: DEFAULT_AVATAR,
    address: "Quận Cẩm Lệ, Đà Nẵng",
    createdAt: "10/02/2024",
  },
  {
    id: "usr-cust-1",
    name: "Nguyễn Văn An",
    email: "demo@dinhbao.vn",
    phone: "0988 776 655",
    role: "customer",
    status: "active",
    password: "demo123",
    avatarUrl: DEFAULT_AVATAR,
    address: "123 Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng",
    createdAt: "05/03/2024",
  },
  {
    id: "usr-cust-2",
    name: "Lê Thị Hồng",
    email: "hong.le@gmail.com",
    phone: "0977 112 233",
    role: "customer",
    status: "active",
    password: "user123",
    avatarUrl: DEFAULT_AVATAR,
    address: "45 Lê Duẩn, Đà Nẵng",
    createdAt: "20/04/2024",
  },
  {
    id: "usr-cust-3",
    name: "Phạm Quốc Hưng (Demo Khóa)",
    email: "hung.pham@yahoo.com",
    phone: "0935 999 888",
    role: "customer",
    status: "locked",
    password: "user123",
    avatarUrl: DEFAULT_AVATAR,
    address: "Quận Ba Đình, Hà Nội",
    createdAt: "12/05/2024",
  },
];
