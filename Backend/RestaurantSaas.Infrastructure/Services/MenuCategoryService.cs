using RestaurantSaas.Application.interfaces;
using RestaurantSaas.Application.DTOs;
using RestaurantSaas.Domain.Entities;
using RestaurantSaas.Infrastructure.Persistence;

namespace RestaurantSaas.Infrastructure.Services;


public class MenuCategoryService : IMenuCategoryService
{
    
    private readonly ApplicationDbContext _context;
    
    public MenuCategoryService(ApplicationDbContext context){
        _context=context;
    }

 public  IEnumerable<MenuCategoryDto> GetAll()
    {
        return this._context.MenuCategories
        .OrderBy(x=>x.Name).
        Select((x)=> new MenuCategoryDto
        {
            Id=x.Id,
            Name=x.Name
        }).ToList();
    }
     public MenuCategoryDto? GetById(int id)
    {
        var category = _context.MenuCategories.FirstOrDefault(x => x.Id == id);
        if (category == null) return null;
        return new MenuCategoryDto
        {
            Id = category.Id,
            Name = category.Name
        };
    }
    public MenuCategoryDto Create(MenuCategoryDto dto)
    {
        var entity = new MenuCategory
        {
            Name = dto.Name
        };

        _context.MenuCategories.Add(entity);
        _context.SaveChanges();

        dto.Id = entity.Id;
        return dto;
    }

    public bool Update(int id, MenuCategoryDto dto)
    {
        var entity = _context.MenuCategories.FirstOrDefault(x => x.Id == id);

        if (entity == null) return false;

        entity.Name = dto.Name;
        _context.SaveChanges();

        return true;
    }

    public bool Delete(int id)
    {
        var entity = _context.MenuCategories.FirstOrDefault(x => x.Id == id);

        if (entity == null) return false;
         if (entity.MenuItems.Any())
        throw new InvalidOperationException("Cannot delete category because it is used by menu items.");


        _context.MenuCategories.Remove(entity);
        _context.SaveChanges();

        return true;
    }

}