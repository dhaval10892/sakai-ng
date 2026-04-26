export type GeoPoint = {
    latitude: number;
    longitude: number;
};

const STATE_COORDINATES: Record<string, GeoPoint> = {
    Gujarat: { latitude: 22.2587, longitude: 71.1924 },
    Maharashtra: { latitude: 19.7515, longitude: 75.7139 },
    Delhi: { latitude: 28.7041, longitude: 77.1025 },
    Karnataka: { latitude: 15.3173, longitude: 75.7139 },
    'Tamil Nadu': { latitude: 11.1271, longitude: 78.6569 },
    Ontario: { latitude: 50.0000, longitude: -85.0000 },
    Quebec: { latitude: 52.9399, longitude: -73.5491 },
    Alberta: { latitude: 53.9333, longitude: -116.5765 },
    California: { latitude: 36.7783, longitude: -119.4179 },
    Texas: { latitude: 31.9686, longitude: -99.9018 },
    Florida: { latitude: 27.6648, longitude: -81.5158 },
    England: { latitude: 52.3555, longitude: -1.1743 },
    Scotland: { latitude: 56.4907, longitude: -4.2026 },
    Dubai: { latitude: 25.2048, longitude: 55.2708 },
    'New South Wales': { latitude: -31.2532, longitude: 146.9211 }
};

const COUNTRY_COORDINATES: Record<string, GeoPoint> = {
    India: { latitude: 20.5937, longitude: 78.9629 },
    Canada: { latitude: 56.1304, longitude: -106.3468 },
    'United States': { latitude: 37.0902, longitude: -95.7129 },
    'United Kingdom': { latitude: 55.3781, longitude: -3.4360 },
    Australia: { latitude: -25.2744, longitude: 133.7751 },
    Germany: { latitude: 51.1657, longitude: 10.4515 },
    France: { latitude: 46.2276, longitude: 2.2137 },
    Italy: { latitude: 41.8719, longitude: 12.5674 },
    Spain: { latitude: 40.4637, longitude: -3.7492 },
    Mexico: { latitude: 23.6345, longitude: -102.5528 },
    Brazil: { latitude: -14.2350, longitude: -51.9253 },
    Singapore: { latitude: 1.3521, longitude: 103.8198 },
    'United Arab Emirates': { latitude: 23.4241, longitude: 53.8478 }
};

export function getApproximateRestaurantPoint(country?: string | null, state?: string | null): GeoPoint | null {
    const trimmedState = state?.trim();
    const trimmedCountry = country?.trim();

    if (trimmedState && STATE_COORDINATES[trimmedState]) {
        return STATE_COORDINATES[trimmedState];
    }

    if (trimmedCountry && COUNTRY_COORDINATES[trimmedCountry]) {
        return COUNTRY_COORDINATES[trimmedCountry];
    }

    return null;
}

export function calculateDistanceKm(origin: GeoPoint, destination: GeoPoint): number {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const latitudeDelta = toRadians(destination.latitude - origin.latitude);
    const longitudeDelta = toRadians(destination.longitude - origin.longitude);
    const startLatitude = toRadians(origin.latitude);
    const endLatitude = toRadians(destination.latitude);

    const a =
        Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
        Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
}
