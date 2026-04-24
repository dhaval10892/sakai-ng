using Microsoft.AspNetCore.Mvc;
using RestaurantSaas.Application.interfaces;
using RestaurantSaas.Application.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace RestaurantSaaS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrderController : ControllerBase
{
    private readonly IOrderService _orderService;
     private readonly CurrentTenantService _tenant;

    public OrderController(IOrderService orderService,CurrentTenantService tenant)
    {
        _orderService = orderService;
        _tenant=tenant;
    }
    [HttpGet]
    public IActionResult Get()
    {
        var restaurantId = _tenant.RestaurantId;
         if (restaurantId == null)
            return Unauthorized();

        var orders = _orderService.GetAll();
        return Ok(orders);
    }
    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var order = _orderService.GetById(id);
        if (order == null) return NotFound();

        return Ok(order);
    }


    [HttpPost]
    public IActionResult Create([FromBody] OrderDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Table))
            return BadRequest("Table is required.");

        if (dto.Total <= 0)
            return BadRequest("Total must be greater than zero.");

        if (string.IsNullOrWhiteSpace(dto.Status))
            return BadRequest("Status is required.");

        if (dto.Items == null || !dto.Items.Any())
            return BadRequest("At least one order item is required.");
            var order=new OrderDto
            {
                Id=dto.Id,
                Table=dto.Table,
                Total=dto.Total,
                Status=dto.Status,
                CreatedAt=dto.CreatedAt,
                ItemsText=dto.ItemsText,
                Items=dto.Items,
                RestaurantId=dto.RestaurantId
            };

        var created = _orderService.Create(order);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] OrderDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Table))
            return BadRequest("Table is required.");

        if (dto.Total <= 0)
            return BadRequest("Total must be greater than zero.");

        if (string.IsNullOrWhiteSpace(dto.Status))
            return BadRequest("Status is required.");

        if (dto.Items == null || !dto.Items.Any())
            return BadRequest("At least one order item is required.");

        var updated = _orderService.Update(id, dto);
        if (!updated) return NotFound();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var deleted = _orderService.Delete(id);
        if (!deleted) return NotFound();

        return NoContent();
    }
}