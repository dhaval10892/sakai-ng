using RestaurantSaaS.Application.DTOs;

namespace RestaurantSaaS.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto?> Login(LoginRequestDto request);
}