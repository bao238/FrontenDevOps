/**
 * Module tiện ích quản lý và đồng bộ điểm đánh giá (Rating Balancer) cho hệ sinh thái BookStore.
 * 
 * Nguyên tắc:
 * - Dữ liệu đánh giá phải hoàn toàn trung thực, nhất quán 100% giữa thẻ sách ngoài trang chủ,
 *   thanh tóm tắt đầu trang chi tiết và tab nhận xét thực tế từ độc giả.
 * - Tuyệt đối KHÔNG tự động băm sinh số ảo (như 4.9 sao và 312 đánh giá) khi sản phẩm chưa có bài đánh giá.
 * - Sách chưa có nhận xét: Hiển thị rõ ràng "Chưa có đánh giá" (rating = 0, reviewsCount = 0).
 * - Sách có nhận xét: Điểm sao tính theo trung bình cộng thực tế của các bài nhận xét.
 */

import { Product } from "../data/products";

/**
 * Tính toán điểm sao và số lượng đánh giá thực tế của một cuốn sách
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

  // Trường hợp 2: Sách đã có điểm rating và reviewsCount dương từ cơ sở dữ liệu
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

  // Trường hợp 3: Sách chưa có bài đánh giá nào => rating = 0, reviewsCount = 0
  return { rating: 0, reviewsCount: 0 };
}

/**
 * Chuẩn hóa danh sách sản phẩm để điểm số và số lượng đánh giá luôn đồng bộ
 * Không tự động sinh điểm số ảo cho các sản phẩm chưa có nhận xét.
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

  // Chỉ lấy các sản phẩm đã có đánh giá thực tế (rating > 0 và reviewsCount > 0)
  const ratedProducts = products.filter(
    (p) => typeof p.rating === "number" && p.rating > 0 && typeof p.reviewsCount === "number" && p.reviewsCount > 0
  );

  if (ratedProducts.length === 0) return 5.0;

  const sum = ratedProducts.reduce((acc, curr) => acc + (curr.rating || 0), 0);
  const avg = sum / ratedProducts.length;
  return Number(avg.toFixed(1));
}
