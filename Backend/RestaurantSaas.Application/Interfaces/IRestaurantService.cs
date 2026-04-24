using System.Linq.Expressions;
using RestaurantSaaS.Domain.Entities;

public interface IRestaurantService
{
    Task<RestaurantDto> CreateAsync(RestaurantDto rdto);
    Task<List<RestaurantDto>> GetAllAsync();
    Task<RestaurantDto?> GetByIdAsync(int id);
    Task<bool> UpdateAsync(int id, UpdateRestaurantDto dto);
    Task<bool> DeleteAsync(int id);
    public Task<int> CountAsync(Expression<Func<Restaurant, bool>> filter);

}