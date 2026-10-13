export interface ReviewItem {
  id: string;
  productId?: string;
  userId?: string;
  author: string;
  rating: number;
  date: string;
  content: string;
  verified: boolean;
  likes: number;
}

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
  reviews?: ReviewItem[];
}

export const CATEGORIES = [
  "Tất cả",
  "Điện thoại",
  "Laptop & PC",
  "Phụ kiện",
  "Âm thanh",
  "Smart Home"
];
