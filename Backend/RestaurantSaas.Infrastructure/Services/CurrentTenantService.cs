using System.Security.Claims;
using Microsoft.AspNetCore.Http;

public class CurrentTenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentTenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int? RestaurantId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("RestaurantId");
            return claim != null ? int.Parse(claim.Value) : null;
        }
    }

    public bool IsSuperAdmin =>
        _httpContextAccessor.HttpContext?.User?.IsInRole("SuperAdmin") ?? false;
}