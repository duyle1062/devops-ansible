import {
  GroupOrder,
  CreateGroupOrderResponse,
  JoinGroupOrderRequest,
  JoinGroupOrderResponse,
  AddGroupOrderItemRequest,
  UpdateGroupOrderItemRequest,
  PlaceGroupOrderRequest,
  PlaceGroupOrderResponse,
  GroupOrderMember,
  GroupOrderItem,
} from "../types/groupOrder.types";
import authService from "./auth.service";
import { getProducts, makeAppError, readJSON, writeJSON } from "./offlineDb";

/**
 * Create a new group order
 * POST /api/group-orders/
 */
const GROUP_ORDERS_KEY = "foodi_offline:groupOrders";

const getAllGroupOrders = (): GroupOrder[] =>
  readJSON<GroupOrder[]>(GROUP_ORDERS_KEY, []);

const saveAllGroupOrders = (orders: GroupOrder[]): void =>
  writeJSON<GroupOrder[]>(GROUP_ORDERS_KEY, orders);

const newCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const currentMember = (is_creator: boolean): GroupOrderMember => {
  const user = authService.getUser();
  const id = user?.id || 0;
  const email = user?.email || "guest@offline";
  const name =
    `${user?.firstname || "Guest"} ${user?.lastname || "User"}`.trim();
  return {
    id,
    user_email: email,
    user_name: name,
    is_creator,
    joined_at: new Date().toISOString(),
  };
};

const recalcGroup = (g: GroupOrder): GroupOrder => {
  const total_items = g.items
    .filter((i) => i.is_active)
    .reduce((sum, i) => sum + i.quantity, 0);
  return { ...g, total_items, updated_at: new Date().toISOString() };
};

export const createGroupOrder = async (): Promise<CreateGroupOrderResponse> => {
  const user = authService.getUser();
  if (!user) {
    throw makeAppError("Please login to create a group order", {
      detail: "Please login to create a group order",
      statusCode: 401,
    });
  }

  const now = new Date().toISOString();
  const all = getAllGroupOrders();
  const nextId = all.reduce((m, o) => Math.max(m, o.id), 0) + 1;
  const creator = currentMember(true);

  const group: GroupOrder = {
    id: nextId,
    creator_id: creator.id,
    creator_email: creator.user_email,
    restaurant_id: 1,
    code: newCode(),
    status: "PENDING",
    members: [creator],
    items: [],
    total_items: 0,
    created_at: now,
    updated_at: now,
  };

  all.unshift(group);
  saveAllGroupOrders(all);
  return group;
};

/**
 * Join an existing group order using code
 * POST /api/group-orders/join/
 */
export const joinGroupOrder = async (
  data: JoinGroupOrderRequest,
): Promise<JoinGroupOrderResponse> => {
  const code = data.code.trim().toUpperCase();
  const all = getAllGroupOrders();
  const idx = all.findIndex((g) => g.code === code);
  if (idx < 0) {
    throw makeAppError("Invalid code", {
      detail: "Invalid code",
      statusCode: 404,
    });
  }
  const g = all[idx];
  if (g.status !== "PENDING") {
    throw makeAppError("Group order is not active", {
      detail: "Group order is not active",
    });
  }
  const member = currentMember(false);
  if (!g.members.some((m) => m.user_email === member.user_email)) {
    g.members = [...g.members, member];
  }
  all[idx] = recalcGroup(g);
  saveAllGroupOrders(all);
  return { message: "Joined group (offline)", group_order: all[idx] };
};

/**
 * Get group order details
 * GET /api/group-orders/{id}/
 */
export const getGroupOrderDetail = async (
  groupOrderId: number,
): Promise<GroupOrder> => {
  const all = getAllGroupOrders();
  const g = all.find((x) => x.id === groupOrderId);
  if (!g) {
    throw makeAppError("Group order not found", {
      detail: "Group order not found",
      statusCode: 404,
    });
  }
  return g;
};

/**
 * Get all members in a group order
 * GET /api/group-orders/{id}/members/
 */
