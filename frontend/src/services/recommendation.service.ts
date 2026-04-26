import { Product } from "../types/product.types";
import { getProducts } from "./offlineDb";
import { getProductDisplayImage } from "../utils/dishImage.util";

interface PopularProductsParams {
  limit?: number;
}

interface SimilarProductsParams {
  limit?: number;
}

class RecommendationService {
  /**
   * Get personalized recommendations for authenticated user
   * GET /api/recommendations/?limit=10
   * Requires authentication
   * @param limit - Number of recommendations to fetch (default: 10)
   */
  async getRecommendations(limit: number = 10): Promise<Product[]> {
    const products = getProducts();
    return products.slice(0, limit);
  }

  /**
   * Get popular products (for non-authenticated users or fallback)
   * GET /api/products/popular/?limit=8
   * Public endpoint
   * @param limit - Number of popular products to fetch (default: 8)
   */
  async getPopularProducts(params?: PopularProductsParams): Promise<Product[]> {
    const limit = params?.limit || 8;
    const products = getProducts();
    return products.slice(0, limit);
  }

  /**
   * Get best selling products based on order data
   * GET /api/products/best-sellers/?limit=8
   * Public endpoint
   * @param params - Optional parameters (limit, days)
   */
  async getBestSellers(params?: {
    limit?: number;
    days?: number;
  }): Promise<Product[]> {
    const limit = params?.limit || 8;
    const products = getProducts();
    // offline demo: just return last N
    return products.slice(-limit);
  }

  /**
   * Get similar products based on a specific product
   * GET /api/recommendations/similar/{product_id}/?limit=6
   * Public endpoint
   * @param productId - ID of the product to find similar items for
   * @param params - Optional parameters (limit)
   */
  async getSimilarProducts(
    productId: number,
    params?: SimilarProductsParams,
  ): Promise<Product[]> {
    const limit = params?.limit || 6;
    const products = getProducts();
    const base = products.find((p) => p.id === productId);
    if (!base) return products.slice(0, limit);
    const sameCategory = products.filter(
      (p) =>
        p.id !== productId && p.category.slug_name === base.category.slug_name,
    );
    return sameCategory.slice(0, limit);
  }

  /**
   * Track user interaction with a product (click, view)
   * POST /api/recommendations/track_interaction/
   * Requires authentication
   * @param productId - ID of the product being interacted with
   */
  async trackInteraction(productId: number): Promise<void> {
    // Offline: no-op
    void productId;
  }

  /**
   * Helper method to get primary image or first image
   * @param product - Product object with images array
   */
  getPrimaryImage(product: Product): string {
    return getProductDisplayImage(product);
  }

  /**
   * Format price to Vietnamese currency
   * @param price - Price string from API
   */
  formatPrice(price: string | number): string {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return `${numPrice.toLocaleString("vi-VN")}₫`;
  }
}

const recommendationService = new RecommendationService();
export default recommendationService;
