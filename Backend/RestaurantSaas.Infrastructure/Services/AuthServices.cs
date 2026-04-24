using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using RestaurantSaaS.Application.DTOs;
using RestaurantSaaS.Application.Interfaces;
using RestaurantSaaS.Domain.Common;
using RestaurantSaaS.Domain.Entities;

namespace RestaurantSaaS.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto?> Login(LoginRequestDto request)
    {
        var user = await _userManager.FindByNameAsync(request.Username);
        if (user == null) return null;
             var result = await _signInManager.CheckPasswordSignInAsync(
            user, request.Password, lockoutOnFailure: false);

        if (!result.Succeeded) return null;

        var roles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            // Recommended standard claims
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),

            // Your existing claims
            new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
            new Claim("displayName", user.DisplayName ?? string.Empty),
        };

        // Roles
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        // RestaurantId claim (ONLY for tenant users, not super admin)
        var isSuperAdmin = roles.Contains(AppRoles.SuperAdmin);

        if (!isSuperAdmin && user.RestaurantId.HasValue)
        {
            claims.Add(new Claim("RestaurantId", user.RestaurantId.Value.ToString()));
        }
        Console.WriteLine($"JWT RestaurantId: {user.RestaurantId}");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new LoginResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            Username = user.UserName ?? string.Empty,
            Role = roles.FirstOrDefault() ?? string.Empty,
            RestaurantId = user.RestaurantId,
            Roles = roles.ToList()
        };
        
    }
}