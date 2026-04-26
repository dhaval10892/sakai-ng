import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { TagModule } from 'primeng/tag';

import { MenuItem as RestaurantMenuItem } from '@/app/core/models/menu-items.model';
import { CartItem } from '@/app/core/models/cart-item.model';
import { BookingRequest } from '@/app/core/models/booking-request.model';
import { PublicRestaurantDiscovery } from '@/app/core/models/public-restaurant-discovery.model';
import { PublicRestaurantSettings } from '@/app/core/models/public-restaurant-settings.model';
import { Restaurant } from '@/app/core/models/restaurant';
import { RestaurantTable } from '@/app/core/models/table.model';
import { CartService } from '@/app/core/services/cart.service';
import { NotificationService } from '@/app/core/services/notification.service';
import { PublicOrderingService } from '@/app/core/services/public-ordering.service';
import { GeoPoint, calculateDistanceKm, getApproximateRestaurantPoint } from '@/app/core/utils/public-location';
import { resolveCurrencySymbol } from '@/app/core/utils/tenant-localization';

type MenuSection = {
    category: string;
    items: RestaurantMenuItem[];
};

type QuickReview = {
    score: number;
    tag: string;
    submittedAt: string;
};

type SidebarItem = {
    label: string;
    icon: string;
    kind: 'home' | 'offers' | 'cuisine';
    value: string;
};

type VisualCategory = {
    value: string;
    label: string;
    icon: string;
};

type RestaurantCard = {
    id: number;
    name: string;
    logoUrl?: string | null;
    previewImageUrl?: string | null;
    country: string;
    state: string;
    currencyCode: string;
    currencySymbol: string;
    cuisineLabel: string;
    featuredItemName: string;
    rating: number;
    reviewCount: number;
    estimatedMinutes: number;
    coordinates: GeoPoint | null;
};

@Component({
    selector: 'app-public-menu',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, ButtonModule, DrawerModule, TagModule],
    templateUrl: './public-menu.html',
    styleUrl: './public-menu.scss'
})
export class PublicMenu implements OnInit {
    tableNumber = '';
    restaurantId: number | null = null;
    currentPath = '';
    restaurantSearch = '';
    menuSearch = '';
    cartCount = 0;
    orderType: 'DineIn' | 'Takeaway' = 'Takeaway';
    restaurantCards: RestaurantCard[] = [];
    availableMenuItem: RestaurantMenuItem[] = [];
    availableTables: RestaurantTable[] = [];
    bookingTables: RestaurantTable[] = [];
    categories: string[] = [];
    selectedCategory = 'All';
    selectedTableNumber = '';
    selectedBookingRestaurantId: number | null = null;
    selectedSidebarValue = 'Home';
    sidebarOpen = false;
    locationStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
    currentLocation: GeoPoint | null = null;
    locationError = '';
    cartVisible = false;
    loading = false;
    cartItems: CartItem[] = [];
    total = 0;
    restaurantSettings?: PublicRestaurantSettings;
    averageFoodRating = 4.7;
    averageHygieneRating = 4.8;
    recommendationRate = 95;
    reviewCount = 96;
    quickReview = {
        score: 5,
        tag: 'Loved it'
    };
    reviewTags = ['Loved it', 'Very clean', 'Fast service', 'Good value'];
    bookingForm = {
        preferredTable: '',
        phone: '',
        date: '',
        time: '19:00',
        seats: 2
    };
    storeBookingForm = {
        guestName: '',
        date: '',
        time: '19:00',
        seats: 2
    };
    timeSlots = ['12:00', '13:00', '18:00', '19:00', '20:00', '21:00'];
    sidebarItems: SidebarItem[] = [
        { label: 'Home', icon: 'pi pi-home', kind: 'home', value: 'Home' },
        { label: 'Pizza', icon: 'pi pi-star-fill', kind: 'cuisine', value: 'Pizza' },
        { label: 'Indian', icon: 'pi pi-sparkles', kind: 'cuisine', value: 'Indian' },
        { label: 'Sushi', icon: 'pi pi-circle-fill', kind: 'cuisine', value: 'Sushi' },
        { label: 'Burgers', icon: 'pi pi-verified', kind: 'cuisine', value: 'Burgers' },
        { label: 'Healthy', icon: 'pi pi-heart-fill', kind: 'cuisine', value: 'Healthy' },
        { label: 'Offers', icon: 'pi pi-gift', kind: 'offers', value: 'Offers' }
    ];

