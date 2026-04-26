import { getCategories } from "./offlineDb";

export interface Category {
  id: number;
  name: string;
  slug_name: string;
  is_active: boolean;
}

class CategoryService {
  /**
   * Get all categories
   * GET /api/category/
   */
  async getCategories(): Promise<Category[]> {
    return getCategories().map((c) => ({
      id: c.id,
      name: c.name,
      slug_name: c.slug_name,
      is_active: c.is_active,
    }));
  }

  /**
   * Get category detail by slug
   * GET /api/category/{slug}/
   */
  async getCategoryBySlug(slug: string): Promise<Category> {
    const all = await this.getCategories();
    const found = all.find((c) => c.slug_name === slug);
    if (!found) {
      throw new Error("Category not found");
    }
    return found;
  }
}

const categoryService = new CategoryService();
export default categoryService;
