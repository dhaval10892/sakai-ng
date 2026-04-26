using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantSaas.Infrastructure.Persistence;
using RestaurantSaaS.Application.DTOs;
using RestaurantSaaS.Application.Interfaces;
using RestaurantSaaS.Domain.Entities;

[ApiController]
[Route("api/super-admin/restaurants")]
[Authorize(Roles = "SuperAdmin")]
public class SuperAdminRestaurantController : ControllerBase
{
    private readonly IRestaurantService _service;
    private readonly ApplicationDbContext _context;
    UserManager<ApplicationUser> _userManager;
    CurrentTenantService _tenant;
    public SuperAdminRestaurantController(IRestaurantService service, CurrentTenantService tenant, UserManager<ApplicationUser> userManager, ApplicationDbContext context)
    {
        _service = service;
        _context = context;
        _tenant = tenant;
        _userManager = userManager;
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Create(CreateRestaurantDto dto)
    {
        var restaurant = new Restaurant
        {
            Name = dto.Name,
            LogoUrl = dto.LogoUrl,
            IsActive=dto.IsActive,
            Country = dto.Country,
            State = dto.State,
            CurrencyCode = dto.CurrencyCode,
            CurrencySymbol = dto.CurrencySymbol,
            TaxName = dto.TaxName,
            TaxRate = dto.TaxRate
        };
Console.WriteLine(dto +" Create Restaurant");
        _context.Restaurants.Add(restaurant);
        await _context.SaveChangesAsync();

        // 🔥 CREATE ADMIN USER
        var adminUser = new ApplicationUser
        {
            UserName = dto.AdminUsername,
            DisplayName = dto.AdminName,
            RestaurantId = restaurant.Id,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(adminUser, dto.Password);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await _userManager.AddToRoleAsync(adminUser, "Admin");

        return Ok(new RestaurantDto
    {
        Id = restaurant.Id,
        Name = restaurant.Name,
        LogoUrl = restaurant.LogoUrl,
        IsActive = restaurant.IsActive,
        Country = restaurant.Country,
        State = restaurant.State,
        CurrencyCode = restaurant.CurrencyCode,
        CurrencySymbol = restaurant.CurrencySymbol,
        TaxName = restaurant.TaxName,
        TaxRate = restaurant.TaxRate,
        CreatedAt = restaurant.CreatedAt
    });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound();

        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateRestaurantDto dto)
    {
        var success = await _service.UpdateAsync(id, dto);
        if (!success) return NotFound();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _service.DeleteAsync(id);
        if (!success) return NotFound();

        return NoContent();
    }
    
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var total = await _service.CountAsync(r => true);
        var active = await _service.CountAsync(r => r.IsActive);
        var inactive = total - active;


        return Ok(new
        {
            total,
            active,
            inactive
        });
    }


}
