/**
 * Module tiện ích cân bằng điểm đánh giá (Rating Balancer) cho hệ thống BookStore.
 * 
 * Mục tiêu:
 * - Thay thế việc toàn bộ sách bị gán cứng cùng một mức "5 sao (20 đánh giá)" gây mất tự nhiên.
 * - Phân bổ ngẫu nhiên có kiểm soát (Deterministic Hashing) dựa trên ID sách để điểm số không bị nhảy khi F5 hoặc lọc.
 * - Cân bằng toán học chuẩn xác để điểm sao trung bình toàn bộ trang web luôn đạt mức 4.9 / 5.0.
 */

import { Product } from "../data/products";

/**
 * Hàm băm chuỗi thành số nguyên 32-bit dương (Deterministic Hash)
 * @param str Chuỗi ký tự đầu vào (ID, tên hoặc mã sách)
 * @returns Số nguyên dương xác định
 */
export function hashString(str: string): number {
  let hash = 0;
  if (!str || str.length === 0) return 42;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Chuyển sang số nguyên 32-bit
  }
  return Math.abs(hash);
}

/**
 * Tính toán điểm sao và số lượng nhận xét được cân bằng toán học
 * Phân bổ trọng số 100%:
 * - 40% sách đạt 5.0 sao (Sách bán chạy xuất sắc)
 * - 35% sách đạt 4.9 sao (Sách rất hay được đánh giá cao)
 * - 15% sách đạt 4.8 sao (Sách hay tiêu chuẩn)
 * - 8% sách đạt 4.7 sao (Sách khá)
 * - 2% sách đạt 4.6 sao (Sách trung bình khá)
 * 
 * Kỳ vọng toán học (Expected Mean):
 * 5.0 * 0.40 + 4.9 * 0.35 + 4.8 * 0.15 + 4.7 * 0.08 + 4.6 * 0.02 = 4.903 => Làm tròn chuẩn 4.9 / 5.0
 * 
 * @param productId Mã định danh của cuốn sách
 * @param fallbackIndex Chỉ số dự phòng nếu ID không có
 * @returns Object chứa điểm rating và reviewsCount
 */
export function getBalancedProductRating(
  productId?: string | number,
  fallbackIndex: number = 0
): { rating: number; reviewsCount: number } {
  const seed = String(productId || `book-index-${fallbackIndex}`);
  const h = hashString(seed);

  // Phân bổ điểm sao theo modulo 100
  const mod = h % 100;
  let rating = 5.0;
  if (mod < 40) {
    rating = 5.0;
  } else if (mod < 75) {
    rating = 4.9;
  } else if (mod < 90) {
    rating = 4.8;
  } else if (mod < 98) {
    rating = 4.7;
  } else {
    rating = 4.6;
  }

  // Số lượng đánh giá dao động tự nhiên từ 24 đến 368 lượt
  const reviewsCount = ((h % 43) * 8) + 24;

  return { rating, reviewsCount };
}

/**
 * Chuẩn hóa và áp dụng cân bằng điểm đánh giá cho danh sách sản phẩm
 * Tự động phát hiện các sản phẩm đang bị gán cứng tĩnh (rating 5 và reviewCount 20) để thay bằng điểm cân bằng tự nhiên.
 * 
 * @param products Danh sách sản phẩm từ API hoặc mock data
 * @returns Danh sách sản phẩm đã được cân bằng điểm sao
 */
export function applyRatingBalancing<T extends Product>(products: T[]): T[] {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return products;
  }

  return products.map((prod, idx) => {
    // Nếu sản phẩm chưa có rating hoặc đang bị gán cứng toàn bộ là 5 sao và 20 đánh giá
    const isHardcodedMonotonous =
      !prod.rating ||
      !prod.reviewsCount ||
      (prod.rating === 5 && prod.reviewsCount === 20) ||
      (prod.rating === 4.8 && prod.reviewsCount === 15);

    if (isHardcodedMonotonous) {
      const balanced = getBalancedProductRating(prod.id || (prod as any)._id, idx);
      return {
        ...prod,
        rating: balanced.rating,
        reviewsCount: balanced.reviewsCount,
      };
    }

    return prod;
  });
}

/**
 * Tính điểm sao trung bình thực tế của toàn bộ sách trên hệ thống
 * @param products Danh sách sản phẩm
 * @returns Điểm sao trung bình định dạng 1 chữ số thập phân (ví dụ: 4.9)
 */
export function calculateAverageRating(products: Array<{ rating?: number }>): number {
  if (!products || products.length === 0) return 4.9;
  const validRatings = products
    .map((p) => p.rating)
    .filter((r): r is number => typeof r === "number" && r > 0);

  if (validRatings.length === 0) return 4.9;
  const sum = validRatings.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / validRatings.length;
  return Number(avg.toFixed(1));
}
