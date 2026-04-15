using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantSaas.Application.DTOs;
using RestaurantSaas.Application.interfaces;
using RestaurantSaaS.Application.DTOs;
using RestaurantSaaS.Application.Interfaces;

namespace RestaurantSaaS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Billing,Admin")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }
[HttpGet("paged")]
[Authorize]
public async Task<IActionResult> GetPaged([FromQuery] PaymentQueryDto query, [FromServices] IPaymentQueryService paymentQueryService)
{
    var result = await paymentQueryService.GetPagedAsync(query);
    return Ok(result);
}
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(_paymentService.GetAll());
    }

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var payment = _paymentService.GetById(id);
        if (payment == null) return NotFound();

        return Ok(payment);
    }

    [HttpPost]
    public async Task<IActionResult>  Create([FromBody] PaymentDto dto)
    {
        try
        {
            if (dto.OrderId <= 0)
                return BadRequest("OrderId is required.");

            if (dto.Amount <= 0)
                return BadRequest("Amount must be greater than zero.");

            if (string.IsNullOrWhiteSpace(dto.PaymentMethod))
                return BadRequest("Payment method is required.");

            if (string.IsNullOrWhiteSpace(dto.PaymentStatus))
                return BadRequest("Payment status is required.");
            var created = await _paymentService.Create(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {

            return StatusCode(500, ex.InnerException?.Message ?? ex.Message);
        }

    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] PaymentDto dto)
    {
        if (dto.Amount <= 0)
            return BadRequest("Amount must be greater than zero.");

        if (string.IsNullOrWhiteSpace(dto.PaymentMethod))
            return BadRequest("Payment method is required.");

        if (string.IsNullOrWhiteSpace(dto.PaymentStatus))
            return BadRequest("Payment status is required.");

        var updated = _paymentService.Update(id, dto);
        if (!updated) return NotFound();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var deleted = _paymentService.Delete(id);
        if (!deleted) return NotFound();

        return NoContent();
    }
}