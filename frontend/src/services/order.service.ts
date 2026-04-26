import {
  PlaceOrderRequest,
  PlaceOrderResponse,
  Order,
  OrderListResponse,
} from "../types/order.types";
import authService from "./auth.service";
import { Cart } from "../types/cart.types";
import { Address } from "./address.service";
import { OFFLINE_KEYS, makeAppError, readJSON, writeJSON } from "./offlineDb";

/**
 * Place a new order from user's cart
 * POST /api/orders/place/
 */
export const placeOrder = async (
  orderData: PlaceOrderRequest,
): Promise<PlaceOrderResponse> => {
  const user = authService.getUser();
  const user_email = user?.email || "guest@offline";

  const cartFallback: Cart = {
    id: 1,
    items: [],
    total_items: 0,
    total_price: 0,
    updated_at: new Date().toISOString(),
  };
  const cart = readJSON<Cart>(OFFLINE_KEYS.CART, cartFallback);
  if (!cart.items.length) {
    throw makeAppError("Your cart is empty", { detail: "Your cart is empty" });
  }

  const addresses = readJSON<Address[]>(OFFLINE_KEYS.ADDRESSES, []);
  const address = addresses.find((a) => a.id === orderData.address_id) || null;

  const orders = readJSON<Order[]>(OFFLINE_KEYS.ORDERS, []);
  const nextId = orders.reduce((m, o) => Math.max(m, o.id), 0) + 1;
  const now = new Date().toISOString();
  const deliveryFee = orderData.delivery_fee ?? 0;
  const discount = orderData.discount ?? 0;
  const subtotal = cart.total_price;
  const total = subtotal + deliveryFee - discount;

  const items = cart.items.map((ci, idx) => {
    const unit =
      typeof ci.product.price === "string"
        ? Number(ci.product.price)
        : ci.product.price;
    return {
      id: idx + 1,
      product: {
        id: ci.product.id,
        name: ci.product.name,
        price: unit,
        image_url: ci.product.image_url,
      },
      product_name: ci.product.name,
      unit_price: unit,
      quantity: ci.quantity,
      line_total: unit * ci.quantity,
      created_at: now,
    };
  });

  const order: Order = {
    id: nextId,
    user_email,
    restaurant_id: 1,
    address: address as any,
    type: orderData.type || "DELIVERY",
    subtotal: String(subtotal),
    delivery_fee: String(deliveryFee),
    discount: String(discount),
    total: String(total),
    status: "PENDING",
    payment_method: orderData.payment_method,
    payment_status: orderData.payment_method === "CASH" ? "PENDING" : "UNPAID",
    items,
    group_order_id: null,
    is_group_order: false,
    created_at: now,
    updated_at: now,
  };

  orders.unshift(order);
  writeJSON<Order[]>(OFFLINE_KEYS.ORDERS, orders);
  writeJSON<Cart>(OFFLINE_KEYS.CART, { ...cartFallback, updated_at: now });

  return {
    message: "Order placed (offline)",
    order,
    payment:
      orderData.payment_method === "CARD" ||
      orderData.payment_method === "WALLET"
        ? {
            id: 1,
            status: "PENDING",
            payment_url: "/payment/result?status=pending",
          }
        : undefined,
  };
};

/**
 * Get user's order history
 * GET /api/orders/
 * @param page - Page number (default: 1)
 * @param pageSize - Number of items per page (default: 10)
 * @param status - Optional filter by order status (e.g., "PENDING", "COMPLETED")
 */
export const getUserOrders = async (
  page: number = 1,
  pageSize: number = 10,
  status?: string,
): Promise<OrderListResponse> => {
  const user = authService.getUser();
  const user_email = user?.email || "guest@offline";
  const all = readJSON<Order[]>(OFFLINE_KEYS.ORDERS, []).filter(
    (o) => o.user_email === user_email,
  );

  const filtered =
    status && status !== "ALL" ? all.filter((o) => o.status === status) : all;
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safeSize;
  const end = start + safeSize;
  const results = filtered.slice(start, end);

  return {
    count: filtered.length,
    next: end < filtered.length ? String(safePage + 1) : null,
    previous: safePage > 1 ? String(safePage - 1) : null,
    results,
  };
};

/**
 * Get order details by ID
 * GET /api/orders/{id}/
 */
export const getOrderById = async (orderId: number): Promise<Order> => {
  const orders = readJSON<Order[]>(OFFLINE_KEYS.ORDERS, []);
  const order = orders.find((o) => o.id === orderId);
  if (!order) {
    throw makeAppError("Order not found", {
      detail: "Order not found",
      statusCode: 404,
    });
  }
  return order;
};

/**
 * Cancel an order
 * POST /api/orders/{id}/cancel/
 */
export const cancelOrder = async (
  orderId: number,
): Promise<{ message: string; order: Order }> => {
  const orders = readJSON<Order[]>(OFFLINE_KEYS.ORDERS, []);
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx < 0) {
    throw makeAppError("Order not found", {
      detail: "Order not found",
      statusCode: 404,
    });
  }
  const updated: Order = {
    ...orders[idx],
    status: "CANCELLED",
    updated_at: new Date().toISOString(),
  };
  orders[idx] = updated;
  writeJSON<Order[]>(OFFLINE_KEYS.ORDERS, orders);
  return { message: "Order cancelled (offline)", order: updated };
};
