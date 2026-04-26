import {
  Rating,
  RatingListResponse,
  CreateRatingData,
} from "../types/product.types";
import authService from "./auth.service";
import { addRating, getRatingsByProduct, makeAppError } from "./offlineDb";

/**
 * Rating Service - Handles all rating-related API operations
 */
class RatingService {
  /**
   * Get ratings for a product with pagination
   * GET /api/products/{productId}/ratings/
   * @param productId - Product ID
   * @param page - Page number (default: 1)
   * @param pageSize - Number of items per page (default: 10)
   * @param signal - AbortSignal to cancel request
   */
  async getRatings(
    productId: number,
    page: number = 1,
    pageSize: number = 10,
    signal?: AbortSignal,
  ): Promise<RatingListResponse> {
    if (signal?.aborted) {
      throw makeAppError("Request aborted", { name: "AbortError" });
    }

    const map = getRatingsByProduct();
    const all = map[productId] || [];
    const safePage = Math.max(1, page);
    const safeSize = Math.max(1, pageSize);
    const start = (safePage - 1) * safeSize;
    const end = start + safeSize;
    const results = all.slice(start, end);

    return {
      count: all.length,
      next: end < all.length ? String(safePage + 1) : null,
      previous: safePage > 1 ? String(safePage - 1) : null,
      results,
    };
  }

  /**
   * Create a new rating for a product
   * POST /api/products/{productId}/ratings/
   * Requires authentication
   * @param productId - Product ID
   * @param data - Rating data (rating: 1-5, comment)
   */
  async createRating(
    productId: number,
    data: CreateRatingData,
  ): Promise<Rating> {
    if (data.rating < 1 || data.rating > 5) {
      throw makeAppError("Rating must be between 1 and 5", {
        detail: "Rating must be between 1 and 5",
      });
    }

    const map = getRatingsByProduct();
    const current = map[productId] || [];
    const maxId = current.reduce((m, r) => Math.max(m, r.id), 0);
    const user = authService.getUser();

    const rating: Rating = {
      id: maxId + 1,
      user: {
        id: user?.id || 0,
        first_name: user?.firstname || "Guest",
        last_name: user?.lastname || "User",
      },
      rating: data.rating,
      comment: data.comment,
      created_at: new Date().toISOString(),
    };

    addRating(productId, rating);
    return rating;
  }

  /**
   * Check if user has purchased the product
   * This is inferred from the create rating response
   * If the user hasn't purchased, the backend will return an error
   */
  async canUserRate(productId: number): Promise<boolean> {
    // Offline mode: no purchase validation
    void productId;
    return true;
  }
}

const ratingService = new RatingService();
export default ratingService;
