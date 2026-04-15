export interface MenuItem {
  id: number;
  name: string;
  menuCategoryId: number;
  categoryName: string;
  price: number;
  available: boolean;
  imageUrl?: string | null;
}