export const getGroupOrderMembers = async (
  groupOrderId: number,
): Promise<GroupOrderMember[]> => {
  const g = await getGroupOrderDetail(groupOrderId);
  return g.members;
};

/**
 * Get all items in a group order
 * GET /api/group-orders/{id}/items/
 */
export const getGroupOrderItems = async (
  groupOrderId: number,
): Promise<GroupOrderItem[]> => {
  const g = await getGroupOrderDetail(groupOrderId);
  return g.items;
};

/**
 * Add an item to group order
 * POST /api/group-orders/{id}/items/
 */
export const addGroupOrderItem = async (
  groupOrderId: number,
  data: AddGroupOrderItemRequest,
): Promise<GroupOrderItem> => {
  const products = getProducts();
  const product = products.find((p) => p.id === data.product_id);
  if (!product) {
    throw makeAppError("Product not found", {
      detail: "Product not found",
      statusCode: 404,
    });
  }

  const all = getAllGroupOrders();
  const idx = all.findIndex((g) => g.id === groupOrderId);
  if (idx < 0) {
    throw makeAppError("Group order not found", {
      detail: "Group order not found",
      statusCode: 404,
    });
  }

  const g = all[idx];
  const member = currentMember(false);
  if (!g.members.some((m) => m.user_email === member.user_email)) {
    g.members = [...g.members, member];
  }

  const now = new Date().toISOString();
  const nextItemId = g.items.reduce((m, i) => Math.max(m, i.id), 0) + 1;
  const unit = Number(product.price);
  const item: GroupOrderItem = {
    id: nextItemId,
    user_id: member.id,
    user_email: member.user_email,
    user_name: member.user_name,
    product_id: product.id,
    product_name: product.name,
    unit_price: unit,
    quantity: data.quantity,
    line_total: unit * data.quantity,
    is_active: true,
    created_at: now,
  };

  g.items = [item, ...g.items];
  all[idx] = recalcGroup(g);
  saveAllGroupOrders(all);
  return item;
};

/**
 * Update a group order item quantity
 * PATCH /api/group-orders/{id}/items/{itemId}/
 */
export const updateGroupOrderItem = async (
  groupOrderId: number,
  itemId: number,
  data: UpdateGroupOrderItemRequest,
): Promise<GroupOrderItem> => {
  const all = getAllGroupOrders();
  const idx = all.findIndex((g) => g.id === groupOrderId);
  if (idx < 0) {
    throw makeAppError("Group order not found", {
      detail: "Group order not found",
      statusCode: 404,
    });
  }
  const g = all[idx];
  const itemIdx = g.items.findIndex((i) => i.id === itemId && i.is_active);
  if (itemIdx < 0) {
    throw makeAppError("Item not found", {
      detail: "Item not found",
      statusCode: 404,
    });
  }
  if (data.quantity < 1) {
    throw makeAppError("Quantity must be at least 1", {
      detail: "Quantity must be at least 1",
    });
  }
  const current = g.items[itemIdx];
  g.items[itemIdx] = {
    ...current,
    quantity: data.quantity,
    line_total: current.unit_price * data.quantity,
  };
  all[idx] = recalcGroup(g);
  saveAllGroupOrders(all);
  return g.items[itemIdx];
};

/**
 * Remove a group order item
 * DELETE /api/group-orders/{id}/items/{itemId}/
 */
export const removeGroupOrderItem = async (
  groupOrderId: number,
  itemId: number,
): Promise<{ message: string }> => {
  const all = getAllGroupOrders();
  const idx = all.findIndex((g) => g.id === groupOrderId);
  if (idx < 0) {
    throw makeAppError("Group order not found", {
      detail: "Group order not found",
      statusCode: 404,
    });
  }
  const g = all[idx];
  const itemIdx = g.items.findIndex((i) => i.id === itemId && i.is_active);
  if (itemIdx < 0) {
    throw makeAppError("Item not found", {
      detail: "Item not found",
      statusCode: 404,
    });
  }
  g.items[itemIdx] = { ...g.items[itemIdx], is_active: false };
  all[idx] = recalcGroup(g);
  saveAllGroupOrders(all);
  return { message: "Item removed (offline)" };
};

