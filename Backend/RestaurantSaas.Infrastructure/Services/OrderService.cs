using Microsoft.EntityFrameworkCore;
using RestaurantSaas.Application.DTOs;
using RestaurantSaas.Application.interfaces;
using RestaurantSaas.Domain.Entities;
using RestaurantSaas.Infrastructure.Persistence;

namespace RestaurantSaas.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext _context;

    public OrderService(ApplicationDbContext context)
    {
        _context = context;
    }

    public IEnumerable<OrderDto> GetAll()
    {
        return _context.Orders
            .Include(x => x.OrderItems)
            .ThenInclude(x => x.MenuItem)
            .OrderByDescending(x => x.Id)
            .Select(x => new OrderDto
            {
                Id = x.Id,
                Table = x.Table,
                Total = x.Total,
                Status = x.Status,
                CreatedAt = x.CreatedAt,
                ItemsText = string.Join(", ", x.OrderItems.Select(oi =>
    $"{(oi.MenuItem != null ? oi.MenuItem.Name : "Item")} x{oi.Quantity}{(!string.IsNullOrWhiteSpace(oi.SpecialInstructions) ? $" ({oi.SpecialInstructions})" : string.Empty)}")),
                Items = x.OrderItems.Select(i => new OrderItemDto
                {
                    Id = i.Id,
                    MenuItemId = i.MenuItemId,
                    MenuItemName = i.MenuItem != null ? i.MenuItem.Name : string.Empty,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    TotalPrice = i.TotalPrice,
                    SpecialInstructions = i.SpecialInstructions
                    
                }).ToList()
            })
            .ToList();
    }

    public OrderDto? GetById(int id)
    {
        return _context.Orders
            .Include(x => x.OrderItems)
            .ThenInclude(x => x.MenuItem)
            .Where(x => x.Id == id)
            .Select(x => new OrderDto
            {
                Id = x.Id,
                Table = x.Table,
                Total = x.Total,
                Status = x.Status,
                CreatedAt = x.CreatedAt,
                ItemsText = string.Join(", ", x.OrderItems.Select(oi =>
    $"{(oi.MenuItem != null ? oi.MenuItem.Name : "Item")} x{oi.Quantity}{(!string.IsNullOrWhiteSpace(oi.SpecialInstructions) ? $" ({oi.SpecialInstructions})" : string.Empty)}")),
                Items = x.OrderItems.Select(i => new OrderItemDto
                {
                    Id = i.Id,
                    MenuItemId = i.MenuItemId,
                    MenuItemName = i.MenuItem != null ? i.MenuItem.Name : string.Empty,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    TotalPrice = i.TotalPrice,
                    SpecialInstructions = i.SpecialInstructions
                }).ToList()
            })
            .FirstOrDefault();
    }
        public OrderDto Create(OrderDto dto)
    {
        var requestedMenuItemIds = dto.Items.Select(x => x.MenuItemId).Distinct().ToList();
        var menuItems = _context.MenuItems
            .Where(x => requestedMenuItemIds.Contains(x.Id))
            .ToDictionary(x => x.Id);

        foreach (var item in dto.Items)
        {
            if (!menuItems.TryGetValue(item.MenuItemId, out var menuItem))
            {
                throw new InvalidOperationException($"Menu item {item.MenuItemId} was not found.");
            }

            if (!menuItem.Available || menuItem.StockQuantity < item.Quantity)
            {
                throw new InvalidOperationException($"{menuItem.Name} is out of stock or does not have enough quantity available.");
            }
        }

        var order = new Order
        {
            Table = dto.Table,
            Total = dto.Total,
            Status = dto.Status,
            CreatedAt = dto.CreatedAt == default ? DateTime.UtcNow : dto.CreatedAt,
            OrderItems = dto.Items.Select(i => new OrderItem
            {
                MenuItemId = i.MenuItemId,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.TotalPrice,
                SpecialInstructions = i.SpecialInstructions.Trim()
            }).ToList()
        };

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

        _context.Orders.Add(order);
        _context.SaveChanges();

        return GetById(order.Id)!;
    }

    public bool Update(int id, OrderDto dto)
    {
        var order = _context.Orders
            .Include(x => x.OrderItems)
            .FirstOrDefault(x => x.Id == id);

        if (order == null)
            return false;

        order.Table = dto.Table;
        order.Total = dto.Total;
        order.Status = dto.Status;
        order.CreatedAt = dto.CreatedAt;

        _context.OrderItems.RemoveRange(order.OrderItems);

        order.OrderItems = dto.Items.Select(i => new OrderItem
        {
            MenuItemId = i.MenuItemId,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            TotalPrice = i.TotalPrice,
            SpecialInstructions = i.SpecialInstructions.Trim()
        }).ToList();

        _context.SaveChanges();
        return true;
    }

    public bool UpdateStatus(int id, string status)
    {
        var order = _context.Orders.FirstOrDefault(x => x.Id == id);

        if (order == null)
            return false;

        order.Status = status;
        _context.SaveChanges();
        return true;
    }

    public bool Delete(int id)
    {
        var order = _context.Orders
            .Include(x => x.OrderItems)
            .FirstOrDefault(x => x.Id == id);

        if (order == null)
            return false;

        _context.OrderItems.RemoveRange(order.OrderItems);
        _context.Orders.Remove(order);
        _context.SaveChanges();

        return true;
    }
}
