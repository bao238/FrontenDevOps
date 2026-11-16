/**
 * Module tiện ích quản lý và đồng bộ điểm đánh giá (Rating Balancer) cho hệ sinh thái BookStore.
 * 
 * Nguyên tắc cốt lõi:
 * - Dữ liệu đánh giá phải hoàn toàn trung thực, nhất quán 100% giữa thẻ sách ngoài trang chủ,
 *   thanh tóm tắt đầu trang chi tiết và tab nhận xét thực tế từ độc giả.
 * - Lọc bỏ triệt để các số ảo mặc định (như 5 sao với 20 lượt đánh giá, 5 sao với 2 lượt đánh giá)
 *   vốn sinh ra từ các script nạp dữ liệu mẫu ban đầu trong MongoDB.
 * - Sách chưa có nhận xét thực tế: Hiển thị rõ ràng "Chưa có đánh giá" (rating = 0, reviewsCount = 0).
 * - Sách có nhận xét: Điểm sao tính theo trung bình cộng thực tế của các bài nhận xét.
 */

import { Product } from "../data/products";

/**
 * Tính toán điểm sao và số lượng đánh giá thực tế của một cuốn sách
 * Lọc bỏ toàn bộ các giá trị gán cứng tĩnh không có review tương ứng.
 * 
 * @param product Đối tượng sách cần xác định đánh giá
 * @returns Object chứa điểm rating chuẩn xác và số lượng nhận xét reviewsCount
 */
export function getProductRatingInfo(product?: Partial<Product>): { rating: number; reviewsCount: number } {
  if (!product) {
    return { rating: 0, reviewsCount: 0 };
  }

  // Trường hợp 1: Sách có mảng bài nhận xét thực tế (reviews array)
  if (product.reviews && Array.isArray(product.reviews) && product.reviews.length > 0) {
    const total = product.reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    const avg = Number((total / product.reviews.length).toFixed(1));
    return {
      rating: avg,
      reviewsCount: product.reviews.length,
    };
  }

  // Phát hiện và loại bỏ các số ảo gán cứng mặc định trong dữ liệu mẫu MongoDB
  // Các sách chưa có review thường bị gán cứng: 5 sao (20 đánh giá), 5 sao (2 đánh giá), hoặc 4.8 sao (15 đánh giá)
  const isDummyHardcoded =
    (product.rating === 5 && (product.reviewsCount === 20 || product.reviewsCount === 2)) ||
    (product.rating === 4.8 && product.reviewsCount === 15) ||
    (!product.reviewsCount || product.reviewsCount <= 0) ||
    (!product.rating || product.rating <= 0);

  if (isDummyHardcoded) {
    return { rating: 0, reviewsCount: 0 };
  }

  // Trường hợp 2: Sách có điểm rating và reviewsCount dương hợp lệ
  if (
    typeof product.reviewsCount === "number" &&
    product.reviewsCount > 0 &&
    typeof product.rating === "number" &&
    product.rating > 0
  ) {
    return {
      rating: Number(product.rating.toFixed(1)),
      reviewsCount: Math.round(product.reviewsCount),
    };
  }

  // Mặc định: Chưa có đánh giá nào
  return { rating: 0, reviewsCount: 0 };
}

/**
 * Chuẩn hóa danh sách sản phẩm để điểm số và số lượng đánh giá luôn đồng bộ thực tế
 * Tự động loại bỏ số ảo 5 sao / 20 đánh giá của các sách chưa có nhận xét.
 * 
 * @param products Danh sách sản phẩm từ API hoặc mock data
 * @returns Danh sách sản phẩm với rating và reviewsCount đồng bộ thực tế
 */
export function applyRatingBalancing<T extends Product>(products: T[]): T[] {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return products;
  }

  return products.map((prod) => {
    const ratingInfo = getProductRatingInfo(prod);
    return {
      ...prod,
      rating: ratingInfo.rating,
      reviewsCount: ratingInfo.reviewsCount,
    };
  });
}

/**
 * Tính điểm sao trung bình thực tế của toàn bộ sách có đánh giá trên hệ thống
 * @param products Danh sách sản phẩm
 * @returns Điểm sao trung bình định dạng 1 chữ số thập phân (hoặc 5.0 nếu chưa có sách nào được đánh giá)
 */
export function calculateAverageRating(products: Array<{ rating?: number; reviewsCount?: number }>): number {
  if (!products || products.length === 0) return 5.0;

  // Chỉ lấy các sản phẩm đã có đánh giá thực tế (rating > 0 và reviewsCount > 0 và không phải số ảo)
  const ratedProducts = products.filter((p) => {
    const info = getProductRatingInfo(p as Product);
    return info.rating > 0 && info.reviewsCount > 0;
  });

  if (ratedProducts.length === 0) return 5.0;

  const sum = ratedProducts.reduce((acc, curr) => acc + (curr.rating || 0), 0);
  const avg = sum / ratedProducts.length;
  return Number(avg.toFixed(1));
}
