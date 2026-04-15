using RestaurantSaaS.Application.DTOs;

namespace RestaurantSaaS.Application.Interfaces;

public interface IAuthService
{
    LoginResponseDto? Login(LoginRequestDto request);
}