/**
 * Place the group order (finalize and create payment)
 * POST /api/group-orders/{id}/place/
 */
export const placeGroupOrder = async (
  groupOrderId: number,
  data: PlaceGroupOrderRequest,
): Promise<PlaceGroupOrderResponse> => {
  const all = getAllGroupOrders();
  const idx = all.findIndex((g) => g.id === groupOrderId);
  if (idx < 0) {
    throw makeAppError("Group order not found", {
      detail: "Group order not found",
      statusCode: 404,
    });
  }
  const g = all[idx];
  const now = new Date().toISOString();

  const subtotal = g.items
    .filter((i) => i.is_active)
    .reduce((sum, i) => sum + i.line_total, 0);
  const deliveryFee = data.delivery_fee ?? 0;
  const discount = data.discount ?? 0;
  const total = subtotal + deliveryFee - discount;

  g.status = "PAID";
  all[idx] = recalcGroup(g);
  saveAllGroupOrders(all);

  return {
    message: "Group order placed (offline)",
    order: {
      id: Date.now(),
      user_email: g.creator_email,
      restaurant_id: g.restaurant_id,
      type: data.type || "DELIVERY",
      subtotal: String(subtotal),
      delivery_fee: String(deliveryFee),
      discount: String(discount),
      total: String(total),
      status: "PENDING",
      payment_method: data.payment_method,
      payment_status: data.payment_method === "CASH" ? "PENDING" : "UNPAID",
      created_at: now,
    },
    payment:
      data.payment_method === "CARD" || data.payment_method === "WALLET"
        ? {
            id: 1,
            status: "PENDING",
            payment_url: "/payment/result?status=pending",
          }
        : undefined,
  };
};

/**
 * Leave a group order
 * POST /api/group-orders/{id}/leave/
 * If creator: cancels entire group
 * If member: removes member and their items
 */
export const leaveGroupOrder = async (
  groupOrderId: number,
): Promise<{
  message: string;
  cancelled: boolean;
  deleted_items_count?: number;
}> => {
  const all = getAllGroupOrders();
  const idx = all.findIndex((g) => g.id === groupOrderId);
  if (idx < 0) {
    throw makeAppError("Group order not found", {
      detail: "Group order not found",
      statusCode: 404,
    });
  }
  const g = all[idx];
  const member = currentMember(false);
  const beforeItems = g.items.length;
  g.members = g.members.filter((m) => m.user_email !== member.user_email);
  g.items = g.items.filter((i) => i.user_email !== member.user_email);
  const deleted = beforeItems - g.items.length;
  let cancelled = false;
  if (g.creator_email === member.user_email) {
    g.status = "CANCELLED";
    cancelled = true;
  }
  all[idx] = recalcGroup(g);
  saveAllGroupOrders(all);
  return {
    message: "Left group order (offline)",
    cancelled,
    deleted_items_count: deleted,
  };
};

/**
 * Remove a member from group order (creator only)
 * DELETE /api/group-orders/{id}/members/{memberId}/
 */
export const removeMember = async (
  groupOrderId: number,
  memberId: number,
): Promise<{ message: string; deleted_items_count: number }> => {
  const all = getAllGroupOrders();
  const idx = all.findIndex((g) => g.id === groupOrderId);
  if (idx < 0) {
    throw makeAppError("Group order not found", {
      detail: "Group order not found",
      statusCode: 404,
    });
  }
  const g = all[idx];
  const member = g.members.find((m) => m.id === memberId);
  if (!member) {
    throw makeAppError("Member not found", {
      detail: "Member not found",
      statusCode: 404,
    });
  }
  const beforeItems = g.items.length;
  g.members = g.members.filter((m) => m.id !== memberId);
  g.items = g.items.filter((i) => i.user_id !== memberId);
  const deleted = beforeItems - g.items.length;
  all[idx] = recalcGroup(g);
  saveAllGroupOrders(all);
  return { message: "Member removed (offline)", deleted_items_count: deleted };
};
