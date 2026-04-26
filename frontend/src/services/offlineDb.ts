import {
  seedCategories,
  seedProducts,
  seedRatingsByProduct,
  RatingsByProduct,
} from "../mock/seed";
import { Category, Product, Rating } from "../types/product.types";
import { Cart } from "../types/cart.types";
import { Order } from "../types/order.types";

const PREFIX = "foodi_offline";

export const OFFLINE_KEYS = {
  CATEGORIES: `${PREFIX}:categories`,
  PRODUCTS: `${PREFIX}:products`,
  RATINGS: `${PREFIX}:ratingsByProduct`,
  CART: `${PREFIX}:cart`,
  ORDERS: `${PREFIX}:orders`,
  ADDRESSES: `${PREFIX}:addresses`,
  USER: `${PREFIX}:user`,
} as const;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function initOfflineData(): void {
  // Seed once. If any key exists, we assume user already has data.
  const hasProducts = !!localStorage.getItem(OFFLINE_KEYS.PRODUCTS);
  if (hasProducts) return;

  writeJSON<Category[]>(OFFLINE_KEYS.CATEGORIES, seedCategories);
  writeJSON<Product[]>(OFFLINE_KEYS.PRODUCTS, seedProducts);
  writeJSON<RatingsByProduct>(OFFLINE_KEYS.RATINGS, seedRatingsByProduct);

  const emptyCart: Cart = {
    id: 1,
    items: [],
    total_price: 0,
    total_items: 0,
    updated_at: new Date().toISOString(),
  };
  writeJSON<Cart>(OFFLINE_KEYS.CART, emptyCart);

  writeJSON<Order[]>(OFFLINE_KEYS.ORDERS, []);
  writeJSON<any[]>(OFFLINE_KEYS.ADDRESSES, []);
}

export function makeAppError(
  message: string,
  extras?: Record<string, unknown>,
): Error {
  return Object.assign(new Error(message), extras);
}

export function getCategories(): Category[] {
  initOfflineData();
  return readJSON<Category[]>(OFFLINE_KEYS.CATEGORIES, seedCategories);
}

export function getProducts(): Product[] {
  initOfflineData();
  const products = readJSON<Product[]>(OFFLINE_KEYS.PRODUCTS, seedProducts);

  const seedById = new Map(seedProducts.map((p) => [p.id, p]));
  const shouldUpgradeDescriptions = products.some((product) => {
    const seed = seedById.get(product.id);
    if (!seed) return false;
    // Keep seeded products aligned with current seed descriptions (English).
    return (
      product.slug === seed.slug && product.description !== seed.description
    );
  });

  if (!shouldUpgradeDescriptions) {
    return products;
  }

  const upgradedProducts = products.map((product) => {
    const seed = seedById.get(product.id);
    if (!seed) return product;

    const shouldSyncDescription =
      product.slug === seed.slug && product.description !== seed.description;

    return shouldSyncDescription
      ? {
          ...product,
          description: seed.description,
          updated_at: new Date().toISOString(),
        }
      : product;
  });

  setProducts(upgradedProducts);
  return upgradedProducts;
}

export function setProducts(products: Product[]): void {
  writeJSON<Product[]>(OFFLINE_KEYS.PRODUCTS, products);
}

export function getRatingsByProduct(): RatingsByProduct {
  initOfflineData();
  const map = readJSON<RatingsByProduct>(
    OFFLINE_KEYS.RATINGS,
    seedRatingsByProduct,
  );

  const legacyCommentMap: Record<string, string> = {
    "Ngon lắm!": "Absolutely delicious!",
    "Ổn áp.": "Pretty good.",
  };

  let changed = false;
  const normalized: RatingsByProduct = Object.fromEntries(
    Object.entries(map).map(([productId, ratings]) => {
      const migrated = ratings.map((rating) => {
        const translatedComment = legacyCommentMap[rating.comment];
        if (!translatedComment) return rating;
        changed = true;
        return {
          ...rating,
          comment: translatedComment,
        };
      });
      return [productId, migrated];
    }),
  );

  if (changed) {
    setRatingsByProduct(normalized);
  }

  return normalized;
}

export function setRatingsByProduct(map: RatingsByProduct): void {
  writeJSON<RatingsByProduct>(OFFLINE_KEYS.RATINGS, map);
}

export function addRating(productId: number, rating: Rating): void {
  const map = getRatingsByProduct();
  const list = map[productId] || [];
  map[productId] = [rating, ...list];
  setRatingsByProduct(map);

  // also update product average_rating
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === productId);
  if (idx >= 0) {
    const ratings = map[productId] || [];
    const avg = ratings.length
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : null;
    products[idx] = {
      ...products[idx],
      average_rating: avg,
      updated_at: new Date().toISOString(),
    };
    setProducts(products);
  }
}
