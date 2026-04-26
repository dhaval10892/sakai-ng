export interface PublicRestaurantSettings {
    restaurantId: number;
    restaurantName: string;
    logoUrl?: string | null;
    tableNumber: string;
    country: string;
    state: string;
    currencyCode: string;
    currencySymbol: string;
    taxName: string;
    taxRate: number;
}
