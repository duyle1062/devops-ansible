import { Product, ProductDetailResponse } from "../types/product.types";
import { getProducts, getRatingsByProduct, makeAppError } from "./offlineDb";
import { getProductDisplayImage } from "../utils/dishImage.util";

/**
 * Product Service - Handles all product-related API operations
 */
class ProductService {
  /**
   * Get products by category
   * GET /api/category/{slug}/products/
   * @param categorySlug - Category slug name
   * @param signal - AbortSignal to cancel request
   */
  async getProductsByCategory(
    categorySlug: string,
    signal?: AbortSignal,
  ): Promise<Product[]> {
    if (signal?.aborted) {
      throw makeAppError("Request aborted", { name: "AbortError" });
    }

    const products = getProducts().filter(
      (p) =>
        p.category.slug_name === categorySlug && p.is_active && p.available,
    );
    return products;
  }

  /**
   * Get product detail by category slug and product slug
   * GET /api/category/{categorySlug}/products/{productSlug}/
   * @param categorySlug - Category slug name
   * @param productSlug - Product slug name
   * @param signal - AbortSignal to cancel request
   */
  async getProductDetail(
    categorySlug: string,
    productSlug: string,
    signal?: AbortSignal,
  ): Promise<ProductDetailResponse> {
    if (signal?.aborted) {
      throw makeAppError("Request aborted", { name: "AbortError" });
    }

    const products = getProducts();
    const found = products.find(
      (p) => p.category.slug_name === categorySlug && p.slug === productSlug,
    );

    if (!found) {
      const detail = "Product not found";
      throw makeAppError(detail, {
        detail,
        response: { status: 404, data: { detail } },
        statusCode: 404,
      });
    }

    const ratingsMap = getRatingsByProduct();
    const ratings = ratingsMap[found.id] || [];

    return {
      ...found,
      ratings: {
        count: ratings.length,
        next: null,
        previous: null,
        results: ratings,
      },
    };
  }

  /**
   * Helper method to get primary image or first image
   * @param product - Product object with images array
   * @returns Image URL or placeholder
   */
  getPrimaryImage(product: Product): string {
    return getProductDisplayImage(product);
  }

  /**
   * Format price to Vietnamese currency
   * @param price - Price string from API
   */
  formatPrice(price: string): string {
    const numPrice = parseFloat(price);
    return `${numPrice.toLocaleString("vi-VN")}₫`;
  }

  // Admin endpoints removed (static/offline-only build)

  /**
   * Search products by name
   * GET /api/products/search/
   * @param query - Search query string
   * @param params - Additional filter parameters
   */
  async searchProducts(
    query: string,
    params?: {
      is_active?: boolean;
      category?: number;
    },
  ): Promise<Product[]> {
    const q = query.trim().toLowerCase();
    const products = getProducts();
    const filtered = products.filter((p) => {
      if (params?.is_active !== undefined && p.is_active !== params.is_active) {
        return false;
      }
      if (params?.category !== undefined && p.category.id !== params.category) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });

    return filtered;
  }
}

const productService = new ProductService();
export default productService;
