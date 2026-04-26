export interface PublicMenuSearchItem {
    menuItemId: number;
    menuItemName: string;
    categoryName: string;
    price: number;
    imageUrl?: string | null;
    restaurantId: number;
    restaurantName: string;
    restaurantLogoUrl?: string | null;
    country: string;
    state: string;
    currencyCode: string;
    currencySymbol: string;
    estimatedMinutes: number;
}
