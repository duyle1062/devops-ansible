import { Category, Product, Rating } from "../types/product.types";

const nowIso = () => new Date().toISOString();

export const seedCategories: Category[] = [
  {
    id: 1,
    name: "Pizza",
    slug_name: "pizza",
    description: "Pizza",
    is_active: true,
    sort_order: 1,
  },
  {
    id: 2,
    name: "Chicken",
    slug_name: "chicken",
    description: "Chicken",
    is_active: true,
    sort_order: 2,
  },
  {
    id: 3,
    name: "Salad",
    slug_name: "salad",
    description: "Salad",
    is_active: true,
    sort_order: 3,
  },
  {
    id: 4,
    name: "Drink",
    slug_name: "drink",
    description: "Drink",
    is_active: true,
    sort_order: 4,
  },
  {
    id: 5,
    name: "Vegetarian",
    slug_name: "vegetarian",
    description: "Vegetarian",
    is_active: true,
    sort_order: 5,
  },
  {
    id: 6,
    name: "Combo",
    slug_name: "combo",
    description: "Combo",
    is_active: true,
    sort_order: 6,
  },
];

const placeholderImage = (label: string) =>
  `https://via.placeholder.com/600x400?text=${encodeURIComponent(label)}`;

const product = (
  id: number,
  name: string,
  slug: string,
  priceVnd: number,
  category: Category,
  description: string,
): Product => {
  const created_at = nowIso();
  const updated_at = created_at;
  return {
    id,
    name,
    slug,
    description,
    price: String(priceVnd),
    category,
    average_rating: null,
    images: [
      {
        id: id * 10 + 1,
        image_url: placeholderImage(name),
        is_primary: true,
        sort_order: 0,
      },
    ],
    is_active: true,
    available: true,
    created_at,
    updated_at,
  };
};

export const seedProducts: Product[] = [
  product(
    101,
    "Margherita Pizza",
    "margherita-pizza",
    89000,
    seedCategories[0],
    "A thin and crispy pizza crust topped with fresh tomato sauce, mozzarella cheese, and fragrant basil leaves. Balanced flavor and easy to enjoy for a quick but quality lunch.",
  ),
  product(
    102,
    "Pepperoni Pizza",
    "pepperoni-pizza",
    109000,
    seedCategories[0],
    "Pepperoni pizza with mildly spicy sausage slices and rich melted cheese on a moderately crispy base. A satisfying choice for friends or a weekend dinner.",
  ),

  product(
    201,
    "Crispy Fried Chicken",
    "crispy-fried-chicken",
    79000,
    seedCategories[1],
    "Golden crispy fried chicken with juicy and tender meat inside. Well-seasoned and even better when served with fries and a mild spicy sauce.",
  ),
  product(
    202,
    "Grilled Chicken",
    "grilled-chicken",
    99000,
    seedCategories[1],
    "Char-grilled chicken breast with a smoky aroma, marinated with garlic, pepper, and herbs. Lower in oil, ideal for a lighter and more balanced meal.",
  ),

  product(
    301,
    "Caesar Salad",
    "caesar-salad",
    69000,
    seedCategories[2],
    "Classic Caesar salad with fresh romaine lettuce, crispy croutons, parmesan, and creamy Caesar dressing. A refreshing starter that pairs well with grilled chicken.",
  ),
  product(
    302,
    "Greek Salad",
    "greek-salad",
    65000,
    seedCategories[2],
    "Greek salad with tomatoes, cucumber, black olives, and feta cheese. Naturally refreshing and fiber-rich, perfect for a light lunch.",
  ),

  product(
    401,
    "Lemon Tea",
    "lemon-tea",
    25000,
    seedCategories[3],
    "Iced lemon tea with a balanced sweet and sour taste, served with fresh lemon slices. A perfect refreshment for hot days.",
  ),
  product(
    402,
    "Iced Coffee",
    "iced-coffee",
    30000,
    seedCategories[3],
    "Vietnamese-style iced coffee with milk, bold flavor, and a classic roasted aroma. Great for staying energized in the morning or early afternoon.",
  ),

  product(
    501,
    "Veggie Bowl",
    "veggie-bowl",
    72000,
    seedCategories[4],
    "A mixed veggie bowl with broccoli, corn, green peas, and brown rice. High in fiber with a clean taste, suitable for a healthy eating plan.",
  ),
  product(
    502,
    "Mushroom Pasta",
    "mushroom-pasta",
    85000,
    seedCategories[4],
    "Creamy mushroom pasta made with sauteed fresh mushrooms, garlic, and black pepper. Smooth and comforting, suitable for vegetarian-friendly meals.",
  ),

  product(
    601,
    "Combo A",
    "combo-a",
    129000,
    seedCategories[5],
    "A value combo including one main dish, one side, and one drink. A balanced option for individual meals that is both filling and budget-friendly.",
  ),
  product(
    602,
    "Combo B",
    "combo-b",
    149000,
    seedCategories[5],
    "A generous combo for two with main dishes, sides, and two drinks. Ideal for couples or friends who want to enjoy multiple items together.",
  ),
];

export type RatingsByProduct = Record<number, Rating[]>;

export const seedRatingsByProduct: RatingsByProduct = {
  101: [
    {
      id: 1,
      user: { id: 1, first_name: "An", last_name: "Nguyen" },
      rating: 5,
      comment: "Absolutely delicious!",
      created_at: nowIso(),
    },
  ],
  102: [
    {
      id: 2,
      user: { id: 2, first_name: "Binh", last_name: "Tran" },
      rating: 4,
      comment: "Pretty good.",
      created_at: nowIso(),
    },
  ],
};
