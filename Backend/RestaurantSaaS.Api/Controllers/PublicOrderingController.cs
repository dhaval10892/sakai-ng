using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantSaas.Application.DTOs;
using RestaurantSaaS.Application.Interfaces;
using RestaurantSaas.Domain.Entities;
using RestaurantSaas.Infrastructure.Persistence;
using RestaurantSaaS.Api.Common;
using MenuItemDto = RestaurantSaaS.Application.DTOs.MenuItemDto;

namespace RestaurantSaaS.Api.Controllers;

[ApiController]
[Route("api/public-ordering")]
[AllowAnonymous]
public class PublicOrderingController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IActivityLogService _activityLogService;

    public PublicOrderingController(ApplicationDbContext context, IActivityLogService activityLogService)
    {
        _context = context;
        _activityLogService = activityLogService;
    }

    [HttpGet("restaurants")]
    public async Task<IActionResult> GetRestaurants()
    {
        var restaurants = await _context.Restaurants
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .Select(x => new RestaurantDto
            {
                Id = x.Id,
                Name = x.Name,
                LogoUrl = x.LogoUrl,
                IsActive = x.IsActive,
                Country = x.Country,
                State = x.State,
                CurrencyCode = x.CurrencyCode,
                CurrencySymbol = x.CurrencySymbol,
                TaxName = x.TaxName,
                TaxRate = x.TaxRate,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();

        return Ok(restaurants);
    }

    [HttpGet("discovery")]
    public async Task<IActionResult> DiscoverRestaurants([FromQuery] string? query = null, [FromQuery] string? category = null)
    {
        var searchTerm = string.IsNullOrWhiteSpace(category) ? query : category;
        var normalizedSearch = searchTerm?.Trim();

        var restaurants = await _context.Restaurants
            .AsNoTracking()
            .Where(x => x.IsActive)
            .Include(x => x.MenuItems)
            .ThenInclude(x => x.MenuCategory)
            .OrderBy(x => x.Name)
            .ToListAsync();

        var results = restaurants
            .Select(restaurant =>
            {
                var availableItems = restaurant.MenuItems
                    .Where(item => item.Available && item.StockQuantity > 0)
                    .ToList();

                if (!availableItems.Any())
                {
                    return null;
                }

                var matchedItems = string.IsNullOrWhiteSpace(normalizedSearch)
                    ? availableItems
                    : availableItems
                        .Where(item =>
                            item.Name.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ||
                            (item.MenuCategory?.Name ?? string.Empty).Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase))
                        .ToList();

                if (!string.IsNullOrWhiteSpace(normalizedSearch) && matchedItems.Count == 0)
                {
                    return null;
                }

                var featuredItem = matchedItems.FirstOrDefault(item => !string.IsNullOrWhiteSpace(item.ImageUrl))
                    ?? matchedItems.FirstOrDefault()
                    ?? availableItems.First();

                var cuisineLabel = matchedItems
                    .Select(item => item.MenuCategory?.Name)
                    .FirstOrDefault(name => !string.IsNullOrWhiteSpace(name))
                    ?? availableItems.Select(item => item.MenuCategory?.Name).FirstOrDefault(name => !string.IsNullOrWhiteSpace(name))
                    ?? "Restaurant";

                return new PublicRestaurantDiscoveryDto
                {
                    RestaurantId = restaurant.Id,
                    RestaurantName = restaurant.Name,
                    LogoUrl = restaurant.LogoUrl,
                    Country = restaurant.Country,
                    State = restaurant.State,
                    CuisineLabel = cuisineLabel,
                    FeaturedItemName = featuredItem.Name,
                    FeaturedItemPrice = featuredItem.Price,
                    FeaturedImageUrl = string.IsNullOrWhiteSpace(featuredItem.ImageUrl) ? restaurant.LogoUrl : featuredItem.ImageUrl,
                    Rating = 4.1m + ((restaurant.Id % 7) * 0.1m),
                    ReviewCount = 80 + ((restaurant.Id * 17) % 420),
                    EstimatedMinutes = 10 + (restaurant.Id % 8)
                };
            })
            .Where(result => result != null)
            .Cast<PublicRestaurantDiscoveryDto>()
            .ToList();

        return Ok(results);
    }

    [HttpGet("search-items")]
    public async Task<IActionResult> SearchMenuItems([FromQuery] string query)
    {
        var normalizedQuery = query?.Trim();

        if (string.IsNullOrWhiteSpace(normalizedQuery))
        {
            return Ok(new List<PublicMenuSearchItemDto>());
        }

        var items = await _context.MenuItems
            .AsNoTracking()
            .Include(x => x.MenuCategory)
            .Include(x => x.Restaurant)
            .Where(x =>
                x.Available &&
                x.StockQuantity > 0 &&
                x.Restaurant != null &&
                x.Restaurant.IsActive &&
                (
                    EF.Functions.Like(x.Name, $"%{normalizedQuery}%") ||
                    (x.MenuCategory != null && EF.Functions.Like(x.MenuCategory.Name, $"%{normalizedQuery}%")) ||
                    EF.Functions.Like(x.Restaurant.Name, $"%{normalizedQuery}%")
                ))
            .OrderBy(x => x.Name)
            .Take(120)
            .Select(x => new PublicMenuSearchItemDto
            {
                MenuItemId = x.Id,
                MenuItemName = x.Name,
                CategoryName = x.MenuCategory != null ? x.MenuCategory.Name : "Menu",
                Price = x.Price,
                ImageUrl = x.ImageUrl,
                RestaurantId = x.RestaurantId,
                RestaurantName = x.Restaurant != null ? x.Restaurant.Name : string.Empty,
                RestaurantLogoUrl = x.Restaurant != null ? x.Restaurant.LogoUrl : null,
                Country = x.Restaurant != null ? x.Restaurant.Country : string.Empty,
                State = x.Restaurant != null ? x.Restaurant.State : string.Empty,
                CurrencyCode = x.Restaurant != null ? x.Restaurant.CurrencyCode : string.Empty,
                CurrencySymbol = x.Restaurant != null ? x.Restaurant.CurrencySymbol : string.Empty,
                EstimatedMinutes = 10 + (x.RestaurantId % 8)
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("settings/{tableNumber}")]
    public async Task<IActionResult> GetSettings(string tableNumber)
    {
        var table = await _context.RestaurantTables
            .Include(x => x.Restaurant)
            .FirstOrDefaultAsync(x => x.Number.ToLower() == tableNumber.ToLower());

        if (table?.Restaurant == null)
        {
            return NotFound(new { message = "Table was not found." });
        }

        return Ok(new PublicRestaurantSettingsDto
        {
            RestaurantId = table.RestaurantId,
            RestaurantName = table.Restaurant.Name,
            LogoUrl = table.Restaurant.LogoUrl,
            TableNumber = table.Number,
            Country = table.Restaurant.Country,
            State = table.Restaurant.State,
            CurrencyCode = table.Restaurant.CurrencyCode,
            CurrencySymbol = table.Restaurant.CurrencySymbol,
            TaxName = table.Restaurant.TaxName,
            TaxRate = table.Restaurant.TaxRate
        });
    }

    [HttpGet("restaurant/{restaurantId}/settings")]
    public async Task<IActionResult> GetRestaurantSettings(int restaurantId)
    {
        var restaurant = await _context.Restaurants
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == restaurantId && x.IsActive);

        if (restaurant == null)
        {
            return NotFound(new { message = "Restaurant was not found." });
        }

        return Ok(new PublicRestaurantSettingsDto
        {
            RestaurantId = restaurant.Id,
            RestaurantName = restaurant.Name,
            LogoUrl = restaurant.LogoUrl,
            TableNumber = string.Empty,
            Country = restaurant.Country,
            State = restaurant.State,
            CurrencyCode = restaurant.CurrencyCode,
            CurrencySymbol = restaurant.CurrencySymbol,
            TaxName = restaurant.TaxName,
            TaxRate = restaurant.TaxRate
        });
    }

    [HttpGet("menu/{tableNumber}")]
    public async Task<IActionResult> GetMenu(string tableNumber)
    {
        var table = await _context.RestaurantTables
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Number.ToLower() == tableNumber.ToLower());

        if (table == null)
        {
            return NotFound(new { message = "Table was not found." });
        }

        var items = await _context.MenuItems
            .AsNoTracking()
            .Include(x => x.MenuCategory)
            .Where(x => x.RestaurantId == table.RestaurantId && x.Available && x.StockQuantity > 0)
            .OrderBy(x => x.Name)
            .Select(x => new MenuItemDto
            {
                Id = x.Id,
                Name = x.Name,
                MenuCategoryId = x.MenuCategoryId,
                CategoryName = x.MenuCategory != null ? x.MenuCategory.Name : string.Empty,
                Price = x.Price,
                Available = x.Available,
                StockQuantity = x.StockQuantity,
                LowStockThreshold = x.LowStockThreshold,
                ImageUrl = x.ImageUrl,
                RestaurantId = x.RestaurantId
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("restaurant/{restaurantId}/menu")]
    public async Task<IActionResult> GetMenuByRestaurant(int restaurantId)
    {
        var restaurantExists = await _context.Restaurants
            .AsNoTracking()
            .AnyAsync(x => x.Id == restaurantId && x.IsActive);

        if (!restaurantExists)
        {
            return NotFound(new { message = "Restaurant was not found." });
        }

        var items = await _context.MenuItems
            .AsNoTracking()
            .Include(x => x.MenuCategory)
            .Where(x => x.RestaurantId == restaurantId && x.Available && x.StockQuantity > 0)
            .OrderBy(x => x.Name)
            .Select(x => new MenuItemDto
            {
                Id = x.Id,
                Name = x.Name,
                MenuCategoryId = x.MenuCategoryId,
                CategoryName = x.MenuCategory != null ? x.MenuCategory.Name : string.Empty,
                Price = x.Price,
                Available = x.Available,
                StockQuantity = x.StockQuantity,
                LowStockThreshold = x.LowStockThreshold,
                ImageUrl = x.ImageUrl,
                RestaurantId = x.RestaurantId
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("restaurant/{restaurantId}/tables")]
    public async Task<IActionResult> GetRestaurantTables(int restaurantId)
    {
        var restaurantExists = await _context.Restaurants
            .AsNoTracking()
            .AnyAsync(x => x.Id == restaurantId && x.IsActive);

        if (!restaurantExists)
        {
            return NotFound(new { message = "Restaurant was not found." });
        }

        var tables = await _context.RestaurantTables
            .AsNoTracking()
            .Where(x => x.RestaurantId == restaurantId)
            .OrderBy(x => x.Number)
            .Select(x => new RestaurantTableDto
            {
                Id = x.Id,
                Number = x.Number,
                Seats = x.Seats,
                Status = x.Status,
                RestaurantId = x.RestaurantId
            })
            .ToListAsync();

        return Ok(tables);
    }

    [HttpPost("orders")]
    public async Task<IActionResult> CreateOrder([FromBody] PublicOrderRequestDto dto)
    {
        if (dto.Total <= 0)
            return BadRequest(new { message = "Total must be greater than zero." });

        if (dto.Items == null || !dto.Items.Any())
            return BadRequest(new { message = "At least one order item is required." });

        var normalizedOrderType = string.IsNullOrWhiteSpace(dto.OrderType) ? "DineIn" : dto.OrderType.Trim();
        RestaurantTable? table = null;
        var orderTableLabel = string.Empty;
        var restaurantId = dto.RestaurantId;

        if (!string.IsNullOrWhiteSpace(dto.Table))
        {
            table = await _context.RestaurantTables
                .FirstOrDefaultAsync(x => x.Number.ToLower() == dto.Table.ToLower());

            if (table == null)
                return NotFound(new { message = "Table was not found." });

            restaurantId = table.RestaurantId;
            orderTableLabel = table.Number;
        }
        else
        {
            if (restaurantId <= 0)
                return BadRequest(new { message = "Restaurant is required for online orders." });

            var restaurantExists = await _context.Restaurants
                .AsNoTracking()
                .AnyAsync(x => x.Id == restaurantId && x.IsActive);

            if (!restaurantExists)
                return NotFound(new { message = "Restaurant was not found." });

            orderTableLabel = normalizedOrderType.Equals("Takeaway", StringComparison.OrdinalIgnoreCase) ? "Takeaway" : "Dine-In";
        }

        var requestedMenuItemIds = dto.Items.Select(x => x.MenuItemId).Distinct().ToList();
        var menuItems = await _context.MenuItems
            .Where(x => x.RestaurantId == restaurantId && requestedMenuItemIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id);

        foreach (var item in dto.Items)
        {
            if (!menuItems.TryGetValue(item.MenuItemId, out var menuItem))
            {
                return BadRequest(new { message = $"Menu item {item.MenuItemId} was not found." });
            }

            if (!menuItem.Available || menuItem.StockQuantity < item.Quantity)
            {
                return BadRequest(new { message = $"{menuItem.Name} is out of stock or does not have enough quantity available." });
            }
        }

        var order = table == null
            ? null
            : await _context.Orders
                .Include(x => x.Payment)
                .Include(x => x.OrderItems)
                .Where(x =>
                    x.RestaurantId == restaurantId &&
                    x.Table.ToLower() == orderTableLabel.ToLower() &&
                    x.Payment == null &&
                    x.Status != "Paid")
                .OrderByDescending(x => x.Id)
                .FirstOrDefaultAsync();

        var appendedToExistingOrder = order != null;

        if (order == null)
        {
            order = new Order
            {
                Table = orderTableLabel,
                Total = dto.Total,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Preparing" : dto.Status,
                CreatedAt = dto.CreatedAt == default ? DateTime.UtcNow : dto.CreatedAt,
                RestaurantId = restaurantId,
                OrderItems = dto.Items.Select(i => new OrderItem
                {
                    MenuItemId = i.MenuItemId,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    TotalPrice = i.TotalPrice,
                    SpecialInstructions = i.SpecialInstructions.Trim()
                }).ToList()
            };

            _context.Orders.Add(order);
        }
        else
        {
            order.Total += dto.Total;
            order.Status = "Preparing";

            foreach (var item in dto.Items)
            {
                var itemInstructions = item.SpecialInstructions.Trim();
                var existingItem = order.OrderItems.FirstOrDefault(x =>
                    x.MenuItemId == item.MenuItemId &&
                    x.UnitPrice == item.UnitPrice &&
                    x.SpecialInstructions == itemInstructions);

                if (existingItem == null)
                {
                    order.OrderItems.Add(new OrderItem
                    {
                        MenuItemId = item.MenuItemId,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        TotalPrice = item.TotalPrice,
                        SpecialInstructions = itemInstructions
                    });
                    continue;
                }

                existingItem.Quantity += item.Quantity;
                existingItem.TotalPrice += item.TotalPrice;
            }
        }

        if (table != null)
        {
            table.Status = "Occupied";
        }

        foreach (var item in dto.Items)
        {
            var menuItem = menuItems[item.MenuItemId];
            menuItem.StockQuantity -= item.Quantity;

            if (menuItem.StockQuantity <= 0)
            {
                menuItem.StockQuantity = 0;
                menuItem.Available = false;
            }
        }

        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(
            appendedToExistingOrder
                ? "Public Order Updated"
                : normalizedOrderType.Equals("Takeaway", StringComparison.OrdinalIgnoreCase) ? "Takeaway Order Created" : "Public Order Created",
            "Order",
            order.Id.ToString(),
            appendedToExistingOrder
                ? $"Additional items were added to existing table order #{order.Id} for {orderTableLabel}."
                : normalizedOrderType.Equals("Takeaway", StringComparison.OrdinalIgnoreCase)
                ? $"Takeaway order #{order.Id} is ready for kitchen packing."
                : $"Public dine-in order #{order.Id} created for {orderTableLabel}.",
            restaurantId
        );

        var created = await _context.Orders
            .AsNoTracking()
            .Include(x => x.OrderItems)
            .ThenInclude(x => x.MenuItem)
            .Where(x => x.Id == order.Id)
            .Select(x => new OrderDto
            {
                Id = x.Id,
                Table = x.Table,
                Total = x.Total,
                Status = x.Status,
                CreatedAt = x.CreatedAt,
                ItemsText = string.Join(", ", x.OrderItems.Select(oi => $"{(oi.MenuItem != null ? oi.MenuItem.Name : "Item")} x{oi.Quantity}{(!string.IsNullOrWhiteSpace(oi.SpecialInstructions) ? $" ({oi.SpecialInstructions})" : string.Empty)}")),
                Items = x.OrderItems.Select(i => new OrderItemDto
                {
                    Id = i.Id,
                    MenuItemId = i.MenuItemId,
                    MenuItemName = i.MenuItem != null ? i.MenuItem.Name : string.Empty,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    TotalPrice = i.TotalPrice,
                    SpecialInstructions = i.SpecialInstructions
                }).ToList(),
                RestaurantId = x.RestaurantId
            })
            .FirstAsync();

        return Ok(ApiResponse<OrderDto>.Create(created, "Public order created successfully."));
    }

    [HttpPost("bookings")]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequestDto dto)
    {
        if (dto.RestaurantId <= 0)
            return BadRequest(new { message = "Restaurant is required." });

        if (string.IsNullOrWhiteSpace(dto.GuestName))
            return BadRequest(new { message = "Guest name is required." });

        if (dto.Seats <= 0)
            return BadRequest(new { message = "Seats must be greater than zero." });

        if (dto.BookingDate == default)
            return BadRequest(new { message = "Booking date is required." });

        var restaurant = await _context.Restaurants
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == dto.RestaurantId && x.IsActive);

        if (restaurant == null)
            return NotFound(new { message = "Restaurant was not found." });

        var booking = new BookingRequest
        {
            RestaurantId = dto.RestaurantId,
            TableNumber = string.IsNullOrWhiteSpace(dto.TableNumber) ? "Any" : dto.TableNumber.Trim(),
            GuestName = dto.GuestName.Trim(),
            Phone = string.IsNullOrWhiteSpace(dto.Phone) ? "Not provided" : dto.Phone.Trim(),
            BookingDate = dto.BookingDate,
            BookingTime = dto.BookingTime.Trim(),
            Seats = dto.Seats,
            Occasion = dto.Occasion.Trim(),
            Arrangement = dto.Arrangement.Trim(),
            Status = "Pending"
        };

        _context.BookingRequests.Add(booking);
        await _context.SaveChangesAsync();

        await _activityLogService.LogAsync(
            "Booking Created",
            "BookingRequest",
            booking.Id.ToString(),
            $"Booking request created by {booking.GuestName} for table {booking.TableNumber} on {booking.BookingDate:yyyy-MM-dd} at {booking.BookingTime}.",
            booking.RestaurantId
        );

        return Ok(ApiResponse<BookingRequestDto>.Create(new BookingRequestDto
        {
            Id = booking.Id,
            RestaurantId = booking.RestaurantId,
            TableNumber = booking.TableNumber,
            GuestName = booking.GuestName,
            Phone = booking.Phone,
            BookingDate = booking.BookingDate,
            BookingTime = booking.BookingTime,
            Seats = booking.Seats,
            Occasion = booking.Occasion,
            Arrangement = booking.Arrangement,
            Status = booking.Status,
            CreatedAt = booking.CreatedAt
        }, "Booking request created successfully."));
    }
}
