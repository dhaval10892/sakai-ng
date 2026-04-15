using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using RestaurantSaaS.Application.DTOs;
using RestaurantSaaS.Application.Interfaces;
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

    public LoginResponseDto? Login(LoginRequestDto request)
    {
        var user = _userManager.Users.FirstOrDefault(x => x.UserName == request.Username);

        if (user == null)
            return null;
        if(!user.IsActive)
            return null;

        var result = _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false)
            .GetAwaiter()
            .GetResult();

        if (!result.Succeeded)
            return null;

        var roles = _userManager.GetRolesAsync(user).GetAwaiter().GetResult();

        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, user.UserName ?? string.Empty),
            new("displayName", user.DisplayName ?? string.Empty)
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

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
            Role = roles.FirstOrDefault() ?? string.Empty
        };
    }
}