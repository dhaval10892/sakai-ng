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

    public MenuController(IMenuService menuService)
    {
        _menuService = menuService;
    }
    [HttpGet]
    public IActionResult Get()
    {
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
        if (string.IsNullOrWhiteSpace(dto.CategoryName)) return BadRequest("Category is required");
        if (dto.Price <= 0) return BadRequest("Price must be greter than Zero");
        var updated = _menuService.Update(id, dto);
        if (!updated) { return NotFound(); }
        return NoContent();
    }
    [HttpPost]
    public IActionResult Create([FromBody] MenuItemDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Namr is required");
        if (string.IsNullOrWhiteSpace(dto.CategoryName)) return BadRequest("Category is required");
        if (dto.Price <= 0) return BadRequest("Price must be greter than Zero");
        var created = _menuService.Create(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
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