export interface MenuItem {
  id: number;
  name: string;
  menuCategoryId: number;
  categoryName: string;
  price: number;
  available: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl?: string | null;
  restaurantId?: number;
}
