using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantSaaS.Application.DTOs;
using RestaurantSaaS.Application.Interfaces;

namespace RestaurantSaaS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserManagementService _userManagementService;

    public UsersController(IUserManagementService userManagementService)
    {
        _userManagementService = userManagementService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
          var isSuperAdmin = User.IsInRole("SuperAdmin");

        var users = await _userManagementService.GetAllAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var user = await _userManagementService.GetByIdAsync(id);
        if (user == null) return NotFound();

        return Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username))
            return BadRequest("Username is required.");

        if (string.IsNullOrWhiteSpace(dto.DisplayName))
            return BadRequest("Display name is required.");

        if (string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest("Password is required.");

        if (string.IsNullOrWhiteSpace(dto.Role))
            return BadRequest("Role is required.");

        var result = await _userManagementService.CreateAsync(dto);

        if (!result.Success)
            return BadRequest(result.Message);

        return CreatedAtAction(nameof(GetById), new { id = result.User!.Id }, result.User);
    }
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateUserStatusDto dto)
    {
        var result = await _userManagementService.UpdateStatusAsync(id, dto);

        if (!result.Success)
            return BadRequest(result.Message);

        return NoContent();
    }

    [HttpPut("{id}/role")]
    public async Task<IActionResult> UpdateRole(string id, [FromBody] UpdateUserRoleDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Role))
            return BadRequest("Role is required.");

        var result = await _userManagementService.UpdateRoleAsync(id, dto);

        if (!result.Success)
            return BadRequest(result.Message);

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var result = await _userManagementService.DeleteAsync(id);

        if (!result.Success)
            return BadRequest(result.Message);

        return NoContent();
    }
    [HttpPut("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CurrentPassword))
            return BadRequest("Current password is required.");

        if (string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest("New password is required.");

        var username = User.FindFirstValue(ClaimTypes.Name);

        if (string.IsNullOrWhiteSpace(username))
            return Unauthorized();

        var result = await _userManagementService.ChangePasswordAsync(username, dto);

        if (!result.Success)
            return BadRequest(result.Message);

        return NoContent();
    }
    [HttpPut("{id}/reset-password")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResetPassword(string id, [FromBody] ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NewPassword))
            return BadRequest("New password is required.");

        var result = await _userManagementService.ResetPasswordAsync(id, dto);

        if (!result.Success)
            return BadRequest(result.Message);

        return NoContent();
    }
}