using RestaurantSaas.Application.DTOs;

namespace RestaurantSaas.Application.interfaces;

public interface IMenuCategoryService
{

IEnumerable<MenuCategoryDto> GetAll();
MenuCategoryDto? GetById(int Id);
MenuCategoryDto? Create(MenuCategoryDto dto);    
bool Update(int id, MenuCategoryDto dto);
bool Delete(int id);

}