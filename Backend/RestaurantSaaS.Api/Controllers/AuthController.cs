using Microsoft.AspNetCore.Mvc;
using RestaurantSaaS.Application.DTOs;
using RestaurantSaaS.Application.Interfaces;

namespace RestaurantSaaS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Username and password are required.");
        }

        var result = _authService.Login(request);

        if (result == null)
            return Unauthorized("Invalid username or password.");

        return Ok(result);
    }
}