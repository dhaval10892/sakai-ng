using RestaurantSaas.Application.DTOs;

namespace RestaurantSaas.Application.interfaces;

public interface ITableService
{
    IEnumerable<RestaurantTableDto> GetAll();
    RestaurantTableDto? GetById(int id);
    RestaurantTableDto Create(RestaurantTableDto dto);
    bool Update(int id, RestaurantTableDto dto);
    bool Delete(int id);
}