using Microsoft.EntityFrameworkCore;
using RestaurantSaas.Application.interfaces;
using RestaurantSaas.Application.DTOs;
using RestaurantSaas.Domain.Entities;
using RestaurantSaas.Infrastructure.Persistence;

namespace RestaurantSaas.Infrastructure.Services;


public class MenuCategoryService : IMenuCategoryService
{
    
    private readonly ApplicationDbContext _context;
    private readonly CurrentTenantService _tenant;
    
    public MenuCategoryService(ApplicationDbContext context, CurrentTenantService tenant){
        _context=context;
        _tenant = tenant;
    }

 public  IEnumerable<MenuCategoryDto> GetAll()
    {
        var restaurantId = _tenant.RestaurantId;

        return this._context.MenuCategories
        .AsNoTracking()
        .Where(x => !restaurantId.HasValue || x.RestaurantId == restaurantId.Value)
        .OrderBy(x=>x.Name).
        Select((x)=> new MenuCategoryDto
        {
            Id=x.Id,
            Name=x.Name,
            RestaurantId = x.RestaurantId
        }).ToList();
    }
    public MenuCategoryDto? GetById(int id)
    {
        var restaurantId = _tenant.RestaurantId;
        var category = _context.MenuCategories
            .AsNoTracking()
            .FirstOrDefault(x => x.Id == id && (!restaurantId.HasValue || x.RestaurantId == restaurantId.Value));
        if (category == null) return null;
        return new MenuCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            RestaurantId = category.RestaurantId
        };
    }
    public MenuCategoryDto Create(MenuCategoryDto dto)
    {
        if (!_tenant.RestaurantId.HasValue)
            throw new InvalidOperationException("Restaurant context is missing.");

        var entity = new MenuCategory
        {
            Name = dto.Name,
            RestaurantId = _tenant.RestaurantId.Value
        };

        _context.MenuCategories.Add(entity);
        _context.SaveChanges();

        dto.Id = entity.Id;
        dto.RestaurantId = entity.RestaurantId;
        return dto;
    }

    public bool Update(int id, MenuCategoryDto dto)
    {
        var restaurantId = _tenant.RestaurantId;
        var entity = _context.MenuCategories.FirstOrDefault(x => x.Id == id && (!restaurantId.HasValue || x.RestaurantId == restaurantId.Value));

        if (entity == null) return false;

        entity.Name = dto.Name;
        _context.SaveChanges();

        return true;
    }

    public bool Delete(int id)
    {
        var restaurantId = _tenant.RestaurantId;
        var entity = _context.MenuCategories.FirstOrDefault(x => x.Id == id && (!restaurantId.HasValue || x.RestaurantId == restaurantId.Value));

        if (entity == null) return false;
         if (_context.MenuItems.Any(x => x.MenuCategoryId == id))
        throw new InvalidOperationException("Cannot delete category because it is used by menu items.");


        _context.MenuCategories.Remove(entity);
        _context.SaveChanges();

        return true;
    }

}
