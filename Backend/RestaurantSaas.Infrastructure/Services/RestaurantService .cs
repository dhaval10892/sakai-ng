using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using RestaurantSaas.Infrastructure.Persistence;
using RestaurantSaaS.Application.DTOs;
using RestaurantSaaS.Application.Interfaces;
using RestaurantSaaS.Domain.Entities;

public class RestaurantService : IRestaurantService
{
    private readonly ApplicationDbContext _context;

    public RestaurantService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<RestaurantDto> CreateAsync(RestaurantDto rdto)
    {
        var restaurant = new Restaurant
        {
            Name = rdto.Name,
            LogoUrl = rdto.LogoUrl
        };

        _context.Restaurants.Add(restaurant);
        await _context.SaveChangesAsync();

        return MapToDto(restaurant);
    }

    public async Task<List<RestaurantDto>> GetAllAsync()
    {
        return await _context.Restaurants
            .Select(r => MapToDto(r))
            .ToListAsync();
    }

    public async Task<RestaurantDto?> GetByIdAsync(int id)
    {
        var restaurant = await _context.Restaurants.FindAsync(id);
        return restaurant == null ? null : MapToDto(restaurant);
    }

    public async Task<bool> UpdateAsync(int id, UpdateRestaurantDto dto)
    {
        var restaurant = await _context.Restaurants.FindAsync(id);
        if (restaurant == null) return false;

        restaurant.Name = dto.Name;
        restaurant.LogoUrl = dto.LogoUrl;
        restaurant.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var restaurant = await _context.Restaurants.FindAsync(id);
        if (restaurant == null) return false;

        _context.Restaurants.Remove(restaurant);
        await _context.SaveChangesAsync();
        return true;
    }

    private static RestaurantDto MapToDto(Restaurant r)
    {
        return new RestaurantDto
        {
            Id = r.Id,
            Name = r.Name,
            LogoUrl = r.LogoUrl,
            IsActive = r.IsActive,
            CreatedAt = r.CreatedAt
        };
    }
    public async Task<int> CountAsync(Expression<Func<Restaurant, bool>> filter)
{
    return await _context.Restaurants.CountAsync(filter);
}
}