using Microsoft.EntityFrameworkCore;
using RestaurantSaas.Application.interfaces;
using RestaurantSaaS.Domain.Entities;
using RestaurantSaas.Infrastructure.Persistence;
using RestaurantSaaS.Application.DTOs;

namespace RestaurantSaas.Infrastructure.Services;
public class MenuService : IMenuService
{

    private readonly ApplicationDbContext _context;
    private readonly CurrentTenantService _tenant;

    public MenuService(ApplicationDbContext context, CurrentTenantService tenant)
    {
        _context=context;
        _tenant = tenant;
    }
 public IEnumerable<MenuItemDto> GetAll()
    {
        return _context.MenuItems
        .AsNoTracking()
        .Include(x => x.MenuCategory)
        .OrderBy(x => x.Name)
        .Select(x=>new MenuItemDto
        {
            Id=x.Id,
            Name=x.Name,
            MenuCategoryId=x.MenuCategoryId,
            CategoryName = x.MenuCategory != null ? x.MenuCategory.Name : string.Empty,
            Price=x.Price,
            Available=x.Available,
            StockQuantity = x.StockQuantity,
            LowStockThreshold = x.LowStockThreshold,
            ImageUrl = x.ImageUrl,
            RestaurantId = x.RestaurantId
        }).ToList();
    }

    public MenuItemDto? GetById(int id)
    {
        var restaurantId = _tenant.RestaurantId;
        var item = _context.MenuItems
            .AsNoTracking()
            .FirstOrDefault(x => x.Id == id && (!restaurantId.HasValue || x.RestaurantId == restaurantId.Value));

        if (item == null) return null;

        var categoryName = _context.MenuCategories
            .AsNoTracking()
            .Where(x => x.Id == item.MenuCategoryId && (!restaurantId.HasValue || x.RestaurantId == restaurantId.Value))
            .Select(x => x.Name)
            .FirstOrDefault() ?? string.Empty;

        return new MenuItemDto
        {
            Id = item.Id,
            Name = item.Name,
            MenuCategoryId = item.MenuCategoryId,
            CategoryName = categoryName,
            Price = item.Price,
            Available = item.Available,
            StockQuantity = item.StockQuantity,
            LowStockThreshold = item.LowStockThreshold,
            ImageUrl = item.ImageUrl,
            RestaurantId = item.RestaurantId
        };
    }

    public MenuItemDto Create(MenuItemDto dto)
    {
        if (!_tenant.RestaurantId.HasValue)
            throw new InvalidOperationException("Restaurant context is missing.");

        var categoryExists = _context.MenuCategories.Any(x => x.Id == dto.MenuCategoryId && x.RestaurantId == _tenant.RestaurantId.Value);
        if (!categoryExists)
            throw new InvalidOperationException("Selected category was not found for this restaurant.");

        var entity = new MenuItem
        {
            Name = dto.Name,
            MenuCategoryId = dto.MenuCategoryId,
            Price = dto.Price,
            Available = dto.Available,
            StockQuantity = dto.StockQuantity,
            LowStockThreshold = dto.LowStockThreshold,
            ImageUrl = dto.ImageUrl,
            RestaurantId = _tenant.RestaurantId.Value
        };

        _context.MenuItems.Add(entity);
        _context.SaveChanges();

        dto.Id = entity.Id;
        return dto;
    }

    public bool Update(int id, MenuItemDto dto)
    {
        if (!_tenant.RestaurantId.HasValue)
            throw new InvalidOperationException("Restaurant context is missing.");

        var entity = _context.MenuItems
            .FirstOrDefault(x => x.Id == id && x.RestaurantId == _tenant.RestaurantId.Value);

        if (entity == null) return false;

        var categoryExists = _context.MenuCategories.Any(x => x.Id == dto.MenuCategoryId && x.RestaurantId == _tenant.RestaurantId.Value);
        if (!categoryExists)
            throw new InvalidOperationException("Selected category was not found for this restaurant.");

        entity.Name = dto.Name;
        entity.MenuCategoryId = dto.MenuCategoryId;
        entity.Price = dto.Price;
        entity.Available = dto.Available;
        entity.StockQuantity = dto.StockQuantity;
        entity.LowStockThreshold = dto.LowStockThreshold;
        entity.ImageUrl = dto.ImageUrl;

        _context.SaveChanges();
        return true;
    }

    public bool Delete(int id)
    {
        var entity = _context.MenuItems.FirstOrDefault(x => x.Id == id && (!_tenant.RestaurantId.HasValue || x.RestaurantId == _tenant.RestaurantId.Value));

        if (entity == null) return false;

        _context.MenuItems.Remove(entity);
        _context.SaveChanges();
        return true;
    }
}
