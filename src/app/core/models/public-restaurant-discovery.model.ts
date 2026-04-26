export interface PublicRestaurantDiscovery {
    restaurantId: number;
    restaurantName: string;
    logoUrl?: string | null;
    country: string;
    state: string;
    cuisineLabel: string;
    featuredItemName: string;
    featuredItemPrice: number;
    featuredImageUrl?: string | null;
    rating: number;
    reviewCount: number;
    estimatedMinutes: number;
}
