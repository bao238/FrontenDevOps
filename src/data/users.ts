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