    constructor(
        private activeRoute: ActivatedRoute,
        private router: Router,
        private cartService: CartService,
        private cdr: ChangeDetectorRef,
        private notificationService: NotificationService,
        private publicOrderingService: PublicOrderingService
    ) {}

    get isQrMode(): boolean {
        return this.currentPath.startsWith('qr-menu');
    }

    get isMarketplaceMode(): boolean {
        return this.currentPath === 'restaurants' && !this.restaurantId;
    }

    get isStoreMode(): boolean {
        return this.currentPath.startsWith('restaurants') && !!this.restaurantId;
    }

    get currentOrderType(): 'DineIn' | 'Takeaway' {
        return this.isQrMode ? 'DineIn' : this.orderType;
    }

    get locationPillLabel(): string {
        if (this.locationStatus === 'loading') {
            return 'Finding your location';
        }

        if (this.locationStatus === 'ready') {
            return 'Nearby search is on';
        }

        if (this.locationStatus === 'error') {
            return 'Location unavailable';
        }

        return 'Use live location';
    }

    get locationBannerText(): string {
        if (this.locationStatus === 'ready') {
            return 'Restaurants are sorted by approximate distance from your live location.';
        }

        if (this.locationStatus === 'error') {
            return 'We could not read your location, so restaurants are shown without distance sorting.';
        }

        return 'Turn on live location to bring nearby restaurants to the top.';
    }

    get liveLocationHint(): string {
        if (this.locationStatus === 'ready') {
            return 'Live location active';
        }

        if (this.locationStatus === 'loading') {
            return 'Waiting for browser permission';
        }

        if (this.locationStatus === 'error') {
            return 'Tap to try again';
        }

        return 'Allow location for nearby search';
    }

    get topCategoryItems(): SidebarItem[] {
        return this.sidebarItems.filter((item) => item.kind === 'cuisine');
    }

    get filteredRestaurantCards(): RestaurantCard[] {
        const query = this.restaurantSearch.trim().toLowerCase();
        let cards = this.restaurantCards.filter((restaurant) => this.matchesSidebarFilter(restaurant));

        if (query) {
            cards = cards.filter((restaurant) =>
                [restaurant.name, restaurant.cuisineLabel, restaurant.country, restaurant.state]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(query))
            );
        }

