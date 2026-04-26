export interface BookingRequest {
    id: number;
    restaurantId: number;
    tableNumber: string;
    guestName: string;
    phone: string;
    bookingDate: string;
    bookingTime: string;
    seats: number;
    occasion: string;
    arrangement: string;
    status: string;
    createdAt: string;
}
