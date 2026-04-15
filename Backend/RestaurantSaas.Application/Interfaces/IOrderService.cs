using RestaurantSaas.Application.DTOs;

namespace RestaurantSaas.Application.interfaces;

public interface IOrderService
{
    IEnumerable<OrderDto> GetAll();
    OrderDto? GetById(int id);
    OrderDto Create(OrderDto dto);
    bool Update(int id, OrderDto dto);
    bool Delete(int id);
}