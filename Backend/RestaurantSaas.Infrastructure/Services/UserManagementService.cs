using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RestaurantSaas.Infrastructure.Migrations;
using RestaurantSaaS.Application.DTOs;
using RestaurantSaaS.Application.Interfaces;
using RestaurantSaaS.Domain.Entities;

namespace RestaurantSaaS.Infrastructure.Services;

public class UserManagementService : IUserManagementService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IActivityLogService _activityLogService;

    public UserManagementService(UserManager<ApplicationUser> userManager, IActivityLogService activityLogService)
    {
        _activityLogService = activityLogService;
        _userManager = userManager;
    }

    public async Task<IEnumerable<UserDto>> GetAllAsync()
    {
        var users = await _userManager.Users.OrderBy(x => x.UserName).ToListAsync();
        var result = new List<UserDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);

            result.Add(new UserDto
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                DisplayName = user.DisplayName ?? string.Empty,
                Role = roles.FirstOrDefault() ?? string.Empty,
                IsActive = user.IsActive
            });
        }

        return result;
    }

    public async Task<UserDto?> GetByIdAsync(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return null;

        var roles = await _userManager.GetRolesAsync(user);

        return new UserDto
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
            DisplayName = user.DisplayName ?? string.Empty,
            Role = roles.FirstOrDefault() ?? string.Empty,
            IsActive = user.IsActive
        };
    }

    public async Task<(bool Success, string Message, UserDto? User)> CreateAsync(CreateUserDto dto)
    {
        var existing = await _userManager.FindByNameAsync(dto.Username);
        if (existing != null)
            return (false, "Username already exists.", null);

        var user = new ApplicationUser
        {
            UserName = dto.Username,
            DisplayName = dto.DisplayName,
            IsActive = true
        };

        var createResult = await _userManager.CreateAsync(user, dto.Password);

        if (!createResult.Succeeded)
        {
            return (false, string.Join(", ", createResult.Errors.Select(x => x.Description)), null);
        }

        var roleResult = await _userManager.AddToRoleAsync(user, dto.Role);

        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            return (false, string.Join(", ", roleResult.Errors.Select(x => x.Description)), null);
        }

        var createdUser = await GetByIdAsync(user.Id);
        return (true, "User created successfully.", createdUser);
    }
    public async Task<(bool Success, string Message)> UpdateStatusAsync(string id, UpdateUserStatusDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);

        if (user == null)
            return (false, "User not found.");

        if ((user.UserName ?? "").ToLower() == "admin" && dto.IsActive == false)
            return (false, "Default admin user cannot be deactivated.");

        user.IsActive = dto.IsActive;

        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
            return (false, string.Join(", ", result.Errors.Select(x => x.Description)));
        await _activityLogService.LogAsync(
dto.IsActive ? "User Activated" : "User Deactivated",
"User",
user.Id,
$"User {user.UserName} status changed to {(dto.IsActive ? "Active" : "Inactive")}."
);

        return (true, dto.IsActive ? "User activated successfully." : "User deactivated successfully.");
    }
    public async Task<(bool Success, string Message)> UpdateRoleAsync(string id, UpdateUserRoleDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return (false, "User not found.");

        var existingRoles = await _userManager.GetRolesAsync(user);

        if (existingRoles.Any())
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(user, existingRoles);
            if (!removeResult.Succeeded)
                return (false, string.Join(", ", removeResult.Errors.Select(x => x.Description)));
        }

        var addResult = await _userManager.AddToRoleAsync(user, dto.Role);
        if (!addResult.Succeeded)
            return (false, string.Join(", ", addResult.Errors.Select(x => x.Description)));
        await _activityLogService.LogAsync(
            "Role Updated",
            "User",
            user.Id,
            $"Role changed to {dto.Role} for user {user.UserName}."
        );
        return (true, "Role updated successfully.");

    }

    public async Task<(bool Success, string Message)> DeleteAsync(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return (false, "User not found.");

        if ((user.UserName ?? "").ToLower() == "admin")
            return (false, "Default admin user cannot be deleted.");

        var result = await _userManager.DeleteAsync(user);

        if (!result.Succeeded)
            return (false, string.Join(", ", result.Errors.Select(x => x.Description)));

        return (true, "User deleted successfully.");
    }
    public async Task<(bool Success, string Message)> ChangePasswordAsync(string username, ChangePasswordDto dto)
    {
        var user = await _userManager.FindByNameAsync(username);

        if (user == null)
            return (false, "User not found.");

        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);

        if (!result.Succeeded)
            return (false, string.Join(", ", result.Errors.Select(x => x.Description)));

        return (true, "Password changed successfully.");
    }

    public async Task<(bool Success, string Message)> ResetPasswordAsync(string id, ResetPasswordDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);

        if (user == null)
            return (false, "User not found.");

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);

        if (!result.Succeeded)
            return (false, string.Join(", ", result.Errors.Select(x => x.Description)));

        return (true, "Password reset successfully.");
    }

}