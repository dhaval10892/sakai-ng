using Microsoft.EntityFrameworkCore;
using RestaurantSaas.Application.interfaces;
using RestaurantSaaS.Domain.Entities;
using RestaurantSaas.Infrastructure.Persistence;
using RestaurantSaaS.Application.DTOs;

namespace RestaurantSaas.Infrastructure.Services;
public class MenuService : IMenuService
{

    private readonly ApplicationDbContext _context;

    public MenuService(ApplicationDbContext context)
    {
        _context=context;
    }
 public IEnumerable<MenuItemDto> GetAll()
    {
        return _context.MenuItems.Include(x=>x.MenuCategory).
        Select(x=>new MenuItemDto
        {
            Id=x.Id,
            Name=x.Name,
            MenuCategoryId=x.MenuCategoryId,
            CategoryName=x.MenuCategory !=null? x.MenuCategory.Name: "",
            Price=x.Price,
            Available=x.Available,
            ImageUrl = x.ImageUrl
        }).ToList();
    }

    public MenuItemDto? GetById(int id)
    {
        var item = _context.MenuItems.Include(x=>x.MenuCategory).FirstOrDefault(x => x.Id == id);

        if (item == null) return null;

        return new MenuItemDto
        {
            Id = item.Id,
            Name = item.Name,
            MenuCategoryId = item.MenuCategoryId,
            Price = item.Price,
            Available = item.Available,
            ImageUrl = item.ImageUrl
        };
    }

    public MenuItemDto Create(MenuItemDto dto)
    {
        var entity = new MenuItem
        {
            Name = dto.Name,
            MenuCategoryId = dto.MenuCategoryId,
            Price = dto.Price,
            Available = dto.Available,
            ImageUrl = dto.ImageUrl
        };

        _context.MenuItems.Add(entity);
        _context.SaveChanges();

        dto.Id = entity.Id;
        return dto;
    }

    public bool Update(int id, MenuItemDto dto)
    {
        var entity = _context.MenuItems.Include((x)=>x.MenuCategory).FirstOrDefault(x => x.Id == id);

        if (entity == null) return false;

        entity.Name = dto.Name;
        entity.MenuCategoryId = dto.MenuCategoryId;
        entity.Price = dto.Price;
        entity.Available = dto.Available;
        entity.ImageUrl = dto.ImageUrl;

        _context.SaveChanges();
        return true;
    }

    public bool Delete(int id)
    {
        var entity = _context.MenuItems.FirstOrDefault(x => x.Id == id);

        if (entity == null) return false;

        _context.MenuItems.Remove(entity);
        _context.SaveChanges();
        return true;
    }
}