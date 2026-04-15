

using RestaurantSaaS.Application.DTOs;

namespace RestaurantSaaS.Application.Interfaces;

public interface IUserManagementService
{
    Task<IEnumerable<UserDto>> GetAllAsync();
    Task<UserDto?> GetByIdAsync(string id);
    Task<(bool Success, string Message, UserDto? User)> CreateAsync(CreateUserDto dto);
    Task<(bool Success, string Message)> UpdateRoleAsync(string id, UpdateUserRoleDto dto);
    Task<(bool Success, string Message)> DeleteAsync(string id);
    Task<(bool Success, string Message)> ChangePasswordAsync(string username, ChangePasswordDto dto);
Task<(bool Success, string Message)> ResetPasswordAsync(string id, ResetPasswordDto dto);
Task<(bool Success, string Message)> UpdateStatusAsync(string id, UpdateUserStatusDto dto);
}