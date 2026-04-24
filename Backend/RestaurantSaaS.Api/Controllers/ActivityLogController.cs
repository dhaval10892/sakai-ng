using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantSaaS.Application.DTOs;
using RestaurantSaaS.Application.Interfaces;

namespace RestaurantSaaS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ActivityLogsController : ControllerBase
{
    private readonly IActivityLogQueryService _activityLogQueryService;
    

    public ActivityLogsController(IActivityLogQueryService activityLogQueryService)
    {
        _activityLogQueryService = activityLogQueryService;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] ActivityLogQueryDto query)
    {
        var result = await _activityLogQueryService.GetPagedAsync(query);
        return Ok(result);
    }
}