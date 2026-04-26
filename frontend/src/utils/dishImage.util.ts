import { Product } from "../types/product.types";

const HARDCODED_DISH_IMAGES: string[] = [
  "https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/2619967/pexels-photo-2619967.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/1565982/pexels-photo-1565982.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg?auto=compress&cs=tinysrgb&w=1200",
];

const normalize = (value: string): string => value.trim().toLowerCase();

const hashSeed = (seed: string): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getRandomHardcodedDishImage = (seed: string | number): string => {
  const normalizedSeed = String(seed);
  const idx = hashSeed(normalizedSeed) % HARDCODED_DISH_IMAGES.length;
  return HARDCODED_DISH_IMAGES[idx];
};

export const isUsableProductImageUrl = (url?: string): boolean => {
  if (!url) return false;
  const normalized = normalize(url);

  if (!normalized) return false;

  return ![
    "via.placeholder.com",
    "no+image",
    "/placeholder.png",
    "placeholder.png",
  ].some((token) => normalized.includes(token));
};

export const getProductDisplayImage = (product: Product): string => {
  const primary = product.images?.find((img) => img.is_primary)?.image_url;
  if (isUsableProductImageUrl(primary)) {
    return primary as string;
  }

  const first = product.images?.[0]?.image_url;
  if (isUsableProductImageUrl(first)) {
    return first as string;
  }

  return getRandomHardcodedDishImage(`${product.id}-${product.slug}`);
};

export const getProductImageGallery = (product: Product): string[] => {
  const urls = (product.images || [])
    .map((img) => img.image_url)
    .filter((url) => isUsableProductImageUrl(url));

  const uniqueUrls = Array.from(new Set(urls));
  if (uniqueUrls.length > 0) {
    return uniqueUrls;
  }

  return [getProductDisplayImage(product)];
};
