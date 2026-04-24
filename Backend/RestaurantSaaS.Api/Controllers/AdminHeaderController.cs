

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantSaas.Infrastructure.Persistence;
[ApiController]
[Route("api/[controller]")]
public class AdminHeaderController : ControllerBase
{
    private readonly CurrentTenantService _tenant;
    private readonly ApplicationDbContext _context;

    public AdminHeaderController(CurrentTenantService tenant, ApplicationDbContext context)
    {
        _tenant = tenant;
        _context=context;
    }


[HttpGet("me")]
    public async Task<IActionResult> GetMyRestaurant()
    {
        var restaurantId = _tenant.RestaurantId;

        var restaurant = await _context.Restaurants
            .Where(r => r.Id == restaurantId)
            .Select(r => new
            {
                r.Name,
                r.LogoUrl
            })
            .FirstOrDefaultAsync();

        return Ok(restaurant);
    }
}