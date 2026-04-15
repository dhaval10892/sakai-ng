using RestaurantSaas.Application.DTOs;
using RestaurantSaaS.Application.DTOs;

namespace RestaurantSaas.Application.interfaces;

public interface IMenuService
{
    IEnumerable<MenuItemDto> GetAll();
    MenuItemDto Create(MenuItemDto dto);
    MenuItemDto? GetById(int id);
    bool Update(int id,MenuItemDto dto);
    bool Delete(int id);

}