        return [...cards].sort((left, right) => this.compareRestaurants(left, right));
    }

    get selectedRestaurantCard(): RestaurantCard | undefined {
        return this.restaurantCards.find((restaurant) => restaurant.id === this.selectedBookingRestaurantId);
    }

    get featuredItems(): RestaurantMenuItem[] {
        return this.availableMenuItem.filter((item) => item.stockQuantity > 0).slice(0, 3);
    }

    get storeGallery(): string[] {
        return this.featuredItems.map((item) => item.imageUrl).filter((imageUrl): imageUrl is string => !!imageUrl).slice(0, 3);
    }

    get visualMenuCategories(): VisualCategory[] {
        const normalizedCategories = Array.from(new Set(this.categories.filter(Boolean)));
        const sourceCategories = normalizedCategories.includes('All') ? normalizedCategories : ['All', ...normalizedCategories];

        return sourceCategories.map((category) => ({
            value: category,
            label: this.getCategoryChipLabel(category),
            icon: this.getCategoryChipIcon(category)
        }));
    }

    get storeHeaderTitle(): string {
        if (this.isQrMode) {
            return `Table ${this.tableNumber} ordering`;
        }

        return this.restaurantSettings?.restaurantName || 'Restaurant menu';
    }

    get storeSubtitle(): string {
        if (this.isQrMode) {
            return 'Scan, add dishes quickly, and send your order straight to the kitchen.';
        }

        return this.currentOrderType === 'Takeaway'
            ? 'Quick take away ordering'
            : 'Dine in ordering with optional table selection';
    }

    get currencySymbol(): string {
        return resolveCurrencySymbol(
            this.restaurantSettings?.currencySymbol,
            this.restaurantSettings?.country,
            this.restaurantSettings?.currencyCode
        );
    }

    get bookingMinDate(): string {
        return new Date().toISOString().split('T')[0];
    }

    get guestCountOptions(): number[] {
        return Array.from({ length: 12 }, (_, index) => index + 1);
    }

    get marketplaceBookingDisabled(): boolean {
        return !this.selectedBookingRestaurantId || !this.bookingForm.phone.trim() || !this.bookingForm.date || !this.bookingForm.time;
    }

    get storeBookingDisabled(): boolean {
        return (
            !this.restaurantSettings?.restaurantId ||
            !this.storeBookingForm.guestName.trim() ||
            !this.storeBookingForm.date ||
            !this.storeBookingForm.time ||
            this.storeBookingForm.seats <= 0
        );
    }

    get activeOrderLabel(): string {
        if (this.isQrMode) {
            return `Table ${this.tableNumber}`;
        }

        if (this.currentOrderType === 'Takeaway') {
            return 'Take away';
        }

        return this.selectedTableNumber ? `Dine in | ${this.selectedTableNumber}` : 'Dine in';
    }

    get estimatedReadyMinutes(): number {
        const currentRestaurantId = this.restaurantSettings?.restaurantId || this.restaurantId || this.selectedBookingRestaurantId;
        const restaurant = this.restaurantCards.find((item) => item.id === currentRestaurantId);

        if (restaurant) {
            return restaurant.estimatedMinutes;
        }

        return this.currentOrderType === 'Takeaway' ? 12 : 16;
    }

    get menuSections(): MenuSection[] {
        const normalizedSearch = this.menuSearch.trim().toLowerCase();
        const sectionCategories = this.selectedCategory === 'All' ? this.categories.filter((category) => category !== 'All') : [this.selectedCategory];

        return sectionCategories
            .map((category) => ({
                category,
                items: this.availableMenuItem.filter((item) => {
                    const matchesCategory = item.categoryName === category;

                    if (!matchesCategory) {
                        return false;
                    }

                    if (!normalizedSearch) {
                        return true;
                    }

                    return item.name.toLowerCase().includes(normalizedSearch);
                })
            }))
            .filter((section) => section.items.length > 0);
    }

    ngOnInit(): void {
        this.currentPath = this.activeRoute.snapshot.routeConfig?.path || '';
        this.tableNumber = this.activeRoute.snapshot.paramMap.get('tableNumber') || '';
        const restaurantIdParam = this.activeRoute.snapshot.paramMap.get('restaurantId');
        this.restaurantId = restaurantIdParam ? Number(restaurantIdParam) : null;

        this.loadCartSidebar();
        this.orderType = this.cartService.getOrderType();

        if (this.isMarketplaceMode) {
            this.loadMarketplaceData();
            return;
        }

        if (this.isStoreMode && this.restaurantId) {
            this.scrollToBookingPanel(this.activeRoute.snapshot.fragment);
            this.loadStore(this.restaurantId);
            return;
        }

        if (this.tableNumber) {
            this.orderType = 'DineIn';
            this.cartService.setOrderContext({
                tableNumber: this.tableNumber,
                orderType: 'DineIn'
            });
            this.loadRestaurantSettings();
            this.loadMenuItems();
        }

        this.loadQuickReviewStats();
    }

    loadMarketplaceData(): void {
        this.loading = true;

        forkJoin({
            restaurants: this.publicOrderingService.getRestaurants(),
            discovery: this.publicOrderingService.discoverRestaurants()
        }).subscribe({
            next: ({ restaurants, discovery }) => {
                this.restaurantCards = this.buildRestaurantCards(restaurants, discovery);
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.loading = false;
                this.notificationService.showApiError(error, 'Failed to load restaurants.');
            }
        });
    }

    loadStore(restaurantId: number): void {
        this.loadRestaurantSettingsByRestaurant(restaurantId);
        this.loadMenuItemsByRestaurant(restaurantId);
        this.loadRestaurantTables(restaurantId);
    }

    loadMenuItems(): void {
        if (!this.tableNumber) {
            return;
        }

        this.loading = true;

        this.publicOrderingService.getMenuByTable(this.tableNumber).subscribe({
            next: (items) => {
                this.availableMenuItem = items.filter((item) => item.available && item.stockQuantity > 0);
                this.categories = ['All', ...new Set(this.availableMenuItem.map((item) => item.categoryName))];
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.loading = false;
                this.notificationService.showApiError(error, 'Failed to load menu items.');
            }
        });
    }

    loadMenuItemsByRestaurant(restaurantId: number): void {
        this.loading = true;

        this.publicOrderingService.getMenuByRestaurant(restaurantId).subscribe({
            next: (items) => {
                this.availableMenuItem = items.filter((item) => item.available && item.stockQuantity > 0);
                this.categories = ['All', ...new Set(this.availableMenuItem.map((item) => item.categoryName))];
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.loading = false;
                this.notificationService.showApiError(error, 'Failed to load restaurant menu.');
            }
        });
    }

    loadRestaurantSettings(): void {
        if (!this.tableNumber) {
            return;
        }

        this.publicOrderingService.getRestaurantSettings(this.tableNumber).subscribe({
            next: (settings) => {
                this.restaurantSettings = settings;
                this.cartService.setOrderContext({
                    tableNumber: this.tableNumber,
                    restaurantId: settings.restaurantId,
                    restaurantName: settings.restaurantName,
                    orderType: 'DineIn'
                });
                this.orderType = 'DineIn';
                this.loadQuickReviewStats();
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.notificationService.showApiError(error, 'Failed to load restaurant settings.');
            }
        });
    }

    loadRestaurantSettingsByRestaurant(restaurantId: number): void {
        this.publicOrderingService.getRestaurantSettingsByRestaurant(restaurantId).subscribe({
            next: (settings) => {
                this.restaurantSettings = settings;
                this.cartService.setOrderContext({
                    restaurantId: settings.restaurantId,
                    restaurantName: settings.restaurantName,
                    tableNumber: this.currentOrderType === 'Takeaway' ? '' : this.selectedTableNumber,
                    orderType: this.currentOrderType
                });
                this.loadQuickReviewStats();
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.notificationService.showApiError(error, 'Failed to load restaurant details.');
            }
        });
    }

    loadRestaurantTables(restaurantId: number): void {
        this.publicOrderingService.getTablesByRestaurant(restaurantId).subscribe({
            next: (tables) => {
                this.availableTables = tables.filter((table) => table.status === 'Available');
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.notificationService.showApiError(error, 'Failed to load available tables.');
            }
        });
    }

    loadBookingTables(restaurantId: number): void {
        this.publicOrderingService.getTablesByRestaurant(restaurantId).subscribe({
            next: (tables) => {
                this.bookingTables = tables.filter((table) => table.status === 'Available');
                this.cdr.markForCheck();
            },
            error: (error) => {
                this.notificationService.showApiError(error, 'Failed to load available tables.');
            }
        });
    }

    toggleSidebar(): void {
        this.sidebarOpen = !this.sidebarOpen;
    }

    closeSidebar(): void {
        this.sidebarOpen = false;
    }

    selectSidebarItem(item: SidebarItem): void {
        this.selectedSidebarValue = item.value;
        this.closeSidebar();
    }

    requestLiveLocation(): void {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            this.locationStatus = 'error';
            this.locationError = 'This browser does not support live location.';
            this.notificationService.warn('Location unavailable', this.locationError);
            return;
        }

        this.locationStatus = 'loading';
        this.locationError = '';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                this.locationStatus = 'ready';
                this.notificationService.success('Live location enabled', 'Nearby restaurants are now sorted by distance.');
                this.cdr.markForCheck();
            },
            () => {
                this.locationStatus = 'error';
                this.locationError = 'Location permission was denied.';
                this.notificationService.warn('Location unavailable', 'Please allow location access to sort nearby restaurants.');
                this.cdr.markForCheck();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    }

    submitMarketplaceSearch(): void {
        this.cdr.markForCheck();
    }

    clearRestaurantSearch(): void {
        this.restaurantSearch = '';
    }

    selectRestaurant(value: number | string | null): void {
        const restaurantId = Number(value);

        if (!restaurantId) {
            this.selectedBookingRestaurantId = null;
            this.bookingTables = [];
            this.bookingForm.preferredTable = '';
            return;
        }

        this.selectedBookingRestaurantId = restaurantId;
        this.bookingForm.preferredTable = '';
        this.loadBookingTables(restaurantId);
    }

    viewRestaurant(restaurantId: number): void {
        this.router.navigate(['/restaurants', restaurantId]);
    }

    openRestaurantBooking(restaurantId: number): void {
        this.router.navigate(['/restaurants', restaurantId], { fragment: 'book-table' });
    }

    filterByCategory(category: string): void {
        this.selectedCategory = category;
    }

    openCart(): void {
        this.cartVisible = true;
        this.loadCartSidebar();
    }

    loadCartCount(): void {
        this.cartCount = this.cartService.getCartCount();
    }

    loadCartSidebar(): void {
        this.cartItems = this.cartService.getCartItems();
        this.total = this.cartService.getCartTotal();
        this.loadCartCount();
    }

    addToCart(item: RestaurantMenuItem): void {
        if (!this.restaurantSettings?.restaurantId && !this.isQrMode) {
            this.notificationService.warn('Choose a restaurant', 'Please open a restaurant before adding dishes.');
            return;
        }

        const quantityInCart = this.getItemQuantity(item.id);

        if (quantityInCart >= item.stockQuantity) {
            this.notificationService.warn('Stock limit reached', `${item.name} has only ${item.stockQuantity} item(s) available.`);
            return;
        }

        this.cartService.setOrderContext({
            tableNumber: this.currentOrderType === 'Takeaway' ? '' : this.selectedTableNumber || this.tableNumber,
            restaurantId: item.restaurantId || this.restaurantSettings?.restaurantId || null,
            restaurantName: this.restaurantSettings?.restaurantName || this.storeHeaderTitle,
            orderType: this.currentOrderType
        });
        this.cartService.addCartItem(item, this.currentOrderType === 'Takeaway' ? undefined : this.selectedTableNumber || this.tableNumber);
        this.loadCartSidebar();
        this.notificationService.success('Added to cart', `${item.name} added to your ${this.currentOrderType === 'Takeaway' ? 'take away' : 'dine in'} order.`);
    }

    increaseQuantity(menuItemId: number): void {
        const cartItem = this.cartItems.find((item) => item.menuItem.id === menuItemId);

        if (!cartItem) {
            return;
        }

        if (cartItem.quantity >= cartItem.menuItem.stockQuantity) {
            this.notificationService.warn('Stock limit reached', `${cartItem.menuItem.name} has only ${cartItem.menuItem.stockQuantity} item(s) available.`);
            return;
        }

        this.cartService.increaseQuantity(menuItemId);
        this.loadCartSidebar();
    }

    decreaseQuantity(menuItemId: number): void {
        this.cartService.decreaseQuantity(menuItemId);
        this.loadCartSidebar();
    }

    updateSpecialInstructions(menuItemId: number, instructions: string): void {
        this.cartService.updateSpecialInstructions(menuItemId, instructions);
        this.loadCartSidebar();
    }

    getItemQuantity(menuItemId: number): number {
        return this.cartItems.find((item) => item.menuItem.id === menuItemId)?.quantity ?? 0;
    }

    getAddButtonLabel(item: RestaurantMenuItem): string {
        return item.stockQuantity <= item.lowStockThreshold ? 'Add fast' : 'Add';
    }

    getCardCurrencySymbol(card: RestaurantCard): string {
        return resolveCurrencySymbol(card.currencySymbol, card.country, card.currencyCode);
    }

    getRestaurantDistanceText(restaurant: RestaurantCard): string {
        const distance = this.getRestaurantDistanceKm(restaurant);

        if (distance !== null) {
            return `${distance.toFixed(1)} km away`;
        }

        return `${restaurant.estimatedMinutes} min away`;
    }

    setOrderType(orderType: 'DineIn' | 'Takeaway'): void {
        this.orderType = orderType;

        if (orderType === 'Takeaway') {
            this.selectedTableNumber = '';
        }

        this.cartService.setOrderContext({
            tableNumber: orderType === 'Takeaway' ? '' : this.selectedTableNumber,
            restaurantId: this.restaurantSettings?.restaurantId || this.restaurantId,
            restaurantName: this.restaurantSettings?.restaurantName || this.storeHeaderTitle,
            orderType
        });
    }

    selectOptionalTable(tableNumber: string): void {
        this.selectedTableNumber = tableNumber;
        this.cartService.setOrderContext({
            tableNumber,
            restaurantId: this.restaurantSettings?.restaurantId || this.restaurantId,
            restaurantName: this.restaurantSettings?.restaurantName || this.storeHeaderTitle,
            orderType: this.currentOrderType
        });
    }

    submitQuickReview(): void {
        const savedReviews = this.readStorage<QuickReview>(this.reviewStorageKey);
        savedReviews.unshift({
            ...this.quickReview,
            submittedAt: new Date().toISOString()
        });

        this.writeStorage(this.reviewStorageKey, savedReviews.slice(0, 40));
        this.loadQuickReviewStats();
        this.quickReview = {
            score: 5,
            tag: 'Loved it'
        };
        this.notificationService.success('Thanks for the quick review', 'Your quick rating was submitted.');
    }

    submitTableBooking(): void {
        if (this.marketplaceBookingDisabled || !this.selectedBookingRestaurantId) {
            this.notificationService.warn('Booking details missing', 'Select a restaurant, date, time, and phone.');
            return;
        }

        const request: Omit<BookingRequest, 'id' | 'status' | 'createdAt'> = {
            restaurantId: this.selectedBookingRestaurantId,
            tableNumber: this.bookingForm.preferredTable || 'Any',
            guestName: 'Guest',
            phone: this.bookingForm.phone.trim(),
            bookingDate: this.bookingForm.date,
            bookingTime: this.bookingForm.time,
            seats: this.bookingForm.seats,
            occasion: 'Reservation',
            arrangement: ''
        };

        this.publicOrderingService.createBookingRequest(request).subscribe({
            next: () => {
                this.notificationService.success(
                    'Booking request sent',
                    `${this.bookingForm.seats} seats requested for ${this.bookingForm.date} at ${this.bookingForm.time}.`
                );
                this.bookingForm = {
                    preferredTable: '',
                    phone: '',
                    date: '',
                    time: this.timeSlots[0],
                    seats: 2
                };
                this.bookingTables = [];
                this.selectedBookingRestaurantId = null;
            },
            error: (error) => {
                this.notificationService.showApiError(error, 'Failed to create booking request.');
            }
        });
    }

    submitStoreBooking(): void {
        const restaurantId = this.restaurantSettings?.restaurantId || this.restaurantId;

        if (this.storeBookingDisabled || !restaurantId) {
            this.notificationService.warn('Booking details missing', 'Choose a date, people count, and time slot.');
            return;
        }

        const request: Omit<BookingRequest, 'id' | 'status' | 'createdAt'> = {
            restaurantId,
            tableNumber: 'Any',
            guestName: this.storeBookingForm.guestName.trim(),
            phone: 'Not provided',
            bookingDate: this.storeBookingForm.date,
            bookingTime: this.storeBookingForm.time,
            seats: this.storeBookingForm.seats,
            occasion: 'Reservation',
            arrangement: ''
        };

        this.publicOrderingService.createBookingRequest(request).subscribe({
            next: () => {
                this.notificationService.success(
                    'Table requested',
                    `${this.storeBookingForm.seats} people for ${this.storeBookingForm.date} at ${this.storeBookingForm.time}.`
                );
                this.storeBookingForm = {
                    guestName: '',
                    date: '',
                    time: this.timeSlots[0],
                    seats: 2
                };
            },
            error: (error) => {
                this.notificationService.showApiError(error, 'Failed to create booking request.');
            }
        });
    }

    setReviewTag(tag: string): void {
        this.quickReview.tag = tag;
    }

    goToCheckout(): void {
        if (!this.restaurantSettings?.restaurantId && !this.isQrMode) {
            this.notificationService.warn('Choose a restaurant', 'Please open a restaurant before continuing to checkout.');
            return;
        }

        this.cartService.setOrderContext({
            tableNumber: this.currentOrderType === 'Takeaway' ? '' : this.selectedTableNumber || this.tableNumber,
            restaurantId: this.restaurantSettings?.restaurantId || this.restaurantId,
            restaurantName: this.restaurantSettings?.restaurantName || this.storeHeaderTitle,
            orderType: this.currentOrderType
        });
        this.router.navigate(['/checkout']);
    }

    backToMarketplace(): void {
        this.router.navigate(['/restaurants']);
    }

    private buildRestaurantCards(restaurants: Restaurant[], discovery: PublicRestaurantDiscovery[]): RestaurantCard[] {
        const discoveryMap = new Map(discovery.map((item) => [item.restaurantId, item]));

        return restaurants
            .filter((restaurant) => restaurant.isActive)
            .map((restaurant) => {
                const preview = discoveryMap.get(restaurant.id);

                return {
                    id: restaurant.id,
                    name: restaurant.name,
                    logoUrl: restaurant.logoUrl || null,
                    previewImageUrl: preview?.featuredImageUrl || restaurant.logoUrl || null,
                    country: restaurant.country || '',
                    state: restaurant.state || '',
                    currencyCode: restaurant.currencyCode || '',
                    currencySymbol: restaurant.currencySymbol || '',
                    cuisineLabel: preview?.cuisineLabel || 'Restaurant',
                    featuredItemName: preview?.featuredItemName || 'View menu',
                    rating: preview?.rating ?? 4.1 + ((restaurant.id % 7) * 0.1),
                    reviewCount: preview?.reviewCount ?? 75 + ((restaurant.id * 11) % 260),
                    estimatedMinutes: preview?.estimatedMinutes ?? 10 + (restaurant.id % 8),
                    coordinates: getApproximateRestaurantPoint(restaurant.country, restaurant.state)
                };
            })
            .sort((left, right) => left.name.localeCompare(right.name));
    }

    private matchesSidebarFilter(restaurant: RestaurantCard): boolean {
        if (this.selectedSidebarValue === 'Home') {
            return true;
        }

        if (this.selectedSidebarValue === 'Offers') {
            return restaurant.rating >= 4.5 || restaurant.reviewCount >= 120;
        }

        return (
            restaurant.cuisineLabel.toLowerCase().includes(this.selectedSidebarValue.toLowerCase()) ||
            restaurant.featuredItemName.toLowerCase().includes(this.selectedSidebarValue.toLowerCase())
        );
    }

    private compareRestaurants(left: RestaurantCard, right: RestaurantCard): number {
        const leftDistance = this.getRestaurantDistanceKm(left);
        const rightDistance = this.getRestaurantDistanceKm(right);

        if (leftDistance !== null && rightDistance !== null && leftDistance !== rightDistance) {
            return leftDistance - rightDistance;
        }

        if (leftDistance !== null && rightDistance === null) {
            return -1;
        }

        if (leftDistance === null && rightDistance !== null) {
            return 1;
        }

        if (left.rating !== right.rating) {
            return right.rating - left.rating;
        }

        return left.name.localeCompare(right.name);
    }

    private getRestaurantDistanceKm(restaurant: RestaurantCard): number | null {
        if (!this.currentLocation || !restaurant.coordinates) {
            return null;
        }

        return calculateDistanceKm(this.currentLocation, restaurant.coordinates);
    }

    private scrollToBookingPanel(fragment?: string | null): void {
        if (fragment !== 'book-table' || typeof document === 'undefined') {
            return;
        }

        setTimeout(() => {
            document.getElementById('book-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    }

    private loadQuickReviewStats(): void {
        this.resetReviewStats();

        const reviews = this.readStorage<QuickReview>(this.reviewStorageKey);

        if (reviews.length === 0) {
            return;
        }

        this.reviewCount = reviews.length;
        this.averageFoodRating = reviews.reduce((total, review) => total + review.score, 0) / reviews.length;
        this.averageHygieneRating = Math.min(5, this.averageFoodRating + 0.1);
        this.recommendationRate = Math.round((reviews.filter((review) => review.score >= 4).length / reviews.length) * 100);
    }

    private resetReviewStats(): void {
        const sourceId = this.restaurantSettings?.restaurantId || this.restaurantId || 1;
        this.averageFoodRating = 4.1 + ((sourceId % 7) * 0.1);
        this.averageHygieneRating = Math.min(5, this.averageFoodRating + 0.1);
        this.reviewCount = 70 + ((sourceId * 13) % 240);
        this.recommendationRate = 88 + (sourceId % 10);
    }

    private getCategoryChipLabel(category: string): string {
        if (category === 'All') {
            return 'All';
        }

        const words = category
            .split(/\s+/)
            .map((value) => value.trim())
            .filter(Boolean);

        return words.slice(0, 2).join(' ');
    }

    private getCategoryChipIcon(category: string): string {
        const normalized = category.trim().toLowerCase();

        if (normalized === 'all') {
            return '🍽️';
        }

        if (normalized.includes('pizza')) {
            return '🍕';
        }

        if (normalized.includes('burger')) {
            return '🍔';
        }

        if (normalized.includes('taco') || normalized.includes('mex')) {
            return '🌮';
        }

        if (normalized.includes('dessert') || normalized.includes('cake') || normalized.includes('sweet')) {
            return '🧁';
        }

        if (normalized.includes('noodle') || normalized.includes('ramen') || normalized.includes('pasta')) {
            return '🍜';
        }

        if (normalized.includes('rice') || normalized.includes('biryani')) {
            return '🍛';
        }

        if (normalized.includes('drink') || normalized.includes('tea') || normalized.includes('coffee') || normalized.includes('juice')) {
            return '🥤';
        }

        if (normalized.includes('chicken') || normalized.includes('wings')) {
            return '🍗';
        }

        if (normalized.includes('salad') || normalized.includes('healthy')) {
            return '🥗';
        }

        if (normalized.includes('sandwich') || normalized.includes('wrap')) {
            return '🥪';
        }

        if (normalized.includes('breakfast')) {
            return '🍳';
        }

        return '🍴';
    }

    private get storagePrefix(): string {
        return `restaurant-${this.restaurantSettings?.restaurantId || this.restaurantId || this.tableNumber || 'public'}`;
    }

    private get reviewStorageKey(): string {
        return `${this.storagePrefix}-quick-reviews`;
    }

    private readStorage<T>(key: string): T[] {
        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T[]) : [];
        } catch {
            return [];
        }
    }

    private writeStorage<T>(key: string, value: T[]): void {
        localStorage.setItem(key, JSON.stringify(value));
    }
}
