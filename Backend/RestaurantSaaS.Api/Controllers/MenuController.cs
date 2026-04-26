using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantSaas.Application.DTOs;
using RestaurantSaas.Application.interfaces;
using RestaurantSaas.Domain.Entities;
using RestaurantSaaS.Application.DTOs;

namespace RestaurantSaaS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MenuController : ControllerBase
{
    private readonly IMenuService _menuService;
    private readonly CurrentTenantService _tenant;

    public MenuController(IMenuService menuService, CurrentTenantService tenant)
    {
        _menuService = menuService;
        _tenant = tenant;
    }
    [HttpGet]
    public IActionResult Get()
    {
        var restaurantId = _tenant.RestaurantId;

        if (restaurantId == null)
            return Unauthorized();
            

        var items = _menuService.GetAll();
        return Ok(items);
    }
    [HttpGet("{id}")]
    public IActionResult GetById(int Id)
    {
        var item = _menuService.GetById(Id);
        if (item == null) { return NotFound(); }
        return Ok(item);
    }
    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] MenuItemDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Namr is required");
        if (dto.MenuCategoryId <= 0) return BadRequest("Category is required");
        if (dto.Price <= 0) return BadRequest("Price must be greter than Zero");
        if (dto.StockQuantity < 0) return BadRequest("Stock quantity cannot be negative");
        if (dto.LowStockThreshold < 0) return BadRequest("Low stock threshold cannot be negative");
        try
        {
        var updated = _menuService.Update(id, dto);
        if (!updated) { return NotFound(); }
        return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
    [HttpPost]
    public IActionResult Create([FromBody] MenuItemDto dto)
    {
        var restaurantId = _tenant.RestaurantId;
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Namr is required");
        if (dto.MenuCategoryId <= 0) return BadRequest("Category is required");
        if (dto.Price <= 0) return BadRequest("Price must be greter than Zero");
        if (dto.StockQuantity < 0) return BadRequest("Stock quantity cannot be negative");
        if (dto.LowStockThreshold < 0) return BadRequest("Low stock threshold cannot be negative");

        if (restaurantId == null)
            return Unauthorized();
        var item = new MenuItemDto
        {
            Name = dto.Name,
            MenuCategoryId = dto.MenuCategoryId,
            CategoryName = dto.CategoryName,
            Price = dto.Price,
            Available = dto.Available,
            StockQuantity = dto.StockQuantity,
            LowStockThreshold = dto.LowStockThreshold,
            ImageUrl = dto.ImageUrl,
            RestaurantId = restaurantId.Value
        };
        try
        {
        var created = _menuService.Create(item);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var deleted = _menuService.Delete(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
    [HttpPost("upload")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
            return BadRequest("Only image files are allowed.");

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var imageUrl = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";

        return Ok(new { imageUrl });
    }

}
