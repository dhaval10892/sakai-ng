using RestaurantSaaS.Application.Interfaces;

namespace RestaurantSaaS.Infrastructure.Persistence;

public class DesignTimeCurrentUserService : ICurrentUserService
{
    public string? UserId => null;
    public string? Username => null;
    public string? Role => null;
    public bool IsAuthenticated => false;
}