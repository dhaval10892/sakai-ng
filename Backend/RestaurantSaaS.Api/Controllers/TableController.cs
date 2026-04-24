using Microsoft.AspNetCore.Mvc;
using RestaurantSaas.Application.interfaces;
using RestaurantSaas.Infrastructure.Services;
using RestaurantSaas.Application.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace RestaurantSaaS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class TableController : ControllerBase
{
    private readonly ITableService _tableService;
    private CurrentTenantService _tenant;
    public TableController(ITableService tableService, CurrentTenantService tenant)
    {
        _tableService = tableService;
        _tenant = tenant;
    }
    [HttpGet]
    public IActionResult Get()
    {
        var restaurantId = _tenant.RestaurantId;

        if (restaurantId == null)
            return Unauthorized();
        var tables = _tableService.GetAll();
        return Ok(tables);
    }
    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var table = _tableService.GetById(id);
        if (table == null) return NotFound();

        return Ok(table);
    }

    [HttpPost]
    public IActionResult Create([FromBody] RestaurantTableDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Number))
            return BadRequest("Table number is required.");

        if (dto.Seats <= 0)
            return BadRequest("Seats must be greater than zero.");

        if (string.IsNullOrWhiteSpace(dto.Status))
            return BadRequest("Status is required.");

        var created = _tableService.Create(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] RestaurantTableDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Number))
            return BadRequest("Table number is required.");

        if (dto.Seats <= 0)
            return BadRequest("Seats must be greater than zero.");

        if (string.IsNullOrWhiteSpace(dto.Status))
            return BadRequest("Status is required.");

        var updated = _tableService.Update(id, dto);
        if (!updated) return NotFound();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var deleted = _tableService.Delete(id);
        if (!deleted) return NotFound();

        return NoContent();
    }

}