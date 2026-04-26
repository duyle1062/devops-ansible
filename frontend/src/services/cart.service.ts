import { Cart, AddToCartData, UpdateCartItemData } from "../types/cart.types";
import {
  getProducts,
  makeAppError,
  OFFLINE_KEYS,
  readJSON,
  writeJSON,
} from "./offlineDb";

/**
 * Cart Service - Handles all cart-related API operations
 * Following enterprise best practices with proper error handling and type safety
 */
class CartService {
  private getCartInternal(): Cart {
    const fallback: Cart = {
      id: 1,
      items: [],
      total_items: 0,
      total_price: 0,
      updated_at: new Date().toISOString(),
    };
    return readJSON<Cart>(OFFLINE_KEYS.CART, fallback);
  }

  private saveCart(cart: Cart): void {
    writeJSON<Cart>(OFFLINE_KEYS.CART, {
      ...cart,
      updated_at: new Date().toISOString(),
    });
  }

  private recalc(cart: Cart): Cart {
    const total_items = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    const total_price = cart.items.reduce(
      (sum, i) => sum + i.total_item_price,
      0,
    );
    return {
      ...cart,
      total_items,
      total_price,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Get current user's cart
   * GET /api/cart/
   */
  async getCart(): Promise<Cart> {
    const cart = this.getCartInternal();
    return this.recalc(cart);
  }

  /**
   * Add item to cart
   * POST /api/cart/items/
   * @param data - Product ID and quantity
   */
  async addToCart(data: AddToCartData): Promise<Cart> {
    const products = getProducts();
    const product = products.find((p) => p.id === data.product_id);
    if (!product) {
      throw makeAppError("Product not found", {
        detail: "Product not found",
        statusCode: 404,
      });
    }

    const cart = this.getCartInternal();
    const existing = cart.items.find((i) => i.product.id === product.id);
    const unitPrice = Number(product.price);
    const imageUrl =
      product.images?.find((img) => img.is_primary)?.image_url ||
      product.images?.[0]?.image_url ||
      "";

    if (existing) {
      existing.quantity += data.quantity;
      existing.total_item_price = existing.quantity * unitPrice;
    } else {
      const nextId = cart.items.reduce((m, i) => Math.max(m, i.id), 0) + 1;
      cart.items.push({
        id: nextId,
        product: {
          id: product.id,
          name: product.name,
          price: unitPrice,
          image_url: imageUrl,
        },
        quantity: data.quantity,
        total_item_price: data.quantity * unitPrice,
      });
    }

    const updated = this.recalc(cart);
    this.saveCart(updated);
    return updated;
  }

  /**
   * Update cart item quantity
   * PATCH /api/cart/items/{id}/
   * @param itemId - Cart item ID
   * @param data - New quantity
   */
  async updateCartItem(
    itemId: number,
    data: UpdateCartItemData,
  ): Promise<Cart> {
    if (data.quantity < 1) {
      throw new Error("Quantity cannot be less than 1");
    }

    const cart = this.getCartInternal();
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw makeAppError("Cart item not found", {
        detail: "Cart item not found",
        statusCode: 404,
      });
    }

    const products = getProducts();
    const product = products.find((p) => p.id === item.product.id);
    const unitPrice = product
      ? Number(product.price)
      : Number(item.product.price);

    item.quantity = data.quantity;
    item.total_item_price = unitPrice * data.quantity;

    const updated = this.recalc(cart);
    this.saveCart(updated);
    return updated;
  }

  /**
   * Delete item from cart
   * DELETE /api/cart/items/{id}/
   * @param itemId - Cart item ID
   */
  async deleteCartItem(itemId: number): Promise<void> {
    const cart = this.getCartInternal();
    const before = cart.items.length;
    cart.items = cart.items.filter((i) => i.id !== itemId);
    if (cart.items.length === before) {
      throw makeAppError("Cart item not found", {
        detail: "Cart item not found",
        statusCode: 404,
      });
    }
    const updated = this.recalc(cart);
    this.saveCart(updated);
  }

  /**
   * Helper method to increase quantity of cart item
   */
  async increaseQuantity(
    itemId: number,
    currentQuantity: number,
  ): Promise<Cart> {
    return this.updateCartItem(itemId, { quantity: currentQuantity + 1 });
  }

  /**
   * Helper method to decrease quantity of cart item
   */
  async decreaseQuantity(
    itemId: number,
    currentQuantity: number,
  ): Promise<Cart> {
    if (currentQuantity <= 1) {
      throw new Error("Quantity cannot be less than 1");
    }
    return this.updateCartItem(itemId, { quantity: currentQuantity - 1 });
  }
}

const cartService = new CartService();
export default cartService;
