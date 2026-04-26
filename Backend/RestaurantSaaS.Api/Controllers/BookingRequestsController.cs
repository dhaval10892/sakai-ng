using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantSaas.Application.DTOs;
using RestaurantSaas.Infrastructure.Persistence;
using RestaurantSaaS.Api.Common;

namespace RestaurantSaaS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class BookingRequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public BookingRequestsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var bookings = await _context.BookingRequests
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new BookingRequestDto
            {
                Id = x.Id,
                RestaurantId = x.RestaurantId,
                TableNumber = x.TableNumber,
                GuestName = x.GuestName,
                Phone = x.Phone,
                BookingDate = x.BookingDate,
                BookingTime = x.BookingTime,
                Seats = x.Seats,
                Occasion = x.Occasion,
                Arrangement = x.Arrangement,
                Status = x.Status,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();

        return Ok(bookings);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateBookingStatusRequest request)
    {
        var booking = await _context.BookingRequests.FirstOrDefaultAsync(x => x.Id == id);
        if (booking == null)
            return NotFound(new { message = "Booking request not found." });

        booking.Status = string.IsNullOrWhiteSpace(request.Status) ? booking.Status : request.Status.Trim();

        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object?>.Create(null, "Booking status updated successfully."));
    }
}

public class UpdateBookingStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
