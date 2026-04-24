namespace RestaurantSaaS.Application.DTOs;
public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;

    // Keep for backward compatibility if your UI expects it
    public string Role { get; set; } = string.Empty;

    // Add these
    public int? RestaurantId { get; set; }
    public List<string> Roles { get; set; } = new();
}