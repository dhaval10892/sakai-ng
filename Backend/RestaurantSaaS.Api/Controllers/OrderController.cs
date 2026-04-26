using Microsoft.AspNetCore.Mvc;
using RestaurantSaas.Application.interfaces;
using RestaurantSaas.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using RestaurantSaaS.Api.Common;

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
            return Unauthorized(new { message = "Restaurant context was not found for the current user." });

        var orders = _orderService.GetAll();
        return Ok(orders);
    }
    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var order = _orderService.GetById(id);
        if (order == null) return NotFound(new { message = "Order not found." });

        return Ok(order);
    }


    [HttpPost]
    public IActionResult Create([FromBody] OrderDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Table))
            return BadRequest(new { message = "Table is required." });

        if (dto.Total <= 0)
            return BadRequest(new { message = "Total must be greater than zero." });

        if (string.IsNullOrWhiteSpace(dto.Status))
            return BadRequest(new { message = "Status is required." });

        if (dto.Items == null || !dto.Items.Any())
            return BadRequest(new { message = "At least one order item is required." });
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
        return CreatedAtAction(
            nameof(GetById),
            new { id = created.Id },
            ApiResponse<OrderDto>.Create(created, "Order created successfully.")
        );
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] OrderDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Table))
            return BadRequest(new { message = "Table is required." });

        if (dto.Total <= 0)
            return BadRequest(new { message = "Total must be greater than zero." });

        if (string.IsNullOrWhiteSpace(dto.Status))
            return BadRequest(new { message = "Status is required." });

        if (dto.Items == null || !dto.Items.Any())
            return BadRequest(new { message = "At least one order item is required." });

        var updated = _orderService.Update(id, dto);
        if (!updated) return NotFound(new { message = "Order not found." });

        return Ok(ApiResponse<object?>.Create(null, "Order updated successfully."));
    }

    [HttpPatch("{id}/status")]
    public IActionResult UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Status))
            return BadRequest(new { message = "Status is required." });

        var updated = _orderService.UpdateStatus(id, dto.Status.Trim());
        if (!updated) return NotFound(new { message = "Order not found." });

        return Ok(ApiResponse<object?>.Create(null, "Order status updated successfully."));
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var deleted = _orderService.Delete(id);
        if (!deleted) return NotFound(new { message = "Order not found." });

        return Ok(ApiResponse<object?>.Create(null, "Order deleted successfully."));
    }
}
